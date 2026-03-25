/**
 * POST /api/build
 *
 * Takes a generated AI coding prompt and:
 * 1. Sends it to Sonnet 4.6 (or Haiku in dev mode) to generate a complete React+Vite project
 * 2. Deploys the generated files to Vercel via their Deployments API
 * 3. Returns the deployment URL + generated files
 *
 * Input:
 *   {
 *     session_id: string,
 *     title: string,
 *     prompt: string,
 *     tech_stack: string[],
 *     features: string[],
 *     dev_mode: boolean
 *   }
 *
 * Output:
 *   {
 *     deploy_url: string,
 *     files: [{ path, content }],
 *     status: "deployed"
 *   }
 */

import Anthropic from '@anthropic-ai/sdk'
import { MODELS } from './models.js'

export const config = { maxDuration: 60 }

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CODE_GEN_SYSTEM = `You are an expert React developer. Your job is to generate a complete, working React + Vite project from a build specification.

Return ONLY a valid JSON object where:
- Keys are file paths (e.g. "package.json", "index.html", "src/App.jsx")
- Values are the full file contents as strings

Required files:
- package.json (with "name", "version", "scripts": {"dev": "vite", "build": "vite build", "preview": "vite preview"}, and dependencies)
- index.html (with <!DOCTYPE html>, root div, script tag pointing to /src/main.jsx)
- vite.config.js (import { defineConfig } from 'vite'; import react from '@vitejs/plugin-react'; export default defineConfig({ plugins: [react()] }))
- src/main.jsx (React 18 createRoot render)
- src/App.jsx (main application component)

Rules:
- Use React 18 with functional components and hooks
- Use inline styles — no CSS frameworks, no Tailwind, no external CSS files (a small index.css for resets is OK)
- Make it visually polished — use a clean, modern design with good spacing, colors, and typography
- All code must be complete and working — NO placeholder comments like "// TODO" or "// implement later"
- NO API keys, secrets, or environment variables in the generated code
- Keep it self-contained — the app must work with just npm install && npm run dev
- If the spec mentions a database or backend, mock it with local state or localStorage
- Include proper error handling and loading states
- The app should look professional and be immediately usable
- Do NOT use TypeScript — use plain JavaScript (.jsx files)
- Dependencies in package.json must include "react", "react-dom", "vite", "@vitejs/plugin-react"
- No markdown, no code fences, no explanation — ONLY the JSON object`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { session_id, title, prompt, tech_stack, features, dev_mode } = req.body ?? {}

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' })
  }
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required' })
  }

  const model = dev_mode ? MODELS.FAST : MODELS.BALANCED

  const userMessage = `Generate a complete React + Vite project for the following app:

## App Name
${title}

## Build Specification
${prompt}

${features?.length ? `## Key Features\n${features.map(f => `- ${f}`).join('\n')}` : ''}

${tech_stack?.length ? `## Suggested Tech Stack (adapt as needed for a pure frontend app)\n${tech_stack.map(t => `- ${t}`).join('\n')}` : ''}

Generate the complete project as a JSON object. Every file must be complete and working.`

  try {
    // Step 1: Generate code with Claude
    const message = await client.messages.create({
      model,
      max_tokens: 8192,
      system: CODE_GEN_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    })

    const raw = message.content[0].text.trim()
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const fileMap = JSON.parse(cleaned)

    // Validate required files
    const requiredFiles = ['package.json', 'index.html', 'src/main.jsx', 'src/App.jsx']
    for (const f of requiredFiles) {
      if (!(f in fileMap)) throw new Error(`Generated code missing required file: ${f}`)
    }

    // Convert to files array
    const files = Object.entries(fileMap).map(([path, content]) => ({ path, content }))

    // Step 2: Deploy to Vercel
    const vercelToken = process.env.VERCEL_TOKEN
    if (!vercelToken) {
      // No Vercel token — return files without deploying
      return res.status(200).json({
        deploy_url: null,
        files,
        status: 'generated',
        message: 'Code generated successfully. Set VERCEL_TOKEN to enable deployment.',
      })
    }

    // Build Vercel deployment payload
    const slugName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)

    const vercelFiles = files.map(f => ({
      file: f.path,
      data: Buffer.from(f.content, 'utf-8').toString('base64'),
      encoding: 'base64',
    }))

    const deployBody = {
      name: slugName || 'promptready-app',
      files: vercelFiles,
      projectSettings: {
        framework: 'vite',
        installCommand: 'npm install',
        buildCommand: 'npm run build',
        outputDirectory: 'dist',
      },
    }

    const teamId = process.env.VERCEL_TEAM_ID
    const vercelUrl = teamId
      ? `https://api.vercel.com/v13/deployments?teamId=${teamId}`
      : 'https://api.vercel.com/v13/deployments'

    const deployRes = await fetch(vercelUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${vercelToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(deployBody),
    })

    const deployData = await deployRes.json()

    if (!deployRes.ok) {
      console.error('Vercel deploy error:', deployData)
      return res.status(200).json({
        deploy_url: null,
        files,
        status: 'deploy_failed',
        message: deployData.error?.message ?? 'Vercel deployment failed',
      })
    }

    const deployUrl = `https://${deployData.url}`

    return res.status(200).json({
      deploy_url: deployUrl,
      files,
      status: 'deployed',
    })
  } catch (err) {
    console.error('Build API error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}

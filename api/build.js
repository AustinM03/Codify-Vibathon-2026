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
- NO API keys, secrets, or environment variables in the generated code
- Keep it self-contained — the app must work with just npm install && npm run dev
- If the spec mentions a database or backend, mock it with local state or localStorage
- Dependencies in package.json must include "react", "react-dom", "vite", "@vitejs/plugin-react"
- CRITICAL: KEEP YOUR CODE EXTREMELY CONCISE to ensure the entire app fits within the LLM's output limits. 
- YOU MUST BUILD A MINIMUM VIABLE PROTOTYPE ONLY. DO NOT attempt to build every feature discussed.
- DO NOT INCLUDE ANY ADMIN PANELS OR SETTINGS PAGES unless requested. Focus ONLY on the primary user-facing flow.
- STRICTLY LIMIT MOCK DATA size. Use maximum 2-3 items per array (e.g., 2 courses, 2 lessons, 1 user). Do not write paragraphs of description text.
- Try to put most of your components directly inside src/App.jsx instead of creating many separate files.
- Simplify non-core features and avoid unnecessary UI fluff. Make it work fully end-to-end first.
- No markdown, no code fences, no explanation — ONLY the JSON object`

function safeParseJSONObject(raw) {
  let text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  try { return JSON.parse(text) } catch (_) { /* fall through to repair */ }

  // Truncated mid-string scenario
  try { return JSON.parse(text + '"}') } catch (_) {}
  try { return JSON.parse(text + '}') } catch (_) {}

  // Walk backward to last complete key-value pair and close it
  const lastComma = text.lastIndexOf('",')
  if (lastComma > 0) {
    try { return JSON.parse(text.slice(0, lastComma + 1) + '}') } catch (_) {}
  }

  throw new SyntaxError('Could not parse or repair JSON from model response')
}

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
      max_tokens: 16384,
      system: CODE_GEN_SYSTEM,
      messages: [{ role: 'user', content: userMessage }],
    })

    const raw = message.content[0].text.trim()
    
    let fileMap
    let isErrorState = false

    try {
      fileMap = safeParseJSONObject(raw)
    } catch (_) {
      isErrorState = true
      fileMap = { 
        'index.html': `<html><body><h1>RAW RESPONSE FAILED TO PARSE:</h1><pre>${raw}</pre></body></html>` 
      }
    }

    const requiredFiles = ['package.json', 'index.html', 'src/main.jsx', 'src/App.jsx']
    if (!isErrorState) {
      for (const f of requiredFiles) {
        if (!(f in fileMap)) {
          isErrorState = true
          fileMap = {
            'index.html': `<html><body><h1>Missing file: ${f}</h1><pre>RAW RESPONSE:\n\n${raw}</pre></body></html>`
          }
          break
        }
      }
    }

    // Convert to files array
    const files = Object.entries(fileMap).map(([path, content]) => ({ path, content }))
    
    // If it's an error state, also log it locally in case Vercel totally rejects it
    if (isErrorState) {
      import('fs').then(fs => fs.writeFileSync('./error.log', raw))
    }

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

    const slugName = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)

    const vercelFiles = files.map(f => ({
      file: f.path,
      data: Buffer.from(f.content, 'utf-8').toString('base64'),
      encoding: 'base64',
    }))

    const projectSettings = isErrorState
      ? { framework: null } // Static HTML deploy so it doesn't crash on npm install
      : {
          framework: 'vite',
          installCommand: 'npm install',
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
        }

    const deployBody = {
      name: slugName || 'promptready-app',
      files: vercelFiles,
      projectSettings,
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

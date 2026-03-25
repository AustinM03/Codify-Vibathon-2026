import Anthropic from '@anthropic-ai/sdk'
import { inngest } from './client.js'
import { supabase } from '../supabaseServer.js'
import { MODELS } from '../models.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ---------------------------------------------------------------------------
// Static files that never touch Claude — keeps token budget for real code
// ---------------------------------------------------------------------------
const BASE_TEMPLATE = {
  'index.html': `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>App</title></head>
<body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>
</html>`,

  'vite.config.js': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({ plugins: [react()] })`,

  'src/main.jsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>)`,
}

// Minimal package.json — extra deps merged from architect output
function buildPackageJson(name, extraDeps = {}) {
  return JSON.stringify({
    name: name || 'generated-app',
    private: true,
    version: '0.0.1',
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: {
      react: '^18.2.0',
      'react-dom': '^18.2.0',
      ...extraDeps,
    },
    devDependencies: {
      vite: '^5.0.0',
      '@vitejs/plugin-react': '^4.0.0',
    },
  }, null, 2)
}

// Strip markdown fences Claude sometimes wraps code in
function stripFences(text) {
  return text.trim().replace(/^```[\w]*\s*/i, '').replace(/\s*```\s*$/i, '').trim()
}

// Robust JSON parse with truncation repair (from existing build.js)
function safeParseJSON(raw) {
  const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  try { return JSON.parse(text) } catch (_) { /* fall through */ }
  try { return JSON.parse(text + '"]') } catch (_) {}
  try { return JSON.parse(text + '}]') } catch (_) {}
  try { return JSON.parse(text + '"}]') } catch (_) {}
  throw new SyntaxError('Could not parse architect JSON')
}

async function updateJob(jobId, fields) {
  await supabase.from('jobs').update(fields).eq('id', jobId)
}

// ---------------------------------------------------------------------------
// buildAppJob — the Inngest function (3 sequential steps)
// ---------------------------------------------------------------------------
export const buildAppJob = inngest.createFunction(
  { id: 'build-app-job', retries: 1, triggers: [{ event: 'app/build' }] },
  async ({ event, step }) => {
    const { jobId, session_id, title, prompt, tech_stack, features, dev_mode } = event.data
    const model = dev_mode ? MODELS.FAST : MODELS.BALANCED

    // -----------------------------------------------------------------------
    // Step A — Architect: design the file schema
    // -----------------------------------------------------------------------
    const schema = await step.run('architect', async () => {
      await updateJob(jobId, { status: 'Architecting codebase...' })

      const res = await client.messages.create({
        model,
        max_tokens: 2048,
        system: `You are a senior React architect. Given an app specification, output a JSON array describing the src/ files to create.
Each item: { "path": "src/Foo.jsx", "description": "...", "exports": ["default Foo"], "dependencies": [] }
Rules:
- 3-6 files max, all under src/
- src/App.jsx is ALWAYS the first entry — it is the root component
- dependencies = npm packages beyond react/react-dom (e.g. "recharts", "date-fns")
- ONLY output the JSON array. No markdown, no explanation.`,
        messages: [{
          role: 'user',
          content: `Design the file structure for this app:

## App Name
${title}

## Specification
${prompt}

${features?.length ? `## Features\n${features.map(f => `- ${f}`).join('\n')}` : ''}
${tech_stack?.length ? `## Tech Stack\n${tech_stack.map(t => `- ${t}`).join('\n')}` : ''}

Return ONLY the JSON array.`
        }],
      })

      return safeParseJSON(res.content[0].text)
    })

    // -----------------------------------------------------------------------
    // Step B — Worker Swarm: write each file in parallel
    // -----------------------------------------------------------------------
    const generatedFiles = await step.run('worker-swarm', async () => {
      await updateJob(jobId, { status: 'Writing files...', total_files: schema.length })

      // Collect extra dependencies from architect output
      const allDeps = {}
      schema.forEach(f => (f.dependencies ?? []).forEach(d => { allDeps[d] = 'latest' }))

      // Build context string so each worker knows about sibling files
      const schemaContext = schema.map(f => `- ${f.path}: ${f.description} (exports: ${f.exports?.join(', ') ?? 'default'})`).join('\n')

      let completed = 0
      const files = await Promise.all(schema.map(async (fileSpec) => {
        const res = await client.messages.create({
          model,
          max_tokens: 4096,
          system: `You are an expert React developer writing a single file for a larger project.
Rules:
- Output ONLY the file contents — no markdown fences, no explanation
- Use React 18 with functional components and hooks
- Use inline styles — no CSS frameworks, no Tailwind
- Make it visually polished with good spacing, colors, typography
- NO API keys or environment variables
- Mock any backend/database with local state or localStorage
- Keep code concise — this is an MVP prototype
- CRITICAL: Use correct relative import paths based on the file's location. For example, if you are writing src/App.jsx and importing src/components/Foo.jsx, use './components/Foo'. If writing src/components/Bar.jsx and importing src/hooks/useX.js, use '../hooks/useX'.`,
          messages: [{
            role: 'user',
            content: `Write the complete code for: ${fileSpec.path}
Description: ${fileSpec.description}
Exports: ${fileSpec.exports?.join(', ') ?? 'default'}

## Full App Context
App: ${title}
Spec: ${prompt}

## Project File Structure
${schemaContext}

IMPORTANT: This file is located at "${fileSpec.path}". Calculate all import paths relative to this file's directory.

Write ONLY the code for ${fileSpec.path}. No explanation, no markdown fences.`
          }],
        })

        completed++
        await updateJob(jobId, { progress: completed })

        return { path: fileSpec.path, content: stripFences(res.content[0].text) }
      }))

      return { files, extraDeps: allDeps }
    })

    // -----------------------------------------------------------------------
    // Step C — Assembly & Deploy to Vercel
    // -----------------------------------------------------------------------
    const result = await step.run('assembly-deploy', async () => {
      await updateJob(jobId, { status: 'Deploying to Vercel...' })

      // Merge base template + generated files
      const slugName = (title || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
      const fileMap = {
        ...BASE_TEMPLATE,
        'package.json': buildPackageJson(slugName, generatedFiles.extraDeps),
      }
      generatedFiles.files.forEach(f => { fileMap[f.path] = f.content })

      const vercelToken = process.env.VERCEL_TOKEN
      if (!vercelToken) {
        await updateJob(jobId, { status: 'Done!', deploy_url: null, error: 'No VERCEL_TOKEN configured' })
        return { deploy_url: null }
      }

      const vercelFiles = Object.entries(fileMap).map(([path, content]) => ({
        file: path,
        data: Buffer.from(content, 'utf-8').toString('base64'),
        encoding: 'base64',
      }))

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
        body: JSON.stringify({
          name: slugName || 'promptready-app',
          files: vercelFiles,
          projectSettings: {
            framework: 'vite',
            installCommand: 'npm install',
            buildCommand: 'npm run build',
            outputDirectory: 'dist',
          },
        }),
      })

      const deployData = await deployRes.json()

      if (!deployRes.ok) {
        const errMsg = deployData.error?.message ?? 'Vercel deployment failed'
        await updateJob(jobId, { status: 'Error', error: errMsg })
        throw new Error(errMsg)
      }

      const deployUrl = `https://${deployData.url}`
      await updateJob(jobId, { status: 'Done!', deploy_url: deployUrl })
      return { deploy_url: deployUrl }
    })

    return result
  }
)

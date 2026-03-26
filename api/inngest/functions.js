import Anthropic from '@anthropic-ai/sdk'
import { inngest } from './client.js'
import { supabase } from '../supabaseServer.js'
import { MODELS } from '../models.js'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  timeout: 45_000, // 45s — fail fast before Vercel's 60s kill, let Inngest retry cleanly
})

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
  { id: 'build-app-job', retries: 3, triggers: [{ event: 'app/build' }] },
  async ({ event, step }) => {
    const { jobId, session_id, title, prompt, tech_stack, features, dev_mode } = event.data
    // Haiku for all build steps — fast responses (3-10s) guarantee we stay
    // well under Vercel's 60s timeout. Files are small (~50-80 lines) so
    // Haiku quality is sufficient.
    const buildModel = MODELS.FAST

    // -----------------------------------------------------------------------
    // Step A — Architect: design the file schema (Haiku for speed)
    // -----------------------------------------------------------------------
    const schema = await step.run('architect', async () => {
      await updateJob(jobId, { status: 'Architecting codebase...' })

      const res = await client.messages.create({
        model: buildModel,
        max_tokens: 4096,
        system: `You are a senior React architect. Given an app specification, output a JSON array describing the src/ files to create.
Each item: { "path": "src/Foo.jsx", "description": "...", "exports": ["default Foo"], "dependencies": [] }

Rules:
- All files under src/
- src/App.jsx is ALWAYS the first entry — it is the root component and router
- Prefer MANY small files over few large ones — each file should be a single component, hook, or utility (~50-80 lines max)
- No file count limit — let the app's complexity determine how many files are needed
- dependencies = npm packages beyond react/react-dom (e.g. "recharts", "date-fns")
- ONLY output the JSON array. No markdown, no explanation

Architecture constraint — each file will be generated independently by a separate AI call in parallel. The writer sees ONLY the file list and the app spec, NOT the code of other files. Design for this:
- Each component must be fully self-contained — one responsibility per file
- Put ALL state management in App.jsx and pass data down via props. Child components should be pure/presentational
- If a shared data model or theme is needed, make it its own file (e.g. src/theme.js, src/data.js) so every file can import it
- Write detailed descriptions — these are the ONLY instructions the file writer gets. Include: what the component renders, what props it expects (names and types), what callbacks it exposes, and any specific UI details`,
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
    // Step B — Worker Swarm: write each file as its own Inngest step
    // Each step.run() gets its own serverless invocation (stays under 10s)
    // -----------------------------------------------------------------------
    await step.run('init-swarm', async () => {
      await updateJob(jobId, { status: 'Writing files...', total_files: schema.length })
    })

    // Collect extra dependencies from architect output
    const allDeps = {}
    schema.forEach(f => (f.dependencies ?? []).forEach(d => { allDeps[d] = 'latest' }))

    // Build context string so each worker knows about sibling files
    const schemaContext = schema.map(f => `- ${f.path}: ${f.description} (exports: ${f.exports?.join(', ') ?? 'default'})`).join('\n')

    const BATCH_SIZE = 5
    const files = []
    for (let b = 0; b < schema.length; b += BATCH_SIZE) {
      const batch = schema.slice(b, b + BATCH_SIZE)
      const batchFiles = await Promise.all(
        batch.map((fileSpec, j) => {
          const i = b + j
          return step.run(`write-file-${i}`, async () => {
            const res = await client.messages.create({
              model: buildModel,
              max_tokens: 2048,
              system: `You are an expert React developer writing a single file for a larger project.
Rules:
- Output ONLY the file contents — no markdown fences, no explanation
- Use React 18 with functional components and hooks
- Use inline styles — no CSS frameworks, no Tailwind
- NO API keys or environment variables
- Mock any backend/database with local state or localStorage
- CRITICAL: Use correct relative import paths based on the file's location. For example, if writing src/App.jsx and importing src/components/Foo.jsx, use './components/Foo'. If writing src/components/Bar.jsx and importing src/hooks/useX.js, use '../hooks/useX'

The project already has these files (do NOT generate them):
- index.html (mounts #root)
- vite.config.js (React plugin)
- src/main.jsx (renders <App /> into #root via ReactDOM.createRoot)

Design system — apply consistently since files are generated independently:
- Use a cohesive color palette: one primary color, one accent, neutral grays for backgrounds/borders, white cards on light gray (#f5f5f5) backgrounds
- Typography: system font stack (-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif), base 16px, headings bold
- Spacing: 8px grid (padding/margins in multiples of 8)
- Cards/containers: 8px border-radius, subtle box-shadow (0 2px 8px rgba(0,0,0,0.1))
- Interactive elements: smooth transitions (0.2s ease), hover states, pointer cursor

This file is generated in ISOLATION — you cannot see the code of sibling files. Use the file descriptions and export lists in the project structure below to determine the correct import names, prop interfaces, and callback signatures. Match them exactly.`,
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

            return { path: fileSpec.path, content: stripFences(res.content[0].text) }
          })
        })
      )
      files.push(...batchFiles)
      // Update progress after each batch completes — no race condition
      await step.run(`progress-batch-${b}`, async () => {
        await updateJob(jobId, { progress: Math.min(b + batch.length, schema.length) })
      })
    }

    const generatedFiles = { files, extraDeps: allDeps }

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

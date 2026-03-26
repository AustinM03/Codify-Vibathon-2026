import { inngest } from './client.js'
import { supabase } from '../supabaseServer.js'
import { MODELS } from '../models.js'

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

// Robust JSON parse — handles fences, preamble text, and truncation
function safeParseJSON(raw) {
  let text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  const arrStart = text.indexOf('[')
  if (arrStart > 0) text = text.slice(arrStart)
  const arrEnd = text.lastIndexOf(']')
  if (arrEnd > 0) text = text.slice(0, arrEnd + 1)

  try { return JSON.parse(text) } catch (_) { /* fall through */ }
  try { return JSON.parse(text + '"]') } catch (_) {}
  try { return JSON.parse(text + '}]') } catch (_) {}
  try { return JSON.parse(text + '"}]') } catch (_) {}
  throw new SyntaxError('Could not parse architect JSON: ' + text.slice(0, 200))
}

async function updateJob(jobId, fields) {
  await supabase.from('jobs').update(fields).eq('id', jobId)
}

// ---------------------------------------------------------------------------
// buildAppJob — the Inngest function
// step.ai.infer() offloads Claude calls to Inngest's servers — zero Vercel timeout risk
// ---------------------------------------------------------------------------
export const buildAppJob = inngest.createFunction(
  { id: 'build-app-job', retries: 3, triggers: [{ event: 'app/build' }] },
  async ({ event, step }) => {
    const { jobId, session_id, title, prompt, tech_stack, features } = event.data

    // -----------------------------------------------------------------------
    // Step A — Architect: design the file schema (Haiku — simple JSON output)
    // -----------------------------------------------------------------------
    await step.run('architect-status', async () => {
      await updateJob(jobId, { status: 'Architecting codebase...' })
    })

    const architectRes = await step.ai.infer('architect', {
      model: step.ai.models.anthropic({
        model: MODELS.FAST,
        defaultParameters: { max_tokens: 4096 },
      }),
      body: {
        system: `You are a React architect. Output a JSON array of src/ files for a client-side React app.
Each item: { "path": "src/Foo.jsx", "description": "...", "exports": ["default Foo"], "dependencies": [] }

FILE COUNT: 6–10 files maximum. Every extra file is a risk — keep it tight.

REQUIRED structure (always include these in this order):
1. src/data.js — ALL mock data as exported JS arrays/objects. No components. Just data.
2. src/App.jsx — Root component. Owns ALL useState. Renders views conditionally based on a "currentView" state string. No react-router-dom. No useContext. Just props down.
3. 1–2 view files (src/views/HomeView.jsx, src/views/DetailView.jsx, etc.) — each renders one screen, receives all data and callbacks as props from App
4. 2–4 shared UI components (src/components/Card.jsx, etc.) — purely presentational, props only

RULES:
- NEVER use react-router-dom, useContext, createContext, useReducer, Zustand, Redux, or any state library
- NEVER create a hooks/ directory or custom hooks — inline logic in components
- NEVER make real API calls — all data comes from src/data.js
- ALL state lives in App.jsx as useState. Pass everything down as props
- dependencies array: ONLY charting/UI libs like "recharts" or "react-icons". No state libs
- ONLY output the raw JSON array. No markdown, no explanation

DESCRIPTION rules — descriptions are the ONLY context the file writer gets:
- For src/data.js: list every exported variable name and its shape. E.g. "Exports: items (array of {id,name,price,category}), users (array of {id,name,email}). Seed with 5-8 realistic entries each."
- For view files: list every prop name and type. E.g. "Props: items (array), onSelect(item), currentUser(object). Renders a grid of Cards..."
- For App.jsx: list all useState variables with initial values. E.g. "useState: currentView('home'), selectedItem(null), items(imported from data.js)..."
- Be specific enough that a developer with no other context can write the complete file`,
        messages: [{
          role: 'user',
          content: `Design the file structure for this app:

## App Name
${title}

## Specification
${prompt}

${features?.length ? `## Features\n${features.map(f => `- ${f}`).join('\n')}` : ''}

Return ONLY the JSON array.`,
        }],
        max_tokens: 4096,
      },
    })

    const schema = safeParseJSON(architectRes.content[0].text)

    // -----------------------------------------------------------------------
    // Step B — Worker Swarm: write each file via step.ai.infer (Sonnet quality,
    // no timeout risk — Inngest makes the call, Vercel just collects the result)
    // -----------------------------------------------------------------------
    await step.run('init-swarm', async () => {
      await updateJob(jobId, { status: 'Writing files...', total_files: schema.length })
    })

    const allDeps = {}
    schema.forEach(f => (f.dependencies ?? []).forEach(d => { allDeps[d] = 'latest' }))

    const schemaContext = schema.map(f =>
      `- ${f.path} (exports: ${f.exports?.join(', ') ?? 'default'})`
    ).join('\n')

    const fileWriterSystem = `You are a React developer writing ONE file. Output ONLY raw file contents — no markdown fences, no explanation.

RULES:
- Functional components, useState/useEffect only. Inline styles only (no Tailwind/CSS files)
- NEVER use: useContext, createContext, useReducer, react-router-dom, Zustand/Redux, fetch(), process.env
- Navigation: use props like currentView/setCurrentView passed from App.jsx — never a router
- Mock data: import from ../data or ./data — never hardcode data in components
- Defensive JSX: always (items ?? []).map(...), always item?.name ?? 'Unknown'
- Declare every prop in the function signature: function Foo({ items, onSelect }) {
- src/data.js: export plain JS arrays/objects only. No React imports.
- Import paths are RELATIVE to this file's location. src/App.jsx → './components/Foo'. src/views/Home.jsx → '../components/Foo', '../data'
- DO NOT generate: index.html, vite.config.js, src/main.jsx

DESIGN: inline styles, #f5f5f5 page bg, #fff cards, 8px border-radius, 8px spacing grid, system font stack, use primary color from spec or #4f46e5.

This file is written in ISOLATION — use only the export names and prop signatures from the file list below.`

    const BATCH_SIZE = 3
    const files = []
    for (let b = 0; b < schema.length; b += BATCH_SIZE) {
      const batch = schema.slice(b, b + BATCH_SIZE)
      const batchFiles = await Promise.all(
        batch.map((fileSpec, j) => {
          const i = b + j
          const fileWriterMessage = `Write the complete code for: ${fileSpec.path}
Description: ${fileSpec.description}
Exports: ${fileSpec.exports?.join(', ') ?? 'default'}

## App
${title}: ${prompt.slice(0, 300)}

## Project File Structure
${schemaContext}

IMPORTANT: This file is located at "${fileSpec.path}". Calculate all import paths relative to this file's directory.

Write ONLY the code for ${fileSpec.path}. No explanation, no markdown fences.`

          return step.ai.infer(`write-file-${i}`, {
            model: step.ai.models.anthropic({
              model: MODELS.FAST,
              defaultParameters: { max_tokens: 4096 },
            }),
            body: {
              system: fileWriterSystem,
              messages: [{ role: 'user', content: fileWriterMessage }],
              max_tokens: 4096,
            },
          }).then(res => ({ path: fileSpec.path, content: stripFences(res.content[0].text) }))
        })
      )
      files.push(...batchFiles)
      await step.run(`progress-batch-${b}`, async () => {
        await updateJob(jobId, { progress: Math.min(b + batch.length, schema.length) })
      })
      if (b + BATCH_SIZE < schema.length) {
        await step.sleep(`batch-gap-${b}`, '10s')
      }
    }

    // -----------------------------------------------------------------------
    // Step C — Assembly & Deploy to Vercel
    // -----------------------------------------------------------------------
    const result = await step.run('assembly-deploy', async () => {
      await updateJob(jobId, { status: 'Deploying to Vercel...' })

      const slugName = (title || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
      const fileMap = {
        ...BASE_TEMPLATE,
        'package.json': buildPackageJson(slugName, allDeps),
      }
      files.forEach(f => { fileMap[f.path] = f.content })

      const vercelToken = process.env.DEPLOY_VERCEL_TOKEN
      if (!vercelToken) {
        await updateJob(jobId, { status: 'Done!', deploy_url: null, error: 'No DEPLOY_VERCEL_TOKEN configured' })
        return { deploy_url: null }
      }

      const vercelFiles = Object.entries(fileMap).map(([path, content]) => ({
        file: path,
        data: Buffer.from(content, 'utf-8').toString('base64'),
        encoding: 'base64',
      }))

      const teamId = process.env.DEPLOY_TEAM_ID
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
        const debugInfo = `[${deployRes.status}] token=${vercelToken?.slice(0,8)}... teamId=${teamId ?? 'none'} err=${errMsg}`
        console.error('Deploy failed:', debugInfo, JSON.stringify(deployData))
        await updateJob(jobId, { status: 'Error', error: debugInfo })
        throw new Error(debugInfo)
      }

      const deployUrl = `https://${deployData.url}`
      await updateJob(jobId, { status: 'Done!', deploy_url: deployUrl })
      return { deploy_url: deployUrl }
    })

    return result
  }
)

// ---------------------------------------------------------------------------
// generatePlanJob — runs Claude to produce a build spec, saves to build_plans
// step.ai.infer() means Sonnet runs on Inngest's servers — no Vercel timeout
// ---------------------------------------------------------------------------
const GENERATE_SYSTEM_PROMPT = `You are a product strategist writing a build specification for an AI code generator. The generator builds client-side React apps where each file is written by a separate AI in isolation with no shared context.

Return ONLY a valid JSON object with exactly these fields:
{
  "title": "3-5 word app name, title case, no punctuation",
  "summary": "2-3 plain-English sentences. What it does, who it's for, what problem it solves. No jargon.",
  "prompt": "CRITICAL FIELD — the full spec the code generator receives. 300-500 words. Write it as direct instructions starting with 'Build a [name]...'. Structure:\n\n1) OVERVIEW: what the app is, who uses it, core value (2-3 sentences)\n2) VISUAL DESIGN: exact primary color hex, accent color, layout pattern (e.g. 'top nav + content area', 'sidebar + main', 'single scrolling page'), overall feel\n3) SCREENS: describe each view/screen separately. For each: what it shows, what the user can do, what data appears. Be specific — name the fields, buttons, and interactions\n4) MOCK DATA: list the exact entities with field names. E.g. 'Products: {id, name, price, category, inStock}. Seed with 6 realistic entries: [Apple Watch $399 Electronics, ...]'. Every screen that shows data must reference these same entities\n5) INTERACTIONS: which actions update state (add, delete, filter, select, toggle). State lives in App.jsx and is passed as props — keep it simple\n\nCONSTRAINTS TO INCLUDE IN THE PROMPT (copy these verbatim into the prompt field):\n- No routing library. Use a currentView state variable in App.jsx for navigation\n- All state in App.jsx as useState. Child components receive data and callbacks as props only\n- All backend is mocked with hardcoded data from src/data.js. No fetch, no API, no auth\n- Max 3 interactive features — keep scope tight so every feature works",
  "features": ["4-6 plain-English feature names that map to the screens described in prompt"],
  "tech_stack": ["React 18", "Vite", "Inline styles"],
  "user_stories": ["As a [user], I can [action] so that [benefit]. — 3-5 stories"],
  "build_traps": ["2-3 warnings about scope creep or complexity that would break the generator"],
  "phases": { "phase1": ["must-have features"], "phase2": ["nice-to-have enhancements"] }
}

Rules:
- prompt is the most important field. It determines whether the generated app works or crashes. Be specific, concrete, and scope-limited
- Never suggest auth, payments, real APIs, or multi-user features — these cannot be faked cleanly
- No markdown, no code fences, no explanation — only the JSON object`

export const generatePlanJob = inngest.createFunction(
  { id: 'generate-plan-job', retries: 2, triggers: [{ event: 'app/generate' }] },
  async ({ event, step }) => {
    const { jobId, session_id, raw_idea, extracted, answers } = event.data

    try {
      await step.run('generate-status', async () => {
        await updateJob(jobId, { status: 'Generating plan...' })
      })

      const extractedBlock = extracted
        ? `## Extracted App Profile\nCore problem: ${extracted.core_problem ?? 'not specified'}\nTarget users: ${extracted.target_users ?? 'not specified'}\nKey features: ${Array.isArray(extracted.key_features) ? extracted.key_features.join(', ') : 'not specified'}\nDomain: ${extracted.domain ?? 'not specified'}\nScale: ${extracted.scale ?? 'not specified'}`
        : `## Raw Idea\n"${raw_idea}"`

      const answersBlock = answers
        .map(a => `### ${a.category}\nQuestion: ${a.question}\nAnswer: ${a.answer}`)
        .join('\n\n')

      const userMessage = `Generate a complete build specification for this app.\n\n## Original Idea\n"${raw_idea.slice(0, 500)}"\n\n${extractedBlock}\n\n## User's Planning Answers (7 Categories)\n\n${answersBlock}\n\nNow generate the full build specification JSON.`

      // step.ai.infer — Inngest calls Anthropic on their servers, Vercel function
      // returns immediately and is re-invoked with the result. No timeout risk.
      const aiRes = await step.ai.infer('generate', {
        model: step.ai.models.anthropic({
          model: MODELS.BALANCED,
          defaultParameters: { max_tokens: 4000 },
        }),
        body: {
          system: GENERATE_SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userMessage }],
          max_tokens: 4000,
        },
      })

      const result = await step.run('save-plan', async () => {
        let cleaned = aiRes.content[0].text.trim()
          .replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
        const objStart = cleaned.indexOf('{')
        const objEnd = cleaned.lastIndexOf('}')
        if (objStart === -1 || objEnd === -1) throw new Error(`Model returned non-JSON: ${cleaned.slice(0, 200)}`)
        cleaned = cleaned.slice(objStart, objEnd + 1)
        const json = JSON.parse(cleaned)

        const { error: upsertErr } = await supabase.from('build_plans').upsert({
          session_id,
          title: json.title,
          summary: json.summary,
          prompt: json.prompt,
          features: json.features,
          tech_stack: json.tech_stack,
          user_stories: json.user_stories,
        }, { onConflict: 'session_id' })

        if (upsertErr) throw new Error('Failed to save plan: ' + upsertErr.message)

        await updateJob(jobId, { status: 'Done!' })
        return json
      })

      return result
    } catch (err) {
      await updateJob(jobId, { status: 'Error', error: err.message ?? 'Plan generation failed' })
      throw err
    }
  }
)

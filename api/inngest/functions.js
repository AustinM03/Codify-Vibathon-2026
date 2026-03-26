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
        system: `You are a senior React architect. Given an app specification, output a JSON array describing the src/ files to create.
Each item: { "path": "src/Foo.jsx", "description": "...", "exports": ["default Foo"], "dependencies": [] }

Rules:
- All files under src/
- src/App.jsx is ALWAYS the first entry — it is the root component and router. Keep App.jsx THIN: only top-level state, routing logic, and composition of child components. No inline UI — delegate everything to named components
- Prefer MANY small files over few large ones — each file should be a single component, hook, or utility (~50-80 lines max)
- No file count limit — let the app's complexity determine how many files are needed
- NEVER create a large context file (e.g. DataContext.jsx) that combines data + actions + state. Instead split into: src/data.js (mock data only), src/hooks/useX.js (one hook per concern). Context files easily exceed the token limit and will be truncated
- NEVER put more than one concern in a single file. If a file would need more than ~80 lines, split it
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
      `- ${f.path}: ${f.description} (exports: ${f.exports?.join(', ') ?? 'default'})`
    ).join('\n')

    const fileWriterSystem = `You are an expert React developer writing a single file for a larger project.
Rules:
- Output ONLY the file contents — no markdown fences, no explanation
- Use React 18 with functional components and hooks
- Use inline styles — no CSS frameworks, no Tailwind
- NO API keys or environment variables
- Mock any backend/database with local state or localStorage
- CRITICAL: Use correct relative import paths based on the file's location. For example, if writing src/App.jsx and importing src/components/Foo.jsx, use './components/Foo'. If writing src/components/Bar.jsx and importing src/hooks/useX.js, use '../hooks/useX'
- CRITICAL: If using react-router-dom, ALWAYS wrap the root in <BrowserRouter> inside App.jsx. Never call useLocation() or useNavigate() outside a <Router> — this causes a fatal white-page crash
- CRITICAL: Always declare variables before using them. Never reference an identifier that hasn't been initialized in the current scope
- CRITICAL: For Zustand, use the named import: import { create } from 'zustand' — the default import is deprecated and will crash
- CRITICAL: Every prop and callback referenced in JSX must be declared — never use an undeclared variable
- CRITICAL: Keep each component concise. If a component would exceed ~120 lines, split logic into smaller helpers within the same file

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

This file is generated in ISOLATION — you cannot see the code of sibling files. Use the file descriptions and export lists in the project structure below to determine the correct import names, prop interfaces, and callback signatures. Match them exactly.`

    const BATCH_SIZE = 5
    const files = []
    for (let b = 0; b < schema.length; b += BATCH_SIZE) {
      const batch = schema.slice(b, b + BATCH_SIZE)
      const batchFiles = await Promise.all(
        batch.map((fileSpec, j) => {
          const i = b + j
          const fileWriterMessage = `Write the complete code for: ${fileSpec.path}
Description: ${fileSpec.description}
Exports: ${fileSpec.exports?.join(', ') ?? 'default'}

## Full App Context
App: ${title}
Spec: ${prompt}

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
          name: slugName || 'prism-app',
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
const GENERATE_SYSTEM_PROMPT = `You are a senior software architect and product strategist. Your job is to synthesize a user's app idea and their answers to 7 planning questions into a complete, actionable build specification.

Return ONLY a valid JSON object with exactly these fields:
{
  "title": "3-5 word app name that captures the core value",
  "summary": "2-3 sentences in plain English describing what the app does, who it's for, and what problem it solves. No jargon.",
  "prompt": "A complete app specification used to generate a multi-file React+Vite project where EACH FILE is written by a separate AI call in isolation. Must be 400-800 words. Structure it as:\n\n1) APP OVERVIEW — what the app is and who it's for (2-3 sentences)\n2) VISUAL DESIGN — specific primary color hex code, accent color, overall feel (e.g. 'clean and minimal' or 'bold and playful'), key layout pattern (sidebar+main, tab bar, single scroll)\n3) CORE FEATURES — bulleted, each with specific behavior (inputs, outputs, interactions). Be precise enough that a developer who can't ask questions could build it\n4) SCREENS/VIEWS — describe EACH screen in its own paragraph: what components appear, what data is shown, what actions are available, how the user navigates to/from it. This is critical because each screen may be built by a different developer who cannot see the other screens\n5) DATA MODEL — the key entities, their fields, and relationships. Include sample mock data values so every file uses consistent fake data (same user names, same item names, same categories)\n6) BUSINESS RULES — validation rules, calculated fields, state transitions\n\nWrite it as a direct instruction starting with 'Build a [app name]...'. Focus on WHAT not HOW. Keep scope realistic for a client-side React app with mocked data.",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "tech_stack": ["Technology 1", "Technology 2", "Technology 3"],
  "user_stories": ["As a [user type], I can [action] so that [benefit].", "..."],
  "build_traps": ["Plain-English warning about a non-obvious build risk"],
  "phases": { "phase1": ["Core feature A", "Core feature B"], "phase2": ["Enhancement D"] }
}

Rules:
- title: no subtitle, no punctuation, title case
- summary: completely jargon-free
- prompt: this is the most important field — make it dense, specific, and immediately actionable
- features: 4-8 items, plain-English noun phrases
- tech_stack: realistic recommendations based on scale and features
- user_stories: 4-6 stories in "As a X, I can Y so that Z" format
- build_traps: always include 2-4 items flagging third-party setup, sync risks, or hosting misconceptions
- phases: split into phase1 (minimal core loop) and phase2 (enhancements) if 5+ features; else null
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

/**
 * Local dev server — Codify Vibeathon 2026
 *
 * Wraps Vercel serverless handlers as Express routes so the full
 * API stack runs locally on port 3001. Vite proxies /api/* here.
 *
 * Usage: npm run dev:local
 */

import 'dotenv/config'
import express from 'express'

// Import all API handlers
import questionnaireHandler from './api/questionnaire.js'
import explainHandler       from './api/explain.js'
import testClaudeHandler    from './api/test-claude.js'
import extractHandler       from './api/extract.js'
import generateHandler      from './api/generate.js'

const app  = express()
const PORT = 3001

app.use(express.json())

// Shim: wrap Vercel-style handlers (req, res) as Express middleware
function route(handler) {
  return (req, res) => handler(req, res)
}

app.all('/api/questionnaire', route(questionnaireHandler))
app.all('/api/explain',       route(explainHandler))
app.all('/api/test-claude',   route(testClaudeHandler))
app.all('/api/extract',       route(extractHandler))
app.all('/api/generate',      route(generateHandler))

// validate.js lives on feature/centralize-models — load if present
try {
  const { default: validateHandler } = await import('./api/validate.js')
  app.all('/api/validate', route(validateHandler))
  console.log('   /api/validate loaded')
} catch {
  console.log('   /api/validate not found (merge feature/centralize-models to enable)')
}

// Health check
app.get('/health', (_, res) => res.json({ status: 'ok', server: 'local-dev' }))

app.listen(PORT, () => {
  console.log(`\n🚀 Local API server running on http://localhost:${PORT}`)
  console.log(`   /api/questionnaire  →  Opus 4.6`)
  console.log(`   /api/explain        →  phase-based`)
  console.log(`   /api/validate       →  Opus 4.6`)
  console.log(`   /api/extract        →  Sonnet 4.6`)
  console.log(`   /api/generate       →  Opus 4.6`)
  console.log(`   /api/test-claude    →  Haiku\n`)
})

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

import questionnaireHandler from './api/questionnaire.js'
import explainHandler       from './api/explain.js'
import testClaudeHandler    from './api/test-claude.js'
import validateHandler      from './api/validate.js'
import extractHandler       from './api/extract.js'
import generateHandler      from './api/generate.js'

const app  = express()
const PORT = 3001

app.use(express.json())

function route(handler) {
  return (req, res) => handler(req, res)
}

app.all('/api/questionnaire', route(questionnaireHandler))
app.all('/api/explain',       route(explainHandler))
app.all('/api/test-claude',   route(testClaudeHandler))
app.all('/api/validate',      route(validateHandler))
app.all('/api/extract',       route(extractHandler))
app.all('/api/generate',      route(generateHandler))

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

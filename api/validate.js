/**
 * Validate endpoint — Codify Vibeathon 2026
 *
 * Called after all 7 questionnaire steps are complete.
 * Uses Opus to review the full set of answers and determine
 * whether the user has provided enough information to proceed.
 *
 * Returns:
 *   ready        {boolean} — true if all gaps are resolved
 *   gaps         {string[]} — list of missing or thin answers
 *   contradictions {string[]} — any conflicting answers across categories
 *   summary      {string} — one-paragraph plain-English summary of what will be built
 */

import Anthropic from '@anthropic-ai/sdk'
import { MODELS } from './models.js'
import { requireAuth } from './authMiddleware.js'

export const config = { maxDuration: 60 }

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: 50_000 })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await requireAuth(req, res)
  if (!user) return

  const { answers } = req.body ?? {}

  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers array is required' })
  }

  const answersText = answers
    .map(a => `[${a.category}] Q: ${a.question}\nA: ${a.answer}`)
    .join('\n\n')

  const prompt = `You are a senior product consultant reviewing a client's answers before starting to build their app. Your job is to check whether they have given enough information across all 7 areas to move forward confidently.

Here are all their answers so far:

${answersText}

Review these answers and return a JSON object with exactly this shape:
{
  "ready": true or false,
  "gaps": ["plain English description of missing or thin answer", ...],
  "contradictions": ["plain English description of any conflicting answers", ...],
  "summary": "One short paragraph (3-5 sentences) summarising what the app will do, who it's for, and what makes it unique — written in plain English as if explaining it to a friend."
}

Rules:
- "ready" should be true only if all 7 categories have substantive answers and there are no critical contradictions
- "gaps" should list any category with a vague, missing, or one-word answer — be specific about what's missing
- "contradictions" should list any places where answers conflict with each other
- "summary" should be warm and human — no technical jargon
- Return ONLY valid JSON. No markdown, no code fences, no explanation.`

  try {
    const message = await client.messages.create({
      model: MODELS.POWERFUL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].text.trim()
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const result = JSON.parse(cleaned)

    return res.status(200).json(result)
  } catch (err) {
    console.error('Validate API error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}

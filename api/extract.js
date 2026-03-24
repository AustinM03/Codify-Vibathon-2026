/**
 * POST /api/extract
 *
 * Stage 1 of the output pipeline.
 * Takes the user's raw 2-3 sentence app idea and extracts structured signal
 * using Sonnet 4.6. This structured output feeds directly into /api/generate
 * and can optionally be used by Austin's questionnaire for personalization.
 *
 * Input:  { raw_idea: string }
 * Output: { core_problem, target_users, key_features[], domain, scale }
 */

import Anthropic from '@anthropic-ai/sdk'

const BALANCED = 'claude-sonnet-4-6'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a product analyst. Extract structured information from a brief app idea description.

Return ONLY a valid JSON object with exactly these fields:
{
  "core_problem": "One sentence — what specific pain or gap does this solve?",
  "target_users": "One sentence — who are the primary users?",
  "key_features": ["Feature 1", "Feature 2", "Feature 3"],
  "domain": "Single word or short phrase — industry/category (e.g. retail, health, education, productivity)",
  "scale": "personal | small_business | enterprise"
}

Rules:
- core_problem and target_users must be full sentences, not fragments
- key_features: 3-6 items, each a short plain-English noun phrase (e.g. "Points tracking", "Reward redemption")
- domain: be specific (e.g. "food & beverage" not just "business")
- scale: pick the single best fit — personal (1 person), small_business (small team/local), enterprise (large org/many users)
- No markdown, no code fences, no explanation — only the JSON object`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { raw_idea } = req.body ?? {}

  if (!raw_idea || typeof raw_idea !== 'string' || raw_idea.trim().length < 5) {
    return res.status(400).json({ error: 'raw_idea is required (min 5 chars)' })
  }

  const userMessage = `Extract structured information from this app idea:\n\n"${raw_idea.slice(0, 2000)}"`

  try {
    const message = await client.messages.create({
      model: BALANCED,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const raw = message.content[0].text.trim()
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const extracted = JSON.parse(cleaned)

    // Validate shape
    const required = ['core_problem', 'target_users', 'key_features', 'domain', 'scale']
    for (const field of required) {
      if (!(field in extracted)) throw new Error(`Missing field: ${field}`)
    }
    if (!Array.isArray(extracted.key_features)) {
      throw new Error('key_features must be an array')
    }

    return res.status(200).json(extracted)
  } catch (err) {
    console.error('Extract API error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}

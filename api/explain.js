import Anthropic from '@anthropic-ai/sdk'
import { MODELS, CATEGORY_MODELS } from './models.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { question, category } = req.body ?? {}

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'question is required' })
  }

  const prompt = `You are a warm, friendly advisor helping a non-technical person understand a concept related to building their app idea.

They were just asked this question about the "${category}" part of their app:
"${question.slice(0, 500)}"

They clicked "I'm not sure" — which means they don't fully understand what's being asked or why it matters.

Your job: Write a short, friendly explanation (2–4 sentences max) using a real-world analogy from everyday life — like a restaurant, a library, a coffee shop, or a post office. Make it feel like a helpful friend is explaining it over coffee, not a textbook.

Rules:
- Never use technical words (no: database, auth, API, frontend, backend, schema, query, server, deploy, OAuth)
- Use a concrete real-world analogy (name the analogy explicitly, e.g. "Think of it like a library card...")
- End with one sentence that ties it back to their specific app situation
- Keep it under 60 words total

Return ONLY the plain text explanation. No JSON, no formatting, no quotes around it.`

  try {
    const message = await client.messages.create({
      model: CATEGORY_MODELS[category] ?? MODELS.BALANCED,
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    })

    const explanation = message.content[0].text.trim()
    return res.status(200).json({ explanation })
  } catch (err) {
    console.error('Explain API error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}

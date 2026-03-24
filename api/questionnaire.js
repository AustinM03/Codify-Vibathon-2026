import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { raw_idea } = req.body ?? {}

  if (!raw_idea || typeof raw_idea !== 'string') {
    return res.status(400).json({ error: 'raw_idea is required' })
  }

  const prompt = `You are a product discovery AI helping developers turn app ideas into full specs.

The user wants to build:
"${raw_idea.slice(0, 2000)}"

Generate an adaptive questionnaire to fill in the gaps needed to build a complete product spec. Only ask about things you CANNOT reasonably infer from the description above. A detailed, specific idea needs fewer questions. A vague idea needs more.

Organize questions across these exact 7 categories (use these exact category names):
1. Problem
2. Features
3. Design
4. Auth
5. Data
6. Integrations
7. Logic

Rules:
- Skip a category entirely if the idea already fully answers it
- Aim for 1–3 questions per included category
- Each question must have 3–4 short answer suggestions the user can click as pre-fills

Return ONLY a valid JSON array — no markdown, no explanation, no code fences. Each element must have exactly this shape:
{ "category": "Problem", "question": "Who is the primary user of this app?", "suggestions": ["Developers", "Small business owners", "General consumers", "Students"] }`

  try {
    const message = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content[0].text.trim()
    // Strip markdown code fences if Claude wraps in them anyway
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const questions = JSON.parse(cleaned)

    if (!Array.isArray(questions)) {
      throw new Error('Claude did not return a JSON array')
    }

    return res.status(200).json({ questions })
  } catch (err) {
    console.error('Questionnaire API error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}

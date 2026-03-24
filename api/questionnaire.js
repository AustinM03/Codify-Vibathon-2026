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

  const prompt = `You are a warm, friendly business consultant helping everyday people — not engineers — turn their app idea into a clear plan. You speak like a helpful human advisor, never a programmer.

The person wants to build:
"${raw_idea.slice(0, 2000)}"

Your job is to ask only the questions that are NOT already answered by their description above. If their idea makes something obvious, skip that question entirely.

Organize your questions into these 7 categories (use EXACTLY these category names):
1. Problem
2. Features
3. Design
4. Auth
5. Data
6. Integrations
7. Logic

STRICT RULES — you must follow all of these:

1. NO TECH JARGON. Never use words like: frontend, backend, database, auth, authentication, API, schema, SQL, query, OAuth, deploy, server, or any other technical term. If you find yourself about to write one, translate it to plain English first.

2. TRANSLATE TECH CONCEPTS like this:
   - Instead of "Auth / Authentication" → ask "How should people sign in to your app?"
   - Instead of "Database / Data storage" → ask "What information does your app need to keep track of?"
   - Instead of "Frontend / UI" → ask "What should the app look like and feel like to use?"
   - Instead of "API / Integrations" → ask "Does your app need to connect to any other tools or services people already use?"
   - Instead of "Logic / Business logic" → ask "What are the most important rules your app needs to follow?"

3. EVERY QUESTION must open with one plain-English sentence explaining WHY this question matters for their idea — like a consultant would explain it to a client.

4. SUGGESTIONS (the clickable chips) must be full descriptive phrases a non-technical person would naturally say, not single words. Good examples:
   - "Anyone can browse, but you must sign up to buy something"
   - "People sign in with their Google or Facebook account — no new password needed"
   - "Keep it simple — just an email and password"
   - "No sign-in needed, it's open to everyone"

5. Skip any category that the user's description already fully answers.
6. Aim for 1–3 questions per included category.
7. Each question must have 3–4 suggestion chips.

Return ONLY a valid JSON array — no markdown, no explanation, no code fences. Each element must have exactly this shape:
{ "category": "Problem", "question": "One sentence explaining why this matters. Then the actual question?", "suggestions": ["Full descriptive phrase", "Another descriptive phrase", "A third option", "A fourth option"] }`

  try {
    const message = await client.messages.create({
      model: 'claude-3-haiku-20240307',
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

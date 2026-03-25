/**
 * Two-pass questionnaire generation:
 *
 * Pass 1 — Opus 4.6: Generates the questions themselves.
 *   Opus focuses purely on question quality, personalization, and non-technical
 *   phrasing. No suggestions yet — that's not where Opus adds value.
 *
 * Pass 2 — Haiku 4.5: Generates the clickable suggestion chips.
 *   Given the questions from Pass 1, Haiku quickly produces 3–4 natural-language
 *   suggestion chips per question. Fast and cheap — chips don't need Opus reasoning.
 *
 * Both passes run sequentially (chips need questions first).
 * Results are merged and returned in the same shape the frontend expects.
 */

import Anthropic from '@anthropic-ai/sdk'
import { MODELS } from './models.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { raw_idea, history } = req.body ?? {}

  if (!raw_idea || typeof raw_idea !== 'string') {
    return res.status(400).json({ error: 'raw_idea is required' })
  }

  const previousAnswers = Array.isArray(history) && history.length > 0
    ? history.map(h => `[${h.category}] Q: ${h.question}\nA: ${h.answer}`).join('\n\n')
    : null

  const historySection = previousAnswers
    ? `\nHere is everything the user has already told you across previous steps — treat this as shared memory and DO NOT ask about anything already covered here:\n\n${previousAnswers}\n\nUse this context to personalise new questions. Reference their specific answers naturally. Build on what they said — never repeat it.`
    : ''

  // ── Pass 1: Opus generates questions ──────────────────────────────────────
  const questionPrompt = `You are a warm, friendly business consultant helping everyday people — not engineers — turn their app idea into a clear plan. You speak like a helpful human advisor, never a programmer.

The person wants to build:
"${raw_idea.slice(0, 2000)}"
${historySection}
Your job is to ask questions that help you fully understand their vision across all 7 areas. Use any previous answers they gave as context to make your questions more personalised and relevant — but still ask about every category.

Organize your questions into these 7 categories (use EXACTLY these category names as JSON keys):
1. Problem
2. Features
3. Design
4. Auth
5. Data
6. Integrations
7. Logic

IMPORTANT — when writing questions, refer to these categories using these friendly names:
- "Auth" → call it "User Accounts" (e.g. "Let's talk about User Accounts — how should people sign in?")
- "Data" → call it "Information" (e.g. "For the Information section — what does your app need to keep track of?")
- "Integrations" → call it "App Connections" (e.g. "Under App Connections — does your app need to link with any other tools?")
- "Logic" → call it "Policies" (e.g. "For the Policies section — what rules should your app follow?")
The JSON "category" key must still be the original technical name (e.g. "Auth", "Data"), but all question text must use the friendly name.

STRICT RULES:
1. NO TECH JARGON. Never use words like: frontend, backend, database, auth, authentication, API, schema, SQL, query, OAuth, deploy, server, or any other technical term.
2. EVERY QUESTION must open with one plain-English sentence explaining WHY this question matters for their idea.
3. You MUST include ALL 7 categories — never skip any.
4. Aim for 1–3 questions per category.

Return ONLY a valid JSON array — no markdown, no explanation, no code fences. Each element must have exactly this shape:
{ "category": "Problem", "question": "One sentence explaining why this matters. Then the actual question?" }`

  // ── Pass 2: Haiku generates suggestion chips ───────────────────────────────
  function buildChipsPrompt(questions) {
    const questionList = questions
      .map((q, i) => `${i + 1}. [${q.category}] ${q.question}`)
      .join('\n')

    return `You are generating clickable suggestion chips for a non-technical user filling out an app planning form. The app idea is: "${raw_idea.slice(0, 500)}"

For each question below, generate exactly 3–4 suggestion chips. Each chip must be a full, natural descriptive phrase that a non-technical person would actually say — not single words or technical terms.

Good chip examples:
- "Anyone can browse, but you must sign up to buy something"
- "People sign in with their Google or Facebook account — no new password needed"
- "Keep it simple — just an email and password"
- "No sign-in needed, it's open to everyone"

Questions:
${questionList}

Return ONLY a valid JSON array of arrays — one inner array per question, in the same order, no markdown, no explanation:
[["chip1", "chip2", "chip3"], ["chip1", "chip2", "chip3"], ...]`
  }

  try {
    // Pass 1 — Opus
    const opusMsg = await client.messages.create({
      model: MODELS.POWERFUL,
      max_tokens: 3000,
      messages: [{ role: 'user', content: questionPrompt }],
    })

    const rawQuestions = opusMsg.content[0].text.trim()
    const cleanedQuestions = rawQuestions.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const questions = JSON.parse(cleanedQuestions)

    if (!Array.isArray(questions)) throw new Error('Opus did not return a JSON array')

    // Pass 2 — Haiku
    const haikusMsg = await client.messages.create({
      model: MODELS.FAST,
      max_tokens: 2000,
      messages: [{ role: 'user', content: buildChipsPrompt(questions) }],
    })

    const rawChips = haikusMsg.content[0].text.trim()
    const cleanedChips = rawChips.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const chipsMatrix = JSON.parse(cleanedChips)

    if (!Array.isArray(chipsMatrix)) throw new Error('Haiku did not return a JSON array')

    // Merge: attach chips to each question
    const merged = questions.map((q, i) => ({
      ...q,
      suggestions: Array.isArray(chipsMatrix[i]) ? chipsMatrix[i] : [],
    }))

    return res.status(200).json({ questions: merged })
  } catch (err) {
    console.error('Questionnaire API error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}

/**
 * audit-plan endpoint — Codify Vibeathon 2026
 *
 * "Review & Refine" engine. Acts as a Friendly Product Coach,
 * scanning the user's full questionnaire responses for thin answers
 * and logical contradictions before (or after) generating a build plan.
 *
 * Input:
 *   raw_idea               {string}   — the user's original one-liner
 *   questionnaire_responses {object[]} — [{ category, question, answer }]
 *
 * Output:
 *   {
 *     "thin_answers":   [{ "category": string, "issue": string }],
 *     "contradictions": [{ "issue": string }]
 *   }
 */

import Anthropic from '@anthropic-ai/sdk'
import { MODELS } from './models.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { raw_idea, questionnaire_responses } = req.body ?? {}

  if (!raw_idea || typeof raw_idea !== 'string') {
    return res.status(400).json({ error: 'raw_idea (string) is required' })
  }
  if (!Array.isArray(questionnaire_responses) || questionnaire_responses.length === 0) {
    return res.status(400).json({ error: 'questionnaire_responses array is required' })
  }

  // Format responses grouped by friendly category name
  const responsesText = questionnaire_responses
    .map(r => `[${r.category}]\nQuestion: ${r.question}\nAnswer: ${r.answer || '(no answer provided)'}`)
    .join('\n\n')

  const systemPrompt = `You are a friendly, encouraging Product Coach helping a non-technical founder build their first app. Your job is to review their app plan for gaps and logical conflicts — not to judge them, but to help them make their plan as strong as possible before they start building.

You work with these seven planning categories:
  • Problem       — the core problem the app solves
  • Features      — the main things the app can do
  • Design        — how the app looks and feels
  • User Accounts — who signs up and how they log in
  • Information   — what data the app stores and manages
  • App Connections — any third-party services or APIs
  • Policies      — privacy, payments, content, or legal rules

Your tone must always be:
  ✓ Constructive — suggest what to add, not just what's missing
  ✓ Polite and encouraging — they are doing something brave
  ✗ Never scolding, dismissive, or overly technical`

  const userPrompt = `Here is the founder's original app idea:
"${raw_idea}"

Here are their full questionnaire responses:

${responsesText}

Please review this plan carefully and return a JSON object with exactly this shape — nothing else, no markdown, no explanation:

{
  "thin_answers": [
    { "category": "<one of the 7 category names>", "issue": "<friendly, specific description of what is missing or too vague — and a suggestion for what to add>" }
  ],
  "contradictions": [
    { "issue": "<friendly, specific description of how two answers conflict with each other — and a suggestion for how to resolve it>" }
  ]
}

Rules:
- Only include a category in thin_answers if the answer is genuinely missing, blank, or too vague to be useful (one word, "not sure", "N/A", etc.).
- Only include a contradiction if two answers genuinely conflict with each other in a way that would cause a problem when building.
- If there are no thin answers, return an empty array for thin_answers. Same for contradictions.
- Keep each issue description to 1–2 sentences maximum.
- Return ONLY valid JSON. No markdown fences. No extra keys.`

  try {
    const message = await client.messages.create({
      model: MODELS.POWERFUL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = message.content[0].text.trim()
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const result = JSON.parse(cleaned)

    // Ensure the response always has both expected arrays
    return res.status(200).json({
      thin_answers:   Array.isArray(result.thin_answers)   ? result.thin_answers   : [],
      contradictions: Array.isArray(result.contradictions) ? result.contradictions : [],
    })
  } catch (err) {
    console.error('Audit-plan API error:', err)
    return res.status(200).json({ thin_answers: [], contradictions: [] })
  }
}

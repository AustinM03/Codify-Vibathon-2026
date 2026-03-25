/**
 * POST /api/generate
 *
 * Stage 2 of the output pipeline — the critical Opus pass.
 * Takes extracted feature structure + all 7 completed questionnaire answers
 * and produces a complete, actionable build artifact.
 *
 * Input:
 *   {
 *     raw_idea:  string,
 *     extracted: { core_problem, target_users, key_features[], domain, scale },  // optional
 *     answers:   [{ category, question, answer }, ...]
 *   }
 *
 * Output:
 *   {
 *     title:        string,
 *     summary:      string,
 *     prompt:       string,
 *     features:     string[],
 *     tech_stack:   string[],
 *     user_stories: string[]
 *   }
 */

import Anthropic from '@anthropic-ai/sdk'
import { MODELS } from './models.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a senior software architect and product strategist. Your job is to synthesize a user's app idea and their answers to 7 planning questions into a complete, actionable build specification.

Return ONLY a valid JSON object with exactly these fields:
{
  "title": "3-5 word app name that captures the core value",
  "summary": "2-3 sentences in plain English describing what the app does, who it's for, and what problem it solves. No jargon.",
  "prompt": "A complete, copy-paste-ready prompt for an AI coding tool (Cursor, GitHub Copilot, ChatGPT). Must be 300-600 words. Structure it as: 1) App overview, 2) Core features (bulleted), 3) Tech stack recommendation with specific framework choices, 4) Key screens/flows, 5) Important business rules. Write it as a direct instruction to a developer AI — start with 'Build a [app name]...'. If phases is not null, close with: 'Build Phase 1 first and verify it works end-to-end before touching Phase 2.'",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "tech_stack": ["Technology 1", "Technology 2", "Technology 3"],
  "user_stories": ["As a [user type], I can [action] so that [benefit].", "..."],
  "build_traps": [
    "Plain-English warning about a non-obvious build risk that will silently break the build if ignored"
  ],
  "phases": {
    "phase1": ["Core feature A", "Core feature B", "Core feature C"],
    "phase2": ["Enhancement D", "Enhancement E"]
  }
}

Rules:
- title: no subtitle, no punctuation, title case
- summary: completely jargon-free — a non-technical person must understand every word
- prompt: this is the most important field — make it dense, specific, and immediately actionable

PLATFORM SPECIFICITY — apply these rules whenever relevant:
- React Native in tech stack → always choose and name Expo managed workflow (default) or bare workflow (only if the user described native modules like Bluetooth, custom camera, or background GPS). State the choice and one-line reason inside the prompt.
- Next.js in tech stack → always specify App Router (default for new projects) or Pages Router. State which and why.
- Two separate apps in the spec (e.g. mobile app + admin web panel) → always include one sentence in the prompt explaining how auth and the backend are shared between them (e.g. same Firebase project with custom admin claims, shared Supabase instance with RLS, etc.).

BUILD TRAPS — always include 2–4 items:
- Flag any third-party service that requires manual pre-configuration before the code will work (IAP product IDs in App Store/Play Store, OAuth client IDs, webhook URLs, API keys that must be provisioned)
- Flag any architecture decision where two parts of the system must stay in sync (shared auth between mobile and web, shared DB schema, timezone-dependent scheduled jobs)
- Flag any hosting or storage choice that has a common misconception (e.g. Firebase Cloud Storage has no built-in video CDN — use Mux or Cloudinary for adaptive video streaming)
- Be specific: name the service, the exact thing to do, and why it matters

PHASES:
- If features array has 5 or more items: split into phase1 (the minimal core loop — auth + 2-3 features that make the app usable end-to-end) and phase2 (everything else)
- If features array has 4 or fewer items: set "phases": null

- features: 4-8 items, plain-English noun phrases matching what the user actually described
- tech_stack: realistic recommendations based on the user's scale and described features
- user_stories: 4-6 stories in "As a X, I can Y so that Z" format
- No markdown, no code fences, no explanation — only the JSON object`

async function extractFallback(raw_idea, dev_mode) {
  const message = await client.messages.create({
    model: dev_mode ? MODELS.FAST : MODELS.BALANCED,
    max_tokens: 400,
    system: 'Extract a JSON object with: core_problem (string), target_users (string), key_features (string[]), domain (string), scale ("personal"|"small_business"|"enterprise"). No markdown, JSON only.',
    messages: [{ role: 'user', content: `App idea: "${raw_idea.slice(0, 1000)}"` }],
  })
  const raw = message.content[0].text.trim()
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  return JSON.parse(cleaned)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { raw_idea, extracted: providedExtracted, answers, dev_mode } = req.body ?? {}

  if (!raw_idea || typeof raw_idea !== 'string') {
    return res.status(400).json({ error: 'raw_idea is required' })
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers array is required' })
  }

  let extracted = providedExtracted
  if (!extracted || typeof extracted !== 'object') {
    try {
      extracted = await extractFallback(raw_idea, dev_mode)
    } catch {
      extracted = null
    }
  }

  const extractedBlock = extracted
    ? `## Extracted App Profile
Core problem: ${extracted.core_problem ?? 'not specified'}
Target users: ${extracted.target_users ?? 'not specified'}
Key features identified: ${Array.isArray(extracted.key_features) ? extracted.key_features.join(', ') : 'not specified'}
Domain: ${extracted.domain ?? 'not specified'}
Scale: ${extracted.scale ?? 'not specified'}`
    : `## Raw Idea\n"${raw_idea}"`

  const answersBlock = answers
    .map(a => `### ${a.category}\nQuestion: ${a.question}\nAnswer: ${a.answer}`)
    .join('\n\n')

  const userMessage = `Generate a complete build specification for this app.

## Original Idea
"${raw_idea.slice(0, 500)}"

${extractedBlock}

## User's Planning Answers (7 Categories)

${answersBlock}

Now generate the full build specification JSON.`

  try {
    const message = await client.messages.create({
      model: dev_mode ? MODELS.FAST : MODELS.POWERFUL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const raw = message.content[0].text.trim()
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    const result = JSON.parse(cleaned)

    const required = ['title', 'summary', 'prompt', 'features', 'tech_stack', 'user_stories']
    for (const field of required) {
      if (!(field in result)) throw new Error(`Missing field: ${field}`)
    }

    return res.status(200).json(result)
  } catch (err) {
    console.error('Generate API error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}

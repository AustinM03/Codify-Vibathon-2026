/**
 * POST /api/build
 *
 * Thin dispatcher — inserts a job row, fires an Inngest background event,
 * and returns the job_id immediately. The actual code generation and
 * deployment happen in the Inngest buildAppJob worker.
 *
 * Input:
 *   { session_id, title, prompt, tech_stack[], features[], dev_mode }
 *
 * Output:
 *   { job_id: string }
 */

import crypto from 'crypto'
import { inngest } from './inngest/client.js'
import { supabase } from './supabaseServer.js'
import { requireAuth } from './authMiddleware.js'

export const config = { maxDuration: 10 }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const user = await requireAuth(req, res)
  if (!user) return

  const { session_id, title, prompt, tech_stack, features, dev_mode } = req.body ?? {}

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' })
  }
  if (!title || typeof title !== 'string') {
    return res.status(400).json({ error: 'title is required' })
  }

  try {
    const jobId = crypto.randomUUID()

    // Insert job row so the frontend can poll immediately
    const { error: insertErr } = await supabase.from('jobs').insert({
      id: jobId,
      session_id: session_id ?? null,
      status: 'queued',
      progress: 0,
      total_files: 0,
    })

    if (insertErr) {
      console.error('Job insert error:', insertErr)
      return res.status(500).json({ error: 'Failed to create job: ' + insertErr.message })
    }

    // Fire background event — does not block
    await inngest.send({
      name: 'app/build',
      data: { jobId, session_id, title, prompt, tech_stack, features, dev_mode },
    })

    return res.status(200).json({ job_id: jobId })
  } catch (err) {
    console.error('Build API error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}

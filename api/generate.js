/**
 * POST /api/generate
 *
 * Thin dispatcher — inserts a job row, fires an Inngest background event,
 * and returns the job_id immediately. The actual plan generation happens
 * in the Inngest generatePlanJob worker (no timeout risk).
 *
 * Input:
 *   { raw_idea, extracted, answers, dev_mode }
 *
 * Output:
 *   { job_id: string }
 */

import crypto from 'crypto'
import { inngest } from './inngest/client.js'
import { supabase } from './supabaseServer.js'

export const config = { maxDuration: 10 }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { raw_idea, extracted, answers, session_id, dev_mode } = req.body ?? {}

  if (!raw_idea || typeof raw_idea !== 'string') {
    return res.status(400).json({ error: 'raw_idea is required' })
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({ error: 'answers array is required' })
  }

  try {
    const jobId = crypto.randomUUID()

    const { error: insertErr } = await supabase.from('jobs').insert({
      id: jobId,
      session_id: session_id ?? null,
      status: 'Generating plan...',
      progress: 0,
      total_files: 0,
    })

    if (insertErr) {
      console.error('Job insert error:', insertErr)
      return res.status(500).json({ error: 'Failed to create job: ' + insertErr.message })
    }

    await inngest.send({
      name: 'app/generate',
      data: { jobId, session_id, raw_idea, extracted, answers, dev_mode },
    })

    return res.status(200).json({ job_id: jobId })
  } catch (err) {
    console.error('Generate API error:', err)
    return res.status(500).json({ error: err.message ?? 'Internal server error' })
  }
}

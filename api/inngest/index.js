import { serve } from 'inngest/next'
import { inngest } from './client.js'
import { buildAppJob, generatePlanJob } from './functions.js'

export const config = { maxDuration: 60 }

export default serve({ client: inngest, functions: [buildAppJob, generatePlanJob] })

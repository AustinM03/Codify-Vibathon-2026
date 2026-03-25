import { serve } from 'inngest/vercel'
import { inngest } from './client.js'
import { buildAppJob } from './functions.js'

export const config = { maxDuration: 60 }

export default serve({ client: inngest, functions: [buildAppJob] })

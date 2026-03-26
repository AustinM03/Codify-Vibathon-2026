# [Prism - AI App Builder](https://codify-vibathon-2026.vercel.app/)

**Turn a raw idea into a live, deployed React app in minutes. No coding required.**

Prism guides non-technical founders through a 7-step AI-powered questionnaire, generates a complete build specification, then writes every file and deploys the finished app to Vercel — all from a plain-English description.

Built for the [codefi Vibathon 2026](https://codefi.com).

For Website Testing (if not wanting to simple signup and bypass Auth):
- Username: tester1@test.com | Password: Test1234 (1 Live Project, 1 Ready to go live project)
- Username: tester2@gmail.com | Password: Test1234 (No Currently live projects)
- Username: tester3@gmail.com | Password: Test1234 (No Currently live projects)
- Username: tester4@gmail.com | Password: Test1234 (No Currently live projects)

---

## How It Works

```
Describe your idea in plain English
        |
        v
  7-category AI questionnaire
  (personalized, jargon-free)
        |
        v
  AI validates for gaps & contradictions
        |
        v
  Build specification generated
  (features, tech stack, user stories, phases)
        |
        v
  Code generation via worker swarm
  (architect -> parallel file writers -> quality checker)
        |
        v
  Auto-deployed to Vercel
  Live URL in minutes
```

---

## Features

- **Plain English input** — describe what you want, not how to build it
- **AI-generated questionnaire** — Claude Opus generates personalized, non-technical questions across 7 categories (Problem, Features, Design, User Accounts, Information, App Connections, Policies)
- **Clickable suggestion chips** — pre-written answers you can click instead of typing
- **"I'm not sure" help** — on-demand AI explanations for any question
- **Gap detection** — AI reviews all answers for missing info and contradictions before building
- **Validation caching** — unchanged answers skip re-validation (SHA-256 hash)
- **Resume anytime** — answers auto-save, pick up where you left off
- **Live blueprint panel** — watch your spec build in real-time as you answer
- **One-click build & deploy** — generates a full React + Vite app and deploys it to Vercel
- **Quality checker** — automatically detects and re-generates broken files before deployment

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Three.js (WebGL shader background) |
| Styling | Inline styles (zero CSS framework dependency) |
| Auth | Supabase Auth (email + password, JWT sessions) |
| Database | Supabase Postgres (RLS-protected) |
| API | Node.js serverless functions (Vercel) |
| Background Jobs | Inngest (worker swarm, timeout-proof) |
| AI - Reasoning | Claude Opus 4.6 (questions, validation) |
| AI - Synthesis | Claude Sonnet 4.6 (extraction, plan generation) |
| AI - Fast Work | Claude Haiku 4.5 (code writing, suggestion chips) |
| Deployment | Vercel (platform + generated app hosting) |

---

## AI Model Routing

Each task uses the right model for the job:

| Task | Model | Reasoning |
|------|-------|-----------|
| Generate questionnaire | Opus 4.6 | Needs reasoning to personalize and avoid jargon |
| Suggestion chips | Haiku 4.5 | Pattern-matching, 10x faster |
| On-demand explanations | Sonnet/Haiku | Sonnet for nuanced concepts, Haiku for simple ones |
| Feature extraction | Sonnet 4.6 | Structured JSON extraction from prose |
| Pre-build validation | Opus 4.6 | Finds gaps and contradictions across 7 categories |
| Architect file schema | Haiku 4.5 | Simple structured output |
| Write code files | Haiku 4.5 | Fast, parallelizable, cost-effective |
| Generate build plan | Sonnet 4.6 | Synthesizes all answers into spec |

---

## Build Pipeline (Deep Dive)

The code generation pipeline runs as an Inngest background job with 4 steps:

### Step A: Architect
Haiku designs a 6-10 file schema for the app. Enforces constraints: no routing library, all state in App.jsx, no external APIs, mock data in `src/data.js`.

### Step B: Worker Swarm
Files are generated in parallel batches of 2 via `step.ai.infer()`. Each file is written in isolation — the writer only sees its own spec, not other files' code. 20-second sleep between batches respects Anthropic rate limits.

### Step C: Quality Checker
Scans every generated file for crash-causing patterns:
- JSX in `.js` files (fatal Vite error)
- Banned imports (zustand, redux, react-router, fetch, createContext)
- Missing `export default` in `.jsx` files
- React imports in data files

Broken files are automatically re-generated with targeted fix prompts.

### Step D: Assembly & Deploy
Merges generated files with static templates (index.html, vite.config.js, main.jsx), builds a package.json with dependencies, and deploys to Vercel via the Deployments API. Returns a live URL.

### Why Inngest?
Vercel serverless functions have a 10-second timeout. Code generation takes 60-90 seconds. Inngest runs the pipeline on its own infrastructure with no timeout — the API route returns a `job_id` in under 2 seconds, and the frontend polls for status.

---

## Project Structure

```
codefi-Vibathon-2026/
├── api/                          # Node.js serverless functions
│   ├── questionnaire.js          # Two-pass: Opus (questions) + Haiku (chips)
│   ├── explain.js                # On-demand help explanations
│   ├── validate.js               # Pre-generation validation (Opus)
│   ├── extract.js                # Structured signal extraction (Sonnet)
│   ├── generate.js               # Dispatcher -> Inngest plan generation
│   ├── build.js                  # Dispatcher -> Inngest code build
│   ├── authMiddleware.js         # Supabase JWT verification
│   ├── supabaseServer.js         # Service role client (bypasses RLS)
│   ├── models.js                 # Model tier definitions
│   └── inngest/
│       ├── client.js             # Inngest client init
│       ├── functions.js          # buildAppJob + generatePlanJob
│       └── index.js              # Inngest serverless handler
│
├── src/                          # React frontend
│   ├── App.jsx                   # Root component + full state machine
│   ├── supabaseClient.js         # Supabase client + authHeaders()
│   ├── views/
│   │   ├── Dashboard.jsx         # Project list, resume, delete
│   │   └── LandingPage.jsx       # Marketing page
│   ├── components/
│   │   ├── PrismLoader.jsx       # Animated loading triangle
│   │   ├── ShaderBackground.jsx  # Three.js WebGL prism shader
│   │   └── AIGeneratedInput.jsx  # Textarea with char count
│   ├── index.css                 # Design tokens, animations
│   └── main.jsx                  # React entry point
│
├── server.dev.js                 # Local Express wrapper for API routes
├── vite.config.js                # Vite config (React, /api proxy)
├── vercel.json                   # Vercel routing + build config
├── package.json                  # Dependencies + scripts
└── CLAUDE.md                     # AI coding assistant instructions
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://anthropic.com) API key
- (Optional) A [Vercel](https://vercel.com) account for deployment

### Environment Variables

Create a `.env` file in the project root:

```env
# Anthropic API
ANTHROPIC_API_KEY=sk-ant-api03-...

# Supabase
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=...

# Vercel (for deploying generated apps)
DEPLOY_VERCEL_TOKEN=vcp_...
DEPLOY_TEAM_ID=...              # optional, for team projects
```

### Install & Run

```bash
# Install dependencies
npm install

# Run the full local dev stack (recommended)
npm run dev:local

# This starts 3 processes:
#   1. Inngest CLI      (port 8288) — background job dev server
#   2. Express API       (port 3001) — serves /api/* handlers
#   3. Vite dev server   (port 5173) — React frontend with HMR
```

Vite proxies `/api/*` requests to `localhost:3001` automatically.

### Other Commands

```bash
npm run dev          # Vite only (no API, frontend-only development)
npm run dev:api      # Express API only (port 3001)
npm run build        # Production build to dist/
npm run preview      # Preview production build locally
```

---

## Database Schema

Prism uses 5 Supabase tables, all protected by Row Level Security:

| Table | Purpose |
|-------|---------|
| `sessions` | Project metadata (user_id, raw_idea, created_at) |
| `questionnaire_responses` | All answers (session_id, category, question, answer) |
| `build_plans` | Generated specifications (cached per session) |
| `jobs` | Build/deploy job tracking (status, progress, deploy_url) |
| `validation_cache` | Opus validation results (keyed by SHA-256 of answers) |

---

## Deployment

Push to `main` to auto-deploy on Vercel:

```bash
git push origin main
```

Vercel handles:
- Frontend: `vite build` -> dist/ -> global CDN
- API routes: each `api/*.js` -> serverless function
- Inngest: auto-registered via `/api/inngest` endpoint

---

## Security

- **JWT auth on every API endpoint** — Supabase token verified server-side
- **Row Level Security** — users can only access their own data
- **Server-side API keys** — Anthropic and Vercel tokens never reach the browser
- **Pre-commit hooks** — blocks commits containing API keys, tokens, or files >100MB
- **Deploy URL validation** — only `*.vercel.app` URLs rendered as links
- **Input length limits** — all user inputs sliced before AI prompt injection

---

## Team

Built by Max, Austin, and Spring for the codefi Vibathon 2026.

---

## License

MIT

# JUDGES.md — Codify Vibeathon 2026

> **This document is our manifest for the AI Judging System.**
> It explains *why* we built what we built, how it works, and why it matters.

---

## Team

| Member | Background | Role |
|--------|-----------|------|
| Max Hagl | Cybersecurity & Mathematics | Architecture, Security, API Design, Model Strategy |
| Austin Metzler | Computer Science & Political Science | Frontend, UX, Narrative, Product Thinking |

## Hardware

- **NVIDIA RTX 4090** — Available for local inference and compute-intensive tasks
- **Apple M3 Max** — Primary development and testing environment

---

## Problem Statement

Most people have ideas for apps but no way to translate them into something a developer or AI can actually build. The gap between "I have an idea" and "here's a spec" is where most non-technical founders get stuck — and where most AI tools fail them by speaking in jargon they don't understand.

---

## Our Solution

### What We Built

**PromptReady** — an AI-powered app planning assistant that turns a raw idea into a complete, structured specification through a guided conversation. No technical knowledge required.

A user describes their app idea in plain English. Claude (Opus 4.6) generates a personalized 7-category questionnaire — Problem, Features, Design, Auth, Data, Integrations, and Logic — phrased entirely in non-technical language. The user answers at their own pace, with clickable suggestion chips and on-demand explanations for anything they don't understand. Every answer is persisted to a database. When all 7 sections are complete, a final Opus pass validates the spec for completeness and surfaces any gaps or contradictions before the user reaches their dashboard.

The result: a structured, machine-readable product specification that any developer or AI coding tool can act on immediately.

### Why It Matters (Impact — 40%)

The addressable problem is enormous. There are an estimated 500M+ people globally with app ideas they cannot execute because they lack technical vocabulary to communicate with developers or AI tools. Current solutions either require technical literacy (GitHub Copilot, Cursor) or produce generic output (ChatGPT without structure).

PromptReady bridges this gap with three measurable outcomes:

1. **Speed** — A complete app specification in under 15 minutes, versus days or weeks with traditional product discovery processes
2. **Quality** — Opus 4.6 catches contradictions and thin answers before they become expensive misunderstandings in development
3. **Accessibility** — Zero technical jargon. Every question is translated to plain English with real-world analogies. A coffee shop owner can spec their loyalty app without knowing what a database is.

Real-world deployment scenarios: indie founders before hiring a developer, product managers before sprint planning, entrepreneurs before pitching to technical co-founders.

### How It Works (Feasibility — 15%)

The architecture is intentionally lean and deployable in minutes:

```
User → React Frontend (Vite)
         ↓
     Supabase Auth   →   Supabase DB (questionnaire_responses)
         ↓
     Node.js API Routes (Vercel Serverless)
         ↓
     Anthropic Claude API
       ├── Opus 4.6    → questionnaire generation, validation
       ├── Sonnet 4.6  → nuanced category explanations (Auth, Logic, etc.)
       └── Haiku 4.5   → simple explanations (Design, Data), real-time chat
```

**Deployment:** Single `git push` to main → Vercel auto-deploys. Public URL, no-auth browsing supported. Full auth flow (email + password with strength validation) for saving and resuming sessions.

**Reproducibility:** All dependencies pinned in `package.json` and `requirements.txt`. Environment variables documented. Setup from clone to running local dev: under 5 minutes.

**Data persistence:** Supabase Postgres with Row Level Security — every user's responses are isolated, deletable, and resumable across sessions.

### What Makes It Different (Innovation — 15%)

**1. Tiered model selection by task complexity**
Most AI apps use one model for everything. We designed a deliberate model routing strategy: Opus 4.6 for the planning and validation passes where quality is critical, Sonnet 4.6 for nuanced category explanations, Haiku 4.5 for fast real-time responses. This gives users the best possible output at each stage without burning cost on simple tasks.

**2. Opus-powered completeness validation**
After all 7 steps, a dedicated Opus pass reviews the entire answer set for gaps, contradictions, and thin responses before the user reaches their dashboard. This "review before you build" step is something no mainstream product discovery tool offers.

**3. Non-technical language as a first-class constraint**
The system prompt enforces a strict no-jargon rule with explicit translation mappings (e.g. "Auth" → "How should people sign in?"). This is architecturally enforced, not just hoped for — Claude is given a list of banned words and required alternatives.

**4. Category-aware explanation routing**
The `/api/explain` endpoint selects its model based on which of the 7 categories is being explained. Security concepts (Auth) and business rules (Logic) get Sonnet. Visual concepts (Design) and storage analogies (Data) get Haiku. The model fits the cognitive load of the task.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  React Frontend (Vite)               │
│  LoginScreen → Questionnaire (7 steps) → Dashboard  │
└────────────────────────┬────────────────────────────┘
                         │ /api/*
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   questionnaire.js  explain.js   validate.js
   (Opus 4.6)     (phase-based)   (Opus 4.6)
          │              │              │
          └──────────────┴──────────────┘
                         │
                  Anthropic Claude API
                         │
                  Supabase (Auth + DB)
```

### Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | React 18 + Vite | Fast HMR, modern component model |
| Styling | Inline React styles | Zero build complexity, full control |
| API Routes | Node.js (Vercel Serverless) | Co-located with frontend, instant deploy |
| Python API | FastAPI + Uvicorn | Secondary API layer, chat endpoint |
| AI | Anthropic Claude (Opus/Sonnet/Haiku) | Best-in-class reasoning, tiered by task |
| Database | Supabase (Postgres + Auth) | RLS, real-time, auth built-in |
| Deployment | Vercel | Auto-deploy on push, global CDN |
| Security | Pre-commit hooks (The Bouncer) | Blocks secrets and files >100MB |

---

## Design Decisions Log

| # | Decision | Rationale | Score Impact |
|---|----------|-----------|--------------|
| 1 | Opus 4.6 for questionnaire generation | This single pass determines the quality of the entire downstream user experience | Impact |
| 2 | Opus 4.6 for post-completion validation | Catches gaps and contradictions before they reach the user's dashboard | Impact + Innovation |
| 3 | Phase-based model routing in explain.js | Right-size cost and quality to the cognitive complexity of each category | Innovation |
| 4 | No technical jargon — architecturally enforced | Translates to genuine accessibility, not just marketing copy | Impact |
| 5 | Supabase RLS for response isolation | Users can only see their own data — security by default, not by configuration | Feasibility |
| 6 | Pre-commit secret scanning (The Bouncer) | Vibeathon compliance + prevents credential leaks under competition pressure | Feasibility |
| 7 | Modular API route structure | Each route is a single-responsibility handler — readable by AI judges and humans alike | All |
| 8 | Session persistence with resume support | Real-world users don't finish in one sitting — this makes the app actually usable | Impact |

---

## Security Posture

- **No secrets in repository** — enforced by pre-commit hook scanning 15+ secret patterns
- **No files >100MB** — enforced by The Bouncer (Vibeathon compliance)
- **Row Level Security** — Supabase RLS ensures each user can only access their own data
- **Server-side API keys** — Anthropic key never touches the browser; all AI calls are proxied
- **Input validation** — all API endpoints validate required fields and types before processing
- **Auth with password rules** — minimum 8 chars, uppercase, number enforced client-side

---

## How to Run

```bash
git clone https://github.com/AustinM03/Codify-Vibathon-2026.git
cd Codify-Vibathon-2026
npm install
cp .env.example .env   # add ANTHROPIC_API_KEY, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev:local      # starts API server (port 3001) + Vite (port 5173)
```

Open **http://localhost:5173**

---

## Live Demo

> **URL:** https://codefi-vibathon-2026-max-ausin-spri.vercel.app/

---

*This document reflects the architectural state as of Codify Vibeathon 2026 — Springfield, MO.*

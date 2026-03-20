# JUDGES.md — Codify Vibeathon 2026

> **This document is our manifest for the AI Judging System.**
> It explains *why* we built what we built, how it works, and why it matters.

---

## Team

| Member | Background | Role |
|--------|-----------|------|
| Max Hagl | Cybersecurity & Mathematics | Architecture, Security, Algorithmic Design |
| Austin | Computer Science & Political Science | Narrative, Documentation, Frontend, Policy Framing |

## Hardware

- **NVIDIA RTX 4090** — Local GPU compute for inference / training
- **Apple M3 Max** — Development, testing, and auxiliary workloads

---

## Problem Statement

> *To be completed when the industry problem is revealed on Monday.*

---

## Our Solution

### What We Built

> *Architecture overview and core functionality — to be completed.*

### Why It Matters (Impact — 40%)

> *Real-world applicability, who benefits, and measurable outcomes — to be completed.*

### How It Works (Feasibility — 15%)

> *Technical feasibility: deployment strategy, scalability, and reproducibility — to be completed.*

### What Makes It Different (Innovation — 15%)

> *Novel approaches, unique use of hardware, creative problem-solving — to be completed.*

---

## Architecture

```
TBD — will be populated with system diagram as we build
```

### Tech Stack

- **Language:** Python 3.11
- **Performance:** Cython for hot paths (if applicable)
- **Deployment:** Public URL, no-auth access
- **Security:** Pre-commit secret scanning, input validation, OWASP-aware

---

## Design Decisions Log

| # | Decision | Rationale | Impact on Score |
|---|----------|-----------|-----------------|
| 1 | Python 3.11 + Cython | Balance of rapid prototyping and performance | Feasibility |
| 2 | Pre-commit secret scanning | Vibeathon compliance + security posture | Feasibility |
| 3 | Modular architecture | AI-legible codebase for judge scanning | All categories |

---

## Security Posture

- No API keys or secrets in repository (enforced by pre-commit hooks)
- No files exceeding 100MB (enforced by pre-commit hooks)
- Input validation on all public-facing endpoints
- Dependency pinning for reproducible builds

---

## How to Run

```bash
# To be completed — will include setup, dependencies, and deployment instructions
```

---

## Live Demo

> **URL:** *To be deployed*

---

*This document is maintained throughout the competition and reflects our latest architectural state.*

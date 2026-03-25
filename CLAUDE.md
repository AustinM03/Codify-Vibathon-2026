# CLAUDE.md — Codify Vibeathon 2026

## GSD Protocol (Get Stuff Done)

This is a hackathon. Speed and impact win. Follow this loop:

### 1. SCOPE → What are we building right now?
- Before writing code, confirm the **single deliverable** for this sprint
- If the task is ambiguous, ask ONE clarifying question — then build
- No gold-plating. Ship the 80% solution, iterate if time allows

### 2. BUILD → Ship it fast
- Write working code first, optimize second
- Every module gets: docstring, type hints, and a test stub
- Use FastAPI for all endpoints. Use Pydantic for all data models
- Hot paths only: if something is slow AND blocking, consider Cython

### 3. VERIFY → Does it work?
- Run tests after every feature: `pytest tests/ -v`
- Hit the endpoint: `curl localhost:8000/...`
- If it breaks, fix it now — don't accumulate debt

### 4. SHIP → Make it visible
- Every working feature gets committed immediately
- Update JUDGES.md with what was built and why
- Ensure the live URL reflects the latest state

---

## Branch Discipline
- **ALWAYS** check `git branch` before making changes
- Main branch = deployable. Feature branches for WIP
- Never force-push to main

## Project Structure
```
Codify-Vibathon-2026/
├── app/              # FastAPI application
│   ├── main.py       # Entry point
│   ├── models/       # Pydantic models
│   ├── routes/       # API endpoints
│   └── services/     # Business logic
├── tests/            # pytest tests
├── .githooks/        # Pre-commit (The Bouncer)
├── JUDGES.md         # AI Judge manifest
├── requirements.txt  # Pinned dependencies
└── CLAUDE.md         # This file
```

## Tech Stack
- Python 3.11 with venv at `.venv/`
- FastAPI + Uvicorn
- Pydantic v2 for validation
- Polars for data (not Pandas)
- pytest for testing

## Scoring Priorities
1. **Impact (40%)** — Does it solve a real problem? Show measurable outcomes
2. **Innovation (15%)** — What's novel? Leverage the 4090/M3 Max if applicable
3. **Feasibility (15%)** — Can it deploy? Is it reproducible?

## Security Rules
- No secrets in code (The Bouncer enforces this)
- Validate all user input with Pydantic
- No files over 100MB in repo

## Commands
- Activate venv: `source .venv/bin/activate`
- Run server: `uvicorn app.main:app --reload`
- Run tests: `pytest tests/ -v`
- Freeze deps: `pip freeze > requirements.txt`

"""
Codify Vibeathon 2026 — FastAPI Application Entry Point

This module initializes the FastAPI app, registers routers,
and configures middleware for the Vibeathon prototype.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Codify Vibeathon 2026",
    description="Vibeathon 2026 prototype — Springfield, MO",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["System"])
async def health_check() -> dict:
    """Return service health status."""
    return {"status": "ok", "service": "vibeathon-2026"}


@app.get("/", tags=["System"])
async def root() -> dict:
    """Root endpoint — confirms API is live."""
    return {"message": "Codify Vibeathon 2026 API", "docs": "/docs"}

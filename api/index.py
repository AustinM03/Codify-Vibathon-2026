"""
Vercel serverless entry point.

Self-contained FastAPI app for Vercel's Python runtime.
Vercel executes this file directly — keeping it self-contained
avoids module resolution issues in the serverless environment.
"""

import sys
import os

# Ensure project root is on the path so `app` package resolves correctly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.main import app  # noqa: E402 — path fix must come first

__all__ = ["app"]

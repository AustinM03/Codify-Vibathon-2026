"""
Vercel serverless entry point.

Vercel looks for app/api/index.py — this imports the FastAPI app
so it can be served as a serverless function.
"""

from app.main import app

"""
Centralized model configuration — Codify Vibeathon 2026

Single source of truth for all Claude model selection in the Python stack.

Tiers:
    FAST     — Haiku 4.5  — real-time responses, simple tasks
    BALANCED — Sonnet 4.6 — quality/speed tradeoff
    POWERFUL — Opus 4.6   — critical planning, validation, complex reasoning
"""


class Models:
    FAST     = "claude-haiku-4-5-20251001"
    BALANCED = "claude-sonnet-4-6"
    POWERFUL = "claude-opus-4-6"


class FeatureModels:
    """Per-feature model assignments for Python routes."""
    chat    = Models.FAST      # Real-time chat — speed wins
    default = Models.BALANCED

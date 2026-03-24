/**
 * Centralized model configuration — Codify Vibeathon 2026
 *
 * Single source of truth for all Claude model selection.
 * Change a tier here and every route that imports it updates automatically.
 *
 * Tiers:
 *   FAST     — Haiku 4.5  — real-time responses, simple tasks, connectivity checks
 *   BALANCED — Sonnet 4.6 — quality explanations, nuanced analogies
 *   POWERFUL — Opus 4.6   — critical planning, validation, complex reasoning
 */

export const MODELS = {
  FAST:     'claude-haiku-4-5-20251001',
  BALANCED: 'claude-sonnet-4-6',
  POWERFUL: 'claude-opus-4-6',
}

/**
 * Per-category model for explain.js.
 * Sonnet for phases where the concept is nuanced or high-stakes.
 * Haiku for phases where the concept is simple and speed matters.
 */
export const CATEGORY_MODELS = {
  Problem:      MODELS.BALANCED,  // Core concept — needs nuanced real-world analogies
  Features:     MODELS.BALANCED,  // Complex tradeoffs to explain clearly
  Design:       MODELS.FAST,      // Visual concepts are intuitive — speed wins
  Auth:         MODELS.BALANCED,  // Security concepts need clear, accurate explanation
  Data:         MODELS.FAST,      // Storage analogies are straightforward
  Integrations: MODELS.BALANCED,  // Technical external services need quality
  Logic:        MODELS.BALANCED,  // Business rules are nuanced
}

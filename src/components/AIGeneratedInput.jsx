import React from 'react'

/**
 * AIGeneratedInput
 * Unified input component for Codify: suggestions + textarea in a single glassmorphic container.
 *
 * Props:
 * - value: string (input value)
 * - onChange: function (event handler)
 * - suggestions: array of strings (optional)
 * - placeholder: string (optional)
 * - onSuggestionClick: function (optional, called with suggestion string)
 * - disabled: boolean (optional)
 * - rows: number (optional, textarea rows)
 * - style: object (optional, extra styles)
 */
export default function AIGeneratedInput({
  value,
  onChange,
  suggestions = [],
  placeholder = '',
  onSuggestionClick,
  disabled = false,
  rows = 3,
  style = {},
}) {
  return (
    <div
      style={{
        background: 'rgba(15,15,20,0.75)',
        border: '1.5px solid rgba(124,91,240,0.18)',
        borderRadius: '13px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        padding: 0,
        width: '100%',
        ...style,
      }}
    >
      {suggestions.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.4rem',
            padding: '1rem 1.1rem 0.5rem 1.1rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            marginBottom: 0,
          }}
        >
          {suggestions.map((chip, idx) => (
            <button
              key={chip + idx}
              type="button"
              onClick={() => onSuggestionClick?.(chip)}
              style={{
                padding: '0.3rem 0.85rem',
                fontSize: '0.82rem',
                borderRadius: '999px',
                border: '1px solid rgba(124,91,240,0.18)',
                background: 'rgba(124,91,240,0.07)',
                color: '#c4b5fd',
                cursor: 'pointer',
                transition: 'all 0.15s',
                outline: 'none',
                fontWeight: 500,
              }}
            >
              {chip}
            </button>
          ))}
        </div>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          color: '#f0eef5',
          fontSize: '1rem',
          padding: suggestions.length > 0 ? '0.85rem 1.1rem 1.1rem 1.1rem' : '1.1rem',
          borderRadius: '0 0 13px 13px',
          fontFamily: 'inherit',
          resize: 'none',
          minHeight: 0,
          boxSizing: 'border-box',
          fontWeight: 500,
          letterSpacing: '0.01em',
          backgroundClip: 'padding-box',
        }}
      />
    </div>
  )
}

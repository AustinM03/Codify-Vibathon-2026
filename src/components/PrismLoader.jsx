import React from 'react';

export default function PrismLoader({ text = "Generating..." }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
      height: '100%',
      minHeight: 300,
      gap: '1.5rem',
    }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
        <defs>
          <filter id="prismGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="prismReflection" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="white" stopOpacity="0.1" />
            <stop offset="50%"  stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        <polygon
          points="50,15 90,85 10,85"
          fill="url(#prismReflection)"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        <polygon
          points="50,15 90,85 10,85"
          fill="none"
          strokeWidth="3.5"
          strokeLinejoin="round"
          strokeLinecap="round"
          pathLength="100"
          className="prism-stroke"
          filter="url(#prismGlow)"
        />
      </svg>

      {text ? (
        <p style={{
          fontSize: '1.05rem',
          fontWeight: 500,
          letterSpacing: '-0.01em',
          color: 'rgba(255,255,255,0.95)',
          textAlign: 'center',
          whiteSpace: 'pre-line',
          animation: 'pulse 2s ease-in-out infinite',
          margin: 0,
        }}>
          {text}
        </p>
      ) : null}
    </div>
  );
}

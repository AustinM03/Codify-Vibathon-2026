import React from 'react';

export default function PrismLoader({ text = "Generating..." }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 w-full h-full min-h-[300px]">
      <svg width="100" height="100" viewBox="0 0 100 100" className="overflow-visible">
        <defs>
          {/* Outer Glow (Bloom) */}
          <filter id="prismGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Glass body reflection gradient */}
          <linearGradient id="prismReflection" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="white" stopOpacity="0.1" />
            <stop offset="50%"  stopColor="white" stopOpacity="0" />
            <stop offset="100%" stopColor="white" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Glass prism body */}
        <polygon
          points="50,15 90,85 10,85"
          fill="url(#prismReflection)"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
          className="drop-shadow-xl"
          style={{ backdropFilter: 'blur(6px)' }}
        />

        {/* Animated rainbow stroke */}
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

      <p className="text-lg font-medium tracking-tight text-white/95 animate-pulse text-center whitespace-pre-line">
        {text}
      </p>
    </div>
  );
}
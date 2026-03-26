import { useState } from 'react'

const ff = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"

const STEPS_PREVIEW = [
  {
    icon: '💬',
    label: 'Step 1',
    title: 'The Idea',
    desc: 'Tell us what you want to make in plain English. No technical knowledge needed — just describe your vision like you\'d explain it to a friend.',
    accent: '#a78bfa',
    accentBg: 'rgba(167,139,250,0.08)',
    accentBorder: 'rgba(167,139,250,0.2)',
  },
  {
    icon: '✨',
    label: 'Step 2', 
    title: 'The Blueprint',
    desc: 'Answer simple, jargon-free questions about your idea. We handle all the technical translations behind the scenes.',
    accent: '#0095ff',
    accentBg: 'rgba(0,149,255,0.08)',
    accentBorder: 'rgba(0,149,255,0.2)',
  },
  {
    icon: '🚀',
    label: 'Step 3',
    title: 'The Build',
    desc: 'Watch as your complete blueprint is generated right before your eyes, then handed to an AI coding tool and built immediately.',
    accent: '#22c55e',
    accentBg: 'rgba(34,197,94,0.08)',
    accentBorder: 'rgba(34,197,94,0.2)',
  },
]

const FEATURES = [
  { icon: '🗣️', label: 'Plain English input' },
  { icon: '⚡', label: 'Instant AI questionnaire' },
  { icon: '🔒', label: 'Your ideas stay private' },
  { icon: '📤', label: 'Export-ready prompt' },
  { icon: '🔄', label: 'Resume anytime' },
  { icon: '🆓', label: 'Free to get started' },
]

export default function LandingPage({ onGetStarted }) {
  const [hovering, setHovering] = useState(false)

  return (
    <div style={{
      height: '100vh',
      minHeight: '100vh',
      background: 'transparent',
      fontFamily: ff,
      overflowX: 'hidden',
      overflowY: 'auto',
      color: '#e2e2e2',
      position: 'relative',
      zIndex: 1,
    }}>
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-10px) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100% { opacity:0.6 } 50% { opacity:1 } }
        .feature-pill:hover { border-color: rgba(255,255,255,0.3) !important; background: rgba(255,255,255,0.05) !important; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2.5rem', height: 60,
        background: 'rgba(255,255,255,0.06)',
        backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 30, height: 30,
            background: 'linear-gradient(135deg, #7c5bf0, #5eead4)',
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '0.8rem', color: '#fff', fontWeight: 700,
          }}>P</div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ebebeb', letterSpacing: '-0.01em' }}>Prism</span>
        </div>
        <button
          className="btn-ghost"
          onClick={onGetStarted}
          style={{
            padding: '0.45rem 1.1rem',
            fontSize: '0.82rem', fontFamily: ff,
          }}>
          Sign in
        </button>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        maxWidth: 820, margin: '0 auto',
        padding: '7rem 2.5rem 5rem',
        textAlign: 'center',
        animation: 'fadeUp 0.6s ease both',
      }}>

        {/* Headline (moved up) */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 6vw, 4rem)',
          fontWeight: 800, lineHeight: 1.1,
          letterSpacing: '-0.04em',
          color: '#ffffff',
          margin: '0 0 1.25rem',
        }}>
          Software Development<br />
          <span style={{
            background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            For Everyone
          </span>
        </h1>

        {/* Sub-headline */}
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
          color: '#9CA3AF', lineHeight: 1.7,
          maxWidth: 560, margin: '0 auto 1.5rem',
        }}>
          No coding experience? No problem. Describe your idea, and our AI will guide you through building it step-by-step.
        </p>

        {/* Slogan */}
        <p style={{
          fontSize: 'clamp(1.4rem, 4vw, 2rem)',
          fontWeight: 800, letterSpacing: '-0.03em',
          color: '#ffffff', margin: '0 0 2.75rem',
          fontStyle: 'italic',
        }}>
          Just{' '}
          <span style={{
            background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            build it.
          </span>
        </p>

        {/* CTA */}
        <button
          className="btn-primary"
          onClick={onGetStarted}
          style={{
            padding: '1rem 2.5rem',
            fontSize: '1.05rem', fontWeight: 700,
            fontFamily: ff, letterSpacing: '-0.01em',
            marginTop: '1rem'
          }}>
          Start Building for Free →
        </button>

        <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#3a3a3a' }}>
          No credit card required · Takes less than 5 minutes
        </p>
      </section>

      {/* ── How it works ── */}
      <section style={{
        maxWidth: 980, margin: '0 auto',
        padding: '2rem 2.5rem 5rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', color: '#444', textTransform: 'uppercase', marginBottom: '0.6rem' }}>How it works</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 700, color: '#ebebeb', margin: '0 0 0.6rem', letterSpacing: '-0.03em' }}>
            From idea to build plan in minutes
          </h2>
          <p style={{ fontSize: '0.9rem', color: '#555', margin: 0 }}>No developer needed. No jargon. Just results.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(268px, 1fr))', gap: '1.25rem', alignItems: 'stretch' }}>
          {STEPS_PREVIEW.map((s, i) => (
            <div
              key={i}
              className="glass-card step-card"
              style={{
                borderRadius: '20px', padding: '2rem 1.75rem',
                transition: 'all 0.2s', position: 'relative',
                display: 'flex', flexDirection: 'column', gap: '1rem',
              }}>

              {/* Step label */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                alignSelf: 'flex-start',
                fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em',
                color: s.accent, background: `${s.accent}18`,
                border: `1px solid ${s.accent}33`,
                borderRadius: '999px', padding: '0.2rem 0.65rem',
              }}>
                {s.label}
              </div>

              {/* Icon */}
              <div style={{
                fontSize: '2.4rem',
                animation: `float 3s ease infinite`,
                animationDelay: `${i * 0.5}s`,
                display: 'inline-block',
              }}>
                {s.icon}
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '1.15rem', fontWeight: 700,
                color: '#ebebeb', margin: 0,
                letterSpacing: '-0.02em',
              }}>
                {s.title}
              </h3>

              {/* Description */}
              <p style={{ fontSize: '0.85rem', color: '#666', lineHeight: 1.7, margin: 0 }}>
                {s.desc}
              </p>

              {/* Connector arrow (not on last card) */}
              {i < STEPS_PREVIEW.length - 1 && (
                <div style={{
                  position: 'absolute', right: '-1.1rem', top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '1rem', color: '#2a2a2a',
                  display: 'none', // hidden on mobile, shown via media query below
                  zIndex: 2,
                }}
                  className="step-arrow">
                  ›
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature pills ── */}
      <section style={{
        maxWidth: 700, margin: '0 auto',
        padding: '0 2.5rem 5rem',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', justifyContent: 'center' }}>
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="feature-pill"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '0.45rem',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '999px', padding: '0.5rem 1.1rem',
                fontSize: '0.82rem', color: '#888',
                transition: 'all 0.15s', cursor: 'default',
              }}>
              <span>{f.icon}</span>
              <span>{f.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA banner ── */}
      <section style={{
        maxWidth: 700, margin: '0 auto 6rem',
        padding: '0 2.5rem',
      }}>
        <div className="glass-card" style={{
          borderRadius: '20px', padding: '3rem 2.5rem',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: '#ebebeb', margin: '0 0 0.75rem', letterSpacing: '-0.03em' }}>
            Your idea deserves to exist.
          </h2>
          <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.65, margin: '0 0 2rem', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Thousands of great ideas never get built because people don't know where to start. Prism changes that.
          </p>
          <button
            className="landing-cta btn-primary"
            onClick={onGetStarted}
            style={{
              padding: '0.875rem 2.25rem',
              fontSize: '0.95rem', fontWeight: 700,
              fontFamily: ff,
              marginTop: '0.5rem'
            }}>
            Start Building for Free →
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: '1px solid #1a1a1a',
        padding: '1.5rem 2.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
      }}>
        <div style={{
          width: 20, height: 20,
          background: 'linear-gradient(135deg, #7c5bf0, #5eead4)',
          borderRadius: '5px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '0.55rem', color: '#fff', fontWeight: 700,
        }}>P</div>
        <span style={{ fontSize: '0.75rem', color: '#2e2e2e' }}>© 2026 Prism. Built for builders.</span>
      </footer>
    </div>
  )
}

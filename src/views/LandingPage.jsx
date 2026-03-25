import { useState } from 'react'

const ff = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"

const STEPS_PREVIEW = [
  { icon: '💡', title: 'Describe your idea', desc: 'Tell us what you want to build in plain English — no tech speak needed.' },
  { icon: '🤖', title: 'AI guides you through it', desc: 'Answer a few friendly questions. Our AI understands your vision and fills in the gaps.' },
  { icon: '📋', title: 'Get your build plan', desc: 'Receive a complete, copy-paste-ready plan you can hand to any AI coding tool.' },
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
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0f0f0f 0%, #141414 50%, #0a0f1a 100%)',
      fontFamily: ff,
      overflowX: 'hidden',
      color: '#e2e2e2',
    }}>
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0px) } 50% { transform: translateY(-10px) } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px) } to { opacity:1; transform:translateY(0) } }
        @keyframes pulse { 0%,100% { opacity:0.6 } 50% { opacity:1 } }
        .landing-cta:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 40px rgba(0,149,255,0.55) !important; }
        .landing-cta:active { transform: translateY(0px) !important; }
        .step-card:hover { border-color: rgba(0,149,255,0.3) !important; background: rgba(0,149,255,0.04) !important; transform: translateY(-3px); }
        .feature-pill:hover { border-color: rgba(0,149,255,0.4) !important; background: rgba(0,149,255,0.08) !important; }
      `}</style>

      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2.5rem', height: 60,
        background: 'rgba(15,15,15,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 30, height: 30,
            background: 'linear-gradient(135deg, #0095ff, #00d4ff)',
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '0.9rem',
          }}>🚀</div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ebebeb', letterSpacing: '-0.01em' }}>PromptReady</span>
        </div>
        <button
          onClick={onGetStarted}
          style={{
            padding: '0.45rem 1.1rem', background: 'transparent',
            border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px',
            color: '#bbb', fontSize: '0.82rem', fontWeight: 500,
            cursor: 'pointer', transition: 'all 0.15s', fontFamily: ff,
          }}
          onMouseOver={e => { e.currentTarget.style.borderColor = '#0095ff'; e.currentTarget.style.color = '#fff' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#bbb' }}>
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
        {/* Accent pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          background: 'rgba(0,149,255,0.1)', border: '1px solid rgba(0,149,255,0.25)',
          borderRadius: '999px', padding: '0.3rem 1rem',
          fontSize: '0.75rem', color: '#60c8ff', fontWeight: 600,
          letterSpacing: '0.04em', marginBottom: '2rem',
          animation: 'pulse 3s ease infinite',
        }}>
          <span>✦</span>
          <span>AI-Powered App Planning — No Code Required</span>
        </div>

        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(2.4rem, 6vw, 4rem)',
          fontWeight: 800, lineHeight: 1.1,
          letterSpacing: '-0.04em',
          color: '#ffffff',
          margin: '0 0 1.25rem',
        }}>
          Software Development<br />
          <span style={{
            background: 'linear-gradient(135deg, #0095ff, #00d4ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            For Everyone
          </span>
        </h1>

        {/* Sub-headline */}
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
          color: '#8a8a8a', lineHeight: 1.7,
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
            background: 'linear-gradient(135deg, #0095ff, #00d4ff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            build it.
          </span>
        </p>

        {/* CTA */}
        <button
          className="landing-cta"
          onClick={onGetStarted}
          style={{
            padding: '1rem 2.5rem',
            background: 'linear-gradient(135deg, #0095ff, #00aaff)',
            color: '#fff', border: 'none',
            borderRadius: '14px',
            fontSize: '1.05rem', fontWeight: 700,
            cursor: 'pointer', fontFamily: ff,
            boxShadow: '0 4px 28px rgba(0,149,255,0.4)',
            transition: 'transform 0.18s, box-shadow 0.18s',
            letterSpacing: '-0.01em',
          }}>
          Start Building for Free →
        </button>

        <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#3a3a3a' }}>
          No credit card required · Takes less than 5 minutes
        </p>
      </section>

      {/* ── How it works ── */}
      <section style={{
        maxWidth: 900, margin: '0 auto',
        padding: '2rem 2.5rem 5rem',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', color: '#444', textTransform: 'uppercase', marginBottom: '0.6rem' }}>How it works</div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 700, color: '#ebebeb', margin: 0, letterSpacing: '-0.03em' }}>
            Three steps to your build plan
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
          {STEPS_PREVIEW.map((s, i) => (
            <div
              key={i}
              className="step-card"
              style={{
                background: '#111', border: '1px solid #1e1e1e',
                borderRadius: '16px', padding: '1.75rem 1.5rem',
                transition: 'all 0.2s',
              }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem', animation: 'float 3s ease infinite', animationDelay: `${i * 0.4}s`, display: 'inline-block' }}>{s.icon}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <span style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0095ff, #00d4ff)',
                  color: '#fff', fontSize: '0.65rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{i + 1}</span>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e2e2', margin: 0 }}>{s.title}</h3>
              </div>
              <p style={{ fontSize: '0.83rem', color: '#555', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
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
                background: '#111', border: '1px solid #1e1e1e',
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
        <div style={{
          background: 'linear-gradient(135deg, rgba(0,149,255,0.1), rgba(0,212,255,0.06))',
          border: '1px solid rgba(0,149,255,0.2)',
          borderRadius: '20px', padding: '3rem 2.5rem',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: '#ebebeb', margin: '0 0 0.75rem', letterSpacing: '-0.03em' }}>
            Your idea deserves to exist.
          </h2>
          <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.65, margin: '0 0 2rem', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            Thousands of great ideas never get built because people don't know where to start. PromptReady changes that.
          </p>
          <button
            className="landing-cta"
            onClick={onGetStarted}
            style={{
              padding: '0.875rem 2.25rem',
              background: 'linear-gradient(135deg, #0095ff, #00aaff)',
              color: '#fff', border: 'none',
              borderRadius: '12px',
              fontSize: '0.95rem', fontWeight: 700,
              cursor: 'pointer', fontFamily: ff,
              boxShadow: '0 4px 24px rgba(0,149,255,0.35)',
              transition: 'transform 0.18s, box-shadow 0.18s',
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
          background: 'linear-gradient(135deg, #0095ff, #00d4ff)',
          borderRadius: '5px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '0.65rem',
        }}>🚀</div>
        <span style={{ fontSize: '0.75rem', color: '#2e2e2e' }}>© 2026 PromptReady. Built for builders.</span>
      </footer>
    </div>
  )
}

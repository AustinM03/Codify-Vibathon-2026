import { useState, useEffect, useCallback } from 'react'
import { supabase } from './supabaseClient'

const STEPS = [
  { id: 'problem',      label: 'Problem',      phase: 1 },
  { id: 'features',     label: 'Features',     phase: 2 },
  { id: 'design',       label: 'Design',       phase: 3 },
  { id: 'auth',         label: 'Auth',         phase: 4 },
  { id: 'data',         label: 'Data',         phase: 5 },
  { id: 'integrations', label: 'Integrations', phase: 6 },
  { id: 'logic',        label: 'Logic',        phase: 7 },
]

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div style={{
      position: 'fixed', bottom: '1.75rem', right: '1.75rem',
      background: '#0a1a0a', border: '1px solid #22c55e', borderRadius: '10px',
      padding: '0.9rem 1.25rem', color: '#4ade80', fontSize: '0.875rem',
      zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
      maxWidth: '340px', animation: 'slideIn 0.2s ease',
    }}>
      <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>✅</span>
      <div>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Session saved successfully</div>
        <div style={{ color: '#86efac', fontSize: '0.77rem', wordBreak: 'break-all', opacity: 0.85 }}>{message}</div>
      </div>
    </div>
  )
}

// ─── Login Screen ─────────────────────────────────────────────────────────────

function LoginScreen() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')

    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email, password })
      if (err) { setError(err.message) }
      else { setInfo('Account created! Check your email or sign in below.') ; setMode('signin') }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError(err.message) }
      // on success, onAuthStateChange in App will handle the redirect
    }
    setLoading(false)
  }

  const inputStyle = {
    width: '100%', background: '#111', border: '1.5px solid #252525',
    borderRadius: '8px', color: '#e2e2e2', padding: '0.75rem 0.9rem',
    fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.15s', display: 'block',
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#191919', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    }}>
      <div style={{
        width: '100%', maxWidth: 420, padding: '2.5rem',
        background: '#111', border: '1px solid #1e1e1e',
        borderRadius: '14px', boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '2rem' }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #0095ff, #00d4ff)',
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
          }}>🚀</div>
          <div style={{ color: '#e2e2e2', fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>PromptReady</div>
        </div>

        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ebebeb', margin: '0 0 0.4rem', letterSpacing: '-0.02em' }}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={{ color: '#444', fontSize: '0.85rem', margin: '0 0 1.75rem' }}>
          {mode === 'signin' ? 'Sign in to continue building.' : 'Get started with PromptReady AI.'}
        </p>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Email</label>
          <input
            type="email" required value={email}
            onChange={e => { setEmail(e.target.value); setError('') }}
            placeholder="you@example.com"
            style={{ ...inputStyle, marginBottom: '1rem' }}
            onFocus={e => (e.target.style.borderColor = '#0095ff')}
            onBlur={e => (e.target.style.borderColor = '#252525')}
          />

          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Password</label>
          <input
            type="password" required value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            placeholder="••••••••"
            style={{ ...inputStyle, marginBottom: '1.4rem' }}
            onFocus={e => (e.target.style.borderColor = '#0095ff')}
            onBlur={e => (e.target.style.borderColor = '#252525')}
          />

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444',
              borderRadius: '7px', padding: '0.6rem 0.85rem',
              color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem',
            }}>{error}</div>
          )}
          {info && (
            <div style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e',
              borderRadius: '7px', padding: '0.6rem 0.85rem',
              color: '#4ade80', fontSize: '0.8rem', marginBottom: '1rem',
            }}>{info}</div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              width: '100%', padding: '0.8rem',
              background: loading ? '#004e8a' : '#0095ff',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
              boxShadow: loading ? 'none' : '0 2px 18px rgba(0,149,255,0.4)',
              transition: 'background 0.15s',
            }}
            onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#007acc' }}
            onMouseOut={e => { if (!loading) e.currentTarget.style.background = '#0095ff' }}
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: '#333' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo('') }}
            style={{
              background: 'none', border: 'none', color: '#0095ff',
              cursor: 'pointer', fontSize: '0.8rem', padding: 0,
            }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function StepRow({ step, isActive, isCompleted }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '0.7rem',
      padding: '0.44rem 0.65rem', borderRadius: '6px',
      background: isActive ? 'rgba(0,149,255,0.1)' : 'transparent',
      marginBottom: '2px', cursor: isActive ? 'default' : 'not-allowed',
      userSelect: 'none',
    }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.68rem', fontWeight: 700,
        background: isCompleted ? '#16a34a' : isActive ? '#0095ff' : 'transparent',
        border: isCompleted || isActive ? 'none' : '1.5px solid #2e2e2e',
        color: isCompleted || isActive ? '#fff' : '#3a3a3a',
      }}>
        {isCompleted ? '✓' : step.phase}
      </div>
      <span style={{
        fontSize: '0.845rem',
        color: isActive ? '#60c8ff' : isCompleted ? '#86efac' : '#3a3a3a',
        fontWeight: isActive ? 600 : 400,
      }}>
        {step.label}
      </span>
      {isActive && (
        <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#0095ff', flexShrink: 0 }} />
      )}
    </div>
  )
}

function Sidebar({ activeStep, completedSteps, userEmail, onLogout }) {
  const progress = (completedSteps.length / STEPS.length) * 100

  return (
    <aside style={{
      width: 232, minWidth: 232, height: '100vh', background: '#111',
      borderRight: '1px solid #1e1e1e', display: 'flex',
      flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.1rem 1rem', borderBottom: '1px solid #1e1e1e',
        display: 'flex', alignItems: 'center', gap: '0.65rem',
      }}>
        <div style={{
          width: 30, height: 30,
          background: 'linear-gradient(135deg, #0095ff, #00d4ff)',
          borderRadius: '7px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0,
        }}>🚀</div>
        <div>
          <div style={{ color: '#e2e2e2', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em' }}>PromptReady</div>
          <div style={{ color: '#3d3d3d', fontSize: '0.68rem' }}>AI App Builder</div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: '1.1rem 0.7rem 0.5rem', flex: 1, overflowY: 'auto' }}>
        <div style={{
          fontSize: '0.61rem', fontWeight: 700, letterSpacing: '0.1em',
          color: '#333', textTransform: 'uppercase', padding: '0 0.4rem', marginBottom: '0.6rem',
        }}>
          Build Phases
        </div>
        {STEPS.map(step => (
          <StepRow key={step.id} step={step} isActive={activeStep === step.id} isCompleted={completedSteps.includes(step.id)} />
        ))}
      </div>

      {/* Progress + User footer */}
      <div style={{ padding: '0.9rem 1rem', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
          <span style={{ fontSize: '0.67rem', color: '#333' }}>Progress</span>
          <span style={{ fontSize: '0.67rem', color: '#444' }}>{completedSteps.length} / 7</span>
        </div>
        <div style={{ height: 3, background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{
            width: `${progress}%`, height: '100%',
            background: 'linear-gradient(90deg, #0095ff, #00d4ff)',
            borderRadius: '2px', transition: 'width 0.4s ease',
          }} />
        </div>

        {/* User row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
          <div style={{
            fontSize: '0.68rem', color: '#3a3a3a',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
          }} title={userEmail}>
            {userEmail}
          </div>
          <button
            onClick={onLogout}
            title="Sign out"
            style={{
              background: 'none', border: '1px solid #2a2a2a', borderRadius: '5px',
              color: '#3a3a3a', cursor: 'pointer', fontSize: '0.65rem',
              padding: '0.2rem 0.45rem', flexShrink: 0, transition: 'all 0.15s',
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#f87171' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#3a3a3a' }}
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}

// ─── Intake Screen ────────────────────────────────────────────────────────────

function IntakeScreen({ onSuccess, user }) {
  const [idea, setIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  const borderColor = error ? '#ef4444' : focused ? '#0095ff' : '#252525'

  async function handleSubmit() {
    if (!idea.trim()) { setError('Please describe your app idea before continuing.'); return }
    setLoading(true)
    setError('')

    const { data, error: dbError } = await supabase
      .from('sessions')
      .insert([{ raw_idea: idea.trim(), user_id: user.id }])
      .select()

    setLoading(false)

    if (dbError) { console.error('Insert error:', dbError); setError(dbError.message); return }

    const sessionId = data?.[0]?.id ?? 'unknown'
    console.log('Session created:', data?.[0])
    console.log('Session ID:', sessionId)
    onSuccess(sessionId)
    setIdea('')
  }

  return (
    <main style={{
      flex: 1, height: '100vh', overflowY: 'auto', background: '#191919',
      display: 'flex', justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 700, padding: '3.5rem 2.5rem 3rem' }}>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          fontSize: '0.71rem', color: '#555', background: '#161616',
          border: '1px solid #252525', borderRadius: '999px',
          padding: '0.25rem 0.8rem', marginBottom: '1.4rem', letterSpacing: '0.02em',
        }}>
          <span>🎯</span><span>Phase 1 — Problem Definition</span>
        </div>

        <h1 style={{ fontSize: '2.1rem', fontWeight: 700, color: '#ebebeb', margin: '0 0 0.55rem', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
          Project Initialization
        </h1>
        <p style={{ color: '#5e5e5e', fontSize: '0.95rem', margin: '0 0 2rem', lineHeight: 1.65 }}>
          Describe your vision. We'll break it down into a complete build plan across all 7 phases.
        </p>

        <div style={{ height: '1px', background: '#1e1e1e', marginBottom: '2rem' }} />

        <label style={{
          display: 'block', fontSize: '0.71rem', fontWeight: 600, color: '#555',
          marginBottom: '0.55rem', letterSpacing: '0.07em', textTransform: 'uppercase',
        }}>Your App Idea</label>

        <textarea
          value={idea}
          onChange={e => { setIdea(e.target.value); if (error) setError('') }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Describe your app idea in as much detail as possible..."
          rows={9}
          style={{
            width: '100%', background: '#111', border: `1.5px solid ${borderColor}`,
            borderRadius: '10px', color: '#e2e2e2', padding: '1rem 1.1rem',
            fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical',
            outline: 'none', lineHeight: 1.7, display: 'block', transition: 'border-color 0.15s',
          }}
        />

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: '0.45rem', marginBottom: '1.5rem', minHeight: '1.1rem',
        }}>
          {error
            ? <span style={{ fontSize: '0.78rem', color: '#f87171' }}>{error}</span>
            : <span />
          }
          <span style={{ fontSize: '0.71rem', color: '#333', marginLeft: 'auto' }}>{idea.length} chars</span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%', padding: '0.875rem',
            background: loading ? '#004e8a' : '#0095ff',
            color: '#fff', border: 'none', borderRadius: '10px',
            fontSize: '0.95rem', fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.015em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
            transition: 'background 0.15s, box-shadow 0.15s',
            boxShadow: loading ? 'none' : '0 2px 22px rgba(0,149,255,0.5)',
          }}
          onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#007acc' }}
          onMouseOut={e => { if (!loading) e.currentTarget.style.background = '#0095ff' }}
        >
          {loading ? 'Saving...' : 'Start Building →'}
        </button>

        <p style={{ fontSize: '0.71rem', color: '#2e2e2e', textAlign: 'center', marginTop: '1rem', lineHeight: 1.6 }}>
          Your idea will be saved and analyzed to generate a complete build plan across all 7 phases.
        </p>
      </div>
    </main>
  )
}

// ─── App Shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [completedSteps, setCompletedSteps] = useState([])
  const [toast, setToast] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSuccess = useCallback((sessionId) => {
    setCompletedSteps(prev => [...new Set([...prev, 'problem'])])
    setToast(`session_id: ${sessionId}`)
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#191919', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ color: '#2a2a2a', fontSize: '0.85rem' }}>Loading...</div>
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <div style={{
      display: 'flex', height: '100vh',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      background: '#191919',
    }}>
      <Sidebar
        activeStep="problem"
        completedSteps={completedSteps}
        userEmail={user.email}
        onLogout={handleLogout}
      />
      <IntakeScreen onSuccess={handleSuccess} user={user} />
      {toast && <Toast message={toast} onDismiss={dismissToast} />}
    </div>
  )
}

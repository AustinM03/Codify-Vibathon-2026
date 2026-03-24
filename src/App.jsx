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

function Toast({ message, onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4500)
    return () => clearTimeout(t)
  }, [onDismiss])

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.75rem',
      right: '1.75rem',
      background: '#0a1a0a',
      border: '1px solid #22c55e',
      borderRadius: '10px',
      padding: '0.9rem 1.25rem',
      color: '#4ade80',
      fontSize: '0.875rem',
      zIndex: 9999,
      boxShadow: '0 8px 32px rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.65rem',
      maxWidth: '340px',
      animation: 'slideIn 0.2s ease',
    }}>
      <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>✅</span>
      <div>
        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Session saved successfully</div>
        <div style={{ color: '#86efac', fontSize: '0.77rem', wordBreak: 'break-all', opacity: 0.85 }}>{message}</div>
      </div>
    </div>
  )
}

function StepRow({ step, isActive, isCompleted }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.7rem',
      padding: '0.44rem 0.65rem',
      borderRadius: '6px',
      background: isActive ? 'rgba(0,149,255,0.1)' : 'transparent',
      marginBottom: '2px',
      cursor: isActive ? 'default' : 'not-allowed',
      userSelect: 'none',
    }}>
      <div style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.68rem',
        fontWeight: 700,
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
        <div style={{
          marginLeft: 'auto',
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: '#0095ff',
          flexShrink: 0,
        }} />
      )}
    </div>
  )
}

function Sidebar({ activeStep, completedSteps }) {
  const progress = (completedSteps.length / STEPS.length) * 100

  return (
    <aside style={{
      width: 232,
      minWidth: 232,
      height: '100vh',
      background: '#111',
      borderRight: '1px solid #1e1e1e',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.1rem 1rem',
        borderBottom: '1px solid #1e1e1e',
        display: 'flex',
        alignItems: 'center',
        gap: '0.65rem',
      }}>
        <div style={{
          width: 30,
          height: 30,
          background: 'linear-gradient(135deg, #0095ff, #00d4ff)',
          borderRadius: '7px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.95rem',
          flexShrink: 0,
        }}>
          🚀
        </div>
        <div>
          <div style={{ color: '#e2e2e2', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em' }}>PromptReady</div>
          <div style={{ color: '#3d3d3d', fontSize: '0.68rem' }}>AI App Builder</div>
        </div>
      </div>

      {/* Steps */}
      <div style={{ padding: '1.1rem 0.7rem 0.5rem', flex: 1 }}>
        <div style={{
          fontSize: '0.61rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: '#333',
          textTransform: 'uppercase',
          padding: '0 0.4rem',
          marginBottom: '0.6rem',
        }}>
          Build Phases
        </div>
        {STEPS.map(step => (
          <StepRow
            key={step.id}
            step={step}
            isActive={activeStep === step.id}
            isCompleted={completedSteps.includes(step.id)}
          />
        ))}
      </div>

      {/* Progress footer */}
      <div style={{
        padding: '0.9rem 1rem',
        borderTop: '1px solid #1a1a1a',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.45rem',
        }}>
          <span style={{ fontSize: '0.67rem', color: '#333' }}>Progress</span>
          <span style={{ fontSize: '0.67rem', color: '#444' }}>{completedSteps.length} / 7</span>
        </div>
        <div style={{
          height: 3,
          background: '#1e1e1e',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #0095ff, #00d4ff)',
            borderRadius: '2px',
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>
    </aside>
  )
}

function IntakeScreen({ onSuccess }) {
  const [idea, setIdea] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)

  const borderColor = error ? '#ef4444' : focused ? '#0095ff' : '#252525'

  async function handleSubmit() {
    if (!idea.trim()) {
      setError('Please describe your app idea before continuing.')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: dbError } = await supabase
      .from('sessions')
      .insert([{ raw_idea: idea.trim() }])
      .select()

    setLoading(false)

    if (dbError) {
      console.error('Insert error:', dbError)
      setError(dbError.message)
      return
    }

    const sessionId = data?.[0]?.id ?? 'unknown'
    console.log('Session created:', data?.[0])
    console.log('Session ID:', sessionId)
    onSuccess(sessionId)
    setIdea('')
  }

  return (
    <main style={{
      flex: 1,
      height: '100vh',
      overflowY: 'auto',
      background: '#191919',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div style={{ width: '100%', maxWidth: 700, padding: '3.5rem 2.5rem 3rem' }}>

        {/* Phase badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.71rem',
          color: '#555',
          background: '#161616',
          border: '1px solid #252525',
          borderRadius: '999px',
          padding: '0.25rem 0.8rem',
          marginBottom: '1.4rem',
          letterSpacing: '0.02em',
        }}>
          <span>🎯</span>
          <span>Phase 1 — Problem Definition</span>
        </div>

        {/* Heading */}
        <h1 style={{
          fontSize: '2.1rem',
          fontWeight: 700,
          color: '#ebebeb',
          margin: '0 0 0.55rem',
          letterSpacing: '-0.03em',
          lineHeight: 1.2,
        }}>
          Project Initialization
        </h1>
        <p style={{
          color: '#5e5e5e',
          fontSize: '0.95rem',
          margin: '0 0 2rem',
          lineHeight: 1.65,
        }}>
          Describe your vision. We'll break it down into a complete build plan across all 7 phases.
        </p>

        <div style={{ height: '1px', background: '#1e1e1e', marginBottom: '2rem' }} />

        {/* Textarea */}
        <label style={{
          display: 'block',
          fontSize: '0.71rem',
          fontWeight: 600,
          color: '#555',
          marginBottom: '0.55rem',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
        }}>
          Your App Idea
        </label>

        <textarea
          value={idea}
          onChange={e => { setIdea(e.target.value); if (error) setError('') }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Describe your app idea in as much detail as possible..."
          rows={9}
          style={{
            width: '100%',
            background: '#111',
            border: `1.5px solid ${borderColor}`,
            borderRadius: '10px',
            color: '#e2e2e2',
            padding: '1rem 1.1rem',
            fontSize: '0.95rem',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            lineHeight: 1.7,
            display: 'block',
            transition: 'border-color 0.15s',
          }}
        />

        {/* Error / char count row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '0.45rem',
          marginBottom: '1.5rem',
          minHeight: '1.1rem',
        }}>
          {error
            ? <span style={{ fontSize: '0.78rem', color: '#f87171' }}>{error}</span>
            : <span />
          }
          <span style={{ fontSize: '0.71rem', color: '#333', marginLeft: 'auto' }}>
            {idea.length} chars
          </span>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            width: '100%',
            padding: '0.875rem',
            background: loading ? '#004e8a' : '#0095ff',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.95rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.015em',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            transition: 'background 0.15s, box-shadow 0.15s',
            boxShadow: loading ? 'none' : '0 2px 22px rgba(0,149,255,0.5)',
          }}
          onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#007acc' }}
          onMouseOut={e => { if (!loading) e.currentTarget.style.background = '#0095ff' }}
        >
          {loading ? 'Saving...' : 'Start Building →'}
        </button>

        <p style={{
          fontSize: '0.71rem',
          color: '#2e2e2e',
          textAlign: 'center',
          marginTop: '1rem',
          lineHeight: 1.6,
        }}>
          Your idea will be saved and analyzed to generate a complete build plan across all 7 phases.
        </p>
      </div>
    </main>
  )
}

export default function App() {
  const [completedSteps, setCompletedSteps] = useState([])
  const [toast, setToast] = useState(null)

  const handleSuccess = useCallback((sessionId) => {
    setCompletedSteps(prev => [...new Set([...prev, 'problem'])])
    setToast(`session_id: ${sessionId}`)
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      background: '#191919',
    }}>
      <Sidebar activeStep="problem" completedSteps={completedSteps} />
      <IntakeScreen onSuccess={handleSuccess} />
      {toast && <Toast message={toast} onDismiss={dismissToast} />}
    </div>
  )
}

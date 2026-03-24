import { useState, useEffect, useCallback, useRef } from 'react'
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

const CATEGORY_TO_STEP = {
  Problem: 'problem', Features: 'features', Design: 'design',
  Auth: 'auth', Data: 'data', Integrations: 'integrations', Logic: 'logic',
}

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
  const [mode, setMode] = useState('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(''); setInfo('')
    if (mode === 'signup') {
      const { error: err } = await supabase.auth.signUp({ email, password })
      if (err) { setError(err.message) }
      else { setInfo('Account created! Sign in below.'); setMode('signin') }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) { setError(err.message) }
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '2rem' }}>
          <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #0095ff, #00d4ff)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>🚀</div>
          <div style={{ color: '#e2e2e2', fontWeight: 700, fontSize: '0.95rem' }}>PromptReady</div>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ebebeb', margin: '0 0 0.4rem', letterSpacing: '-0.02em' }}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={{ color: '#444', fontSize: '0.85rem', margin: '0 0 1.75rem' }}>
          {mode === 'signin' ? 'Sign in to continue building.' : 'Get started with PromptReady AI.'}
        </p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Email</label>
          <input type="email" required value={email} onChange={e => { setEmail(e.target.value); setError('') }} placeholder="you@example.com"
            style={{ ...inputStyle, marginBottom: '1rem' }}
            onFocus={e => (e.target.style.borderColor = '#0095ff')} onBlur={e => (e.target.style.borderColor = '#252525')} />
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Password</label>
          <input type="password" required value={password} onChange={e => { setPassword(e.target.value); setError('') }} placeholder="••••••••"
            style={{ ...inputStyle, marginBottom: '1.4rem' }}
            onFocus={e => (e.target.style.borderColor = '#0095ff')} onBlur={e => (e.target.style.borderColor = '#252525')} />
          {error && <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: '7px', padding: '0.6rem 0.85rem', color: '#f87171', fontSize: '0.8rem', marginBottom: '1rem' }}>{error}</div>}
          {info && <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: '7px', padding: '0.6rem 0.85rem', color: '#4ade80', fontSize: '0.8rem', marginBottom: '1rem' }}>{info}</div>}
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '0.8rem', background: loading ? '#004e8a' : '#0095ff', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 2px 18px rgba(0,149,255,0.4)', transition: 'background 0.15s' }}
            onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#007acc' }}
            onMouseOut={e => { if (!loading) e.currentTarget.style.background = '#0095ff' }}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: '#333' }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setInfo('') }}
            style={{ background: 'none', border: 'none', color: '#0095ff', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.44rem 0.65rem', borderRadius: '6px', background: isActive ? 'rgba(0,149,255,0.1)' : 'transparent', marginBottom: '2px', cursor: 'default', userSelect: 'none' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, background: isCompleted ? '#16a34a' : isActive ? '#0095ff' : 'transparent', border: isCompleted || isActive ? 'none' : '1.5px solid #2e2e2e', color: isCompleted || isActive ? '#fff' : '#3a3a3a' }}>
        {isCompleted ? '✓' : step.phase}
      </div>
      <span style={{ fontSize: '0.845rem', color: isActive ? '#60c8ff' : isCompleted ? '#86efac' : '#3a3a3a', fontWeight: isActive ? 600 : 400 }}>
        {step.label}
      </span>
      {isActive && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#0095ff', flexShrink: 0 }} />}
    </div>
  )
}

function Sidebar({ activeStep, completedSteps, userEmail, onLogout }) {
  const progress = (completedSteps.length / STEPS.length) * 100
  return (
    <aside style={{ width: 232, minWidth: 232, height: '100vh', background: '#111', borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '1.1rem 1rem', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
        <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg, #0095ff, #00d4ff)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.95rem', flexShrink: 0 }}>🚀</div>
        <div>
          <div style={{ color: '#e2e2e2', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em' }}>PromptReady</div>
          <div style={{ color: '#3d3d3d', fontSize: '0.68rem' }}>AI App Builder</div>
        </div>
      </div>
      <div style={{ padding: '1.1rem 0.7rem 0.5rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.61rem', fontWeight: 700, letterSpacing: '0.1em', color: '#333', textTransform: 'uppercase', padding: '0 0.4rem', marginBottom: '0.6rem' }}>Build Phases</div>
        {STEPS.map(step => (
          <StepRow key={step.id} step={step} isActive={activeStep === step.id} isCompleted={completedSteps.includes(step.id)} />
        ))}
      </div>
      <div style={{ padding: '0.9rem 1rem', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
          <span style={{ fontSize: '0.67rem', color: '#333' }}>Progress</span>
          <span style={{ fontSize: '0.67rem', color: '#444' }}>{completedSteps.length} / 7</span>
        </div>
        <div style={{ height: 3, background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden', marginBottom: '1rem' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #0095ff, #00d4ff)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '0.68rem', color: '#3a3a3a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }} title={userEmail}>{userEmail}</div>
          <button onClick={onLogout} title="Sign out"
            style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: '5px', color: '#3a3a3a', cursor: 'pointer', fontSize: '0.65rem', padding: '0.2rem 0.45rem', flexShrink: 0, transition: 'all 0.15s' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#f87171' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#3a3a3a' }}>
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
    setLoading(true); setError('')
    const { data, error: dbError } = await supabase
      .from('sessions')
      .insert([{ raw_idea: idea.trim(), user_id: user.id }])
      .select()
    setLoading(false)
    if (dbError) { console.error('Insert error:', dbError); setError(dbError.message); return }
    const sessionId = data?.[0]?.id ?? 'unknown'
    console.log('Session created:', data?.[0])
    onSuccess({ sessionId, rawIdea: idea.trim() })
  }

  return (
    <main style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#191919', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 700, padding: '3.5rem 2.5rem 3rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.71rem', color: '#555', background: '#161616', border: '1px solid #252525', borderRadius: '999px', padding: '0.25rem 0.8rem', marginBottom: '1.4rem', letterSpacing: '0.02em' }}>
          <span>🎯</span><span>Phase 1 — Problem Definition</span>
        </div>
        <h1 style={{ fontSize: '2.1rem', fontWeight: 700, color: '#ebebeb', margin: '0 0 0.55rem', letterSpacing: '-0.03em', lineHeight: 1.2 }}>Project Initialization</h1>
        <p style={{ color: '#5e5e5e', fontSize: '0.95rem', margin: '0 0 2rem', lineHeight: 1.65 }}>Describe your vision. We'll break it down into a complete build plan across all 7 phases.</p>
        <div style={{ height: '1px', background: '#1e1e1e', marginBottom: '2rem' }} />
        <label style={{ display: 'block', fontSize: '0.71rem', fontWeight: 600, color: '#555', marginBottom: '0.55rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Your App Idea</label>
        <textarea value={idea} onChange={e => { setIdea(e.target.value); if (error) setError('') }} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          placeholder="Describe your app idea in as much detail as possible..." rows={9}
          style={{ width: '100%', background: '#111', border: `1.5px solid ${borderColor}`, borderRadius: '10px', color: '#e2e2e2', padding: '1rem 1.1rem', fontSize: '0.95rem', fontFamily: 'inherit', resize: 'vertical', outline: 'none', lineHeight: 1.7, display: 'block', transition: 'border-color 0.15s' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.45rem', marginBottom: '1.5rem', minHeight: '1.1rem' }}>
          {error ? <span style={{ fontSize: '0.78rem', color: '#f87171' }}>{error}</span> : <span />}
          <span style={{ fontSize: '0.71rem', color: '#333', marginLeft: 'auto' }}>{idea.length} chars</span>
        </div>
        <button onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '0.875rem', background: loading ? '#004e8a' : '#0095ff', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.015em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'background 0.15s, box-shadow 0.15s', boxShadow: loading ? 'none' : '0 2px 22px rgba(0,149,255,0.5)' }}
          onMouseOver={e => { if (!loading) e.currentTarget.style.background = '#007acc' }}
          onMouseOut={e => { if (!loading) e.currentTarget.style.background = '#0095ff' }}>
          {loading ? 'Saving...' : 'Start Building →'}
        </button>
        <p style={{ fontSize: '0.71rem', color: '#2e2e2e', textAlign: 'center', marginTop: '1rem', lineHeight: 1.6 }}>Your idea will be saved and analyzed to generate a complete build plan across all 7 phases.</p>
      </div>
    </main>
  )
}

// ─── Questionnaire Screen ─────────────────────────────────────────────────────

function QuestionnaireScreen({ sessionId, rawIdea, user, onStepComplete, onAllComplete }) {
  const [questions, setQuestions] = useState([])   // [{category, question, suggestions}]
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [categoryIndex, setCategoryIndex] = useState(0)
  const [answers, setAnswers] = useState({})        // key: `${catIdx}-${qIdx}` → string
  const [saving, setSaving] = useState(false)
  const hasFetched = useRef(false)

  // Group questions by category order
  const categories = questions.reduce((acc, q) => {
    if (!acc.find(c => c.name === q.category)) acc.push({ name: q.category, questions: [] })
    acc.find(c => c.name === q.category).questions.push(q)
    return acc
  }, [])

  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    async function fetchQuestions() {
      setApiLoading(true); setApiError('')
      try {
        const res = await fetch('/api/questionnaire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_idea: rawIdea }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error ?? 'Failed to generate questions')
        setQuestions(json.questions)
      } catch (err) {
        setApiError(err.message)
      } finally {
        setApiLoading(false)
      }
    }
    fetchQuestions()
  }, [rawIdea])

  const currentCategory = categories[categoryIndex]
  const isLastCategory = categoryIndex === categories.length - 1

  function setAnswer(catIdx, qIdx, value) {
    setAnswers(prev => ({ ...prev, [`${catIdx}-${qIdx}`]: value }))
  }

  async function handleNext() {
    if (!currentCategory) return
    setSaving(true)

    const rows = currentCategory.questions.map((q, qIdx) => ({
      session_id: sessionId,
      category: currentCategory.name,
      question: q.question,
      answer: answers[`${categoryIndex}-${qIdx}`]?.trim() || '',
    }))

    const { error } = await supabase.from('questionnaire_responses').insert(rows)
    if (error) { console.error('Save error:', error) }

    const stepId = CATEGORY_TO_STEP[currentCategory.name]
    if (stepId) onStepComplete(stepId)

    setSaving(false)

    if (isLastCategory) {
      onAllComplete()
    } else {
      setCategoryIndex(i => i + 1)
    }
  }

  const btnLabel = saving ? 'Saving...' : isLastCategory ? 'Complete Questionnaire ✓' : `Next: ${categories[categoryIndex + 1]?.name ?? ''} →`

  if (apiLoading) {
    return (
      <main style={{ flex: 1, height: '100vh', background: '#191919', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #1e1e1e', borderTopColor: '#0095ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#333', fontSize: '0.85rem' }}>Generating your adaptive questionnaire...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </main>
    )
  }

  if (apiError) {
    return (
      <main style={{ flex: 1, height: '100vh', background: '#191919', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ color: '#f87171', marginBottom: '0.5rem', fontSize: '1.1rem' }}>⚠️</div>
          <p style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: '1rem' }}>{apiError}</p>
          <button onClick={() => { hasFetched.current = false; setApiLoading(true); setApiError('') }}
            style={{ padding: '0.6rem 1.25rem', background: '#0095ff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Try Again
          </button>
        </div>
      </main>
    )
  }

  if (!currentCategory) return null

  const phaseNum = STEPS.findIndex(s => s.id === CATEGORY_TO_STEP[currentCategory.name]) + 1

  return (
    <main style={{ flex: 1, height: '100vh', overflowY: 'auto', background: '#191919', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 700, padding: '3.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.71rem', color: '#555', background: '#161616', border: '1px solid #252525', borderRadius: '999px', padding: '0.25rem 0.8rem', letterSpacing: '0.02em' }}>
            <span>📋</span>
            <span>Phase {phaseNum} — {currentCategory.name}</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#333' }}>{categoryIndex + 1} of {categories.length}</span>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#ebebeb', margin: '0 0 0.5rem', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
          {currentCategory.name}
        </h1>
        <p style={{ color: '#5e5e5e', fontSize: '0.9rem', margin: '0 0 2rem', lineHeight: 1.65 }}>
          Answer these questions to help define the {currentCategory.name.toLowerCase()} requirements for your app.
        </p>

        <div style={{ height: '1px', background: '#1e1e1e', marginBottom: '2rem' }} />

        {/* Category progress bar */}
        <div style={{ height: 2, background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden', marginBottom: '2rem' }}>
          <div style={{ width: `${((categoryIndex + 1) / categories.length) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #0095ff, #00d4ff)', transition: 'width 0.4s ease' }} />
        </div>

        {/* Questions */}
        {currentCategory.questions.map((q, qIdx) => {
          const answerKey = `${categoryIndex}-${qIdx}`
          const currentAnswer = answers[answerKey] ?? ''
          return (
            <div key={qIdx} style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.6rem', lineHeight: 1.5 }}>
                {qIdx + 1}. {q.question}
              </label>

              {/* Suggestion chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.65rem' }}>
                {q.suggestions?.map((chip, cIdx) => {
                  const isSelected = currentAnswer === chip
                  return (
                    <button key={cIdx}
                      onClick={() => setAnswer(categoryIndex, qIdx, isSelected ? '' : chip)}
                      style={{
                        padding: '0.3rem 0.75rem', fontSize: '0.75rem', borderRadius: '999px', cursor: 'pointer',
                        border: `1px solid ${isSelected ? '#0095ff' : '#252525'}`,
                        background: isSelected ? 'rgba(0,149,255,0.12)' : '#161616',
                        color: isSelected ? '#60c8ff' : '#555',
                        transition: 'all 0.12s',
                      }}>
                      {chip}
                    </button>
                  )
                })}
              </div>

              {/* Free text */}
              <textarea
                value={currentAnswer}
                onChange={e => setAnswer(categoryIndex, qIdx, e.target.value)}
                placeholder="Type your answer, or click a suggestion above..."
                rows={3}
                style={{
                  width: '100%', background: '#111', border: '1.5px solid #252525',
                  borderRadius: '8px', color: '#e2e2e2', padding: '0.8rem 1rem',
                  fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical',
                  outline: 'none', lineHeight: 1.6, display: 'block', transition: 'border-color 0.15s',
                }}
                onFocus={e => (e.target.style.borderColor = '#0095ff')}
                onBlur={e => (e.target.style.borderColor = '#252525')}
              />
            </div>
          )
        })}

        {/* Nav */}
        <button onClick={handleNext} disabled={saving}
          style={{ width: '100%', padding: '0.875rem', background: saving ? '#004e8a' : '#0095ff', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: saving ? 'none' : '0 2px 22px rgba(0,149,255,0.5)', transition: 'background 0.15s' }}
          onMouseOver={e => { if (!saving) e.currentTarget.style.background = '#007acc' }}
          onMouseOut={e => { if (!saving) e.currentTarget.style.background = '#0095ff' }}>
          {btnLabel}
        </button>

        <p style={{ fontSize: '0.71rem', color: '#2e2e2e', textAlign: 'center', marginTop: '1rem' }}>
          Answers are saved automatically as you progress through each phase.
        </p>
      </div>
    </main>
  )
}

// ─── Complete Screen ──────────────────────────────────────────────────────────

function CompleteScreen() {
  return (
    <main style={{ flex: 1, height: '100vh', background: '#191919', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', maxWidth: 500, padding: '2rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#ebebeb', margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>Questionnaire Complete</h1>
        <p style={{ color: '#5e5e5e', fontSize: '0.95rem', lineHeight: 1.65 }}>
          All your answers have been saved. Your full build plan is ready to generate.
        </p>
      </div>
    </main>
  )
}

// ─── App Shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [view, setView] = useState('intake')   // 'intake' | 'questionnaire' | 'complete'
  const [sessionId, setSessionId] = useState(null)
  const [rawIdea, setRawIdea] = useState('')
  const [completedSteps, setCompletedSteps] = useState([])
  const [activeStep, setActiveStep] = useState('problem')
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

  const handleIntakeSuccess = useCallback(({ sessionId: id, rawIdea: idea }) => {
    setSessionId(id)
    setRawIdea(idea)
    setCompletedSteps(prev => [...new Set([...prev, 'problem'])])
    setActiveStep('features')
    setToast(`session_id: ${id}`)
    setView('questionnaire')
  }, [])

  const handleStepComplete = useCallback((stepId) => {
    setCompletedSteps(prev => [...new Set([...prev, stepId])])
    const idx = STEPS.findIndex(s => s.id === stepId)
    const next = STEPS[idx + 1]
    if (next) setActiveStep(next.id)
  }, [])

  const handleAllComplete = useCallback(() => {
    setView('complete')
  }, [])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#191919', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#2a2a2a', fontSize: '0.85rem' }}>Loading...</div>
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif", background: '#191919' }}>
      <Sidebar activeStep={activeStep} completedSteps={completedSteps} userEmail={user.email} onLogout={handleLogout} />
      {view === 'intake' && <IntakeScreen onSuccess={handleIntakeSuccess} user={user} />}
      {view === 'questionnaire' && (
        <QuestionnaireScreen
          sessionId={sessionId}
          rawIdea={rawIdea}
          user={user}
          onStepComplete={handleStepComplete}
          onAllComplete={handleAllComplete}
        />
      )}
      {view === 'complete' && <CompleteScreen />}
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

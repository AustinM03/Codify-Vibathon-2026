import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from './supabaseClient'
import Dashboard from './views/Dashboard'
import LandingPage from './views/LandingPage'

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

// Friendly display names shown to the user — internal keys stay unchanged
const CATEGORY_DISPLAY = {
  Problem:      'Problem',
  Features:     'Features',
  Design:       'Design',
  Auth:         'User Accounts',
  Data:         'Information',
  Integrations: 'App Connections',
  Logic:        'Policies',
}
function displayName(cat) {
  return CATEGORY_DISPLAY[cat] ?? cat
}

// Normalize whatever Claude writes to the canonical STEPS label
const CATEGORY_NORM = {
  problem: 'Problem', 'problem statement': 'Problem', 'problem definition': 'Problem',
  features: 'Features', 'feature list': 'Features', 'key features': 'Features',
  design: 'Design', 'ui': 'Design', 'ux': 'Design', 'ui/ux': 'Design', 'look and feel': 'Design', 'style': 'Design',
  auth: 'Auth', authentication: 'Auth', 'user accounts': 'Auth', 'sign in': 'Auth', 'sign-in': 'Auth', 'login': 'Auth', 'access': 'Auth', 'user access': 'Auth',
  data: 'Data', 'data storage': 'Data', database: 'Data', 'data management': 'Data', 'information': 'Data', 'data model': 'Data',
  integrations: 'Integrations', integration: 'Integrations', 'third-party': 'Integrations', 'connected services': 'Integrations', 'external services': 'Integrations',
  logic: 'Logic', 'business logic': 'Logic', 'app rules': 'Logic', rules: 'Logic', workflows: 'Logic', 'app logic': 'Logic',
}
function normalizeCategory(name) {
  return CATEGORY_NORM[name?.toLowerCase()?.trim()] ?? name
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
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  const pwRules = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One number', ok: /[0-9]/.test(password) },
  ]
  const pwValid = pwRules.every(r => r.ok)
  const confirmMatch = confirm === password

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setInfo('')
    if (mode === 'signup') {
      if (!pwValid) { setError('Password does not meet the requirements.'); return }
      if (!confirmMatch) { setError('Passwords do not match.'); return }
    }
    setLoading(true)
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

  function switchMode() {
    setMode(m => m === 'signin' ? 'signup' : 'signin')
    setError(''); setInfo(''); setPassword(''); setConfirm('')
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
            style={{ ...inputStyle, marginBottom: mode === 'signup' ? '0.6rem' : '1.4rem' }}
            onFocus={e => (e.target.style.borderColor = '#0095ff')} onBlur={e => (e.target.style.borderColor = '#252525')} />

          {/* Password requirements — signup only */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {pwRules.map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: r.ok ? '#4ade80' : '#3a3a3a' }}>{r.ok ? '✓' : '○'}</span>
                  <span style={{ color: r.ok ? '#4ade80' : '#3a3a3a', transition: 'color 0.15s' }}>{r.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Confirm password — signup only */}
          {mode === 'signup' && (
            <>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: '#555', marginBottom: '0.4rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Confirm Password</label>
              <input type="password" required={mode === 'signup'} value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }} placeholder="••••••••"
                style={{ ...inputStyle, marginBottom: '0.4rem', borderColor: confirm.length > 0 ? (confirmMatch ? '#16a34a' : '#ef4444') : '#252525' }}
                onFocus={e => (e.target.style.borderColor = confirm.length > 0 ? (confirmMatch ? '#16a34a' : '#ef4444') : '#0095ff')}
                onBlur={e => (e.target.style.borderColor = confirm.length > 0 ? (confirmMatch ? '#16a34a' : '#ef4444') : '#252525')} />
              {confirm.length > 0 && (
                <div style={{ fontSize: '0.75rem', marginBottom: '1rem', color: confirmMatch ? '#4ade80' : '#f87171' }}>
                  {confirmMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </div>
              )}
              {confirm.length === 0 && <div style={{ marginBottom: '1rem' }} />}
            </>
          )}

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
          <button onClick={switchMode}
            style={{ background: 'none', border: 'none', color: '#0095ff', cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function StepRow({ step, isActive, isCompleted, onClick }) {
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.44rem 0.65rem', borderRadius: '6px', background: isActive ? 'rgba(0,149,255,0.1)' : 'transparent', marginBottom: '2px', cursor: 'pointer', userSelect: 'none', transition: 'background 0.12s' }}
      onMouseEnter={e => { e.currentTarget.style.background = isActive ? 'rgba(0,149,255,0.18)' : 'rgba(255,255,255,0.04)' }}
      onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(0,149,255,0.1)' : 'transparent' }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, background: isCompleted ? '#16a34a' : isActive ? '#0095ff' : 'transparent', border: isCompleted || isActive ? 'none' : '1.5px solid #2e2e2e', color: isCompleted || isActive ? '#fff' : '#3a3a3a', pointerEvents: 'none' }}>
        {isCompleted ? '✓' : step.phase}
      </div>
      <span style={{ fontSize: '0.845rem', color: isActive ? '#60c8ff' : isCompleted ? '#86efac' : '#3a3a3a', fontWeight: isActive ? 600 : 400, pointerEvents: 'none' }}>
        {displayName(step.label)}
      </span>
      {isActive && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#0095ff', flexShrink: 0, pointerEvents: 'none' }} />}
    </div>
  )
}

function Sidebar({ activeStep, completedSteps, userEmail, onLogout, onDashboard, onStepClick }) {
  const progress = (completedSteps.length / STEPS.length) * 100
  return (
    <aside style={{ width: 232, minWidth: 232, height: '100%', background: '#111', borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ padding: '0.6rem 0.7rem 0', borderBottom: '1px solid #171717' }}>
        <button onClick={onDashboard}
          style={{ width: '100%', background: 'none', border: 'none', borderRadius: '6px', color: '#3a3a3a', cursor: 'pointer', fontSize: '0.73rem', padding: '0.45rem 0.5rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.45rem', transition: 'color 0.15s, background 0.15s' }}
          onMouseOver={e => { e.currentTarget.style.color = '#00d4ff'; e.currentTarget.style.background = '#0095ff11' }}
          onMouseOut={e => { e.currentTarget.style.color = '#3a3a3a'; e.currentTarget.style.background = 'none' }}>
          <span>◀</span><span>My Projects</span>
        </button>
      </div>
      <div style={{ padding: '1.1rem 0.7rem 0.5rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.61rem', fontWeight: 700, letterSpacing: '0.1em', color: '#333', textTransform: 'uppercase', padding: '0 0.4rem', marginBottom: '0.6rem' }}>Build Phases</div>
        {STEPS.map(step => (
          <StepRow key={step.id} step={step} isActive={activeStep === step.id} isCompleted={completedSteps.includes(step.id)} onClick={() => onStepClick?.(step.id)} />
        ))}
      </div>
      <div style={{ padding: '0.9rem 1rem', borderTop: '1px solid #1a1a1a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
          <span style={{ fontSize: '0.67rem', color: '#333' }}>Progress</span>
          <span style={{ fontSize: '0.67rem', color: '#444' }}>{completedSteps.length} / 7</span>
        </div>
        <div style={{ height: 3, background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: 'linear-gradient(90deg, #0095ff, #00d4ff)', borderRadius: '2px', transition: 'width 0.4s ease' }} />
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
    <main style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#191919', display: 'flex', justifyContent: 'center' }}>
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

function QuestionnaireScreen({ sessionId, rawIdea, user, onStepComplete, onAllComplete, jumpRequest }) {
  const [questions, setQuestions] = useState([])   // [{category, question, suggestions}]
  const [apiLoading, setApiLoading] = useState(true)
  const [apiError, setApiError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const [activeCatName, setActiveCatName] = useState(null)  // name-based; null until questions load
  const [answers, setAnswers] = useState({})        // key: `${catIdx}-${qIdx}` → string
  const [saving, setSaving] = useState(false)
  const [explanations, setExplanations] = useState({})   // key: `${catIdx}-${qIdx}` → {loading, text}

  async function fetchExplanation(catIdx, qIdx, question, category) {
    const key = `${catIdx}-${qIdx}`
    setExplanations(prev => ({ ...prev, [key]: { loading: true, text: '' } }))
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, category }),
      })
      const json = await res.json()
      setExplanations(prev => ({ ...prev, [key]: { loading: false, text: json.explanation ?? json.error ?? 'Could not load explanation.' } }))
    } catch {
      setExplanations(prev => ({ ...prev, [key]: { loading: false, text: 'Could not load explanation right now.' } }))
    }
  }

  // Group questions by category order
  const categories = questions.reduce((acc, q) => {
    if (!acc.find(c => c.name === q.category)) acc.push({ name: q.category, questions: [] })
    acc.find(c => c.name === q.category).questions.push(q)
    return acc
  }, [])

  // Derive numeric index from name (for answer keys, render counters, etc.)
  const categoryIndex = categories.findIndex(c => c.name === activeCatName)
  const currentCategory = categoryIndex >= 0 ? categories[categoryIndex] : null
  // True when the user navigated to a step Claude chose to skip entirely
  const catSkipped = activeCatName !== null && categoryIndex < 0

  // Next category in canonical STEPS order, skipping any Claude omitted
  const stepLabels = STEPS.map(s => s.label)
  const curStepIdx = stepLabels.indexOf(activeCatName ?? '')
  const nextCatName = stepLabels.slice(curStepIdx + 1).find(l => categories.find(c => c.name === l)) ?? null
  const isLastCategory = !nextCatName

  // Pre-fill ALL saved answers once questions have loaded from the API
  useEffect(() => {
    if (questions.length === 0) return
    const cats = questions.reduce((acc, q) => {
      if (!acc.find(c => c.name === q.category)) acc.push({ name: q.category, questions: [] })
      acc.find(c => c.name === q.category).questions.push(q)
      return acc
    }, [])
    supabase
      .from('questionnaire_responses')
      .select('category, answer')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (!data?.length) return
        // Group answers by category in insertion order
        const byCat = {}
        data.forEach(row => {
          if (!byCat[row.category]) byCat[row.category] = []
          byCat[row.category].push(row.answer)
        })
        setAnswers(() => {
          const updated = {}
          Object.entries(byCat).forEach(([catName, savedAnswers]) => {
            const catIdx = cats.findIndex(c => c.name === catName)
            if (catIdx < 0) return
            savedAnswers.forEach((answer, qIdx) => {
              updated[`${catIdx}-${qIdx}`] = answer
            })
          })
          return updated
        })
      })
  }, [questions])

  // Set initial active category once questions arrive
  useEffect(() => {
    if (questions.length === 0) return
    // Honor a pending jumpRequest; otherwise default to first category
    setActiveCatName(jumpRequest?.category ?? categories[0]?.name ?? null)
  }, [questions])

  // React to sidebar step clicks — auto-save current category before navigating
  useEffect(() => {
    if (!jumpRequest?.category) return
    // If questions haven't loaded yet or no current category, just navigate (nothing to save)
    if (!currentCategory || questions.length === 0) {
      setActiveCatName(jumpRequest.category)
      return
    }
    ;(async () => {
      const rows = currentCategory.questions.map((q, qIdx) => ({
        session_id: sessionId,
        category: currentCategory.name,
        question: q.question,
        answer: answers[`${categoryIndex}-${qIdx}`]?.trim() || '',
      }))
      await supabase.from('questionnaire_responses').delete()
        .eq('session_id', sessionId).eq('category', currentCategory.name)
      const { error } = await supabase.from('questionnaire_responses').insert(rows)
      if (!error) {
        const hasAnyAnswer = rows.some(r => r.answer)
        if (hasAnyAnswer) {
          const stepId = CATEGORY_TO_STEP[currentCategory.name]
          if (stepId) onStepComplete(stepId, currentCategory.name, rows)
        }
      }
      setActiveCatName(jumpRequest.category)
    })()
  }, [jumpRequest])

  // If a category was skipped by Claude, silently advance instead of showing a dead-end screen
  // Guard with questions.length > 0 to avoid firing while the API is still loading
  useEffect(() => {
    if (!catSkipped || questions.length === 0) return
    if (nextCatName) setActiveCatName(nextCatName)
    else onAllComplete()
  }, [catSkipped, questions.length])

  useEffect(() => {
    async function fetchQuestions() {
      // Use cached questions if available (avoids re-generating on every re-open)
      if (retryCount === 0) {
        try {
          const cached = localStorage.getItem(`questions_${sessionId}`)
          if (cached) {
            const parsed = JSON.parse(cached)
            if (Array.isArray(parsed) && parsed.length > 0) {
              setQuestions(parsed)
              setApiLoading(false)
              return
            }
          }
        } catch { /* bad cache entry — fall through to API */ }
      }

      setApiLoading(true); setApiError('')
      try {
        // Fetch all previous answers for this session so Claude can build on them
        const { data: history } = await supabase
          .from('questionnaire_responses')
          .select('category, question, answer')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })

        const res = await fetch('/api/questionnaire', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            raw_idea: rawIdea,
            history: history ?? [],
          }),
        })
        const text = await res.text()
        let json
        try {
          json = JSON.parse(text)
        } catch {
          throw new Error(`API returned non-JSON (status ${res.status}). Is 'vercel dev' running on port 3000?`)
        }
        if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`)
        const normalized = json.questions.map(q => ({ ...q, category: normalizeCategory(q.category) }))
        localStorage.setItem(`questions_${sessionId}`, JSON.stringify(normalized))
        setQuestions(normalized)
      } catch (err) {
        setApiError(err.message)
      } finally {
        setApiLoading(false)
      }
    }
    fetchQuestions()
  }, [rawIdea, retryCount])

  function setAnswer(catIdx, qIdx, value) {
    setAnswers(prev => ({ ...prev, [`${catIdx}-${qIdx}`]: value }))
  }

  async function handleNext() {
    // Skipped category — just navigate forward, nothing to save
    if (catSkipped) {
      if (nextCatName) setActiveCatName(nextCatName)
      else onAllComplete()
      return
    }
    if (!currentCategory) return
    setSaving(true)

    const rows = currentCategory.questions.map((q, qIdx) => ({
      session_id: sessionId,
      category: currentCategory.name,
      question: q.question,
      answer: answers[`${categoryIndex}-${qIdx}`]?.trim() || '',
    }))

    // Delete existing rows first so re-edits don't create duplicates
    await supabase.from('questionnaire_responses').delete()
      .eq('session_id', sessionId).eq('category', currentCategory.name)
    const { error } = await supabase.from('questionnaire_responses').insert(rows)
    if (error) { console.error('Save error:', error) }

    const stepId = CATEGORY_TO_STEP[currentCategory.name]
    if (stepId) onStepComplete(stepId, currentCategory.name, rows)

    setSaving(false)

    if (isLastCategory) {
      onAllComplete()
    } else {
      setActiveCatName(nextCatName)
    }
  }

  const btnLabel = saving ? 'Saving...' : isLastCategory ? 'Complete Questionnaire ✓' : `Next: ${displayName(nextCatName ?? '')} →`

  if (apiLoading) {
    return (
      <main style={{ flex: 1, height: '100%', background: '#191919', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #1e1e1e', borderTopColor: '#0095ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#333', fontSize: '0.85rem' }}>Generating your adaptive questionnaire...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </main>
    )
  }

  if (apiError) {
    return (
      <main style={{ flex: 1, height: '100%', background: '#191919', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ color: '#f87171', marginBottom: '0.5rem', fontSize: '1.1rem' }}>⚠️</div>
          <p style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: '1rem' }}>{apiError}</p>
          <button onClick={() => setRetryCount(c => c + 1)}
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
    <main style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#191919', display: 'flex', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 700, padding: '3.5rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.71rem', color: '#555', background: '#161616', border: '1px solid #252525', borderRadius: '999px', padding: '0.25rem 0.8rem', letterSpacing: '0.02em' }}>
            <span>📋</span>
            <span>Phase {phaseNum} — {displayName(currentCategory.name)}</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#333' }}>{categoryIndex + 1} of {categories.length}</span>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#ebebeb', margin: '0 0 0.5rem', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
          {displayName(currentCategory.name)}
        </h1>
        <p style={{ color: '#5e5e5e', fontSize: '0.9rem', margin: '0 0 2rem', lineHeight: 1.65 }}>
          Answer these questions to help define the {displayName(currentCategory.name).toLowerCase()} requirements for your app.
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
          const explKey = `${categoryIndex}-${qIdx}`
          const expl = explanations[explKey]
          return (
            <div key={qIdx} style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#9ca3af', marginBottom: '0.5rem', lineHeight: 1.5 }}>
                {qIdx + 1}. {q.question}
              </label>

              {/* I'm not sure button + explanation */}
              {!expl ? (
                <button
                  onClick={() => fetchExplanation(categoryIndex, qIdx, q.question, currentCategory.name)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: '#444', fontSize: '0.73rem', cursor: 'pointer', padding: '0 0 0.65rem', transition: 'color 0.12s' }}
                  onMouseOver={e => (e.currentTarget.style.color = '#0095ff')}
                  onMouseOut={e => (e.currentTarget.style.color = '#444')}>
                  <span style={{ fontSize: '0.8rem' }}>💡</span> I&apos;m not sure what this means
                </button>
              ) : (
                <div style={{ background: '#0d1a2b', border: '1px solid #0e3a6e', borderRadius: '8px', padding: '0.8rem 1rem', marginBottom: '0.65rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>💡</span>
                  <div style={{ flex: 1 }}>
                    {expl.loading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3a7fc1', fontSize: '0.78rem' }}>
                        <div style={{ width: 12, height: 12, border: '2px solid #1e4a7a', borderTopColor: '#0095ff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0 }} />
                        Thinking of a good analogy...
                      </div>
                    ) : (
                      <>
                        <p style={{ color: '#93c5fd', fontSize: '0.8rem', lineHeight: 1.6, margin: '0 0 0.4rem' }}>{expl.text}</p>
                        <button onClick={() => setExplanations(prev => { const n = { ...prev }; delete n[explKey]; return n })} style={{ background: 'none', border: 'none', color: '#2a5a8a', fontSize: '0.68rem', cursor: 'pointer', padding: 0 }}>Dismiss</button>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Suggestion chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.65rem' }}>
                {q.suggestions?.map((chip, cIdx) => {
                  const selected = currentAnswer.split('\n').map(s => s.trim()).filter(Boolean)
                  const isSelected = selected.includes(chip)
                  return (
                    <button key={cIdx}
                      onClick={() => {
                        setAnswers(prev => {
                          const key = `${categoryIndex}-${qIdx}`
                          const curr = prev[key] ?? ''
                          const sel = curr.split('\n').map(s => s.trim()).filter(Boolean)
                          const already = sel.includes(chip)
                          const next = already ? sel.filter(s => s !== chip) : [...sel, chip]
                          return { ...prev, [key]: next.join('\n') }
                        })
                      }}
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

// ─── Blueprint Panel ────────────────────────────────────────────────────────────

const BLUEPRINT_META = {
  Problem:      { icon: '🎯', label: 'Problem Statement',  color: '#7c3aed' },
  Features:     { icon: '⚡', label: 'Feature List',        color: '#0095ff' },
  Design:       { icon: '🎨', label: 'Style Guide',         color: '#ec4899' },
  Auth:         { icon: '🔑', label: 'Access Rules',        color: '#f59e0b' },
  Data:         { icon: '🗄️', label: 'File Cabinet',        color: '#10b981' },
  Integrations: { icon: '🔌', label: 'Connected Services',  color: '#06b6d4' },
  Logic:        { icon: '⚙️', label: 'App Rules',           color: '#f97316' },
}

function BlueprintPanel({ blueprint }) {
  const entries = Object.entries(blueprint)
  return (
    <aside style={{
      width: 260, minWidth: 260, height: '100%', overflowY: 'auto',
      background: '#111', borderLeft: '1px solid #1a1a1a',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '1.4rem 1.1rem 0.8rem', borderBottom: '1px solid #1a1a1a' }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#333', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Live Blueprint</div>
        <div style={{ fontSize: '0.72rem', color: '#2e2e2e' }}>Your plan builds as you answer</div>
      </div>

      <div style={{ padding: '1rem 0.9rem', flex: 1 }}>
        {entries.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: '2.5rem' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.6rem', opacity: 0.3 }}>📐</div>
            <p style={{ fontSize: '0.72rem', color: '#2a2a2a', lineHeight: 1.6 }}>Your building blocks will appear here as you complete each section.</p>
          </div>
        )}
        {entries.map(([category, summary]) => {
          const meta = BLUEPRINT_META[category] ?? { icon: '📦', label: category, color: '#555' }
          return (
            <div key={category} style={{
              background: '#161616', border: `1px solid ${meta.color}22`,
              borderLeft: `3px solid ${meta.color}`,
              borderRadius: '8px', padding: '0.75rem 0.9rem',
              marginBottom: '0.65rem', animation: 'slideIn 0.25s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.95rem' }}>{meta.icon}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color, letterSpacing: '0.03em' }}>{meta.label}</span>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 0.5rem', listStyle: 'none' }}>
                {summary.map((line, i) => (
                  <li key={i} style={{ fontSize: '0.71rem', color: '#4a4a4a', lineHeight: 1.55, display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                    <span style={{ color: meta.color, opacity: 0.6, flexShrink: 0, marginTop: '0.1rem' }}>›</span>
                    <span style={{ color: '#555' }}>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {entries.length > 0 && (
        <div style={{ padding: '0.8rem 1rem', borderTop: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: '0.67rem', color: '#2a2a2a', textAlign: 'center' }}>{entries.length} of 7 blocks complete</div>
          <div style={{ height: 2, background: '#1e1e1e', borderRadius: '2px', marginTop: '0.4rem', overflow: 'hidden' }}>
            <div style={{ width: `${(entries.length / 7) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #0095ff, #00d4ff)', transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}
    </aside>
  )
}

// ─── Result Screen ────────────────────────────────────────────────────────────

function ResultScreen({ sessionId, rawIdea, onDashboard }) {
  // status: 'loading' | 'validating' | 'gaps' | 'generating' | 'done' | 'error'
  const [status, setStatus] = useState('loading')
  const [result, setResult] = useState(null)
  const [validation, setValidation] = useState(null)  // { ready, gaps[], contradictions[], summary }
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const answersRef = useRef(null)  // cache answers between validate and generate steps

  // Runs extract + generate using cached answers
  async function runGenerate() {
    try {
      setStatus('generating')
      const answers = answersRef.current

      // Extract structured signal from raw idea (Sonnet) — non-fatal
      let extracted = null
      try {
        const extRes = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_idea: rawIdea }),
        })
        if (extRes.ok) extracted = await extRes.json()
      } catch { /* non-fatal */ }

      // Generate full build artifact (Opus)
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_idea: rawIdea, extracted, answers }),
      })
      const json = await genRes.json()
      if (!genRes.ok) throw new Error(json.error ?? `Generation failed (${genRes.status})`)

      // Persist so we never regenerate
      await supabase.from('build_plans').upsert({
        session_id: sessionId,
        title: json.title,
        summary: json.summary,
        prompt: json.prompt,
        features: json.features,
        tech_stack: json.tech_stack,
        user_stories: json.user_stories,
      }, { onConflict: 'session_id' })

      setResult(json)
      setStatus('done')
    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  useEffect(() => {
    async function loadAndValidate() {
      try {
        // 1. Return cached plan immediately — skip validate
        const { data: existing } = await supabase
          .from('build_plans')
          .select('title, summary, prompt, features, tech_stack, user_stories')
          .eq('session_id', sessionId)
          .maybeSingle()

        if (existing) {
          setResult(existing)
          setStatus('done')
          return
        }

        // 2. Load answers
        setStatus('loading')
        const { data: rows } = await supabase
          .from('questionnaire_responses')
          .select('category, question, answer')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true })

        if (!rows?.length) throw new Error('No answers found for this session.')
        const answers = rows.map(r => ({ category: r.category, question: r.question, answer: r.answer }))
        answersRef.current = answers

        // 3. Validate with Opus
        setStatus('validating')
        const valRes = await fetch('/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        })
        const valJson = await valRes.json()

        if (!valRes.ok || valJson.error) {
          // Validate failed — skip to generate rather than blocking the user
          await runGenerate()
          return
        }

        setValidation(valJson)

        if (valJson.ready === false && (valJson.gaps?.length > 0 || valJson.contradictions?.length > 0)) {
          setStatus('gaps')
          return
        }

        // All good — generate
        await runGenerate()
      } catch (err) {
        setError(err.message)
        setStatus('error')
      }
    }
    loadAndValidate()
  }, [sessionId, rawIdea])

  function copyPrompt() {
    navigator.clipboard.writeText(result.prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const ff = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"

  const loadingMessages = {
    loading:    { title: 'Reviewing your answers...', sub: 'Loading your responses from the database' },
    validating: { title: 'Checking your plan for completeness...', sub: 'Claude is reviewing all 7 sections for gaps and contradictions' },
    generating: { title: 'Generating your build plan...', sub: 'Claude is synthesizing all your answers into a complete specification' },
  }

  if (['loading', 'validating', 'generating'].includes(status)) {
    const msg = loadingMessages[status]
    return (
      <main style={{ flex: 1, height: '100%', background: '#191919', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1.25rem', fontFamily: ff }}>
        <div style={{ width: 36, height: 36, border: '3px solid #1e1e1e', borderTopColor: '#0095ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#e2e2e2', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.35rem' }}>{msg.title}</p>
          <p style={{ color: '#333', fontSize: '0.78rem', margin: 0 }}>{msg.sub}</p>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </main>
    )
  }

  if (status === 'gaps') {
    return (
      <main style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#191919', display: 'flex', justifyContent: 'center', fontFamily: ff }}>
        <div style={{ width: '100%', maxWidth: 660, padding: '3.5rem 2.5rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Review needed</div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 700, color: '#ebebeb', margin: '0 0 0.6rem', letterSpacing: '-0.03em' }}>Almost there — a few things to review</h1>
          {validation?.summary && (
            <p style={{ color: '#6a6a6a', fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 2rem' }}>{validation.summary}</p>
          )}
          <div style={{ height: 1, background: '#1e1e1e', marginBottom: '1.75rem' }} />

          {validation?.gaps?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Missing or thin answers</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {validation.gaps.map((gap, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '8px', padding: '0.7rem 0.9rem' }}>
                    <span style={{ flexShrink: 0, fontSize: '0.9rem', marginTop: '1px' }}>⚠️</span>
                    <span style={{ color: '#d97706', fontSize: '0.83rem', lineHeight: 1.6 }}>{gap}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {validation?.contradictions?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#f87171', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Contradictions found</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {validation.contradictions.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '0.7rem 0.9rem' }}>
                    <span style={{ flexShrink: 0, color: '#f87171', fontWeight: 700, fontSize: '0.85rem', marginTop: '2px' }}>✗</span>
                    <span style={{ color: '#f87171', fontSize: '0.83rem', lineHeight: 1.6 }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
            <button onClick={onDashboard}
              style={{ flex: 1, padding: '0.85rem', background: 'transparent', color: '#9ca3af', border: '1px solid #2a2a2a', borderRadius: '9px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#e2e2e2' }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#9ca3af' }}>
              ← Go back and improve
            </button>
            <button onClick={runGenerate}
              style={{ flex: 1, padding: '0.85rem', background: '#0095ff', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 18px rgba(0,149,255,0.4)', transition: 'background 0.15s' }}
              onMouseOver={e => (e.currentTarget.style.background = '#007acc')}
              onMouseOut={e => (e.currentTarget.style.background = '#0095ff')}>
              Generate anyway →
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main style={{ flex: 1, height: '100%', background: '#191919', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff }}>
        <div style={{ textAlign: 'center', maxWidth: 440, padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠️</div>
          <p style={{ color: '#f87171', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>{error}</p>
          <button onClick={onDashboard}
            style={{ padding: '0.65rem 1.5rem', background: '#0095ff', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
            Back to Dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#191919', fontFamily: ff }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '3rem 2.5rem 4rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#22c55e', textTransform: 'uppercase', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '999px', padding: '0.2rem 0.7rem' }}>
            Build Plan Ready
          </div>
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, color: '#ebebeb', margin: '0 0 0.4rem', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
          {result.title}
        </h1>
        <p style={{ color: '#6a6a6a', fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 2.5rem', maxWidth: 620 }}>
          {result.summary}
        </p>

        <div style={{ height: 1, background: '#1e1e1e', marginBottom: '2.5rem' }} />

        {/* AI Coding Prompt — hero section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#555', textTransform: 'uppercase', marginBottom: '0.2rem' }}>AI Coding Prompt</div>
              <div style={{ fontSize: '0.75rem', color: '#333' }}>Paste this into Cursor, Copilot, or ChatGPT to start building</div>
            </div>
            <button onClick={copyPrompt}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', fontSize: '0.78rem', fontWeight: 600,
                background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(0,149,255,0.1)',
                color: copied ? '#4ade80' : '#0095ff',
                border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(0,149,255,0.25)'}`,
                borderRadius: '7px', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
              }}>
              <span>{copied ? '✓' : '⎘'}</span>
              <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
            </button>
          </div>
          <div style={{
            background: '#0d0d0d', border: '1px solid #222', borderRadius: '10px',
            padding: '1.5rem', fontFamily: "'Courier New', Courier, monospace",
            fontSize: '0.82rem', color: '#c9d1d9', lineHeight: 1.75,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            maxHeight: '420px', overflowY: 'auto',
          }}>
            {result.prompt}
          </div>
        </div>

        {/* Features + Tech Stack row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

          {/* Features */}
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '1.25rem 1.3rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#0095ff', textTransform: 'uppercase', marginBottom: '0.9rem' }}>Core Features</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {result.features.map((f, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ color: '#0095ff', flexShrink: 0, marginTop: '1px', fontSize: '0.75rem' }}>›</span>
                  <span style={{ color: '#9ca3af', fontSize: '0.82rem', lineHeight: 1.55 }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack */}
          <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '1.25rem 1.3rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#00d4ff', textTransform: 'uppercase', marginBottom: '0.9rem' }}>Recommended Tech Stack</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {result.tech_stack.map((t, i) => (
                <span key={i} style={{
                  fontSize: '0.75rem', color: '#60c8ff',
                  background: 'rgba(0,149,255,0.07)', border: '1px solid rgba(0,149,255,0.18)',
                  borderRadius: '999px', padding: '0.25rem 0.7rem',
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Build Traps */}
        {result.build_traps?.length > 0 && (
          <div style={{ background: '#111', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '10px', padding: '1.25rem 1.3rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#f59e0b', textTransform: 'uppercase', marginBottom: '0.9rem' }}>Watch Out — Build Traps</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {result.build_traps.map((trap, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', background: 'rgba(245,158,11,0.05)', borderRadius: '7px', padding: '0.6rem 0.75rem' }}>
                  <span style={{ flexShrink: 0, fontSize: '0.85rem' }}>⚠️</span>
                  <span style={{ color: '#d97706', fontSize: '0.82rem', lineHeight: 1.6 }}>{trap}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Build in Phases */}
        {result.phases && (
          <div style={{ background: '#111', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '1.25rem 1.3rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#22c55e', textTransform: 'uppercase', marginBottom: '0.9rem' }}>Suggested Build Order</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#4ade80', marginBottom: '0.5rem' }}>Phase 1 — Start here</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {result.phases.phase1.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
                      <span style={{ color: '#22c55e', flexShrink: 0, fontSize: '0.75rem', marginTop: '2px' }}>›</span>
                      <span style={{ color: '#86efac', fontSize: '0.8rem', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#555', marginBottom: '0.5rem' }}>Phase 2 — Add next</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {result.phases.phase2.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
                      <span style={{ color: '#333', flexShrink: 0, fontSize: '0.75rem', marginTop: '2px' }}>›</span>
                      <span style={{ color: '#444', fontSize: '0.8rem', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Stories */}
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '10px', padding: '1.25rem 1.3rem', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '0.9rem' }}>User Stories</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {result.user_stories.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#a78bfa', flexShrink: 0, fontSize: '0.75rem', marginTop: '2px' }}>›</span>
                <span style={{ color: '#9ca3af', fontSize: '0.82rem', lineHeight: 1.6 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={copyPrompt}
            style={{ padding: '0.8rem 1.75rem', background: copied ? '#16a34a' : '#0095ff', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 18px rgba(0,149,255,0.4)', transition: 'all 0.15s' }}>
            {copied ? '✓ Copied!' : '⎘ Copy Build Prompt'}
          </button>
          <button onClick={onDashboard}
            style={{ padding: '0.8rem 1.5rem', background: 'transparent', color: '#555', border: '1px solid #2a2a2a', borderRadius: '9px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#aaa' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#555' }}>
            Back to Projects
          </button>
        </div>

      </div>
    </main>
  )
}

// ─── App Shell ────────────────────────────────────────────────────────────────

export default function App() {
  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [showAuth, setShowAuth] = useState(false)
  const [view, setView] = useState('dashboard')   // 'dashboard' | 'intake' | 'questionnaire' | 'complete'
  const [sessionId, setSessionId] = useState(null)
  const [rawIdea, setRawIdea] = useState('')
  const [completedSteps, setCompletedSteps] = useState([])
  const [activeStep, setActiveStep] = useState('problem')
  const [toast, setToast] = useState(null)
  const [blueprint, setBlueprint] = useState({})  // category → string[]
  const [jumpRequest, setJumpRequest] = useState({ category: null, nonce: 0 })

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
    setCompletedSteps([])
    setActiveStep('problem')
    setToast(`session_id: ${id}`)
    setView('questionnaire')
  }, [])

  const handleStepComplete = useCallback((stepId, categoryName, categoryAnswers) => {
    setCompletedSteps(prev => [...new Set([...prev, stepId])])
    const idx = STEPS.findIndex(s => s.id === stepId)
    const next = STEPS[idx + 1]
    if (next) setActiveStep(next.id)
    // Build blueprint summary lines from the answers for this category
    const lines = categoryAnswers
      .filter(a => a.answer?.trim())
      .map(a => a.answer.trim().slice(0, 60) + (a.answer.trim().length > 60 ? '…' : ''))
    if (lines.length > 0) {
      setBlueprint(prev => ({ ...prev, [categoryName]: lines }))
    }
  }, [])

  const handleAllComplete = useCallback(() => {
    setView('result')
  }, [])

  const handleNewProject = useCallback(() => {
    setSessionId(null)
    setRawIdea('')
    setCompletedSteps([])
    setActiveStep('problem')
    setBlueprint({})
    setJumpRequest({ category: null, nonce: 0 })
    setView('intake')
  }, [])

  const handleOpenSession = useCallback(async (id, idea) => {
    // Fetch existing responses to determine how far this session has progressed
    const { data: responses } = await supabase
      .from('questionnaire_responses')
      .select('category')
      .eq('session_id', id)

    const answeredCats = new Set(responses?.map(r => r.category) ?? [])
    const categoryOrder = STEPS.map(s => s.label) // ['Problem','Features',...]
    const isComplete = categoryOrder.every(c => answeredCats.has(c))
    const nextCat = isComplete ? null : (categoryOrder.find(c => !answeredCats.has(c)) ?? null)
    const completedStepIds = categoryOrder
      .filter(c => answeredCats.has(c))
      .map(c => CATEGORY_TO_STEP[c])

    setSessionId(id)
    setRawIdea(idea)
    setCompletedSteps(completedStepIds)
    setActiveStep(nextCat ? CATEGORY_TO_STEP[nextCat] : STEPS[0].id)
    setBlueprint({})

    if (isComplete) {
      // All questions answered — go straight to the result/build-plan screen
      setView('result')
    } else {
      setJumpRequest({ category: nextCat, nonce: Date.now() })
      setView('questionnaire')
    }
  }, [])

  const handleGoToDashboard = useCallback(() => {
    setView('dashboard')
  }, [])

  const handleStepClick = useCallback((stepId) => {
    const step = STEPS.find(s => s.id === stepId)
    if (!step) return
    setJumpRequest({ category: step.label, nonce: Math.random() })
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

  if (!user) {
    if (showAuth) return <LoginScreen />
    return <LandingPage onGetStarted={() => setShowAuth(true)} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif", background: '#191919' }}>
      <header style={{ flexShrink: 0, height: 52, background: '#111', borderBottom: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem' }}>
        <button onClick={handleGoToDashboard}
          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.3rem 0.5rem', borderRadius: '7px', transition: 'background 0.15s' }}
          onMouseOver={e => (e.currentTarget.style.background = '#0095ff11')}
          onMouseOut={e => (e.currentTarget.style.background = 'none')}>
          <div style={{ width: 28, height: 28, background: 'linear-gradient(135deg, #0095ff, #00d4ff)', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>🚀</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ color: '#e2e2e2', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>PromptReady</div>
            <div style={{ color: '#3d3d3d', fontSize: '0.62rem' }}>AI App Builder</div>
          </div>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.72rem', color: '#3a3a3a', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.email}>{user.email}</span>
          <button onClick={handleLogout}
            style={{ background: 'none', border: '1px solid #2a2a2a', borderRadius: '5px', color: '#3a3a3a', cursor: 'pointer', fontSize: '0.65rem', padding: '0.25rem 0.55rem', transition: 'all 0.15s' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = '#ef4444'; e.currentTarget.style.color = '#f87171' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#3a3a3a' }}>
            Sign out
          </button>
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        {view === 'dashboard' && <Dashboard user={user} onOpenSession={handleOpenSession} onNewProject={handleNewProject} />}
        {view === 'intake' && <IntakeScreen onSuccess={handleIntakeSuccess} user={user} />}
        {view === 'questionnaire' && (
          <>
            <Sidebar activeStep={activeStep} completedSteps={completedSteps} userEmail={user.email} onLogout={handleLogout} onDashboard={handleGoToDashboard} onStepClick={handleStepClick} />
            <QuestionnaireScreen
              key={sessionId}
              sessionId={sessionId}
              rawIdea={rawIdea}
              user={user}
              onStepComplete={handleStepComplete}
              onAllComplete={handleAllComplete}
              jumpRequest={jumpRequest}
            />
          </>
        )}
        {view === 'result' && <ResultScreen sessionId={sessionId} rawIdea={rawIdea} onDashboard={handleGoToDashboard} />}
      </div>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
    </div>
  )
}

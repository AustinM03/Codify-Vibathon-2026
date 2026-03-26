import { useState, useEffect, useCallback, useRef } from 'react'
import PrismLoader from './components/PrismLoader'
import { supabase } from './supabaseClient'
import Dashboard from './views/Dashboard'
import ShaderBackground from './components/ShaderBackground'
import LandingPage from './views/LandingPage'
import OllamaSetup from './views/OllamaSetup'
import AIGeneratedInput from './components/AIGeneratedInput.jsx'
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

// ─── Design tokens ────────────────────────────────────────────────────────────

const T = {
  ff: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  bg: '#050505',
  card: 'rgba(15,15,20,0.7)',
  cardBorder: 'rgba(255,255,255,0.06)',
  cardShadow: '0 8px 32px rgba(0,0,0,0.4)',
  blur: 'blur(20px)',
  accent: '#7c5bf0',
  accentHover: '#6d28d9',
  accent2: '#5eead4',
  gradient: 'linear-gradient(135deg, #7c5bf0, #5eead4)',
  gradientBtn: 'linear-gradient(135deg, #7c5bf0, #6d28d9)',
  text: '#f0eef5',
  textSub: '#6b6680',
  textMuted: '#4a4458',
  success: '#34d399',
  successBg: 'rgba(52,211,153,0.08)',
  warn: '#fbbf24',
  warnBg: 'rgba(251,191,36,0.06)',
  error: '#f87171',
  errorBg: 'rgba(248,113,113,0.06)',
  inputBg: 'rgba(10,10,15,0.8)',
  inputBorder: 'rgba(255,255,255,0.08)',
  focusBorder: 'rgba(124,91,240,0.4)',
  focusGlow: '0 0 20px rgba(124,91,240,0.15)',
  hoverGlow: '0 0 60px rgba(124,91,240,0.08)',
  divider: 'rgba(255,255,255,0.04)',
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
      background: 'rgba(10,25,20,0.85)', backdropFilter: T.blur, WebkitBackdropFilter: T.blur,
      border: `1px solid rgba(52,211,153,0.3)`, borderRadius: '12px',
      padding: '0.9rem 1.25rem', color: T.success, fontSize: '0.875rem',
      zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'flex-start', gap: '0.65rem',
      maxWidth: '340px', animation: 'slideIn 0.2s ease',
    }}>
      <span style={{ fontSize: '1.1rem', marginTop: '1px' }}>✓</span>
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
    width: '100%', background: T.inputBg, border: `1.5px solid ${T.inputBorder}`,
    borderRadius: '10px', color: T.text, padding: '0.75rem 0.9rem',
    fontSize: '0.9rem', fontFamily: 'inherit', outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s', display: 'block',
  }

  function switchMode() {
    setMode(m => m === 'signin' ? 'signup' : 'signin')
    setError(''); setInfo(''); setPassword(''); setConfirm('')
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: T.ff,
    }}>
      <div className="glass-card" style={{
        width: '100%', maxWidth: 420, padding: '2.5rem',
        animation: 'fadeIn 0.4s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '2rem' }}>
          <div style={{ width: 32, height: 32, background: T.gradient, borderRadius: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', color: '#fff', fontWeight: 700 }}>P</div>
          <div style={{ color: T.text, fontWeight: 700, fontSize: '0.95rem' }}>PromptReady</div>
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: T.text, margin: '0 0 0.4rem', letterSpacing: '-0.02em' }}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p style={{ color: T.textSub, fontSize: '0.85rem', margin: '0 0 1.75rem' }}>
          {mode === 'signin' ? 'Sign in to continue building.' : 'Get started with PromptReady AI.'}
        </p>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: T.textSub, marginBottom: '0.4rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Email</label>
          <input type="email" required value={email} onChange={e => { setEmail(e.target.value); setError('') }} placeholder="you@example.com"
            style={{ ...inputStyle, marginBottom: '1rem' }}
            onFocus={e => { e.target.style.borderColor = T.focusBorder; e.target.style.boxShadow = T.focusGlow }}
            onBlur={e => { e.target.style.borderColor = T.inputBorder; e.target.style.boxShadow = 'none' }} />

          <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: T.textSub, marginBottom: '0.4rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Password</label>
          <input type="password" required value={password} onChange={e => { setPassword(e.target.value); setError('') }} placeholder="••••••••"
            style={{ ...inputStyle, marginBottom: mode === 'signup' ? '0.6rem' : '1.4rem' }}
            onFocus={e => { e.target.style.borderColor = T.focusBorder; e.target.style.boxShadow = T.focusGlow }}
            onBlur={e => { e.target.style.borderColor = T.inputBorder; e.target.style.boxShadow = 'none' }} />

          {/* Password requirements — signup only */}
          {mode === 'signup' && (
            <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              {pwRules.map(r => (
                <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.75rem' }}>
                  <span style={{ fontSize: '0.7rem', color: r.ok ? T.success : T.textMuted }}>{r.ok ? '✓' : '○'}</span>
                  <span style={{ color: r.ok ? T.success : T.textMuted, transition: 'color 0.15s' }}>{r.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* Confirm password — signup only */}
          {mode === 'signup' && (
            <>
              <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 600, color: T.textSub, marginBottom: '0.4rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Confirm Password</label>
              <input type="password" required={mode === 'signup'} value={confirm} onChange={e => { setConfirm(e.target.value); setError('') }} placeholder="••••••••"
                style={{ ...inputStyle, marginBottom: '0.4rem', borderColor: confirm.length > 0 ? (confirmMatch ? T.success : T.error) : T.inputBorder }}
                onFocus={e => { e.target.style.borderColor = confirm.length > 0 ? (confirmMatch ? T.success : T.error) : T.focusBorder; e.target.style.boxShadow = T.focusGlow }}
                onBlur={e => { e.target.style.borderColor = confirm.length > 0 ? (confirmMatch ? T.success : T.error) : T.inputBorder; e.target.style.boxShadow = 'none' }} />
              {confirm.length > 0 && (
                <div style={{ fontSize: '0.75rem', marginBottom: '1rem', color: confirmMatch ? T.success : T.error }}>
                  {confirmMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                </div>
              )}
              {confirm.length === 0 && <div style={{ marginBottom: '1rem' }} />}
            </>
          )}

          {error && <div style={{ background: T.errorBg, border: `1px solid rgba(248,113,113,0.2)`, borderRadius: '9px', padding: '0.6rem 0.85rem', color: T.error, fontSize: '0.8rem', marginBottom: '1rem', backdropFilter: T.blur }}>{error}</div>}
          {info && <div style={{ background: T.successBg, border: `1px solid rgba(52,211,153,0.2)`, borderRadius: '9px', padding: '0.6rem 0.85rem', color: T.success, fontSize: '0.8rem', marginBottom: '1rem', backdropFilter: T.blur }}>{info}</div>}
          <button className="btn-primary" type="submit" disabled={loading} style={{ width: '100%', padding: '0.8rem', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In →' : 'Create Account →'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.8rem', color: T.textMuted }}>
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={switchMode}
            style={{ background: 'none', border: 'none', color: T.accent, cursor: 'pointer', fontSize: '0.8rem', padding: 0 }}>
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function StepRow({ step, isActive, isCompleted, onClick, categoryHealth }) {
  // Map step.label (e.g. 'Auth') to health info
  const health = categoryHealth?.[step.label];
  let borderColor = isActive ? T.accent : 'transparent';
  let bgColor = isActive ? 'rgba(124,91,240,0.1)' : 'transparent';
  let icon = isCompleted ? '✓' : step.phase;
  let iconBg = isCompleted ? T.success : isActive ? T.accent : 'transparent';
  let iconColor = isCompleted || isActive ? '#fff' : T.textMuted;
  let iconBorder = isCompleted || isActive ? 'none' : `1.5px solid ${T.textMuted}`;
  let textColor = isActive ? '#b4a0f4' : isCompleted ? T.success : T.textMuted;
  let messageColor = T.textMuted;
  if (health) {
    if (health.status === 'green') {
      borderColor = T.success;
      iconBg = T.success;
      icon = '✓';
      iconColor = '#fff';
      textColor = T.success;
    } else if (health.status === 'yellow') {
      borderColor = T.warn;
      iconBg = 'rgba(251,191,36,0.7)';
      icon = '⚠️';
      iconColor = '#fff';
      textColor = T.warn;
      messageColor = T.warn;
    } else if (health.status === 'red') {
      borderColor = T.error;
      iconBg = 'rgba(248,113,113,0.7)';
      icon = '❌';
      iconColor = '#fff';
      textColor = T.error;
      messageColor = T.error;
    }
  }
  return (
    <div onClick={onClick} style={{
      display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 0,
      padding: '0.44rem 0.65rem', borderRadius: '8px', background: bgColor, marginBottom: '2px', cursor: 'pointer', userSelect: 'none', transition: 'background 0.15s', border: `1.5px solid ${borderColor}`
    }}
      onMouseEnter={e => { e.currentTarget.style.background = isActive ? 'rgba(124,91,240,0.18)' : 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(124,91,240,0.1)' : 'transparent' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, background: iconBg, border: iconBorder, color: iconColor, pointerEvents: 'none', boxShadow: isActive ? '0 0 12px rgba(124,91,240,0.3)' : 'none', transition: 'all 0.2s' }}>
          {icon}
        </div>
        <span style={{ fontSize: '0.845rem', color: textColor, fontWeight: isActive ? 600 : 400, pointerEvents: 'none' }}>
          {displayName(step.label)}
        </span>
        {isActive && <div style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: T.accent, flexShrink: 0, pointerEvents: 'none' }} />}
      </div>
      {/* Message below if yellow or red */}
      {health && (health.status === 'yellow' || health.status === 'red') && health.message && (
        <div style={{ fontSize: '0.72rem', color: messageColor, marginLeft: 28, marginTop: 2, marginBottom: 2, lineHeight: 1.4, whiteSpace: 'pre-line' }}>{health.message}</div>
      )}
    </div>
  )
}

function Sidebar({ activeStep, completedSteps, userEmail, onLogout, onDashboard, onStepClick, categoryHealth = {} }) {
  const progress = (completedSteps.length / STEPS.length) * 100
  return (
    <aside style={{ width: 232, minWidth: 232, height: '100%', background: 'rgba(8,8,12,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRight: `1px solid ${T.divider}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Removed 'My Projects' button as requested */}
      <div style={{ padding: '1.1rem 0.7rem 0.5rem', flex: 1, overflowY: 'auto' }}>
        <div style={{ fontSize: '0.61rem', fontWeight: 700, letterSpacing: '0.1em', color: T.textMuted, textTransform: 'uppercase', padding: '0 0.4rem', marginBottom: '0.6rem' }}>Build Phases</div>
        {STEPS.map(step => (
          <StepRow key={step.id} step={step} isActive={activeStep === step.id} isCompleted={completedSteps.includes(step.id)} onClick={() => onStepClick?.(step.id)} categoryHealth={categoryHealth} />
        ))}
      </div>
      <div style={{ padding: '0.9rem 1rem', borderTop: `1px solid ${T.divider}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
          <span style={{ fontSize: '0.67rem', color: T.textMuted }}>Progress</span>
          <span style={{ fontSize: '0.67rem', color: T.textSub }}>{completedSteps.length} / 7</span>
        </div>
        <div style={{ height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: `${progress}%`, height: '100%', background: T.gradient, borderRadius: '2px', transition: 'width 0.4s ease' }} />
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

  const borderColor = error ? T.error : focused ? T.focusBorder : T.inputBorder

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
    <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 700,
          minHeight: 'fit-content',
          display: 'flex',
          flexDirection: 'column',
          padding: '3.5rem 2.5rem 3.5rem', // extra bottom padding
          animation: 'fadeIn 0.4s ease',
          margin: '1.5rem auto',
          zIndex: 10,
          background: 'rgba(15,15,20,0.36)',
          border: '1.5px solid rgba(124,91,240,0.18)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >
        <h1 style={{ fontSize: '2.1rem', fontWeight: 700, color: T.text, margin: '0 0 0.55rem', letterSpacing: '-0.03em', lineHeight: 1.2 }}>Project Initialization</h1>
        <p style={{ color: T.textSub, fontSize: '0.95rem', margin: '0 0 2rem', lineHeight: 1.65 }}>Describe your vision. We'll break it down into a complete build plan across all 7 phases.</p>
        <div style={{ height: '1px', background: T.divider, marginBottom: '2rem' }} />
        <label style={{ display: 'block', fontSize: '0.71rem', fontWeight: 600, color: T.textSub, marginBottom: '0.55rem', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Your App Idea</label>
        <AIGeneratedInput
          value={idea}
          onChange={e => { setIdea(e.target.value); if (error) setError('') }}
          placeholder="Describe your app idea in as much detail as possible..."
          rows={9}
          style={{ marginBottom: '0.5rem' }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.45rem', marginBottom: '1.5rem', minHeight: '1.1rem' }}>
          {error ? <span style={{ fontSize: '0.78rem', color: T.error }}>{error}</span> : <span />}
          <span style={{ fontSize: '0.71rem', color: T.textMuted, marginLeft: 'auto' }}>{idea.length} chars</span>
        </div>
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}
          style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '0.015em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
          {loading ? 'Saving...' : 'Start Building →'}
        </button>
        <p style={{ fontSize: '0.71rem', color: T.textMuted, textAlign: 'center', marginTop: '1rem', lineHeight: 1.6 }}>Your idea will be saved and analyzed to generate a complete build plan across all 7 phases.</p>
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
        // Answers changed — invalidate the validation cache
        await supabase.from('validation_cache').delete().eq('session_id', sessionId)
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
      if (nextCatName) {
        setActiveCatName(nextCatName)
        setTimeout(() => {
          const main = document.querySelector('main');
          if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
          else window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 0)
      } else onAllComplete()
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
    // Answers changed — invalidate the validation cache so it re-runs next time
    await supabase.from('validation_cache').delete().eq('session_id', sessionId)

    const stepId = CATEGORY_TO_STEP[currentCategory.name]
    if (stepId) onStepComplete(stepId, currentCategory.name, rows)

    setSaving(false)

    if (isLastCategory) {
      onAllComplete()
    } else {
      setActiveCatName(nextCatName)
      setTimeout(() => {
        const main = document.querySelector('main');
        if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
        else window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 0)
    }
  }

  const btnLabel = saving ? 'Saving...' : isLastCategory ? 'Complete Questionnaire ✓' : `Next: ${displayName(nextCatName ?? '')} →`

  if (apiLoading) {
    return (
      <main className="flex flex-col items-center justify-center w-full h-full min-h-screen" style={{ flex: 1 }}>
        <PrismLoader text="Generating your adaptive questionnaire..." />
      </main>
    )
  }

  if (apiError) {
    return (
      <main style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ color: T.error, marginBottom: '0.5rem', fontSize: '1.1rem' }}>⚠</div>
          <p style={{ color: T.error, fontSize: '0.9rem', marginBottom: '1rem' }}>{apiError}</p>
          <button className="btn-primary" onClick={() => setRetryCount(c => c + 1)}
            style={{ padding: '0.6rem 1.25rem', borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem' }}>
            Try Again
          </button>
        </div>
      </main>
    )
  }

  if (!currentCategory) return null

  const phaseNum = STEPS.findIndex(s => s.id === CATEGORY_TO_STEP[currentCategory.name]) + 1

  return (
    <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', justifyContent: 'center' }}>
      <div
        className="glass-card"
        style={{
          width: '100%',
          maxWidth: 700,
          minHeight: 'fit-content',
          display: 'flex',
          flexDirection: 'column',
          padding: '3.5rem 2.5rem 3.5rem', // extra bottom padding
          animation: 'fadeIn 0.3s ease',
          margin: '1.5rem auto',
          zIndex: 10,
          background: 'rgba(15,15,20,0.36)',
          border: '1.5px solid rgba(124,91,240,0.18)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
        }}
      >

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.71rem', color: T.textSub, background: T.card, backdropFilter: T.blur, border: `1px solid ${T.cardBorder}`, borderRadius: '999px', padding: '0.25rem 0.8rem', letterSpacing: '0.02em' }}>
            <span>Phase {phaseNum}</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: T.textMuted }}>{categoryIndex + 1} of {categories.length}</span>
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: T.text, margin: '0 0 0.5rem', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
          {displayName(currentCategory.name)}
        </h1>
        <p style={{ color: T.textSub, fontSize: '0.9rem', margin: '0 0 2rem', lineHeight: 1.65 }}>
          Answer these questions to help define the {displayName(currentCategory.name).toLowerCase()} requirements for your app.
        </p>

        <div style={{ height: '1px', background: T.divider, marginBottom: '2rem' }} />

        {/* Category progress bar */}
        <div style={{ height: 2, background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden', marginBottom: '2rem' }}>
          <div style={{ width: `${((categoryIndex + 1) / categories.length) * 100}%`, height: '100%', background: T.gradient, transition: 'width 0.4s ease' }} />
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
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', color: T.textMuted, fontSize: '0.73rem', cursor: 'pointer', padding: '0 0 0.65rem', transition: 'color 0.12s' }}
                  onMouseOver={e => (e.currentTarget.style.color = T.accent)}
                  onMouseOut={e => (e.currentTarget.style.color = T.textMuted)}>
                  <span style={{ fontSize: '0.8rem' }}>💡</span> I&apos;m not sure what this means
                </button>
              ) : (
                <div style={{ background: 'rgba(124,91,240,0.06)', border: `1px solid rgba(124,91,240,0.15)`, borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '0.65rem', display: 'flex', gap: '0.65rem', alignItems: 'flex-start', backdropFilter: T.blur }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>💡</span>
                  <div style={{ flex: 1 }}>
                    {expl.loading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#b4a0f4', fontSize: '0.78rem' }}>
                        <span style={{ width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <PrismLoader text="" />
                        </span>
                        Thinking of a good analogy...
                      </div>
                    ) : (
                      <>
                        <p style={{ color: '#c4b5fd', fontSize: '0.8rem', lineHeight: 1.6, margin: '0 0 0.4rem' }}>{expl.text}</p>
                        <button onClick={() => setExplanations(prev => { const n = { ...prev }; delete n[explKey]; return n })} style={{ background: 'none', border: 'none', color: T.textMuted, fontSize: '0.68rem', cursor: 'pointer', padding: 0 }}>Dismiss</button>
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
                        border: `1px solid ${isSelected ? 'rgba(124,91,240,0.4)' : T.cardBorder}`,
                        background: isSelected ? 'rgba(124,91,240,0.12)' : 'rgba(15,15,20,0.5)',
                        color: isSelected ? '#c4b5fd' : T.textSub,
                        transition: 'all 0.15s',
                        backdropFilter: 'blur(8px)',
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
                  width: '100%', background: T.inputBg, border: `1.5px solid ${T.inputBorder}`,
                  borderRadius: '10px', color: T.text, padding: '0.8rem 1rem',
                  fontSize: '0.875rem', fontFamily: 'inherit', resize: 'vertical',
                  outline: 'none', lineHeight: 1.6, display: 'block', transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
                onFocus={e => { e.target.style.borderColor = T.focusBorder; e.target.style.boxShadow = T.focusGlow }}
                onBlur={e => { e.target.style.borderColor = T.inputBorder; e.target.style.boxShadow = 'none' }}
              />
            </div>
          )
        })}

        {/* Nav */}
        <button className="btn-primary" onClick={handleNext} disabled={saving}
          style={{ width: '100%', padding: '0.875rem', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          {btnLabel}
        </button>

        <p style={{ fontSize: '0.71rem', color: T.textMuted, textAlign: 'center', marginTop: '1rem' }}>
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
      background: 'rgba(8,8,12,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderLeft: `1px solid ${T.divider}`,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '1.4rem 1.1rem 0.8rem', borderBottom: `1px solid ${T.divider}` }}>
        <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: T.textMuted, textTransform: 'uppercase', marginBottom: '0.2rem' }}>Live Blueprint</div>
        <div style={{ fontSize: '0.72rem', color: T.textMuted }}>Your plan builds as you answer</div>
      </div>

      <div style={{ padding: '1rem 0.9rem', flex: 1 }}>
        {entries.length === 0 && (
          <div style={{ textAlign: 'center', paddingTop: '2.5rem' }}>
            <div style={{ fontSize: '1.6rem', marginBottom: '0.6rem', opacity: 0.3 }}>📐</div>
            <p style={{ fontSize: '0.72rem', color: T.textMuted, lineHeight: 1.6 }}>Your building blocks will appear here as you complete each section.</p>
          </div>
        )}
        {entries.map(([category, summary]) => {
          const meta = BLUEPRINT_META[category] ?? { icon: '📦', label: category, color: T.textSub }
          return (
            <div key={category} style={{
              background: T.card, backdropFilter: T.blur,
              border: `1px solid ${meta.color}22`,
              borderLeft: `3px solid ${meta.color}`,
              borderRadius: '10px', padding: '0.75rem 0.9rem',
              marginBottom: '0.65rem', animation: 'slideIn 0.25s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.95rem' }}>{meta.icon}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: meta.color, letterSpacing: '0.03em' }}>{meta.label}</span>
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 0.5rem', listStyle: 'none' }}>
                {summary.map((line, i) => (
                  <li key={i} style={{ fontSize: '0.71rem', color: T.textSub, lineHeight: 1.55, display: 'flex', gap: '0.35rem', alignItems: 'flex-start' }}>
                    <span style={{ color: meta.color, opacity: 0.6, flexShrink: 0, marginTop: '0.1rem' }}>›</span>
                    <span style={{ color: T.textSub }}>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>

      {entries.length > 0 && (
        <div style={{ padding: '0.8rem 1rem', borderTop: `1px solid ${T.divider}` }}>
          <div style={{ fontSize: '0.67rem', color: T.textMuted, textAlign: 'center' }}>{entries.length} of 7 blocks complete</div>
          <div style={{ height: 2, background: 'rgba(255,255,255,0.04)', borderRadius: '2px', marginTop: '0.4rem', overflow: 'hidden' }}>
            <div style={{ width: `${(entries.length / 7) * 100}%`, height: '100%', background: T.gradient, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      )}
    </aside>
  )
}

// ─── Result Screen ────────────────────────────────────────────────────────────

// Stable hash of answers array — used to detect when answers change
function hashAnswers(answers) {
  const sorted = [...answers].sort((a, b) =>
    `${a.category}${a.question}`.localeCompare(`${b.category}${b.question}`)
  )
  return JSON.stringify(sorted)
}

function ResultScreen({ sessionId, rawIdea, onDashboard, onEdit, devMode }) {
  // status: 'loading' | 'validating' | 'gaps' | 'generating' | 'done' | 'error'
  const [status, setStatus] = useState('loading')
  const [result, setResult] = useState(null)
  const [validation, setValidation] = useState(null)  // { ready, gaps[], contradictions[], summary }
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const answersRef = useRef(null)  // cache answers between validate and generate steps

  // Build & Deploy state
  const [buildJobId, setBuildJobId] = useState(null)
  const [buildStatus, setBuildStatus] = useState(null)
  const [buildProgress, setBuildProgress] = useState(0)
  const [buildTotal, setBuildTotal] = useState(0)
  const [deployUrl, setDeployUrl] = useState(null)
  const [buildError, setBuildError] = useState(null)

  // Runs extract + generate using cached answers (Inngest background job)
  async function runGenerate() {
    try {
      setStatus('generating')
      const answers = answersRef.current

      // Extract structured signal from raw idea — non-fatal
      let extracted = null
      try {
        const extRes = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ raw_idea: rawIdea }),
        })
        if (extRes.ok) extracted = await extRes.json()
      } catch { /* non-fatal */ }

      // Dispatch to Inngest — returns immediately with job_id
      const genRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_idea: rawIdea, extracted, answers, session_id: sessionId }),
      })
      const genText = await genRes.text()
      let genJson
      try { genJson = JSON.parse(genText) } catch {
        throw new Error(`Generation failed (${genRes.status}): ${genText.slice(0, 200)}`)
      }
      if (!genRes.ok) throw new Error(genJson.error ?? `Generation failed (${genRes.status})`)

      const { job_id } = genJson

      // Poll jobs table until done or error (3 min timeout)
      await new Promise((resolve, reject) => {
        const interval = setInterval(async () => {
          try {
            const { data: job } = await supabase
              .from('jobs')
              .select('status, error')
              .eq('id', job_id)
              .maybeSingle()
            if (!job) return
            if (job.status === 'Done!') { clearInterval(interval); resolve() }
            else if (job.status === 'Error' || job.error) { clearInterval(interval); reject(new Error(job.error ?? 'Generation failed')) }
          } catch { /* retry next tick */ }
        }, 2000)
        setTimeout(() => { clearInterval(interval); reject(new Error('Generation timed out — please try again')) }, 3 * 60 * 1000)
      })

      // Read result from build_plans (saved by Inngest worker)
      const { data: plan } = await supabase
        .from('build_plans')
        .select('title, summary, prompt, features, tech_stack, user_stories')
        .eq('session_id', sessionId)
        .maybeSingle()

      if (!plan) throw new Error('Plan not found after generation')

      setResult(plan)
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

        // 3. Compute a stable SHA-256 hash of the answers to use as a cache key
        const answersHash = await (async () => {
          const canonical = JSON.stringify(
            [...answers].sort((a, b) => (a.category + a.question).localeCompare(b.category + b.question))
          )
          const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical))
          return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
        })()

        // 4. Check validation_cache — skip Claude if hash matches (answers unchanged)
        const { data: cached } = await supabase
          .from('validation_cache')
          .select('ready, category_health, summary, answers_hash')
          .eq('session_id', sessionId)
          .maybeSingle()

        let valJson
        if (cached && cached.answers_hash === answersHash) {
          valJson = {
            ready: cached.ready,
            category_health: cached.category_health ?? {},
            summary: cached.summary,
            gaps: [],
            contradictions: [],
          }
        } else {
          // Cache miss or answers changed — call Claude
          setStatus('validating')
          const valRes = await fetch('/api/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers, dev_mode: devMode }),
          })
          try { valJson = JSON.parse(await valRes.text()) } catch { valJson = { error: true } }

          if (!valRes.ok || valJson.error) {
            // Validate failed — skip to generate rather than blocking the user
            await runGenerate()
            return
          }

          // Persist result to validation_cache
          await supabase.from('validation_cache').upsert({
            session_id: sessionId,
            ready: valJson.ready ?? false,
            category_health: valJson.category_health ?? {},
            summary: valJson.summary ?? '',
            answers_hash: answersHash,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'session_id' })
          setValidation(valJson)
          if (valJson.ready === false) {
            setStatus('gaps')
            return
          }
          await runGenerate()
          return
        }

        // 5. Validate with Claude (cache miss or answers changed)
        setStatus('validating')
        const valRes = await fetch('/api/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers, dev_mode: devMode }),
        })
        let validationJson
        try { validationJson = JSON.parse(await valRes.text()) } catch { validationJson = { error: true } }

        if (!valRes.ok || validationJson.error) {
          // Validate failed — skip to generate rather than blocking the user
          await runGenerate()
          return
        }

        // 6. Persist result to validation_cache
        await supabase.from('validation_cache').upsert({
          session_id: sessionId,
          ready: validationJson.ready ?? false,
          category_health: validationJson.category_health ?? {},
          summary: validationJson.summary ?? '',
          answers_hash: answersHash,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'session_id' })

        setValidation(validationJson)

        if (validationJson.ready === false && Object.keys(validationJson.category_health ?? {}).some(k => validationJson.category_health[k] === 'poor')) {
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

  async function handleBuildAndDeploy() {
    setBuildError(null)
    setBuildStatus('Queuing build...')
    setBuildProgress(0)
    setBuildTotal(0)
    setDeployUrl(null)
    try {
      const res = await fetch('/api/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          title: result.title,
          prompt: result.prompt,
          tech_stack: result.tech_stack,
          features: result.features,
          dev_mode: devMode,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.job_id) {
        setBuildError(data.error || 'Failed to start build')
        setBuildStatus(null)
        return
      }
      setBuildJobId(data.job_id)
    } catch (err) {
      setBuildError(err.message)
      setBuildStatus(null)
    }
  }

  // Poll Supabase for build job progress
  useEffect(() => {
    if (!buildJobId) return
    const interval = setInterval(async () => {
      const { data: job } = await supabase
        .from('jobs')
        .select('status, progress, total_files, deploy_url, error')
        .eq('id', buildJobId)
        .maybeSingle()
      if (!job) return
      setBuildStatus(job.status)
      setBuildProgress(prev => Math.max(prev, job.progress ?? 0))
      setBuildTotal(job.total_files ?? 0)
      if (job.deploy_url) {
        setDeployUrl(job.deploy_url)
        clearInterval(interval)
      }
      if (job.status === 'Error' || job.error) {
        setBuildError(job.error ?? 'Build failed')
        clearInterval(interval)
      }
      if (job.status === 'Done!') {
        clearInterval(interval)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [buildJobId])

  const loadingMessages = {
    loading:    { title: 'Reviewing your answers...', sub: 'Loading your responses from the database' },
    validating: { title: 'Checking your plan for completeness...', sub: 'Claude is reviewing all 7 sections for gaps and contradictions' },
    generating: { title: 'Generating your build plan...', sub: 'Claude is synthesizing all your answers into a complete specification' },
  }

  if (['loading', 'validating', 'generating'].includes(status)) {
    const msg = loadingMessages[status]
    return (
      <main className="flex flex-col items-center justify-center w-full h-full" style={{ flex: 1, gap: '1.25rem', fontFamily: T.ff }}>
        <PrismLoader text={msg.title + (msg.sub ? `\n${msg.sub}` : '')} />
      </main>
    )
  }

  if (status === 'gaps') {
    return (
      <main style={{ flex: 1, height: '100%', overflowY: 'auto', display: 'flex', justifyContent: 'center', fontFamily: T.ff }}>
        <div style={{ width: '100%', maxWidth: 660, padding: '3.5rem 2.5rem', animation: 'fadeIn 0.4s ease', background: 'radial-gradient(ellipse at center, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.85) 35%, rgba(5,5,5,0.5) 55%, rgba(5,5,5,0.0) 75%)', borderRadius: '20px', margin: '1.5rem auto' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: T.warn, textTransform: 'uppercase', marginBottom: '0.6rem' }}>Review needed</div>
          <h1 style={{ fontSize: '1.9rem', fontWeight: 700, color: T.text, margin: '0 0 0.6rem', letterSpacing: '-0.03em' }}>Almost there — a few things to review</h1>
          {validation?.summary && (
            <p style={{ color: T.textSub, fontSize: '0.9rem', lineHeight: 1.7, margin: '0 0 2rem' }}>{validation.summary}</p>
          )}
          <div style={{ height: 1, background: T.divider, marginBottom: '1.75rem' }} />

          {validation?.gaps?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: T.warn, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Missing or thin answers</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {validation.gaps.map((gap, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', background: T.warnBg, border: '1px solid rgba(251,191,36,0.15)', borderRadius: '10px', padding: '0.7rem 0.9rem', backdropFilter: T.blur }}>
                    <span style={{ flexShrink: 0, fontSize: '0.9rem', marginTop: '1px' }}>⚠</span>
                    <span style={{ color: '#d97706', fontSize: '0.83rem', lineHeight: 1.6 }}>{gap}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {validation?.contradictions?.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: T.error, textTransform: 'uppercase', marginBottom: '0.75rem' }}>Contradictions found</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {validation.contradictions.map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', background: T.errorBg, border: '1px solid rgba(248,113,113,0.15)', borderRadius: '10px', padding: '0.7rem 0.9rem', backdropFilter: T.blur }}>
                    <span style={{ flexShrink: 0, color: T.error, fontWeight: 700, fontSize: '0.85rem', marginTop: '2px' }}>✗</span>
                    <span style={{ color: T.error, fontSize: '0.83rem', lineHeight: 1.6 }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
            <button className="btn-ghost" onClick={onDashboard}>
              Back to Dashboard
            </button>
            <button className="btn-ghost" onClick={onEdit}>
              ← Go back and improve
            </button>
            <button className="btn-primary" onClick={runGenerate}>
              Generate anyway →
            </button>
          </div>
        </div>
      </main>
    )
  }

  if (status === 'error') {
    return (
      <main style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.ff }}>
        <div style={{ textAlign: 'center', maxWidth: 440, padding: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>⚠</div>
          <p style={{ color: T.error, fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>{error}</p>
          <button className="btn-primary" onClick={onDashboard}>
            Back to Dashboard
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={{ flex: 1, height: '100%', overflowY: 'auto', fontFamily: T.ff }}>
      <div style={{ maxWidth: 820, margin: '0 auto', padding: '3rem 2.5rem 4rem', animation: 'fadeIn 0.4s ease', background: 'radial-gradient(ellipse at center, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.85) 35%, rgba(5,5,5,0.5) 55%, rgba(5,5,5,0.0) 75%)', borderRadius: '20px', marginTop: '1.5rem', marginBottom: '1.5rem' }}>

        <h1 style={{ fontSize: '2.2rem', fontWeight: 700, color: T.text, margin: '0 0 0.4rem', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
          {result.title}
        </h1>
        <p style={{ color: T.textSub, fontSize: '0.95rem', lineHeight: 1.7, margin: '0 0 2.5rem', maxWidth: 620 }}>
          {result.summary}
        </p>

        <div style={{ height: 1, background: T.divider, marginBottom: '2.5rem' }} />

        {/* AI Coding Prompt — hero section */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.9rem' }}>
            <div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: T.textSub, textTransform: 'uppercase', marginBottom: '0.2rem' }}>AI Coding Prompt</div>
              <div style={{ fontSize: '0.75rem', color: T.textMuted }}>Paste this into Cursor, Copilot, or ChatGPT to start building</div>
            </div>
            <button onClick={copyPrompt}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                padding: '0.5rem 1rem', fontSize: '0.78rem', fontWeight: 600,
                background: copied ? T.successBg : 'rgba(124,91,240,0.1)',
                color: copied ? T.success : '#c4b5fd',
                border: `1px solid ${copied ? 'rgba(52,211,153,0.3)' : 'rgba(124,91,240,0.25)'}`,
                borderRadius: '9px', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
              }}>
              <span>{copied ? '✓' : '⎘'}</span>
              <span>{copied ? 'Copied!' : 'Copy Prompt'}</span>
            </button>
          </div>
          <div style={{
            background: 'rgba(8,8,12,0.9)', border: `1px solid ${T.cardBorder}`, borderRadius: '12px',
            padding: '1.5rem', fontFamily: T.mono,
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
          <div style={{ background: T.card, backdropFilter: T.blur, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', padding: '1.25rem 1.3rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: T.accent, textTransform: 'uppercase', marginBottom: '0.9rem' }}>Core Features</div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {result.features.map((f, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ color: T.accent, flexShrink: 0, fontSize: '0.75rem', marginTop: '1px' }}>›</span>
                  <span style={{ color: '#86efac', fontSize: '0.8rem', lineHeight: 1.5 }}>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack */}
          <div style={{ background: T.card, backdropFilter: T.blur, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', padding: '1.25rem 1.3rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: T.accent2, textTransform: 'uppercase', marginBottom: '0.9rem' }}>Recommended Tech Stack</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {result.tech_stack.map((t, i) => (
                <span key={i} style={{
                  fontSize: '0.75rem', color: T.accent2,
                  background: 'rgba(94,234,212,0.07)', border: '1px solid rgba(94,234,212,0.18)',
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
          <div style={{ background: T.card, backdropFilter: T.blur, border: '1px solid rgba(251,191,36,0.2)', borderRadius: '12px', padding: '1.25rem 1.3rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: T.warn, textTransform: 'uppercase', marginBottom: '0.9rem' }}>Watch Out — Build Traps</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {result.build_traps.map((trap, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', background: T.warnBg, borderRadius: '9px', padding: '0.6rem 0.75rem' }}>
                  <span style={{ flexShrink: 0, fontSize: '0.85rem' }}>⚠</span>
                  <span style={{ color: '#d97706', fontSize: '0.82rem', lineHeight: 1.6 }}>{trap}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Build in Phases */}
        {result.phases && (
          <div style={{ background: T.card, backdropFilter: T.blur, border: `1px solid rgba(52,211,153,0.15)`, borderRadius: '12px', padding: '1.25rem 1.3rem', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: T.success, textTransform: 'uppercase', marginBottom: '0.9rem' }}>Suggested Build Order</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: T.success, marginBottom: '0.5rem' }}>Phase 1 — Start here</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {result.phases.phase1.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
                      <span style={{ color: T.success, flexShrink: 0, fontSize: '0.75rem', marginTop: '2px' }}>›</span>
                      <span style={{ color: '#86efac', fontSize: '0.8rem', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: T.textMuted, marginBottom: '0.5rem' }}>Phase 2 — Add next</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {result.phases.phase2.map((f, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.45rem', alignItems: 'flex-start' }}>
                      <span style={{ color: T.textMuted, flexShrink: 0, fontSize: '0.75rem', marginTop: '2px' }}>›</span>
                      <span style={{ color: T.textSub, fontSize: '0.8rem', lineHeight: 1.5 }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Stories */}
        <div style={{ background: T.card, backdropFilter: T.blur, border: `1px solid ${T.cardBorder}`, borderRadius: '12px', padding: '1.25rem 1.3rem', marginBottom: '2.5rem' }}>
          <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#c4b5fd', textTransform: 'uppercase', marginBottom: '0.9rem' }}>User Stories</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {result.user_stories.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#c4b5fd', flexShrink: 0, fontSize: '0.75rem', marginTop: '2px' }}>›</span>
                <span style={{ color: T.textSub, fontSize: '0.82rem', lineHeight: 1.6 }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Build & Deploy */}
        <div style={{ background: 'rgba(124,91,240,0.06)', border: '1px solid rgba(124,91,240,0.15)', borderRadius: '14px', padding: '1.5rem', textAlign: 'center' }}>
          {!buildStatus && !deployUrl && !buildError && (
            <button onClick={handleBuildAndDeploy}
              style={{ padding: '0.9rem 2rem', background: 'linear-gradient(135deg, #7c5bf0, #6d28d9)', color: '#fff', border: 'none', borderRadius: '11px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 24px rgba(124,91,240,0.35)', transition: 'all 0.2s' }}
              onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 32px rgba(124,91,240,0.55)')}
              onMouseOut={e => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(124,91,240,0.35)')}>
              Build & Deploy to Vercel
            </button>
          )}

          {buildStatus && !deployUrl && !buildError && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 18, height: 18, border: '2px solid rgba(124,91,240,0.2)', borderTopColor: '#7c5bf0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: T.text, fontSize: '0.85rem', fontWeight: 600 }}>{buildStatus}</span>
              </div>
              {buildTotal > 0 && (
                <div style={{ width: '100%', maxWidth: 300 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.7rem', color: T.textSub }}>Files written</span>
                    <span style={{ fontSize: '0.7rem', color: T.textSub }}>{buildProgress} / {buildTotal}</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${Math.round((buildProgress / buildTotal) * 100)}%`, height: '100%', background: 'linear-gradient(90deg, #7c5bf0, #a78bfa)', borderRadius: '3px', transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {deployUrl && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: 700 }}>Deployed successfully!</div>
              <a href={deployUrl} target="_blank" rel="noopener noreferrer"
                style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.9rem', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }}>
                View Live App
              </a>
            </div>
          )}

          {buildError && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ color: '#f87171', fontSize: '0.82rem' }}>{buildError}</div>
              <button onClick={() => { setBuildError(null); setBuildJobId(null); setBuildStatus(null) }}
                style={{ padding: '0.6rem 1.25rem', background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.25)', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}>
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Footer CTA */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          <button className={copied ? "" : "btn-primary"} onClick={copyPrompt}
            style={{ padding: '0.8rem 1.75rem', background: copied ? T.success : 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', border: 'none', borderRadius: '11px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)' }}>
            {copied ? '✓ Copied!' : '⎘ Copy Build Prompt'}
          </button>
          <button
            className="btn-primary"
            onClick={onEdit}
            style={{ padding: '0.8rem 1.75rem', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', border: 'none', borderRadius: '11px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)' }}
          >
            Edit Responses
          </button>
          <button
            className="btn-primary"
            onClick={onDashboard}
            style={{ padding: '0.8rem 1.75rem', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: '#fff', border: 'none', borderRadius: '11px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)' }}
          >
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
  const [categoryHealth, setCategoryHealth] = useState({})

  const [useLocalAI, setUseLocalAI] = useState(() => localStorage.getItem('useLocalAI') === 'true')
  const [localAISetupComplete, setLocalAISetupComplete] = useState(() => localStorage.getItem('localAISetupComplete') === 'true')

  const toggleLocalAI = useCallback(() => {
    const next = !useLocalAI
    setUseLocalAI(next)
    localStorage.setItem('useLocalAI', String(next))
    if (!localAISetupComplete && next === true) {
      setLocalAISetupComplete(true)
      localStorage.setItem('localAISetupComplete', 'true')
    }
  }, [useLocalAI, localAISetupComplete])

  const handleCompleteLocalAISetup = useCallback(() => {
    setLocalAISetupComplete(true)
    localStorage.setItem('localAISetupComplete', 'true')
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setAuthLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      if (event === 'SIGNED_OUT') {
        setShowAuth(false)   // return to LandingPage, not LoginScreen
        setView('dashboard') // reset view for next login
      }
      if (event === 'SIGNED_IN') {
        const intent = sessionStorage.getItem('postLoginRedirect')
        if (intent === 'ollama-setup') {
          setView('ollama-setup')
          sessionStorage.removeItem('postLoginRedirect')
        }
      }
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

  const handleEditResult = useCallback(async () => {
    // Delete cached build plan so it regenerates after the user saves edits
    await supabase.from('build_plans').delete().eq('session_id', sessionId)
    // Jump back to the questionnaire starting at the first category
    setCompletedSteps([])
    setActiveStep(STEPS[0].id)
    setJumpRequest({ category: STEPS[0].label, nonce: Date.now() })
    setView('questionnaire')
  }, [sessionId])

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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 28, height: 28, border: `3px solid ${T.divider}`, borderTopColor: T.accent, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  if (!user) {
    if (showAuth) return <><ShaderBackground /><LoginScreen /></>
    return <><ShaderBackground /><LandingPage onGetStarted={() => setShowAuth(true)} onLearnOllama={() => { sessionStorage.setItem('postLoginRedirect', 'ollama-setup'); setShowAuth(true); }} /></>
  }

  return (
    <>
      <ShaderBackground />
      {view === 'ollama-setup' ? (
        <OllamaSetup onBack={handleGoToDashboard} useLocalAI={useLocalAI} toggleLocalAI={toggleLocalAI} onCompleteSetup={handleCompleteLocalAISetup} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: T.ff, position: 'relative', zIndex: 1 }}>
        <header style={{ flexShrink: 0, height: 52, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.14)', boxShadow: '0 4px 30px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem' }}>
          <button onClick={handleGoToDashboard}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.3rem 0.5rem', borderRadius: '8px', transition: 'background 0.15s' }}
            onMouseOver={e => (e.currentTarget.style.background = 'rgba(124,91,240,0.06)')}
            onMouseOut={e => (e.currentTarget.style.background = 'none')}>
            <div style={{ width: 28, height: 28, background: T.gradient, borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', color: '#fff', fontWeight: 700 }}>P</div>
            <div style={{ textAlign: 'left' }}>
            <div style={{ color: T.text, fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em', lineHeight: 1.2 }}>PromptReady</div>
            <div style={{ color: T.textMuted, fontSize: '0.62rem' }}>AI App Builder</div>
          </div>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            onClick={() => !localAISetupComplete && setView('ollama-setup')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.2rem 0.5rem', 
              background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', 
              opacity: localAISetupComplete ? 1 : 0.4,
              cursor: localAISetupComplete ? 'default' : 'pointer',
              transition: 'opacity 0.2s' 
            }}>
            <span style={{ color: '#fff', fontSize: '0.65rem', fontWeight: 600 }}>Local AI</span>
            <div onClick={localAISetupComplete ? toggleLocalAI : undefined} style={{ width: 30, height: 16, borderRadius: '12px', background: useLocalAI ? '#10b981' : '#333', position: 'relative', cursor: localAISetupComplete ? 'pointer' : 'pointer', transition: 'background 0.2s' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: useLocalAI ? 16 : 2, transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
            </div>
          </div>
          <button onClick={() => setView('ollama-setup')}
            style={{ 
              background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.1))', 
              border: `1px solid rgba(16,185,129,0.3)`, 
              borderRadius: '6px', color: '#10b981', 
              cursor: 'pointer', fontSize: '0.65rem', padding: '0.25rem 0.65rem', 
              transition: 'all 0.15s', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem'
            }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.6)'; e.currentTarget.style.background = 'rgba(16,185,129,0.2)' }}
            onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)'; e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(6,182,212,0.1))' }}>
            ⚡ Connect A Local AI
          </button>
          <span style={{ fontSize: '0.72rem', color: T.textMuted, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.email}>{user.email}</span>
          <button onClick={handleLogout}
            style={{ background: 'none', border: `1px solid ${T.cardBorder}`, borderRadius: '6px', color: T.textMuted, cursor: 'pointer', fontSize: '0.65rem', padding: '0.25rem 0.55rem', transition: 'all 0.15s' }}
            onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)'; e.currentTarget.style.color = T.error }}
            onMouseOut={e => { e.currentTarget.style.borderColor = T.cardBorder; e.currentTarget.style.color = T.textMuted }}>
            Sign out
          </button>
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0, display: 'flex', overflow: 'hidden' }}>
        {view === 'dashboard' && <Dashboard user={user} onOpenSession={handleOpenSession} onNewProject={handleNewProject} />}
        {view === 'intake' && <IntakeScreen onSuccess={handleIntakeSuccess} user={user} />}
        {view === 'questionnaire' && (
          <>
            <Sidebar activeStep={activeStep} completedSteps={completedSteps} userEmail={user.email} onLogout={handleLogout} onDashboard={handleGoToDashboard} onStepClick={handleStepClick} categoryHealth={categoryHealth} />
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
        {view === 'result' && <ResultScreen sessionId={sessionId} rawIdea={rawIdea} onDashboard={handleGoToDashboard} onEdit={handleEditResult} devMode={useLocalAI} />}
      </div>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
        </div>
      )}
    </>
  )
}

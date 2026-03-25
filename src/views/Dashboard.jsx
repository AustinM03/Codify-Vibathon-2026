import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const CATEGORY_ORDER = ['Problem', 'Features', 'Design', 'Auth', 'Data', 'Integrations', 'Logic']
const CATEGORY_DISPLAY = {
  Problem:      'Problem',
  Features:     'Features',
  Design:       'Design',
  Auth:         'User Accounts',
  Data:         'Information',
  Integrations: 'App Connections',
  Logic:        'Policies',
}
const CATEGORY_META = {
  Problem:      { icon: '🎯', color: '#7c3aed' },
  Features:     { icon: '⚡', color: '#0095ff' },
  Design:       { icon: '🎨', color: '#ec4899' },
  Auth:         { icon: '🔑', color: '#f59e0b' },
  Data:         { icon: '🗄️', color: '#10b981' },
  Integrations: { icon: '🔌', color: '#06b6d4' },
  Logic:        { icon: '⚙️', color: '#f97316' },
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export default function Dashboard({ user, onOpenSession, onNewProject }) {
  const [sessions, setSessions] = useState([])
  const [lastCategories, setLastCategories] = useState({}) // sessionId → category
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null) // sessionId being deleted

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (!window.confirm('Delete this project? This cannot be undone.')) return
    setDeleting(id)

    // Delete responses first (foreign key dependency)
    const { error: respErr } = await supabase
      .from('questionnaire_responses')
      .delete()
      .eq('session_id', id)
    if (respErr) {
      alert('Could not delete project responses: ' + respErr.message)
      setDeleting(null)
      return
    }

    // Delete the session, scoped to this user to satisfy RLS
    const { error: sessErr, count } = await supabase
      .from('sessions')
      .delete({ count: 'exact' })
      .eq('id', id)
      .eq('user_id', user.id)
    if (sessErr || count === 0) {
      alert(sessErr ? 'Could not delete project: ' + sessErr.message : 'Delete failed — you may not have permission.')
      setDeleting(null)
      return
    }

    setSessions(prev => prev.filter(s => s.id !== id))
    setLastCategories(prev => { const next = { ...prev }; delete next[id]; return next })
    setDeleting(null)
  }

  useEffect(() => {
    async function load() {
      setLoading(true)

      // Fetch all sessions for this user, newest first
      const { data: sessionRows } = await supabase
        .from('sessions')
        .select('id, raw_idea, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!sessionRows?.length) { setSessions([]); setLoading(false); return }

      setSessions(sessionRows)

      // Fetch latest response per session to determine last worked-on category
      const ids = sessionRows.map(s => s.id)
      const { data: responses } = await supabase
        .from('questionnaire_responses')
        .select('session_id, category, created_at')
        .in('session_id', ids)
        .order('created_at', { ascending: false })

      // For each session, pick the response with the highest category index
      const map = {}
      responses?.forEach(r => {
        const prev = map[r.session_id]
        const prevIdx = prev ? CATEGORY_ORDER.indexOf(prev) : -1
        const currIdx = CATEGORY_ORDER.indexOf(r.category)
        if (currIdx > prevIdx) map[r.session_id] = r.category
      })
      setLastCategories(map)
      setLoading(false)
    }
    load()
  }, [user.id])

  if (loading) {
    return (
      <main style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ width: 28, height: 28, border: '3px solid rgba(255,255,255,0.04)', borderTopColor: '#7c5bf0', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#6b6680', fontSize: '0.8rem' }}>Loading your projects...</p>
      </main>
    )
  }

  if (sessions.length === 0) {
    return (
      <main style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem', animation: 'fadeIn 0.4s ease' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f0eef5', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>No projects yet</h2>
          <p style={{ color: '#6b6680', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
            Describe your idea and we'll help you turn it into a full build plan.
          </p>
          <button onClick={onNewProject}
            style={{ padding: '0.8rem 1.75rem', background: 'linear-gradient(135deg, #7c5bf0, #6d28d9)', color: '#fff', border: 'none', borderRadius: '11px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 24px rgba(124,91,240,0.35)', transition: 'all 0.2s' }}
            onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 32px rgba(124,91,240,0.5)')}
            onMouseOut={e => (e.currentTarget.style.boxShadow = '0 4px 24px rgba(124,91,240,0.35)')}>
            Create your first app →
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={{ flex: 1, height: '100%', overflowY: 'auto' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 2.5rem 3rem', animation: 'fadeIn 0.4s ease' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#4a4458', textTransform: 'uppercase', marginBottom: '0.4rem' }}>My Projects</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f0eef5', margin: 0, letterSpacing: '-0.03em' }}>Your App Ideas</h1>
          </div>
          <button onClick={onNewProject}
            style={{ padding: '0.65rem 1.25rem', background: 'linear-gradient(135deg, #7c5bf0, #6d28d9)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(124,91,240,0.35)', transition: 'all 0.2s', flexShrink: 0 }}
            onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 28px rgba(124,91,240,0.5)')}
            onMouseOut={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(124,91,240,0.35)')}>
            + New Project
          </button>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', marginBottom: '2rem' }} />

        {/* Cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
          {sessions.map(s => {
            const title = s.raw_idea?.trim().slice(0, 50) + (s.raw_idea?.trim().length > 50 ? '…' : '')
            const lastCat = lastCategories[s.id]
            const meta = lastCat ? CATEGORY_META[lastCat] : null
            const stepIdx = lastCat ? CATEGORY_ORDER.indexOf(lastCat) + 1 : 0
            const progress = Math.round((stepIdx / 7) * 100)

            return (
              <div key={s.id}
                onClick={() => onOpenSession(s.id, s.raw_idea)}
                style={{
                  background: 'rgba(15,15,20,0.7)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px',
                  padding: '1.25rem 1.3rem', cursor: 'pointer', position: 'relative',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(124,91,240,0.25)'; e.currentTarget.style.boxShadow = '0 0 60px rgba(124,91,240,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = 'none' }}>

                {/* Delete button */}
                <button
                  onClick={e => handleDelete(e, s.id)}
                  disabled={deleting === s.id}
                  title="Delete project"
                  style={{
                    position: 'absolute', top: '0.75rem', right: '0.75rem',
                    background: 'rgba(248,113,113,0.08)', border: 'none',
                    borderRadius: '6px', cursor: 'pointer',
                    color: '#f87171', fontSize: '0.8rem',
                    padding: '0.2rem 0.35rem',
                    transition: 'all 0.15s', lineHeight: 1.4,
                  }}
                  onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.background = 'rgba(248,113,113,0.15)'; e.currentTarget.style.color = '#fca5a5' }}
                  onMouseLeave={e => { e.stopPropagation(); e.currentTarget.style.background = 'rgba(248,113,113,0.08)'; e.currentTarget.style.color = '#f87171' }}>
                  {deleting === s.id ? '…' : '🗑'}
                </button>

                {/* Title */}
                <div>
                  <div style={{ fontSize: '0.93rem', fontWeight: 600, color: '#f0eef5', lineHeight: 1.4, marginBottom: '0.25rem' }}>{title}</div>
                  <div style={{ fontSize: '0.68rem', color: '#4a4458' }}>{timeAgo(s.created_at)}</div>
                </div>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {meta ? (
                    <>
                      <span style={{ fontSize: '0.8rem' }}>{meta.icon}</span>
                      <span style={{ fontSize: '0.72rem', color: meta.color, fontWeight: 500 }}>Last: {CATEGORY_DISPLAY[lastCat] ?? lastCat}</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.8rem' }}>📝</span>
                      <span style={{ fontSize: '0.72rem', color: '#4a4458' }}>Not started</span>
                    </>
                  )}
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.62rem', color: '#4a4458' }}>Progress</span>
                    <span style={{ fontSize: '0.62rem', color: '#4a4458' }}>{stepIdx} / 7</span>
                  </div>
                  <div style={{ height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#34d399' : 'linear-gradient(135deg, #7c5bf0, #5eead4)', borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* CTA */}
                <div style={{ fontSize: '0.72rem', color: '#4a4458', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>{progress === 100 ? '✓ Complete' : 'Continue building'}</span>
                  <span style={{ marginLeft: 'auto', color: '#7c5bf0', fontSize: '0.8rem' }}>→</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

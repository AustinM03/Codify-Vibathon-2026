import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'

const CATEGORY_ORDER = ['Problem', 'Features', 'Design', 'Auth', 'Data', 'Integrations', 'Logic']
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
  const [confirmDelete, setConfirmDelete] = useState(null) // sessionId awaiting confirm
  const [deleting, setDeleting] = useState(null)           // sessionId being deleted

  async function handleDelete(e, id) {
    e.stopPropagation()
    if (confirmDelete === id) {
      // Second click — actually delete
      setDeleting(id)
      await supabase.from('questionnaire_responses').delete().eq('session_id', id)
      await supabase.from('sessions').delete().eq('id', id)
      setSessions(prev => prev.filter(s => s.id !== id))
      setLastCategories(prev => { const next = { ...prev }; delete next[id]; return next })
      setConfirmDelete(null)
      setDeleting(null)
    } else {
      setConfirmDelete(id)
    }
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
      <main style={{ flex: 1, height: '100%', background: '#191919', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ width: 28, height: 28, border: '3px solid #1e1e1e', borderTopColor: '#0095ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#333', fontSize: '0.8rem' }}>Loading your projects...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </main>
    )
  }

  const ff = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"

  if (sessions.length === 0) {
    return (
      <main style={{ flex: 1, height: '100%', background: '#191919', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: ff }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📂</div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ebebeb', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>No projects yet</h2>
          <p style={{ color: '#3a3a3a', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
            Describe your idea and we'll help you turn it into a full build plan.
          </p>
          <button onClick={onNewProject}
            style={{ padding: '0.8rem 1.75rem', background: '#0095ff', color: '#fff', border: 'none', borderRadius: '9px', fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 18px rgba(0,149,255,0.45)', transition: 'background 0.15s' }}
            onMouseOver={e => (e.currentTarget.style.background = '#007acc')}
            onMouseOut={e => (e.currentTarget.style.background = '#0095ff')}>
            Create your first app →
          </button>
        </div>
      </main>
    )
  }

  return (
    <main style={{ flex: 1, height: '100%', overflowY: 'auto', background: '#191919', fontFamily: ff }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 2.5rem 3rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', color: '#333', textTransform: 'uppercase', marginBottom: '0.4rem' }}>My Projects</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#ebebeb', margin: 0, letterSpacing: '-0.03em' }}>Your App Ideas</h1>
          </div>
          <button onClick={onNewProject}
            style={{ padding: '0.65rem 1.25rem', background: '#0095ff', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 14px rgba(0,149,255,0.4)', transition: 'background 0.15s', flexShrink: 0 }}
            onMouseOver={e => (e.currentTarget.style.background = '#007acc')}
            onMouseOut={e => (e.currentTarget.style.background = '#0095ff')}>
            + New Project
          </button>
        </div>

        <div style={{ height: 1, background: '#1a1a1a', marginBottom: '2rem' }} />

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
                onClick={() => { if (confirmDelete === s.id) { setConfirmDelete(null); return } onOpenSession(s.id, s.raw_idea) }}
                style={{
                  background: '#111', border: `1px solid ${confirmDelete === s.id ? '#ef444455' : '#1e1e1e'}`, borderRadius: '12px',
                  padding: '1.25rem 1.3rem', cursor: 'pointer', position: 'relative',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                  display: 'flex', flexDirection: 'column', gap: '0.75rem',
                }}
                onMouseEnter={e => { if (confirmDelete !== s.id) { e.currentTarget.style.borderColor = '#0095ff44'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,149,255,0.08)' } }}
                onMouseLeave={e => { if (confirmDelete !== s.id) { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.boxShadow = 'none' } setConfirmDelete(prev => prev === s.id ? null : prev) }}>

                {/* Delete button */}
                <button
                  onClick={e => handleDelete(e, s.id)}
                  disabled={deleting === s.id}
                  title={confirmDelete === s.id ? 'Click again to confirm delete' : 'Delete project'}
                  style={{
                    position: 'absolute', top: '0.75rem', right: '0.75rem',
                    background: confirmDelete === s.id ? '#ef4444' : '#3f1212',
                    border: 'none',
                    borderRadius: '5px', cursor: 'pointer',
                    color: confirmDelete === s.id ? '#fff' : '#f87171',
                    fontSize: confirmDelete === s.id ? '0.65rem' : '0.8rem',
                    padding: confirmDelete === s.id ? '0.2rem 0.45rem' : '0.2rem 0.35rem',
                    fontWeight: confirmDelete === s.id ? 600 : 400,
                    transition: 'all 0.15s', lineHeight: 1.4,
                  }}
                  onMouseEnter={e => { e.stopPropagation(); if (confirmDelete !== s.id) { e.currentTarget.style.background = '#7f1d1d'; e.currentTarget.style.color = '#fca5a5' } }}
                  onMouseLeave={e => { e.stopPropagation(); if (confirmDelete !== s.id) { e.currentTarget.style.background = '#3f1212'; e.currentTarget.style.color = '#f87171' } }}>
                  {deleting === s.id ? '…' : confirmDelete === s.id ? 'Delete?' : '🗑'}
                </button>

                {/* Title */}
                <div>
                  <div style={{ fontSize: '0.93rem', fontWeight: 600, color: '#e2e2e2', lineHeight: 1.4, marginBottom: '0.25rem' }}>{title}</div>
                  <div style={{ fontSize: '0.68rem', color: '#2e2e2e' }}>{timeAgo(s.created_at)}</div>
                </div>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  {meta ? (
                    <>
                      <span style={{ fontSize: '0.8rem' }}>{meta.icon}</span>
                      <span style={{ fontSize: '0.72rem', color: meta.color, fontWeight: 500 }}>Last: {lastCat}</span>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: '0.8rem' }}>📝</span>
                      <span style={{ fontSize: '0.72rem', color: '#333' }}>Not started</span>
                    </>
                  )}
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontSize: '0.62rem', color: '#2e2e2e' }}>Progress</span>
                    <span style={{ fontSize: '0.62rem', color: '#2e2e2e' }}>{stepIdx} / 7</span>
                  </div>
                  <div style={{ height: 3, background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${progress}%`, height: '100%', background: progress === 100 ? '#22c55e' : 'linear-gradient(90deg, #0095ff, #00d4ff)', borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>
                </div>

                {/* CTA */}
                <div style={{ fontSize: '0.72rem', color: '#2a2a2a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span>{progress === 100 ? '✓ Complete' : 'Continue building'}</span>
                  <span style={{ marginLeft: 'auto', color: '#1e3a5a', fontSize: '0.8rem' }}>→</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}

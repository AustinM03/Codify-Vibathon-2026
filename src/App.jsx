import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabaseClient'

function ParticleCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 140 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      r: Math.random() * 1.4 + 0.3,
      dx: (Math.random() - 0.5) * 0.25,
      dy: (Math.random() - 0.5) * 0.25,
      alpha: Math.random() * 0.5 + 0.15,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`
        ctx.fill()
        p.x += p.dx
        p.y += p.dy
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1
      })
      animId = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}

export default function App() {
  const [status, setStatus] = useState('')
  const [isError, setIsError] = useState(false)
  const [auditStatus, setAuditStatus] = useState('')
  const [auditIsVuln, setAuditIsVuln] = useState(false)

  async function testWrite() {
    setStatus('Writing...')
    setIsError(false)
    const { data, error } = await supabase
      .from('sessions')
      .insert([{ raw_idea: 'An app that tracks how many times my cat meows.' }])
    if (error) {
      console.error('Insert error:', error)
      setStatus(`Error: ${error.message}`)
      setIsError(true)
    } else {
      console.log('Insert success:', data)
      setStatus('Success! Record inserted.')
    }
  }

  async function runAudit() {
    setAuditStatus('Auditing...')
    setAuditIsVuln(false)
    const { data, error } = await supabase.from('sessions').select('*')
    if (error) {
      setAuditStatus(`Audit error: ${error.message}`)
      setAuditIsVuln(false)
      return
    }
    if (data && data.length > 1) {
      setAuditIsVuln(true)
      setAuditStatus(`VULNERABILITY: Data is public. Found ${data.length} records from all sessions.`)
    } else {
      setAuditIsVuln(false)
      setAuditStatus('SECURE: Row Level Security is active.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#05050a',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      overflow: 'hidden',
      position: 'relative',
    }}>
      <ParticleCanvas />

      <div style={{ position: 'relative', zIndex: 1, padding: '2rem' }}>
        <h1 style={{
          fontSize: 'clamp(3.5rem, 11vw, 6.5rem)',
          fontWeight: 900,
          margin: '0 0 0.6rem',
          background: 'linear-gradient(90deg, #a855f7, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-0.02em',
          lineHeight: 1.1,
        }}>
          Hello, World.
        </h1>

        <p style={{
          fontSize: '0.75rem',
          letterSpacing: '0.22em',
          color: '#6b7280',
          textTransform: 'uppercase',
          margin: '0 0 2.2rem',
        }}>
          Codify Vibeathon 2026 — Springfield, MO
        </p>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1.1rem',
          marginBottom: '1.2rem',
          flexWrap: 'wrap',
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.35rem 1rem',
            border: '1px solid #0d9488',
            borderRadius: '999px',
            fontSize: '0.75rem',
            color: '#5eead4',
            letterSpacing: '0.08em',
            background: 'rgba(13,148,136,0.08)',
          }}>
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 6px #22c55e',
              display: 'inline-block',
            }} />
            SYSTEM ONLINE
          </span>

          <a
            href="/chat.html"
            style={{ color: '#9ca3af', fontSize: '0.9rem', textDecoration: 'none' }}
            onMouseOver={e => (e.currentTarget.style.color = '#fff')}
            onMouseOut={e => (e.currentTarget.style.color = '#9ca3af')}
          >
            Try the Chat →
          </a>
        </div>

        <button
          onClick={testWrite}
          style={{
            padding: '0.55rem 1.75rem',
            fontSize: '0.85rem',
            cursor: 'pointer',
            borderRadius: '8px',
            border: '1px solid #374151',
            background: 'rgba(255,255,255,0.04)',
            color: '#d1d5db',
            letterSpacing: '0.04em',
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
          onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
        >
          Test Database Write
        </button>

        {status && (
          <p style={{
            marginTop: '1rem',
            fontSize: '0.85rem',
            color: isError ? '#f87171' : '#4ade80',
          }}>
            {status}
          </p>
        )}

        <button
          onClick={runAudit}
          style={{
            marginTop: '0.75rem',
            padding: '0.55rem 1.75rem',
            fontSize: '0.85rem',
            cursor: 'pointer',
            borderRadius: '8px',
            border: '1px solid #374151',
            background: 'rgba(255,255,255,0.04)',
            color: '#d1d5db',
            letterSpacing: '0.04em',
            display: 'block',
            margin: '0.75rem auto 0',
          }}
          onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
          onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
        >
          Security Audit
        </button>

        {auditStatus && (
          <p style={{
            marginTop: '1rem',
            fontSize: '0.85rem',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            background: auditIsVuln ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.12)',
            border: `1px solid ${auditIsVuln ? '#ef4444' : '#22c55e'}`,
            color: auditIsVuln ? '#f87171' : '#4ade80',
          }}>
            {auditStatus}
          </p>
        )}
      </div>
    </div>
  )
}

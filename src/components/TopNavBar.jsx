import React from 'react'

const T = {
  ff: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
  textMuted: '#a1a1aa',
  textHover: '#fff'
}

export default function TopNavBar({ user, onLogin, onLogout, onGoToDashboard, children }) {
  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: 60,
      zIndex: 1000,
      backgroundColor: 'rgba(18, 18, 18, 0.85)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2.5rem',
      fontFamily: T.ff,
      boxSizing: 'border-box'
    }}>
      {/* Left Section - Branding */}
      <div 
        onClick={onGoToDashboard} 
        style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}
      >
        <div style={{
          width: 32, height: 32,
          background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
          borderRadius: '8px', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '1rem',
        }}>
          🚀
        </div>
        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#ebebeb', letterSpacing: '-0.02em', marginTop: '2px' }}>
          PromptReady
        </span>
      </div>

      {/* Center Section - Links */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        {['Builder', 'Personal Agent', 'How It Works'].map(link => (
          <a key={link} href="#" onClick={e => e.preventDefault()} style={{
            color: T.textMuted, fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s'
          }} onMouseOver={e => e.currentTarget.style.color = T.textHover} onMouseOut={e => e.currentTarget.style.color = T.textMuted}>
            {link}
          </a>
        ))}
      </nav>

      {/* Right Section - Auth & Extras */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Render children (like the Local AI toggles) before Auth profile block */}
        {children}

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.85rem',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
              {user.email?.[0].toUpperCase() || 'U'}
            </div>
            <button onClick={onLogout} style={{
              background: 'none', border: 'none', color: T.textMuted, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', transition: 'color 0.2s', padding: 0
            }} onMouseOver={e => e.currentTarget.style.color = '#f87171'} onMouseOut={e => e.currentTarget.style.color = T.textMuted}>
              Sign Out
            </button>
          </div>
        ) : (
          <button onClick={onLogin} style={{
            padding: '0.55rem 1.4rem', background: 'linear-gradient(135deg, #8B5CF6, #6366F1)', color: '#fff',
            border: 'none', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)', transition: 'all 0.2s'
          }} onMouseOver={e => e.currentTarget.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.4)'} onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.25)'}>
            Sign In
          </button>
        )}
      </div>
    </header>
  )
}

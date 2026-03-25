import { useState } from 'react'

const ff = "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif"

const Kbd = ({ children }) => (
  <kbd style={{
    background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
    boxShadow: '0 2px 0 rgba(255,255,255,0.1)', borderRadius: '4px',
    padding: '0.1rem 0.35rem', fontSize: '0.8rem', color: '#fff', fontFamily: 'inherit',
    margin: '0 0.2rem'
  }}>{children}</kbd>
)

export default function OllamaSetup({ onBack }) {
  const [copied, setCopied] = useState(false)
  const [copiedServe, setCopiedServe] = useState(false)
  const [os, setOs] = useState('mac')
  const [useLocalAI, setUseLocalAI] = useState(() => localStorage.getItem('useLocalAI') === 'true')

  const toggleLocalAI = () => {
    const next = !useLocalAI
    setUseLocalAI(next)
    localStorage.setItem('useLocalAI', String(next))
  }

  const copyCommand = (cmd, type) => {
    navigator.clipboard.writeText(cmd)
    if (type === 'run') {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      setCopiedServe(true)
      setTimeout(() => setCopiedServe(false), 2000)
    }
  }

  return (
    <div style={{
      height: '100vh',
      background: '#000000',
      fontFamily: ff,
      overflowX: 'hidden',
      overflowY: 'auto',
      color: '#e2e2e2',
      position: 'relative',
      paddingBottom: '4rem',
    }}>
      {/* ── Nav ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2.5rem', height: 60,
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 30, height: 30,
            background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
            borderRadius: '8px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '0.9rem',
          }}>🚀</div>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ebebeb', letterSpacing: '-0.01em' }}>PromptReady</span>
        </div>
        <button
          className="btn-ghost"
          onClick={onBack}
          style={{ padding: '0.45rem 1.1rem', fontSize: '0.82rem', fontFamily: ff }}>
          ← Back to App
        </button>
      </nav>

      <main style={{ maxWidth: 880, margin: '4rem auto 0', padding: '0 2.5rem' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)', fontWeight: 800, color: '#ffffff', 
            margin: '0 0 1.25rem', letterSpacing: '0.05em', lineHeight: 1.1 
          }}>
            Run AI on your own computer.<br />
            <span style={{
              background: 'linear-gradient(135deg, #10b981, #06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Zero costs. 100% Privacy. Run anywhere.
            </span>
          </h1>
          <p style={{ 
            fontSize: 'clamp(1.05rem, 2vw, 1.25rem)', color: '#9CA3AF', 
            lineHeight: 1.6, maxWidth: 640, margin: '0 auto' 
          }}>
            Follow these 3 simple steps to unlock unlimited, free app generation by turning your computer into an AI engine.
          </p>
        </div>

        {/* Steps Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* Step 1 */}
          <div className="glass-card" style={{ padding: '2.5rem', display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '2rem', alignItems: 'center' }}>
            <div>
              <div style={{ 
                display: 'inline-block', background: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6', 
                padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, 
                letterSpacing: '0.05em', marginBottom: '1rem' 
              }}>
                STEP 1
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem', letterSpacing: '0.02em' }}>
                Download the Engine
              </h2>
              <p style={{ color: '#9CA3AF', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                Go to Ollama.com and download the app for your Mac or Windows computer. Install it like any normal app. This gives your computer the ability to run AI models locally.
              </p>
            </div>
            <div>
              <a href="https://ollama.com/download" target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                <button className="btn-primary" style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem', fontFamily: ff }}>
                  Get Ollama ↗
                </button>
              </a>
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-card" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ 
                  display: 'inline-block', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', 
                  padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, 
                  letterSpacing: '0.05em', marginBottom: '1rem' 
                }}>
                  STEP 2
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem', letterSpacing: '0.02em' }}>
                  Download the Brain
                </h2>
                <div style={{ color: '#9CA3AF', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                    <button onClick={() => setOs('mac')} style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', border: '1px solid ' + (os==='mac' ? '#10b981' : '#333'), background: os==='mac' ? 'rgba(16,185,129,0.1)' : 'transparent', color: os==='mac' ? '#10b981' : '#888', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Mac</button>
                    <button onClick={() => setOs('windows')} style={{ padding: '0.3rem 0.8rem', borderRadius: '6px', border: '1px solid ' + (os==='windows' ? '#10b981' : '#333'), background: os==='windows' ? 'rgba(16,185,129,0.1)' : 'transparent', color: os==='windows' ? '#10b981' : '#888', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}>Windows</button>
                  </div>
                  {os === 'mac' ? (
                    <p style={{ margin: 0 }}>Press <Kbd>⌘</Kbd> + <Kbd>Spacebar</Kbd>, type <strong>Terminal</strong>, and hit Enter.</p>
                  ) : (
                    <p style={{ margin: 0 }}>Press the <Kbd>Windows</Kbd> key, type <strong>cmd</strong>, and hit Enter.</p>
                  )}
                  <p style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                    Click the copy button, paste this exact text into the black box, and hit Enter. Wait for the 'success' message, and it will keep running in the background!
                  </p>
                </div>
              </div>
              <div style={{ flex: '1 1 300px', background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <code style={{ fontFamily: 'monospace', color: '#10b981', fontSize: '1rem' }}>ollama run llama3</code>
                <button 
                  className="btn-ghost" 
                  onClick={() => copyCommand('ollama run llama3', 'run')}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                  {copied ? 'Copied!' : 'Copy Text'}
                </button>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass-card" style={{ padding: '2.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ 
                  display: 'inline-block', background: 'rgba(6, 182, 212, 0.1)', color: '#06b6d4', 
                  padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, 
                  letterSpacing: '0.05em', marginBottom: '1rem' 
                }}>
                  STEP 3
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem', letterSpacing: '0.02em' }}>
                  The Secret Handshake
                </h2>
                <p style={{ color: '#9CA3AF', fontSize: '0.95rem', lineHeight: 1.6, margin: 0 }}>
                  Because of browser security, we need to explicitly allow this website to talk to your new AI. Close the Ollama app from your system tray, open your {os === 'mac' ? 'Terminal' : 'Command Prompt'} again, and run the command below. Leave this terminal window open while you build!
                </p>
              </div>
              <div style={{ flex: '1 1 300px', background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <code style={{ fontFamily: 'monospace', color: '#06b6d4', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                  {os === 'mac' ? "OLLAMA_ORIGINS='*' ollama serve" : 'set OLLAMA_ORIGINS="*" && ollama serve'}
                </code>
                <button 
                  className="btn-ghost" 
                  onClick={() => copyCommand(os === 'mac' ? "OLLAMA_ORIGINS='*' ollama serve" : 'set OLLAMA_ORIGINS="*" && ollama serve', 'serve')}
                  style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', alignSelf: 'flex-start' }}>
                  {copiedServe ? 'Copied!' : 'Copy Text'}
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Footer CTA */}
        <div style={{ marginTop: '4rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', padding: '1rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.95rem' }}>Enable Local AI for this session</span>
            <div 
              onClick={toggleLocalAI}
              style={{
                width: 44, height: 24, borderRadius: '12px', background: useLocalAI ? '#10b981' : '#333',
                position: 'relative', cursor: 'pointer', transition: 'background 0.2s',
              }}>
              <div style={{
                width: 18, height: 18, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 3, left: useLocalAI ? 23 : 3, transition: 'left 0.2s',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }} />
            </div>
            <span style={{ color: useLocalAI ? '#10b981' : '#888', fontSize: '0.85rem', fontWeight: 600, minWidth: '40px' }}>
              {useLocalAI ? 'ON' : 'OFF'}
            </span>
          </div>

          <button 
            className="btn-primary" 
            onClick={onBack}
            style={{ padding: '1.2rem 2.5rem', fontSize: '1.1rem', letterSpacing: '0.02em', borderRadius: '12px' }}>
            I've done this! Take me to the next steps →
          </button>
          <p style={{ color: '#555', fontSize: '0.85rem', marginTop: '1rem' }}>
            You can always return here from the dashboard if you need a refresher.
          </p>
        </div>

      </main>
    </div>
  )
}

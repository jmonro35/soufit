export const G    = '#4ADE80'
export const BG   = '#080f08'
export const CARD = '#0c150c'
export const BORD = '#1e3a1e'
export const MUT  = '#4a6a4a'
export const DIM  = '#2a4a2a'
export const RED  = '#f87171'
export const YEL  = '#fbbf24'
export const mono  = "'DM Mono', monospace"
export const bebas = "'Bebas Neue', sans-serif"

export function Card({ children, highlight, red, yellow, style = {} }) {
  return (
    <div style={{
      background: highlight ? 'linear-gradient(135deg,#0a1f0a,#0f2a0f)'
                : red       ? 'linear-gradient(135deg,#1f0a0a,#2a0f0f)'
                : yellow    ? 'linear-gradient(135deg,#1f1a0a,#2a240f)'
                : CARD,
      border: `1px solid ${highlight ? G : red ? RED : yellow ? YEL : BORD}`,
      borderRadius: 16, padding: 18, ...style,
    }}>{children}</div>
  )
}

export function Label({ children, color = MUT, style = {} }) {
  return <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color, marginBottom: 10, ...style }}>{children}</div>
}

export function Btn({ children, onClick, disabled, outline, small, danger, loading }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{
      width: '100%',
      background: disabled || loading ? '#1a2a1a' : outline ? 'transparent' : danger ? RED : G,
      color: disabled || loading ? MUT : outline ? G : danger ? '#fff' : '#000',
      border: outline ? `1px solid ${BORD}` : 'none',
      borderRadius: small ? 10 : 14,
      padding: small ? '10px 14px' : '15px',
      fontFamily: bebas, fontSize: small ? 16 : 20,
      letterSpacing: 2, cursor: disabled || loading ? 'not-allowed' : 'pointer',
    }}>{loading ? '...' : children}</button>
  )
}

export function FieldInput({ label, value, onChange, placeholder, type = 'text', hint, unit }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: MUT, marginBottom: 6 }}>{label}</div>}
      <div style={{ position: 'relative' }}>
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          style={{ width: '100%', background: CARD, border: `1px solid ${BORD}`, borderRadius: 12, padding: unit ? '13px 44px 13px 14px' : '13px 14px', color: '#f0f0f0', fontFamily: mono, fontSize: 14, outline: 'none', boxSizing: 'border-box' }} />
        {unit && <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: mono, fontSize: 11, color: MUT }}>{unit}</span>}
      </div>
      {hint && <div style={{ fontFamily: mono, fontSize: 10, color: DIM, marginTop: 5 }}>{hint}</div>}
    </div>
  )
}

export function RingProgress({ value, max, size = 60, stroke = 5, color = G }) {
  const r    = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const pct  = Math.min(Math.max(value / max, 0), 1)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1a2a1a" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  )
}

export function StepDots({ total, current }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 36 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: i === current ? 20 : 6, height: 6, borderRadius: 99, background: i === current ? G : i < current ? '#166534' : DIM, transition: 'all 0.3s' }} />
      ))}
    </div>
  )
}

export function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} style={{ position: 'fixed', top: 20, left: 20, zIndex: 200, background: CARD, border: `1px solid ${BORD}`, borderRadius: 10, padding: '8px 14px', color: MUT, fontFamily: mono, fontSize: 12, cursor: 'pointer' }}>← Back</button>
  )
}

export function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width: 32, height: 32, border: `3px solid ${BORD}`, borderTop: `3px solid ${G}`, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )
}

export function NavBar({ active, setActive }) {
  const items = [
    { id: 'home',      label: 'Home',
      svg: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></> },
    { id: 'nutrition', label: 'Nutrition',
      svg: <><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></> },
    { id: 'workout',   label: 'Workout',
      svg: <path d="M18 20V10M12 20V4M6 20v-6"/> },
    { id: 'pot',       label: 'Pot',
      svg: <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></> },
    { id: 'profile',   label: 'Me',
      svg: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
  ]
  return (
    <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 430, background: 'rgba(8,15,8,0.96)', backdropFilter: 'blur(20px)', borderTop: `1px solid ${BORD}`, display: 'flex', justifyContent: 'space-around', padding: '10px 0 24px', zIndex: 100 }}>
      {items.map(item => (
        <button key={item.id} onClick={() => setActive(item.id)} style={{ background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '4px 10px', color: active === item.id ? G : DIM }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 22, height: 22 }}>{item.svg}</svg>
          <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' }}>{item.label}</span>
        </button>
      ))}
    </div>
  )
}

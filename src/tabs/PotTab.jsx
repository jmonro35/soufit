import { Card, Label, G, MUT, DIM, RED, mono, bebas } from '../ui.jsx'

export default function PotTab({ members, profile, uid }) {
  const sorted   = [...members].sort((a,b) => (b.workouts+b.nutrition)-(a.workouts+a.nutrition))
  const pot      = members.reduce((a,m) => a+(m.owed||0), 0)
  const now      = new Date()
  const weekNum  = Math.ceil(now.getDate() / 7)
  const weeksLeft = Math.max(4 - weekNum, 0)

  return (
    <div style={{ padding: '0 20px 110px' }}>
      <div style={{ paddingTop: 52, paddingBottom: 20 }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase' }}>
          {now.toLocaleDateString('en-US',{month:'long'})} · Week {weekNum}
        </div>
        <div style={{ fontFamily: bebas, fontSize: 44, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1 }}>The Pot</div>
      </div>

      <Card highlight style={{ textAlign: 'center', marginBottom: 20 }}>
        <Label color={G} style={{ textAlign: 'center' }}>Current Pot</Label>
        <div style={{ fontFamily: bebas, fontSize: 72, color: '#f0f0f0', letterSpacing: 2, lineHeight: 1 }}>${pot}</div>
        <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 8 }}>Winner collects end of month</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 28, marginTop: 16 }}>
          {[{label:'Members',val:members.length},{label:'Weeks Left',val:weeksLeft},{label:'Max/person',val:`$${4*10}`}].map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: bebas, fontSize: 26, color: '#f0f0f0' }}>{s.val}</div>
              <div style={{ fontFamily: mono, fontSize: 9, color: MUT, letterSpacing: 1 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Label>Standings</Label>
      {sorted.length === 0 && (
        <Card>
          <div style={{ fontFamily: mono, fontSize: 11, color: MUT, textAlign: 'center' }}>No members yet</div>
        </Card>
      )}
      {sorted.map((m, i) => {
        const score = (m.workouts||0) + (m.nutrition||0)
        const isMe  = m.uid === uid
        return (
          <Card key={m.uid} highlight={isMe} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontFamily: bebas, fontSize: 28, color: i===0?G:DIM, minWidth: 28, textAlign: 'center' }}>{i+1}</div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,#166534,${G})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: bebas, fontSize: 16, color: '#000', flexShrink: 0 }}>{m.name[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: mono, fontSize: 13, color: '#f0f0f0' }}>
                  {m.name}{isMe && <span style={{color:G,fontSize:10}}> ← you</span>}
                </div>
                <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 2 }}>💪 {m.workouts||0}/5 · 🥗 {m.nutrition||0}/5</div>
                <div style={{ background: '#1a2a1a', borderRadius: 99, height: 3, marginTop: 6, overflow: 'hidden' }}>
                  <div style={{ background: i===0?G:'#166534', width: `${(score/10)*100}%`, height: '100%', borderRadius: 99 }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', minWidth: 52 }}>
                {(m.owed||0) > 0
                  ? <div style={{ fontFamily: bebas, fontSize: 22, color: RED }}>-${m.owed}</div>
                  : <div style={{ fontFamily: bebas, fontSize: 22, color: G }}>✓</div>
                }
                <div style={{ fontFamily: mono, fontSize: 9, color: MUT }}>{(m.owed||0)>0?'owed':'clean'}</div>
              </div>
            </div>
            {isMe && (m.owed||0) > 0 && (
              <button
                onClick={() => window.open(`venmo://paycharge?txn=pay&recipients=${profile.groupVenmo?.replace('@','')}&amount=${m.owed}&note=SouFit+pot`, '_blank')}
                style={{ marginTop: 12, width: '100%', background: G, color: '#000', border: 'none', borderRadius: 10, padding: '10px', fontFamily: bebas, fontSize: 16, letterSpacing: 2, cursor: 'pointer' }}
              >
                PAY ${m.owed} VIA VENMO
              </button>
            )}
          </Card>
        )
      })}
    </div>
  )
}

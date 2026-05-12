import { Card, Label, RingProgress, G, BORD, MUT, DIM, RED, YEL, mono, bebas } from '../ui.jsx'
import { getNutritionStatus, getWeekDates, isSameDay, fmt, DAY_LETTERS } from '../utils.js'

export default function HomeTab({ profile, workoutDays, nutritionDays, members, todayCalories }) {
  const dates  = getWeekDates()
  const today  = new Date()
  const wCount = workoutDays.filter(Boolean).length
  const nCount = nutritionDays.filter(Boolean).length
  const pot    = members.reduce((a, m) => a + (m.owed || 0), 0)
  const me     = members.find(m => m.uid === profile.uid) || {}
  const sorted = [...members].sort((a,b) => (b.workouts+b.nutrition)-(a.workouts+a.nutrition))
  const myRank = sorted.findIndex(m => m.uid === profile.uid) + 1
  const status = getNutritionStatus(todayCalories, profile.foodGoal)

  return (
    <div style={{ padding: '0 20px 110px' }}>
      <div style={{ paddingTop: 52, paddingBottom: 20 }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase' }}>Week of {fmt(dates[0])} – {fmt(dates[6])}</div>
        <div style={{ fontFamily: bebas, fontSize: 44, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1 }}>Your Week</div>
      </div>

      {/* Goal rings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {[{label:'Workouts',count:wCount,color:G},{label:'Nutrition',count:nCount,color:'#86efac'}].map(g => (
          <Card key={g.label}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ position: 'relative' }}>
                <RingProgress value={g.count} max={5} color={g.color} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontFamily: bebas, fontSize: 17, color: '#f0f0f0' }}>{g.count}/5</span>
                </div>
              </div>
              <div style={{ fontFamily: mono, fontSize: 10, color: MUT, letterSpacing: 2, textTransform: 'uppercase' }}>{g.label}</div>
              <div style={{ fontFamily: mono, fontSize: 9, color: g.count >= 5 ? G : MUT }}>{g.count >= 5 ? '✓ GOAL MET' : `${5-g.count} to go`}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Day tracker */}
      <Card style={{ marginBottom: 12 }}>
        <Label>This Week</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {dates.map((d, i) => {
            const isToday = isSameDay(d, today)
            const isPast  = d < today && !isToday
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ fontFamily: mono, fontSize: 9, color: isToday ? G : MUT }}>{DAY_LETTERS[i]}</div>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: workoutDays[i] ? G : isToday ? '#1a3a1a' : '#111811', border: isToday ? `1px solid ${G}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
                  {workoutDays[i] ? '💪' : isPast ? <span style={{color:RED,fontSize:10}}>✕</span> : null}
                </div>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: nutritionDays[i] ? '#166534' : isToday ? '#1a3a1a' : '#111811', border: isToday ? `1px solid ${G}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11 }}>
                  {nutritionDays[i] ? <span style={{color:G}}>✓</span> : isPast ? <span style={{color:RED,fontSize:10}}>✕</span> : null}
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 12 }}>
          {[{color:G,label:'Workout'},{color:'#166534',label:'Nutrition'}].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color }} />
              <span style={{ fontFamily: mono, fontSize: 9, color: MUT }}>{l.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Today's calories */}
      <Card red={status==='over'} yellow={status==='under'} highlight={status==='good'} style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Label color={status==='good'?G:status==='over'?RED:YEL}>Today's calories</Label>
            <div style={{ fontFamily: bebas, fontSize: 32, color: '#f0f0f0', lineHeight: 1 }}>{todayCalories.toLocaleString()}</div>
            <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 4 }}>Zone: {(profile.foodGoal-500).toLocaleString()}–{profile.foodGoal.toLocaleString()}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {status==='good'  && <div style={{ fontFamily: bebas, fontSize: 18, color: G }}>ON TRACK ✓</div>}
            {status==='over'  && <div style={{ fontFamily: bebas, fontSize: 18, color: RED }}>OVER ⚠️</div>}
            {status==='under' && todayCalories > 0 && <div style={{ fontFamily: bebas, fontSize: 18, color: YEL }}>TOO LOW ⚠️</div>}
          </div>
        </div>
      </Card>

      {/* Pot card */}
      <Card highlight style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Label color={G}>Monthly Pot</Label>
            <div style={{ fontFamily: bebas, fontSize: 44, color: '#f0f0f0', lineHeight: 1 }}>${pot}</div>
            <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 4 }}>{members.length} members</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: mono, fontSize: 9, color: MUT, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 }}>Your rank</div>
            <div style={{ fontFamily: bebas, fontSize: 48, color: myRank===1?G:'#f0f0f0', lineHeight: 1 }}>#{myRank}</div>
            {me.owed > 0 && <div style={{ fontFamily: mono, fontSize: 10, color: RED, marginTop: 4 }}>-${me.owed} owed</div>}
          </div>
        </div>
        {me.owed > 0 && (
          <button onClick={() => window.open(`venmo://paycharge?txn=pay&recipients=${profile.groupVenmo?.replace('@','')}&amount=${me.owed}&note=SouFit+pot`, '_blank')}
            style={{ marginTop: 14, width: '100%', background: G, color: '#000', border: 'none', borderRadius: 10, padding: '12px', fontFamily: bebas, fontSize: 18, letterSpacing: 2, cursor: 'pointer' }}>
            PAY ${me.owed} VIA VENMO
          </button>
        )}
      </Card>

      {/* Crew feed */}
      <Label>Crew Activity</Label>
      {members.filter(m => m.uid !== profile.uid).slice(0, 6).map((m, i) => (
        <Card key={i} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg,#166534,${G})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: bebas, fontSize: 16, color: '#000' }}>{m.name[0]}</div>
              <div>
                <div style={{ fontFamily: mono, fontSize: 12, color: '#f0f0f0' }}>{m.name}</div>
                <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 2 }}>💪 {m.workouts}/5 · 🥗 {m.nutrition}/5</div>
              </div>
            </div>
            <div style={{ fontFamily: bebas, fontSize: 18, color: m.owed>0?RED:G }}>{m.owed>0?`-$${m.owed}`:'✓'}</div>
          </div>
        </Card>
      ))}
      {members.filter(m => m.uid !== profile.uid).length === 0 && (
        <Card>
          <div style={{ fontFamily: mono, fontSize: 11, color: MUT, textAlign: 'center', lineHeight: 1.6 }}>
            No crew yet — share your group code from the Profile tab to invite friends!
          </div>
        </Card>
      )}
    </div>
  )
}

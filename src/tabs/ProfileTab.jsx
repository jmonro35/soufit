import { useState } from 'react'
import { Card, Label, Btn, G, BORD, MUT, mono, bebas } from '../ui.jsx'

const goalLabel = { maintain: 'Maintain Weight', lose1: 'Lose 1 lb/week', lose2: 'Lose 2 lbs/week', custom: 'Custom' }

export default function ProfileTab({ profile }) {
  const [copied, setCopied] = useState(false)

  const copyCode = () => {
    navigator.clipboard?.writeText(profile.groupCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ padding: '0 20px 110px' }}>
      <div style={{ paddingTop: 52, paddingBottom: 20 }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase' }}>Account</div>
        <div style={{ fontFamily: bebas, fontSize: 44, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1 }}>Profile</div>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#166534,#4ADE80)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: bebas, fontSize: 28, color: '#000' }}>
          {(profile.userName||'?')[0].toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: bebas, fontSize: 28, color: '#f0f0f0', letterSpacing: 1 }}>{profile.userName}</div>
          <div style={{ fontFamily: mono, fontSize: 11, color: MUT, marginTop: 2 }}>{profile.groupName}</div>
        </div>
      </div>

      {/* Calorie plan */}
      <Card highlight style={{ marginBottom: 14 }}>
        <Label color={G}>Your Calorie Plan</Label>
        {[
          { l: 'Goal',           v: goalLabel[profile.weightGoal] || 'Custom' },
          { l: 'Maintenance',    v: `${profile.tdee?.toLocaleString()} kcal/day` },
          { l: 'Food goal',      v: `${profile.foodGoal?.toLocaleString()} kcal/day` },
          { l: 'Green zone',     v: `${(profile.foodGoal-500)?.toLocaleString()} – ${profile.foodGoal?.toLocaleString()} kcal` },
          { l: 'Protein target', v: `${profile.protein}g/day` },
        ].map(r => (
          <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: MUT }}>{r.l}</span>
            <span style={{ fontFamily: mono, fontSize: 11, color: '#f0f0f0' }}>{r.v}</span>
          </div>
        ))}
        <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 6, lineHeight: 1.6, borderTop: `1px solid ${BORD}`, paddingTop: 10 }}>
          {profile.weightGoal === 'lose2' ? 'Exercise burns the other 500 kcal to reach 2 lbs/week total deficit.'
          : profile.weightGoal === 'lose1' ? 'Exercise burns the other 250 kcal to reach 1 lb/week total deficit.'
          : 'Staying at maintenance — keep consistent.'}
        </div>
      </Card>

      {/* Body stats */}
      <Card style={{ marginBottom: 14 }}>
        <Label>Body Stats</Label>
        {[
          { l: 'Weight',   v: `${profile.weightLbs} lbs` },
          { l: 'Height',   v: `${profile.heightFt}'${profile.heightIn}"` },
          { l: 'Age',      v: profile.age },
          { l: 'Activity', v: profile.activity },
          { l: 'Sex',      v: profile.sex },
        ].map(r => (
          <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: MUT }}>{r.l}</span>
            <span style={{ fontFamily: mono, fontSize: 11, color: '#f0f0f0' }}>{r.v}</span>
          </div>
        ))}
      </Card>

      {/* Invite — only show to group creator */}
      {profile.isCreator && (
        <Card highlight style={{ marginBottom: 14 }}>
          <Label color={G}>Invite Friends</Label>
          <div style={{ fontFamily: mono, fontSize: 12, color: '#c0d0c0', marginBottom: 8 }}>Share this code — friends enter it when they join:</div>
          <div style={{ fontFamily: bebas, fontSize: 40, color: G, letterSpacing: 6, textAlign: 'center', padding: '12px 0', marginBottom: 14 }}>{profile.groupCode}</div>
          <Btn small onClick={copyCode}>{copied ? 'COPIED ✓' : 'COPY CODE'}</Btn>
        </Card>
      )}

      {/* Non-creators see their group code too */}
      {!profile.isCreator && (
        <Card style={{ marginBottom: 14 }}>
          <Label>Your Group</Label>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: MUT }}>Group name</span>
            <span style={{ fontFamily: mono, fontSize: 11, color: '#f0f0f0' }}>{profile.groupName}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: mono, fontSize: 11, color: MUT }}>Group code</span>
            <span style={{ fontFamily: mono, fontSize: 11, color: G }}>{profile.groupCode}</span>
          </div>
        </Card>
      )}

      {/* Payment */}
      <Card style={{ marginBottom: 14 }}>
        <Label>Payment</Label>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: MUT }}>Your Venmo</span>
          <span style={{ fontFamily: mono, fontSize: 11, color: '#f0f0f0' }}>{profile.venmo || '—'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: mono, fontSize: 11, color: MUT }}>Pot holder</span>
          <span style={{ fontFamily: mono, fontSize: 11, color: '#f0f0f0' }}>{profile.groupVenmo || '—'}</span>
        </div>
      </Card>

      {/* Rules */}
      <Card>
        <Label>Weekly Rules</Label>
        {[
          'Log 5 workouts with photo proof',
          'Hit food goal 5 of 7 days',
          'Miss workout → $2 to pot',
          'Nutrition goal — no penalty currently',
          'Over ceiling OR under floor = miss',
          'Photos auto-clear each week',
          'Month winner takes the whole pot',
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < 6 ? 10 : 0 }}>
            <span style={{ fontFamily: mono, color: G, fontSize: 11 }}>·</span>
            <span style={{ fontFamily: mono, color: '#c0d0c0', fontSize: 11, lineHeight: 1.5 }}>{r}</span>
          </div>
        ))}
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase.js'
import { calcTDEE, calcFoodGoal, getWeekKey } from './utils.js'
import { Card, Label, Btn, FieldInput, StepDots, BackBtn, G, BORD, MUT, DIM, RED, mono, bebas } from './ui.jsx'

export default function Onboarding({ uid, onComplete }) {
  const [step, setStep]       = useState('welcome')
  const [mode, setMode]       = useState(null)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [userName, setName]   = useState('')
  const [weightLbs, setWeight]= useState('')
  const [heightFt, setHFt]    = useState('')
  const [heightIn, setHIn]    = useState('0')
  const [age, setAge]         = useState('')
  const [sex, setSex]         = useState('female')
  const [activity, setAct]    = useState('moderate')
  const [weightGoal, setWG]   = useState('maintain')
  const [customCal, setCC]    = useState('')
  const [venmo, setVenmo]     = useState('')
  const [joinCode, setJoin]   = useState('')
  const [joinError, setJE]    = useState('')
  const [groupName, setGN]    = useState('')
  const [groupVenmo, setGV]   = useState('')
  const [copied, setCopied]   = useState(false)

  const tdee = weightLbs && heightFt && age
    ? calcTDEE({ weightLbs: Number(weightLbs), heightFt, heightIn, age: Number(age), sex, activity })
    : null
  const foodGoal = tdee
    ? weightGoal === 'custom' ? (Number(customCal) || tdee) : calcFoodGoal(tdee, weightGoal)
    : null

  const hv  = v => setVenmo(!v ? '' : v.startsWith('@') ? v : `@${v}`)
  const hgv = v => setGV(!v ? '' : v.startsWith('@') ? v : `@${v}`)

  const goBack = () => {
    const map = { name:'welcome', body:'name', goals:'body', venmo:'goals', join:'venmo', create:'venmo' }
    setStep(map[step] || 'welcome')
  }

  const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase()

  const buildProfile = (extra = {}) => ({
    userName, weightLbs: Number(weightLbs), heightFt: Number(heightFt),
    heightIn: Number(heightIn), age: Number(age), sex, activity,
    weightGoal, tdee, foodGoal, venmo,
    protein: Math.round(Number(weightLbs) * 0.8),
    carbs: Math.round((foodGoal * 0.4) / 4),
    fat: Math.round((foodGoal * 0.25) / 9),
    ...extra,
  })

  const handleCreate = async () => {
    setSaving(true); setError('')
    try {
      const code = genCode()
      await setDoc(doc(db, 'groups', code), {
        name: groupName, code, potHolder: uid,
        potHolderVenmo: groupVenmo, potHolderName: userName,
        createdAt: serverTimestamp(), month: new Date().toISOString().slice(0, 7), potTotal: 0,
      })
      const profile = buildProfile({ groupCode: code, isCreator: true, groupName, groupVenmo })
      await setDoc(doc(db, 'users', uid), { ...profile, uid, onboarded: true })
      await setDoc(doc(db, 'groups', code, 'members', uid), {
        uid, name: userName, workouts: 0, nutrition: 0, owed: 0,
        venmo, joinedAt: serverTimestamp(), weekKey: getWeekKey(),
      })
      onComplete(profile)
    } catch (e) { setError('Error creating group. Try again.'); setSaving(false) }
  }

  const handleJoin = async () => {
    setSaving(true); setJE('')
    try {
      const code = joinCode.trim().toUpperCase()
      const gSnap = await getDoc(doc(db, 'groups', code))
      if (!gSnap.exists()) { setJE('Group not found. Check the code.'); setSaving(false); return }
      const group = gSnap.data()
      const profile = buildProfile({ groupCode: code, isCreator: false, groupName: group.name, groupVenmo: group.potHolderVenmo })
      await setDoc(doc(db, 'users', uid), { ...profile, uid, onboarded: true })
      await setDoc(doc(db, 'groups', code, 'members', uid), {
        uid, name: userName, workouts: 0, nutrition: 0, owed: 0,
        venmo, joinedAt: serverTimestamp(), weekKey: getWeekKey(),
      })
      onComplete(profile)
    } catch (e) { setJE('Error joining. Try again.'); setSaving(false) }
  }

  const wrap = (content, showBack = true) => (
    <div style={{ background: '#080f08', minHeight: '100vh', maxWidth: 430, margin: '0 auto', padding: '72px 24px 48px', overflowY: 'auto' }}>
      {showBack && <BackBtn onClick={goBack} />}
      {content}
    </div>
  )

  if (step === 'welcome') return (
    <div style={{ background: '#080f08', minHeight: '100vh', maxWidth: 430, margin: '0 auto', padding: '0 24px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div style={{ paddingTop: 80, textAlign: 'center' }}>
        <div style={{ width: 76, height: 76, borderRadius: 22, background: 'linear-gradient(135deg,#0f2a0f,#166534)', border: `1px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 50px #4ADE8033' }}>
          <span style={{ fontFamily: bebas, fontSize: 34, color: G }}>S</span>
        </div>
        <div style={{ fontFamily: bebas, fontSize: 54, color: '#f0f0f0', letterSpacing: 3, lineHeight: 1 }}>SouFit</div>
        <div style={{ fontFamily: mono, fontSize: 11, color: MUT, marginTop: 10, letterSpacing: 2 }}>sweat together. stack the pot.</div>
        <Card style={{ marginTop: 40, textAlign: 'left' }}>
          <Label>How it works</Label>
          {[
            { icon: '💪', text: 'Work out 5x a week & hit your personal nutrition goals 5x a week' },
            { icon: '📸', text: 'Post photo proof of every workout — no proof, no credit' },
            { icon: '💸', text: 'Miss a goal? $5 goes into the group pot' },
            { icon: '🏆', text: "Best record at month's end wins the whole pot" },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < 3 ? 14 : 0 }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ fontFamily: mono, fontSize: 12, color: '#c0d0c0', lineHeight: 1.6 }}>{item.text}</div>
            </div>
          ))}
        </Card>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 36 }}>
        <Btn onClick={() => { setMode('join'); setStep('name') }}>JOIN A GROUP</Btn>
        <Btn outline onClick={() => { setMode('create'); setStep('name') }}>CREATE GROUP</Btn>
      </div>
    </div>
  )

  if (step === 'name') return wrap(<>
    <StepDots total={5} current={0} />
    <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Step 1 of 5</div>
    <div style={{ fontFamily: bebas, fontSize: 42, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 6 }}>What's your name?</div>
    <div style={{ fontFamily: mono, fontSize: 12, color: MUT, marginBottom: 32, lineHeight: 1.6 }}>How your crew sees you on the leaderboard.</div>
    <FieldInput label="Name or nickname" value={userName} onChange={setName} placeholder="e.g. Marcus, Toya…" />
    <Btn onClick={() => setStep('body')} disabled={userName.trim().length < 2}>CONTINUE →</Btn>
  </>)

  if (step === 'body') return wrap(<>
    <StepDots total={5} current={1} />
    <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Step 2 of 5</div>
    <div style={{ fontFamily: bebas, fontSize: 42, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 6 }}>Your stats</div>
    <div style={{ fontFamily: mono, fontSize: 12, color: MUT, marginBottom: 28, lineHeight: 1.6 }}>Used to calculate your personal maintenance calories. Never shared.</div>
    <FieldInput label="Current weight" value={weightLbs} onChange={setWeight} placeholder="165" type="number" unit="lbs" />
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      <FieldInput label="Height ft" value={heightFt} onChange={setHFt} placeholder="5" type="number" unit="ft" />
      <FieldInput label="Height in" value={heightIn} onChange={setHIn} placeholder="8" type="number" unit="in" />
    </div>
    <FieldInput label="Age" value={age} onChange={setAge} placeholder="28" type="number" unit="yrs" />
    <Label style={{ marginBottom: 8 }}>Sex</Label>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
      {[['female','Female'],['male','Male']].map(([v,l]) => (
        <button key={v} onClick={() => setSex(v)} style={{ background: sex===v?'#0f2a0f':'#0c150c', border: `1px solid ${sex===v?G:BORD}`, borderRadius: 10, padding: '12px', color: sex===v?G:'#f0f0f0', fontFamily: mono, fontSize: 12, cursor: 'pointer' }}>{l}</button>
      ))}
    </div>
    <Label style={{ marginBottom: 8 }}>Activity level</Label>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
      {[
        ['sedentary','Sedentary','Desk job, little exercise'],
        ['light','Lightly Active','1–3x exercise/week'],
        ['moderate','Moderately Active','3–5x exercise/week'],
        ['active','Very Active','6–7x exercise/week'],
      ].map(([v,l,d]) => (
        <button key={v} onClick={() => setAct(v)} style={{ background: activity===v?'#0f2a0f':'#0c150c', border: `1px solid ${activity===v?G:BORD}`, borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span style={{ fontFamily: mono, fontSize: 12, color: activity===v?G:'#f0f0f0' }}>{l}</span>
          <span style={{ fontFamily: mono, fontSize: 10, color: MUT }}>{d}</span>
        </button>
      ))}
    </div>
    <Btn onClick={() => setStep('goals')} disabled={!weightLbs || !heightFt || !age}>CONTINUE →</Btn>
  </>)

  if (step === 'goals') return wrap(<>
    <StepDots total={5} current={2} />
    <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Step 3 of 5</div>
    <div style={{ fontFamily: bebas, fontSize: 42, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 6 }}>Your goal</div>
    <div style={{ fontFamily: mono, fontSize: 12, color: MUT, marginBottom: 24, lineHeight: 1.6 }}>Calculated from your maintenance calories.</div>
    <Card highlight style={{ marginBottom: 20, textAlign: 'center' }}>
      <Label color={G} style={{ textAlign: 'center' }}>Your Maintenance Calories</Label>
      <div style={{ fontFamily: bebas, fontSize: 56, color: '#f0f0f0', lineHeight: 1 }}>{tdee?.toLocaleString()}</div>
      <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 4 }}>kcal/day to maintain current weight</div>
    </Card>
    <Label style={{ marginBottom: 8 }}>Weight goal</Label>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
      {[
        ['maintain','Maintain Weight',`Food goal: ${tdee?.toLocaleString()} kcal/day`],
        ['lose1','Lose 1 lb/week',`Food: ${tdee?(tdee-250).toLocaleString():'—'} kcal · exercise burns 250 more`],
        ['lose2','Lose 2 lbs/week',`Food: ${tdee?(tdee-500).toLocaleString():'—'} kcal · exercise burns 500 more`],
        ['custom','Custom','Set your own food calorie target'],
      ].map(([v,l,d]) => (
        <button key={v} onClick={() => setWG(v)} style={{ background: weightGoal===v?'#0f2a0f':'#0c150c', border: `1px solid ${weightGoal===v?G:BORD}`, borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', cursor: 'pointer' }}>
          <span style={{ fontFamily: mono, fontSize: 13, color: weightGoal===v?G:'#f0f0f0' }}>{l}</span>
          <span style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 4 }}>{d}</span>
        </button>
      ))}
    </div>
    {weightGoal === 'custom' && <FieldInput label="Custom daily food calories" value={customCal} onChange={setCC} placeholder={String(tdee||2000)} type="number" unit="kcal" hint={`Between ${tdee?(tdee-500).toLocaleString():'—'} and ${tdee?.toLocaleString()} kcal`} />}
    <Card style={{ marginBottom: 20 }}>
      <Label>Your green zone (nutrition win)</Label>
      <div style={{ fontFamily: mono, fontSize: 11, color: '#c0d0c0', lineHeight: 1.7 }}>
        Miss if over <span style={{color:RED}}>{foodGoal?.toLocaleString()} kcal</span> or under <span style={{color:RED}}>{foodGoal?(foodGoal-500).toLocaleString():'—'} kcal</span>.<br/>
        Green zone: <span style={{color:G}}>{foodGoal?(foodGoal-500).toLocaleString():'—'} – {foodGoal?.toLocaleString()} kcal</span>
      </div>
    </Card>
    <Btn onClick={() => setStep('venmo')} disabled={weightGoal==='custom' && !customCal}>CONTINUE →</Btn>
  </>)

  if (step === 'venmo') return wrap(<>
    <StepDots total={5} current={3} />
    <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Step 4 of 5</div>
    <div style={{ fontFamily: bebas, fontSize: 42, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 6 }}>Your Venmo</div>
    <div style={{ fontFamily: mono, fontSize: 12, color: MUT, marginBottom: 32, lineHeight: 1.6 }}>Miss a goal? App opens Venmo pre-filled to pay the pot.</div>
    <FieldInput label="Venmo username" value={venmo} onChange={hv} placeholder="@yourname" hint="We never store payment info — Venmo handles it" />
    <Card style={{ marginBottom: 20 }}>
      <Label>Pot rules</Label>
      {['Miss workout goal → $5','Miss nutrition goal → $5','Max $10/week per person','Month end → best record wins','Pot holder pays out the winner'].map((s,i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i<4?10:0 }}>
          <span style={{ fontFamily: mono, color: G, fontSize: 11, flexShrink: 0 }}>{String(i+1).padStart(2,'0')}</span>
          <span style={{ fontFamily: mono, color: '#c0d0c0', fontSize: 11, lineHeight: 1.5 }}>{s}</span>
        </div>
      ))}
    </Card>
    <Btn onClick={() => setStep(mode==='join'?'join':'create')} disabled={venmo.length < 2}>CONTINUE →</Btn>
    <button onClick={() => { setVenmo(''); setStep(mode==='join'?'join':'create') }} style={{ width:'100%', background:'none', border:'none', color:MUT, fontFamily:mono, fontSize:11, marginTop:12, cursor:'pointer' }}>Skip for now</button>
  </>)

  if (step === 'join') return wrap(<>
    <StepDots total={5} current={4} />
    <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Step 5 of 5</div>
    <div style={{ fontFamily: bebas, fontSize: 42, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 6 }}>Enter group code</div>
    <div style={{ fontFamily: mono, fontSize: 12, color: MUT, marginBottom: 32, lineHeight: 1.6 }}>6-character code from whoever created the group.</div>
    <FieldInput label="Group code" value={joinCode} onChange={v => { setJoin(v.toUpperCase()); setJE('') }} placeholder="SF7K2A" />
    {joinError && <div style={{ fontFamily: mono, fontSize: 11, color: RED, marginBottom: 12 }}>{joinError}</div>}
    <Btn onClick={handleJoin} disabled={joinCode.trim().length < 4} loading={saving}>JOIN GROUP →</Btn>
  </>)

  if (step === 'create') return wrap(<>
    <StepDots total={5} current={4} />
    <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Step 5 of 5</div>
    <div style={{ fontFamily: bebas, fontSize: 42, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 6 }}>Create group</div>
    <div style={{ fontFamily: mono, fontSize: 12, color: MUT, marginBottom: 32, lineHeight: 1.6 }}>You're the pot holder. Friends pay you on Venmo.</div>
    <FieldInput label="Group name" value={groupName} onChange={setGN} placeholder="e.g. The Crew…" />
    <FieldInput label="Your Venmo (pot holder)" value={groupVenmo} onChange={hgv} placeholder="@yourvenmo" hint="All $5 payments come here — you pay winner at month end" />
    {error && <div style={{ fontFamily: mono, fontSize: 11, color: RED, marginBottom: 12 }}>{error}</div>}
    <Btn onClick={handleCreate} disabled={groupName.trim().length < 2 || groupVenmo.length < 2} loading={saving}>CREATE GROUP →</Btn>
  </>)

  return null
}

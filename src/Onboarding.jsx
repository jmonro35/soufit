import { useState } from 'react'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase.js'
import { calcTDEE, calcFoodGoal, getWeekKey } from './utils.js'
import { Card, Label, Btn, StepDots, BackBtn, G, BORD, MUT, RED, YEL, mono, bebas } from './ui.jsx'

// Generate a random recovery code
function genRecoveryCode() {
  return Math.random().toString(36).substring(2, 6).toUpperCase() +
         Math.random().toString(36).substring(2, 6).toUpperCase()
}

function genGroupCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// Blank number input — no type=number, uses inputMode for mobile keyboards
function NumField({ label, value, onChange, placeholder, unit }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: MUT, marginBottom: 6 }}>{label}</div>
      <div style={{ position: 'relative' }}>
        <input
          inputMode="decimal"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{ width: '100%', background: '#0c150c', border: '1px solid #1e3a1e', borderRadius: 12, padding: unit ? '13px 44px 13px 14px' : '13px 14px', color: '#f0f0f0', fontFamily: mono, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
        />
        {unit && <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontFamily: mono, fontSize: 11, color: MUT }}>{unit}</span>}
      </div>
    </div>
  )
}

function TextField({ label, value, onChange, placeholder, hint }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: MUT, marginBottom: 6 }}>{label}</div>}
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', background: '#0c150c', border: '1px solid #1e3a1e', borderRadius: 12, padding: '13px 14px', color: '#f0f0f0', fontFamily: mono, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
      />
      {hint && <div style={{ fontFamily: mono, fontSize: 10, color: '#2a4a2a', marginTop: 5 }}>{hint}</div>}
    </div>
  )
}

export default function Onboarding({ uid, onComplete }) {
  const [step, setStep]       = useState('welcome')
  const [mode, setMode]       = useState(null)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  // Body / profile fields — all blank by default
  const [userName, setName]   = useState('')
  const [weightLbs, setWeight]= useState('')
  const [heightFt, setHFt]    = useState('')
  const [heightIn, setHIn]    = useState('')
  const [age, setAge]         = useState('')
  const [sex, setSex]         = useState(null)
  const [activity, setAct]    = useState(null)
  const [weightGoal, setWG]   = useState(null)
  const [customCal, setCC]    = useState('')
  const [venmo, setVenmo]     = useState('')
  const [joinCode, setJoin]   = useState('')
  const [joinError, setJE]    = useState('')
  const [groupName, setGN]    = useState('')
  const [groupVenmo, setGV]   = useState('')

  // Recovery code flow
  const [recoveryInput, setRI] = useState('')
  const [recoveryError, setRE] = useState('')
  const [showRecovery, setSR]  = useState(false)
  const [copiedRC, setCopied]  = useState(false)
  const [myRecoveryCode, setMRC] = useState('')

  const tdee = weightLbs && heightFt && age && sex && activity
    ? calcTDEE({ weightLbs: Number(weightLbs), heightFt, heightIn: heightIn || '0', age: Number(age), sex, activity })
    : null

  const foodGoal = tdee && weightGoal
    ? weightGoal === 'custom' ? (Number(customCal) || tdee) : calcFoodGoal(tdee, weightGoal)
    : null

  const hv  = v => setVenmo(!v ? '' : v.startsWith('@') ? v : `@${v}`)
  const hgv = v => setGV(!v ? '' : v.startsWith('@') ? v : `@${v}`)

  const goBack = () => {
    const map = { name:'welcome', body:'name', goals:'body', venmo:'goals', join:'venmo', create:'venmo', recovery:'welcome' }
    setStep(map[step] || 'welcome')
  }

  const buildProfile = (extra = {}) => ({
    userName,
    weightLbs: Number(weightLbs),
    heightFt: Number(heightFt),
    heightIn: Number(heightIn || 0),
    age: Number(age),
    sex, activity, weightGoal, tdee, foodGoal, venmo,
    protein: Math.round(Number(weightLbs) * 0.8),
    carbs: Math.round(((foodGoal || tdee) * 0.4) / 4),
    fat: Math.round(((foodGoal || tdee) * 0.25) / 9),
    ...extra,
  })

  // Restore via recovery code
  const handleRecover = async () => {
    setSaving(true); setRE('')
    try {
      const code = recoveryInput.trim().toUpperCase()
      // Search for user with this recovery code
      const snap = await getDoc(doc(db, 'recoveryCodes', code))
      if (!snap.exists()) { setRE('Code not found. Check for typos.'); setSaving(false); return }
      const { userId } = snap.data()
      const userSnap = await getDoc(doc(db, 'users', userId))
      if (!userSnap.exists()) { setRE('Profile not found. Contact your group admin.'); setSaving(false); return }
      const profile = { ...userSnap.data(), uid: userId }
      onComplete(profile)
    } catch (e) { setRE('Error recovering. Try again.'); setSaving(false) }
  }

  const handleCreate = async () => {
    setSaving(true); setError('')
    try {
      const code = genGroupCode()
      const recoveryCode = genRecoveryCode()
      await setDoc(doc(db, 'groups', code), {
        name: groupName, code, potHolder: uid,
        potHolderVenmo: groupVenmo, potHolderName: userName,
        createdAt: serverTimestamp(), month: new Date().toISOString().slice(0, 7), potTotal: 0,
      })
      const profile = buildProfile({ groupCode: code, isCreator: true, groupName, groupVenmo, recoveryCode })
      await setDoc(doc(db, 'users', uid), { ...profile, uid, onboarded: true, lastWeekKey: getWeekKey() })
      await setDoc(doc(db, 'groups', code, 'members', uid), {
        uid, name: userName, workouts: 0, nutrition: 0, owed: 0,
        venmo, joinedAt: serverTimestamp(), weekKey: getWeekKey(),
      })
      // Save recovery code lookup
      await setDoc(doc(db, 'recoveryCodes', recoveryCode), { userId: uid })
      setMRC(recoveryCode)
      setStep('recoveryShow')
    } catch (e) { setError('Error creating group. Try again.'); setSaving(false) }
  }

  const handleJoin = async () => {
    setSaving(true); setJE('')
    try {
      const code = joinCode.trim().toUpperCase()
      const gSnap = await getDoc(doc(db, 'groups', code))
      if (!gSnap.exists()) { setJE('Group not found. Check the code.'); setSaving(false); return }
      const group = gSnap.data()
      const recoveryCode = genRecoveryCode()
      const profile = buildProfile({ groupCode: code, isCreator: false, groupName: group.name, groupVenmo: group.potHolderVenmo, recoveryCode })
      await setDoc(doc(db, 'users', uid), { ...profile, uid, onboarded: true, lastWeekKey: getWeekKey() })
      await setDoc(doc(db, 'groups', code, 'members', uid), {
        uid, name: userName, workouts: 0, nutrition: 0, owed: 0,
        venmo, joinedAt: serverTimestamp(), weekKey: getWeekKey(),
      })
      await setDoc(doc(db, 'recoveryCodes', recoveryCode), { userId: uid })
      setMRC(recoveryCode)
      setStep('recoveryShow')
    } catch (e) { setJE('Error joining. Try again.'); setSaving(false) }
  }

  const finishOnboarding = () => {
    const profile = buildProfile({
      groupCode: mode === 'create' ? undefined : joinCode.trim().toUpperCase(),
      recoveryCode: myRecoveryCode,
    })
    onComplete(profile)
  }

  const wrap = (content, showBack = true) => (
    <div style={{ background: '#080f08', minHeight: '100vh', maxWidth: 430, margin: '0 auto', padding: '72px 24px 48px', overflowY: 'auto' }}>
      {showBack && <BackBtn onClick={goBack} />}
      {content}
    </div>
  )

  // ── WELCOME ──────────────────────────────────────────────────────────────
  if (step === 'welcome') return (
    <div style={{ background: '#080f08', minHeight: '100vh', maxWidth: 430, margin: '0 auto', overflowY: 'auto' }}>
      <div style={{ padding: '60px 24px 0' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg,#0f2a0f,#166534)', border: `1px solid ${G}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 50px #4ADE8033' }}>
            <span style={{ fontFamily: bebas, fontSize: 34, color: G }}>S</span>
          </div>
          <div style={{ fontFamily: bebas, fontSize: 52, color: '#f0f0f0', letterSpacing: 3, lineHeight: 1 }}>SouFit</div>
          <div style={{ fontFamily: mono, fontSize: 11, color: MUT, marginTop: 8, letterSpacing: 2 }}>sweat together. stack the pot.</div>
        </div>

        {/* Origin story */}
        <Card style={{ marginBottom: 16, borderColor: '#2a4a2a' }}>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#d4a853', marginBottom: 10 }}>The story behind the name</div>
          <div style={{ fontFamily: mono, fontSize: 12, color: '#90b090', lineHeight: 1.8 }}>
            The <span style={{color:G}}>Sou-Sou</span> is a rotating savings tradition born in West Africa and carried through the Caribbean diaspora. A trusted group pools money together — every month, one person wins the whole pot. No banks. No interest. Just <span style={{color:G}}>community, accountability, and trust.</span>
            <br/><br/>
            SouFit runs on that same energy. We all put in the work, hold each other accountable, and at the end of the month the most disciplined person <span style={{color:G}}>takes the pot.</span>
          </div>
        </Card>

        {/* How it works */}
        <Card style={{ marginBottom: 16 }}>
          <Label>How it works</Label>
          {[
            { icon: '💪', text: 'Work out 5x a week & hit your personal nutrition goals 5x a week' },
            { icon: '📸', text: 'Post photo proof of every workout — no proof, no credit' },
            { icon: '💸', text: 'Miss a goal? $5 goes into the group pot' },
            { icon: '🏆', text: "Best record at month's end wins the whole pot" },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: i < 3 ? 12 : 0 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ fontFamily: mono, fontSize: 11, color: '#c0d0c0', lineHeight: 1.6 }}>{item.text}</div>
            </div>
          ))}
        </Card>

        {/* Venmo requirement */}
        <div style={{ background: '#1a1000', border: '1px solid #3a2a00', borderRadius: 12, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <div style={{ fontFamily: mono, fontSize: 11, color: '#d4a853', lineHeight: 1.6 }}>
            <span style={{ color: '#f0f0f0' }}>Venmo required.</span> SouFit uses Venmo to fund the pot. You'll need a Venmo account to participate and pay when you miss a goal.
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div style={{ padding: '0 24px 48px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Btn onClick={() => { setMode('join'); setStep('name') }}>JOIN A GROUP</Btn>
        <Btn outline onClick={() => { setMode('create'); setStep('name') }}>CREATE GROUP</Btn>
        <button onClick={() => setStep('recovery')} style={{ background: 'none', border: 'none', color: MUT, fontFamily: mono, fontSize: 11, marginTop: 4, cursor: 'pointer', letterSpacing: 1 }}>
          Already have an account? Recover →
        </button>
      </div>
    </div>
  )

  // ── RECOVERY ──────────────────────────────────────────────────────────────
  if (step === 'recovery') return wrap(<>
    <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Account Recovery</div>
    <div style={{ fontFamily: bebas, fontSize: 42, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 6 }}>Enter your recovery code</div>
    <div style={{ fontFamily: mono, fontSize: 12, color: MUT, marginBottom: 32, lineHeight: 1.6 }}>Your 8-character code was shown when you first signed up. Enter it to restore your profile on this device.</div>
    <TextField label="Recovery code" value={recoveryInput} onChange={v => { setRI(v.toUpperCase()); setRE('') }} placeholder="XXXX XXXX" />
    {recoveryError && <div style={{ fontFamily: mono, fontSize: 11, color: RED, marginBottom: 12 }}>{recoveryError}</div>}
    <Btn onClick={handleRecover} disabled={recoveryInput.trim().length < 6} loading={saving}>RECOVER ACCOUNT →</Btn>
  </>)

  // ── RECOVERY CODE DISPLAY (after signup) ─────────────────────────────────
  if (step === 'recoveryShow') return (
    <div style={{ background: '#080f08', minHeight: '100vh', maxWidth: 430, margin: '0 auto', padding: '80px 24px 48px', textAlign: 'center' }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔑</div>
      <div style={{ fontFamily: bebas, fontSize: 38, color: '#f0f0f0', letterSpacing: 2, lineHeight: 1, marginBottom: 12 }}>Save your recovery code</div>
      <div style={{ fontFamily: mono, fontSize: 12, color: MUT, marginBottom: 28, lineHeight: 1.6 }}>
        If you ever lose access to the app, this code restores your profile. Screenshot this screen or write it down.
      </div>
      <Card highlight style={{ marginBottom: 24 }}>
        <Label color={G}>Your Recovery Code</Label>
        <div style={{ fontFamily: bebas, fontSize: 44, color: G, letterSpacing: 8, textAlign: 'center', padding: '12px 0' }}>
          {myRecoveryCode.slice(0,4)} {myRecoveryCode.slice(4)}
        </div>
        <div style={{ fontFamily: mono, fontSize: 10, color: MUT, textAlign: 'center', marginTop: 8 }}>Screenshot this — you won't see it again</div>
        <button
          onClick={() => { navigator.clipboard?.writeText(myRecoveryCode); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          style={{ marginTop: 14, width: '100%', background: copiedRC ? '#166534' : '#1a2a1a', color: copiedRC ? G : MUT, border: `1px solid ${copiedRC ? G : '#1e3a1e'}`, borderRadius: 10, padding: '10px', fontFamily: bebas, fontSize: 16, letterSpacing: 2, cursor: 'pointer' }}
        >
          {copiedRC ? 'COPIED ✓' : 'COPY CODE'}
        </button>
      </Card>
      <Btn onClick={finishOnboarding}>I'VE SAVED IT → ENTER APP</Btn>
    </div>
  )

  // ── NAME ──────────────────────────────────────────────────────────────────
  if (step === 'name') return wrap(<>
    <StepDots total={5} current={0} />
    <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Step 1 of 5</div>
    <div style={{ fontFamily: bebas, fontSize: 42, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 6 }}>What's your name?</div>
    <div style={{ fontFamily: mono, fontSize: 12, color: MUT, marginBottom: 32, lineHeight: 1.6 }}>How your crew sees you on the leaderboard.</div>
    <TextField label="Name or nickname" value={userName} onChange={setName} placeholder="" />
    <Btn onClick={() => setStep('body')} disabled={userName.trim().length < 2}>CONTINUE →</Btn>
  </>)

  // ── BODY STATS ────────────────────────────────────────────────────────────
  if (step === 'body') {
    const bodyValid = String(weightLbs).trim() !== '' && String(heightFt).trim() !== '' && String(age).trim() !== '' && sex !== null && activity !== null
    return wrap(<>
      <StepDots total={5} current={1} />
      <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Step 2 of 5</div>
      <div style={{ fontFamily: bebas, fontSize: 42, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 6 }}>Your stats</div>
      <div style={{ fontFamily: mono, fontSize: 12, color: MUT, marginBottom: 28, lineHeight: 1.6 }}>Used to calculate your personal maintenance calories. Never shared.</div>

      <NumField label="Current weight" value={weightLbs} onChange={setWeight} placeholder="" unit="lbs" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <NumField label="Height ft" value={heightFt} onChange={setHFt} placeholder="" unit="ft" />
        <NumField label="Height in" value={heightIn} onChange={setHIn} placeholder="" unit="in" />
      </div>
      <NumField label="Age" value={age} onChange={setAge} placeholder="" unit="yrs" />

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
      <Btn onClick={() => setStep('goals')} disabled={!bodyValid}>CONTINUE →</Btn>
    </>)
  }

  // ── GOALS ─────────────────────────────────────────────────────────────────
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
    {weightGoal === 'custom' && (
      <NumField label="Custom daily food calories" value={customCal} onChange={setCC} placeholder="" unit="kcal" />
    )}
    {foodGoal && (
      <Card style={{ marginBottom: 20 }}>
        <Label>Your green zone (nutrition win)</Label>
        <div style={{ fontFamily: mono, fontSize: 11, color: '#c0d0c0', lineHeight: 1.7 }}>
          Miss if over <span style={{color:RED}}>{foodGoal.toLocaleString()} kcal</span> or under <span style={{color:RED}}>{(foodGoal-500).toLocaleString()} kcal</span>.<br/>
          Green zone: <span style={{color:G}}>{(foodGoal-500).toLocaleString()} – {foodGoal.toLocaleString()} kcal</span>
        </div>
      </Card>
    )}
    <Btn onClick={() => setStep('venmo')} disabled={!weightGoal || (weightGoal==='custom' && !customCal)}>CONTINUE →</Btn>
  </>)

  // ── VENMO ─────────────────────────────────────────────────────────────────
  if (step === 'venmo') return wrap(<>
    <StepDots total={5} current={3} />
    <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Step 4 of 5</div>
    <div style={{ fontFamily: bebas, fontSize: 42, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 6 }}>Your Venmo</div>
    <div style={{ fontFamily: mono, fontSize: 12, color: MUT, marginBottom: 32, lineHeight: 1.6 }}>Miss a goal? App opens Venmo pre-filled to pay the pot.</div>
    <TextField label="Venmo username" value={venmo} onChange={hv} placeholder="" hint="We never store payment info — Venmo handles it" />
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

  // ── JOIN ──────────────────────────────────────────────────────────────────
  if (step === 'join') return wrap(<>
    <StepDots total={5} current={4} />
    <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Step 5 of 5</div>
    <div style={{ fontFamily: bebas, fontSize: 42, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 6 }}>Enter group code</div>
    <div style={{ fontFamily: mono, fontSize: 12, color: MUT, marginBottom: 32, lineHeight: 1.6 }}>6-character code from whoever created the group.</div>
    <TextField label="Group code" value={joinCode} onChange={v => { setJoin(v.toUpperCase()); setJE('') }} placeholder="" />
    {joinError && <div style={{ fontFamily: mono, fontSize: 11, color: RED, marginBottom: 12 }}>{joinError}</div>}
    <Btn onClick={handleJoin} disabled={joinCode.trim().length < 4} loading={saving}>JOIN GROUP →</Btn>
  </>)

  // ── CREATE ────────────────────────────────────────────────────────────────
  if (step === 'create') return wrap(<>
    <StepDots total={5} current={4} />
    <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 }}>Step 5 of 5</div>
    <div style={{ fontFamily: bebas, fontSize: 42, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1.1, marginBottom: 6 }}>Create group</div>
    <div style={{ fontFamily: mono, fontSize: 12, color: MUT, marginBottom: 32, lineHeight: 1.6 }}>You're the pot holder. Friends pay you on Venmo.</div>
    <TextField label="Group name" value={groupName} onChange={setGN} placeholder="" />
    <TextField label="Your Venmo (pot holder)" value={groupVenmo} onChange={hgv} placeholder="" hint="All $5 payments come here — you pay winner at month end" />
    {error && <div style={{ fontFamily: mono, fontSize: 11, color: RED, marginBottom: 12 }}>{error}</div>}
    <Btn onClick={handleCreate} disabled={groupName.trim().length < 2 || groupVenmo.length < 2} loading={saving}>CREATE GROUP →</Btn>
  </>)

  return null
}

import { useState, useEffect } from 'react'
import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { getNutritionStatus, getWeekKey } from '../utils.js'
import { Card, Label, G, BORD, MUT, DIM, RED, YEL, mono, bebas } from '../ui.jsx'

const FOOD_API = 'https://world.openfoodfacts.org/cgi/search.pl'

async function searchFood(query) {
const url = `${FOOD_API}?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=8&fields=product_name,nutriments`
const res  = await fetch(url)
const data = await res.json()
return (data.products || [])
.filter(p => p.product_name && p.nutriments?.['energy-kcal_100g'])
.map(p => ({
name:     p.product_name,
calories: Math.round(p.nutriments['energy-kcal_serving'] || p.nutriments['energy-kcal_100g'] || 0),
protein:  Math.round(p.nutriments['proteins_serving']    || p.nutriments['proteins_100g']    || 0),
}))
.filter(p => p.calories > 0)
.slice(0, 6)
}

function TextField({ label, value, onChange, placeholder }) {
return (
<div style={{ marginBottom: 12 }}>
{label && <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: MUT, marginBottom: 6 }}>{label}</div>}
<input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
style={{ width: '100%', background: '#080f08', border: `1px solid ${BORD}`, borderRadius: 10, padding: '12px 14px', color: '#f0f0f0', fontFamily: mono, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
</div>
)
}

function NumField({ label, value, onChange, placeholder, unit }) {
return (
<div style={{ marginBottom: 12 }}>
{label && <div style={{ fontFamily: mono, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: MUT, marginBottom: 6 }}>{label}</div>}
<div style={{ position: 'relative' }}>
<input inputMode=“decimal” value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
style={{ width: '100%', background: '#080f08', border: `1px solid ${BORD}`, borderRadius: 10, padding: unit ? '12px 40px 12px 14px' : '12px 14px', color: '#f0f0f0', fontFamily: mono, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
{unit && <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: mono, fontSize: 11, color: MUT }}>{unit}</span>}
</div>
</div>
)
}

export default function NutritionTab({ profile, uid, nutritionDays, setNutritionDays, todayCalories, setTodayCalories }) {
const today    = new Date()
const todayIdx = (today.getDay() + 6) % 7
const weekKey  = getWeekKey()
const todayStr = today.toISOString().split('T')[0]

const [log, setLog]           = useState([])
const [mode, setMode]         = useState(null) // null | 'search' | 'manual'
const [searchQ, setSearchQ]   = useState('')
const [results, setResults]   = useState([])
const [searching, setSearching] = useState(false)
const [searchErr, setSearchErr] = useState('')
const [manualName, setMN]     = useState('')
const [manualCal, setMC]      = useState('')
const [manualProtein, setMP]  = useState('')
const [saving, setSaving]     = useState(false)

const goal         = profile.foodGoal || 2000
const floor        = goal - 500
const status       = getNutritionStatus(todayCalories, goal)
const alreadyLogged = nutritionDays[todayIdx]
const proteinLogged = log.reduce((a, f) => a + (f.protein || 0), 0)

// Live food log listener
useEffect(() => {
const q = query(
collection(db, 'users', uid, 'foodLog'),
where('date', '==', todayStr),
orderBy('createdAt', 'asc')
)
const unsub = onSnapshot(q, snap => {
const items = snap.docs.map(d => ({ id: d.id, …d.data() }))
setLog(items)
setTodayCalories(items.reduce((a, f) => a + (f.calories || 0), 0))
})
return () => unsub()
}, [uid, todayStr])

const saveFood = async (name, calories, protein) => {
if (!name || !calories) return
setSaving(true)
await addDoc(collection(db, 'users', uid, 'foodLog'), {
name,
calories: Number(calories),
protein:  Number(protein) || 0,
date: todayStr,
createdAt: serverTimestamp(),
time: today.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
})
setMode(null)
setSearchQ(''); setResults([]); setSearchErr('')
setMN(''); setMC(''); setMP('')
setSaving(false)
}

const handleSearch = async () => {
if (!searchQ.trim()) return
setSearching(true); setSearchErr(''); setResults([])
try {
const r = await searchFood(searchQ)
if (r.length === 0) setSearchErr('No results. Try a different name or add manually.')
setResults(r)
} catch (e) {
setSearchErr('Search failed. Check your connection or add manually.')
}
setSearching(false)
}

const markToday = async () => {
if (status !== 'good' || alreadyLogged) return
const updated = […nutritionDays]
updated[todayIdx] = true
setNutritionDays(updated)
await updateDoc(doc(db, 'groups', profile.groupCode, 'members', uid), { nutrition: updated.filter(Boolean).length })
await setDoc(doc(db, 'users', uid, 'weeklyNutrition', weekKey), { days: updated })
}

return (
<div style={{ padding: '0 20px 110px' }}>
<div style={{ paddingTop: 52, paddingBottom: 20 }}>
<div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase' }}>Today</div>
<div style={{ fontFamily: bebas, fontSize: 44, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1 }}>Nutrition</div>
</div>

```
  {/* Status banners */}
  {!alreadyLogged && status === 'good' && todayCalories > 0 && (
    <Card highlight style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: bebas, fontSize: 20, color: G }}>In the green zone 🎉</div>
          <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 2 }}>Mark this day complete</div>
        </div>
        <button onClick={markToday} style={{ background: G, color: '#000', border: 'none', borderRadius: 10, padding: '10px 14px', fontFamily: bebas, fontSize: 16, letterSpacing: 1, cursor: 'pointer' }}>MARK ✓</button>
      </div>
    </Card>
  )}
  {status === 'over' && (
    <Card red style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: bebas, fontSize: 20, color: RED }}>Over calorie goal ⚠️</div>
      <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 2 }}>{(todayCalories-goal).toLocaleString()} kcal over — today won't count</div>
    </Card>
  )}
  {status === 'under' && todayCalories > 0 && (
    <Card yellow style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: bebas, fontSize: 20, color: YEL }}>Deficit too large ⚠️</div>
      <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 2 }}>Eat at least {floor.toLocaleString()} kcal. Extra deficit should come from exercise.</div>
    </Card>
  )}
  {alreadyLogged && (
    <Card highlight style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: bebas, fontSize: 20, color: G }}>✓ Day logged</div>
      <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 2 }}>Nutrition counted for today</div>
    </Card>
  )}

  {/* Calories bar */}
  <Card style={{ marginBottom: 10 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontFamily: mono, fontSize: 12, color: '#f0f0f0' }}>Calories</span>
      <span style={{ fontFamily: mono, fontSize: 12, color: MUT }}>{todayCalories.toLocaleString()}<span style={{color:DIM}}>/{goal.toLocaleString()} kcal</span></span>
    </div>
    <div style={{ background: '#1a2a1a', borderRadius: 99, height: 8, overflow: 'hidden' }}>
      <div style={{ background: status==='good'?G:status==='over'?RED:YEL, width: `${Math.min((todayCalories/goal)*100,100)}%`, height: '100%', borderRadius: 99, transition: 'width 0.6s' }} />
    </div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
      <span style={{ fontFamily: mono, fontSize: 9, color: YEL }}>Floor: {floor.toLocaleString()}</span>
      <span style={{ fontFamily: mono, fontSize: 9, color: G }}>Ceiling: {goal.toLocaleString()}</span>
    </div>
  </Card>

  {/* Protein bar */}
  <Card style={{ marginBottom: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
      <span style={{ fontFamily: mono, fontSize: 12, color: '#f0f0f0' }}>Protein</span>
      <span style={{ fontFamily: mono, fontSize: 12, color: MUT }}>{proteinLogged}g<span style={{color:DIM}}>/{profile.protein}g</span></span>
    </div>
    <div style={{ background: '#1a2a1a', borderRadius: 99, height: 8, overflow: 'hidden' }}>
      <div style={{ background: '#86efac', width: `${Math.min((proteinLogged/profile.protein)*100,100)}%`, height: '100%', borderRadius: 99, transition: 'width 0.6s' }} />
    </div>
  </Card>

  {/* Add food buttons */}
  {mode === null && (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
      <button onClick={() => setMode('search')} style={{ background: G, color: '#000', border: 'none', borderRadius: 12, padding: '14px', fontFamily: bebas, fontSize: 17, letterSpacing: 1, cursor: 'pointer' }}>🔍 SEARCH FOOD</button>
      <button onClick={() => setMode('manual')} style={{ background: 'transparent', color: G, border: `1px solid ${BORD}`, borderRadius: 12, padding: '14px', fontFamily: bebas, fontSize: 17, letterSpacing: 1, cursor: 'pointer' }}>+ ADD MANUAL</button>
    </div>
  )}

  {/* Search mode */}
  {mode === 'search' && (
    <Card style={{ marginBottom: 12 }}>
      <Label>Search Food</Label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <input
          value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder="e.g. chicken breast, banana…"
          style={{ flex: 1, background: '#080f08', border: `1px solid ${BORD}`, borderRadius: 10, padding: '12px 14px', color: '#f0f0f0', fontFamily: mono, fontSize: 13, outline: 'none' }}
        />
        <button onClick={handleSearch} disabled={searching} style={{ background: G, color: '#000', border: 'none', borderRadius: 10, padding: '0 16px', fontFamily: bebas, fontSize: 16, cursor: 'pointer' }}>
          {searching ? '…' : 'GO'}
        </button>
      </div>
      {searchErr && <div style={{ fontFamily: mono, fontSize: 10, color: YEL, marginBottom: 8 }}>{searchErr}</div>}
      {results.map((r, i) => (
        <button key={i} onClick={() => saveFood(r.name, r.calories, r.protein)}
          style={{ width: '100%', background: '#080f08', border: `1px solid ${BORD}`, borderRadius: 10, padding: '10px 14px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontFamily: mono, fontSize: 12, color: '#f0f0f0' }}>{r.name.length > 30 ? r.name.slice(0,30)+'…' : r.name}</div>
            <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 2 }}>{r.protein}g protein</div>
          </div>
          <div style={{ fontFamily: bebas, fontSize: 20, color: G, flexShrink: 0, marginLeft: 10 }}>{r.calories} kcal</div>
        </button>
      ))}
      <button onClick={() => { setMode(null); setResults([]); setSearchQ('') }} style={{ width: '100%', background: 'none', border: 'none', color: MUT, fontFamily: mono, fontSize: 11, marginTop: 6, cursor: 'pointer' }}>CANCEL</button>
    </Card>
  )}

  {/* Manual mode */}
  {mode === 'manual' && (
    <Card style={{ marginBottom: 12 }}>
      <Label>Add Manually</Label>
      <TextField label="Food name" value={manualName} onChange={setMN} placeholder="" />
      <NumField label="Calories" value={manualCal} onChange={setMC} placeholder="" unit="kcal" />
      <NumField label="Protein (optional)" value={manualProtein} onChange={setMP} placeholder="" unit="g" />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={() => saveFood(manualName, manualCal, manualProtein)} disabled={saving || !manualName || !manualCal}
          style={{ flex: 1, background: G, color: '#000', border: 'none', borderRadius: 10, padding: '12px', fontFamily: bebas, fontSize: 16, letterSpacing: 1, cursor: 'pointer' }}>
          {saving ? '...' : 'ADD'}
        </button>
        <button onClick={() => { setMode(null); setMN(''); setMC(''); setMP('') }}
          style={{ flex: 1, background: 'transparent', color: MUT, border: `1px solid ${BORD}`, borderRadius: 10, padding: '12px', fontFamily: bebas, fontSize: 16, letterSpacing: 1, cursor: 'pointer' }}>
          CANCEL
        </button>
      </div>
    </Card>
  )}

  {/* Food log */}
  <Label>Today's Log</Label>
  {log.length === 0
    ? <div style={{ fontFamily: mono, fontSize: 11, color: DIM, textAlign: 'center', paddingTop: 12 }}>Nothing logged yet — search or add your first meal!</div>
    : log.map((food, i) => (
      <Card key={i} style={{ marginBottom: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: mono, fontSize: 13, color: '#f0f0f0' }}>{food.name}</div>
            <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 3 }}>{food.time} · {food.protein || 0}g protein</div>
          </div>
          <span style={{ fontFamily: bebas, fontSize: 22, color: G }}>{food.calories}</span>
        </div>
      </Card>
    ))
  }

  {/* Green zone */}
  <Card style={{ marginTop: 12 }}>
    <Label>Your green zone</Label>
    <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: 12 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: bebas, fontSize: 24, color: YEL }}>{floor.toLocaleString()}</div>
        <div style={{ fontFamily: mono, fontSize: 9, color: MUT }}>min (floor)</div>
      </div>
      <div style={{ fontFamily: bebas, fontSize: 24, color: MUT, alignSelf: 'center' }}>–</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: bebas, fontSize: 24, color: G }}>{goal.toLocaleString()}</div>
        <div style={{ fontFamily: mono, fontSize: 9, color: MUT }}>max (ceiling)</div>
      </div>
    </div>
    <div style={{ fontFamily: mono, fontSize: 10, color: MUT, lineHeight: 1.6, textAlign: 'center' }}>
      Over ceiling = miss · Under floor = miss<br/>Extra deficit should come from exercise
    </div>
  </Card>
</div>
```

)
}

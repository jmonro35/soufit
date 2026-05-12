import { useState, useEffect } from 'react'
import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { getNutritionStatus, getWeekKey } from '../utils.js'
import { Card, Label, FieldInput, G, BORD, MUT, DIM, RED, YEL, mono, bebas } from '../ui.jsx'

export default function NutritionTab({ profile, uid, nutritionDays, setNutritionDays, todayCalories, setTodayCalories }) {
  const today    = new Date()
  const todayIdx = (today.getDay() + 6) % 7
  const weekKey  = getWeekKey()
  const todayStr = today.toISOString().split('T')[0]

  const [log, setLog]         = useState([])
  const [adding, setAdding]   = useState(false)
  const [foodName, setFN]     = useState('')
  const [foodCal, setFC]      = useState('')
  const [saving, setSaving]   = useState(false)

  const goal   = profile.foodGoal || 2000
  const floor  = goal - 500
  const status = getNutritionStatus(todayCalories, goal)
  const alreadyLogged = nutritionDays[todayIdx]
  const proteinLogged = log.reduce((a,f) => a + (f.protein || 0), 0)

  useEffect(() => {
    const q = query(
      collection(db, 'users', uid, 'foodLog'),
      where('date', '==', todayStr),
      orderBy('createdAt', 'asc')
    )
    const unsub = onSnapshot(q, snap => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      setLog(items)
      setTodayCalories(items.reduce((a,f) => a + (f.calories || 0), 0))
    })
    return () => unsub()
  }, [uid, todayStr])

  const addFood = async () => {
    if (!foodName.trim() || !foodCal) return
    setSaving(true)
    await addDoc(collection(db, 'users', uid, 'foodLog'), {
      name: foodName, calories: Number(foodCal),
      protein: Math.round(Number(foodCal) * 0.15 / 4),
      date: todayStr, createdAt: serverTimestamp(),
      time: today.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    })
    setFN(''); setFC(''); setAdding(false); setSaving(false)
  }

  const markToday = async () => {
    if (status !== 'good' || alreadyLogged) return
    const updated = [...nutritionDays]
    updated[todayIdx] = true
    setNutritionDays(updated)
    await updateDoc(doc(db, 'groups', profile.groupCode, 'members', uid), {
      nutrition: updated.filter(Boolean).length
    })
    await setDoc(doc(db, 'users', uid, 'weeklyNutrition', weekKey), { days: updated })
  }

  return (
    <div style={{ padding: '0 20px 110px' }}>
      <div style={{ paddingTop: 52, paddingBottom: 20 }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase' }}>Today</div>
        <div style={{ fontFamily: bebas, fontSize: 44, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1 }}>Nutrition</div>
      </div>

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

      {/* Add food */}
      {adding ? (
        <Card style={{ marginBottom: 12 }}>
          <Label>Add Food</Label>
          <FieldInput label="Food name" value={foodName} onChange={setFN} placeholder="e.g. Grilled Chicken" />
          <FieldInput label="Calories" value={foodCal} onChange={setFC} placeholder="350" type="number" unit="kcal" />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={addFood} disabled={saving} style={{ flex: 1, background: G, color: '#000', border: 'none', borderRadius: 10, padding: '12px', fontFamily: bebas, fontSize: 16, letterSpacing: 1, cursor: 'pointer' }}>{saving ? '...' : 'ADD'}</button>
            <button onClick={() => setAdding(false)} style={{ flex: 1, background: 'transparent', color: MUT, border: `1px solid ${BORD}`, borderRadius: 10, padding: '12px', fontFamily: bebas, fontSize: 16, letterSpacing: 1, cursor: 'pointer' }}>CANCEL</button>
          </div>
        </Card>
      ) : (
        <button onClick={() => setAdding(true)} style={{ width: '100%', background: G, color: '#000', border: 'none', borderRadius: 14, padding: '14px', fontFamily: bebas, fontSize: 18, letterSpacing: 2, cursor: 'pointer', marginBottom: 12 }}>+ LOG FOOD</button>
      )}

      {/* Food log */}
      <Label>Today's Log</Label>
      {log.length === 0
        ? <div style={{ fontFamily: mono, fontSize: 11, color: DIM, textAlign: 'center', paddingTop: 12 }}>Nothing logged yet — add your first meal!</div>
        : log.map((food, i) => (
          <Card key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: mono, fontSize: 13, color: '#f0f0f0' }}>{food.name}</div>
                <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 3 }}>{food.time} · {food.protein||0}g protein</div>
              </div>
              <span style={{ fontFamily: bebas, fontSize: 22, color: G }}>{food.calories}</span>
            </div>
          </Card>
        ))
      }

      {/* Green zone reminder */}
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
  )
}

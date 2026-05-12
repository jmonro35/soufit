import { useState, useEffect, useCallback } from 'react'
import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { uploadPhoto } from '../cloudinary.js'
import { getWeekKey } from '../utils.js'
import { Card, Label, Btn, RingProgress, G, BORD, MUT, DIM, mono, bebas } from '../ui.jsx'

export default function WorkoutTab({ profile, uid, workoutDays, setWorkoutDays }) {
  const today    = new Date()
  const todayIdx = (today.getDay() + 6) % 7
  const weekKey  = getWeekKey()

  const [photo, setPhoto]       = useState(null)
  const [photoBlob, setBlob]    = useState(null)
  const [selectedType, setType] = useState(null)
  const [justLogged, setLogged] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recentWorkouts, setRecent] = useState([])

  useEffect(() => {
    const q = query(
      collection(db, 'users', uid, 'workouts'),
      where('weekKey', '==', weekKey),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => setRecent(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => unsub()
  }, [uid, weekKey])

  const handlePaste = useCallback(e => {
    const items = e.clipboardData?.items
    if (!items) return
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const blob = item.getAsFile()
        setPhoto(URL.createObjectURL(blob))
        setBlob(blob)
        break
      }
    }
  }, [])

  const handleLog = async () => {
    if (!selectedType) return
    setUploading(true)
    try {
      let photoUrl = null
      if (photoBlob) {
        const result = await uploadPhoto(photoBlob)
        photoUrl = result.url
      }
      const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
      const updated = [...workoutDays]
      updated[todayIdx] = true
      setWorkoutDays(updated)
      await addDoc(collection(db, 'users', uid, 'workouts'), {
        type: selectedType, day: days[todayIdx], weekKey,
        photoUrl, createdAt: serverTimestamp(),
        date: today.toISOString().split('T')[0],
      })
      await updateDoc(doc(db, 'groups', profile.groupCode, 'members', uid), {
        workouts: updated.filter(Boolean).length
      })
      await setDoc(doc(db, 'users', uid, 'weeklyWorkouts', weekKey), { days: updated })
      setLogged(true); setPhoto(null); setBlob(null); setType(null)
      setTimeout(() => setLogged(false), 4000)
    } catch (e) {
      alert('Error logging workout. Check your connection and try again.')
    }
    setUploading(false)
  }

  const wCount = workoutDays.filter(Boolean).length

  return (
    <div style={{ padding: '0 20px 110px' }}>
      <div style={{ paddingTop: 52, paddingBottom: 20 }}>
        <div style={{ fontFamily: mono, fontSize: 11, color: G, letterSpacing: 3, textTransform: 'uppercase' }}>Log It</div>
        <div style={{ fontFamily: bebas, fontSize: 44, color: '#f0f0f0', letterSpacing: 1.5, lineHeight: 1 }}>Workout</div>
      </div>

      {/* Week progress */}
      <Card style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative' }}>
          <RingProgress value={wCount} max={5} size={56} stroke={4} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: bebas, fontSize: 16, color: '#f0f0f0' }}>{wCount}/5</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: bebas, fontSize: 22, color: '#f0f0f0', letterSpacing: 1 }}>
            {wCount >= 5 ? 'Week complete! 🎉' : `${5-wCount} workouts left`}
          </div>
          <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 2 }}>Goal: 5 sessions/week</div>
        </div>
      </Card>

      {justLogged && (
        <Card highlight style={{ marginBottom: 14 }}>
          <div style={{ fontFamily: bebas, fontSize: 20, color: G }}>✓ Workout logged!</div>
          <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 2 }}>Keep grinding 💪</div>
        </Card>
      )}

      {/* Photo paste zone */}
      <div onPaste={handlePaste} tabIndex={0} style={{ background: photo?'transparent':'#0c150c', border: `2px dashed ${photo?G:'#1e3a1e'}`, borderRadius: 16, minHeight: 160, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 12, outline: 'none', overflow: 'hidden' }}>
        {photo
          ? <img src={photo} alt="Workout proof" style={{ width: '100%', borderRadius: 14, display: 'block' }} />
          : <>
              <span style={{ fontSize: 32, marginBottom: 10 }}>📸</span>
              <div style={{ fontFamily: mono, fontSize: 12, color: G }}>Tap then paste your photo</div>
              <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 4 }}>No camera access · proof saves to group</div>
            </>
        }
      </div>
      {photo && (
        <button onClick={() => { setPhoto(null); setBlob(null) }} style={{ background: 'none', border: 'none', color: MUT, fontFamily: mono, fontSize: 10, cursor: 'pointer', marginBottom: 10 }}>✕ Remove photo</button>
      )}

      {/* Workout type */}
      <Label>Workout type</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {['Weights','Cardio','HIIT','Sports','Yoga','Other'].map(t => (
          <button key={t} onClick={() => setType(t)} style={{ background: selectedType===t?'#0f2a0f':'#0c150c', border: `1px solid ${selectedType===t?G:'#1e3a1e'}`, borderRadius: 10, padding: '13px', color: selectedType===t?G:'#f0f0f0', fontFamily: mono, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>{t}</button>
        ))}
      </div>

      <Btn onClick={handleLog} disabled={!selectedType} loading={uploading}>
        {uploading ? 'UPLOADING PHOTO…' : 'LOG WORKOUT ✓'}
      </Btn>

      {/* Recent */}
      <Label style={{ marginTop: 24 }}>This Week</Label>
      {recentWorkouts.length === 0
        ? <div style={{ fontFamily: mono, fontSize: 11, color: DIM, textAlign: 'center', paddingTop: 12 }}>No workouts logged yet this week</div>
        : recentWorkouts.map((w, i) => (
          <Card key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: mono, fontSize: 13, color: '#f0f0f0' }}>{w.type}</div>
                <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 3 }}>{w.day}{w.photoUrl ? ' · 📸 proof uploaded' : ''}</div>
              </div>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: G, marginTop: 4 }} />
            </div>
            {w.photoUrl && <img src={w.photoUrl} alt="Workout proof" style={{ width: '100%', borderRadius: 10, marginTop: 10 }} />}
          </Card>
        ))
      }
    </div>
  )
}

import { useState, useEffect, useCallback, useRef } from 'react'
import { collection, addDoc, query, where, orderBy, onSnapshot, updateDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase.js'
import { uploadPhoto } from '../cloudinary.js'
import { getWeekKey } from '../utils.js'
import { Card, Label, Btn, RingProgress, G, BORD, MUT, DIM, mono, bebas } from '../ui.jsx'

export default function WorkoutTab({ profile, uid, workoutDays, setWorkoutDays }) {
  const today    = new Date()
  const todayIdx = (today.getDay() + 6) % 7
  const weekKey  = getWeekKey()
  const fileRef  = useRef(null)

  const [photo, setPhoto]         = useState(null)
  const [photoBlob, setBlob]      = useState(null)
  const [selectedType, setType]   = useState(null)
  const [justLogged, setLogged]   = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recentWorkouts, setRecent] = useState([])
  const [pasteHint, setPasteHint] = useState(false)

  useEffect(() => {
    const q = query(
      collection(db, 'users', uid, 'workouts'),
      where('weekKey', '==', weekKey),
      orderBy('createdAt', 'desc')
    )
    const unsub = onSnapshot(q, snap => setRecent(snap.docs.map(d => ({ id: d.id, ...d.data() }))))
    return () => unsub()
  }, [uid, weekKey])

  // Global paste listener — catches paste anywhere on the page
  useEffect(() => {
    const handleGlobalPaste = e => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile()
          if (blob) {
            setPhoto(URL.createObjectURL(blob))
            setBlob(blob)
          }
          break
        }
      }
    }
    window.addEventListener('paste', handleGlobalPaste)
    return () => window.removeEventListener('paste', handleGlobalPaste)
  }, [])

  // File input fallback for mobile
  const handleFileInput = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(URL.createObjectURL(file))
    setBlob(file)
  }

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
      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

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

      {/* Photo zone */}
      {photo ? (
        <div style={{ marginBottom: 12, position: 'relative' }}>
          <img src={photo} alt="Workout proof" style={{ width: '100%', borderRadius: 14, display: 'block' }} />
          <button onClick={() => { setPhoto(null); setBlob(null) }}
            style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 8, padding: '6px 12px', color: '#f0f0f0', fontFamily: mono, fontSize: 11, cursor: 'pointer' }}>
            ✕ Remove
          </button>
        </div>
      ) : (
        <div style={{ marginBottom: 12 }}>
          {/* Primary: file picker (works on all mobile) */}
          <button
            onClick={() => fileRef.current?.click()}
            style={{ width: '100%', background: '#0c150c', border: `2px dashed ${BORD}`, borderRadius: 16, padding: '32px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          >
            <span style={{ fontSize: 32 }}>📸</span>
            <div style={{ fontFamily: bebas, fontSize: 20, color: G, letterSpacing: 1 }}>ADD PHOTO PROOF</div>
            <div style={{ fontFamily: mono, fontSize: 10, color: MUT }}>Tap to choose from your photo library</div>
          </button>
          {/* Secondary: paste hint for desktop */}
          <div style={{ fontFamily: mono, fontSize: 10, color: DIM, textAlign: 'center', marginTop: 8 }}>
            On desktop you can also copy a photo and press Ctrl+V anywhere on this page
          </div>
        </div>
      )}

      {/* Workout type */}
      <Label>Workout type</Label>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {['Weights','Cardio','HIIT','Sports','Yoga','Other'].map(t => (
          <button key={t} onClick={() => setType(t)}
            style={{ background: selectedType===t?'#0f2a0f':'#0c150c', border: `1px solid ${selectedType===t?G:'#1e3a1e'}`, borderRadius: 10, padding: '13px', color: selectedType===t?G:'#f0f0f0', fontFamily: mono, fontSize: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
            {t}
          </button>
        ))}
      </div>

      <Btn onClick={handleLog} disabled={!selectedType} loading={uploading}>
        {uploading ? 'UPLOADING PHOTO…' : 'LOG WORKOUT ✓'}
      </Btn>

      <Label style={{ marginTop: 24 }}>This Week</Label>
      {recentWorkouts.length === 0
        ? <div style={{ fontFamily: mono, fontSize: 11, color: DIM, textAlign: 'center', paddingTop: 12 }}>No workouts logged yet this week</div>
        : recentWorkouts.map((w, i) => (
          <Card key={i} style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: mono, fontSize: 13, color: '#f0f0f0' }}>{w.type}</div>
                <div style={{ fontFamily: mono, fontSize: 10, color: MUT, marginTop: 3 }}>{w.day}{w.photoUrl ? ' · 📸 proof uploaded' : ' · no photo'}</div>
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

import { useState, useEffect, useCallback } from 'react'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore'
import { auth, db } from './firebase.js'
import { getWeekKey } from './utils.js'
import { NavBar, Spinner, G, BG, bebas } from './ui.jsx'
import Onboarding from './Onboarding.jsx'
import HomeTab from './tabs/HomeTab.jsx'
import NutritionTab from './tabs/NutritionTab.jsx'
import WorkoutTab from './tabs/WorkoutTab.jsx'
import PotTab from './tabs/PotTab.jsx'
import ProfileTab from './tabs/ProfileTab.jsx'

export default function App() {
  const [uid, setUid]               = useState(null)
  const [profile, setProfile]       = useState(null)
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState('home')
  const [workoutDays, setWDays]     = useState(Array(7).fill(false))
  const [nutritionDays, setNDays]   = useState(Array(7).fill(false))
  const [todayCalories, setTodayCal]= useState(0)
  const [members, setMembers]       = useState([])

  // Anonymous auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (!user) {
        const result = await signInAnonymously(auth)
        setUid(result.user.uid)
      } else {
        setUid(user.uid)
      }
    })
    return () => unsub()
  }, [])

  // Load profile once uid is ready
  useEffect(() => {
    if (!uid) return
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        if (snap.exists() && snap.data().onboarded) {
          const p = { ...snap.data(), uid }
          setProfile(p)
          await loadWeeklyData(uid)
        }
      } catch (e) {
        console.error('Error loading profile:', e)
      }
      setLoading(false)
    }
    load()
  }, [uid])

  const loadWeeklyData = async (userId) => {
    const weekKey = getWeekKey()
    try {
      const [wSnap, nSnap] = await Promise.all([
        getDoc(doc(db, 'users', userId, 'weeklyWorkouts', weekKey)),
        getDoc(doc(db, 'users', userId, 'weeklyNutrition', weekKey)),
      ])
      if (wSnap.exists()) setWDays(wSnap.data().days || Array(7).fill(false))
      if (nSnap.exists()) setNDays(nSnap.data().days || Array(7).fill(false))
    } catch (e) {
      console.error('Error loading weekly data:', e)
    }
  }

  // Live group members
  useEffect(() => {
    if (!profile?.groupCode) return
    const unsub = onSnapshot(
      collection(db, 'groups', profile.groupCode, 'members'),
      snap => setMembers(snap.docs.map(d => ({ uid: d.id, ...d.data() })))
    )
    return () => unsub()
  }, [profile?.groupCode])

  const handleOnboardingComplete = useCallback(async (p) => {
    const fullProfile = { ...p, uid }
    setProfile(fullProfile)
    await loadWeeklyData(uid)
  }, [uid])

  // Loading screen
  if (loading || !uid) return (
    <div style={{ background: BG, minHeight: '100vh', maxWidth: 430, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <div style={{ fontFamily: bebas, fontSize: 42, color: G, letterSpacing: 3 }}>SOUFIT</div>
      <Spinner />
    </div>
  )

  // Onboarding
  if (!profile) return <Onboarding uid={uid} onComplete={handleOnboardingComplete} />

  // Main app
  return (
    <div style={{ background: BG, minHeight: '100vh', maxWidth: 430, margin: '0 auto', position: 'relative' }}>
      {tab === 'home'      && <HomeTab profile={profile} workoutDays={workoutDays} nutritionDays={nutritionDays} members={members} todayCalories={todayCalories} />}
      {tab === 'nutrition' && <NutritionTab profile={profile} uid={uid} nutritionDays={nutritionDays} setNutritionDays={setNDays} todayCalories={todayCalories} setTodayCalories={setTodayCal} />}
      {tab === 'workout'   && <WorkoutTab profile={profile} uid={uid} workoutDays={workoutDays} setWorkoutDays={setWDays} />}
      {tab === 'pot'       && <PotTab members={members} profile={profile} uid={uid} />}
      {tab === 'profile'   && <ProfileTab profile={profile} />}
      <NavBar active={tab} setActive={setTab} />
    </div>
  )
}

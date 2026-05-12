// ── Calorie calculation (Mifflin-St Jeor) ────────────────────────────────────
export function calcTDEE({ weightLbs, heightFt, heightIn, age, sex, activity }) {
  const kg  = weightLbs * 0.453592
  const cm  = ((Number(heightFt) * 12) + Number(heightIn)) * 2.54
  const bmr = sex === 'male'
    ? 10 * kg + 6.25 * cm - 5 * age + 5
    : 10 * kg + 6.25 * cm - 5 * age - 161
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }
  return Math.round(bmr * (multipliers[activity] || 1.375))
}

export function calcFoodGoal(tdee, goal) {
  if (goal === 'maintain') return tdee
  if (goal === 'lose1')    return tdee - 250
  if (goal === 'lose2')    return tdee - 500
  return tdee
}

export function getNutritionStatus(logged, foodGoal) {
  if (logged > foodGoal)       return 'over'
  if (logged < foodGoal - 500) return 'under'
  return 'good'
}

// ── Week helpers ──────────────────────────────────────────────────────────────
export function getWeekKey() {
  const d   = new Date()
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return mon.toISOString().split('T')[0]
}

export function getWeekDates() {
  const today = new Date()
  const mon   = new Date(today)
  mon.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon)
    d.setDate(mon.getDate() + i)
    return d
  })
}

export function isSameDay(a, b) { return a.toDateString() === b.toDateString() }
export function fmt(d) { return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) }
export const DAY_LETTERS = ['M','T','W','T','F','S','S']

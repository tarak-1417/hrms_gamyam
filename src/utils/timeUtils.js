export function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

/** Time-of-day greeting for dashboards */
export function getTimeGreeting(date = new Date()) {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function nowTime() {
  const d = new Date()
  return d.toTimeString().slice(0, 5)
}

export function formatDisplayDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

export const HALF_DAY_PERIODS = {
  first_half: { value: 'first_half', label: 'First half (morning)' },
  second_half: { value: 'second_half', label: 'Second half (afternoon)' },
}

/** Calendar days between from/to inclusive; half-day returns 0.5 */
export function calculateLeaveDays({ from, to, durationType = 'full' }) {
  if (durationType === 'half') return 0.5
  if (!from || !to) return 0
  const start = new Date(from + 'T12:00:00')
  const end = new Date(to + 'T12:00:00')
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1)
}

export function formatLeaveDuration(leave) {
  const days = leave?.days ?? 0
  const dayLabel = days === 1 ? 'day' : 'days'
  if (leave?.durationType === 'half') {
    const period =
      leave.halfDayPeriod === 'second_half'
        ? HALF_DAY_PERIODS.second_half.label
        : HALF_DAY_PERIODS.first_half.label
    return `Half day · ${period}`
  }
  return `${days} ${dayLabel}`
}

export function formatLeaveDateRange(leave) {
  if (!leave?.from) return '—'
  if (leave.durationType === 'half' || leave.from === leave.to) {
    return formatDisplayDate(leave.from)
  }
  return `${formatDisplayDate(leave.from)} – ${formatDisplayDate(leave.to)}`
}

export function parseTimeToMinutes(timeStr) {
  if (!timeStr || timeStr === '-') return null
  const [h, m] = timeStr.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function dateTimeFromLog(dateStr, timeStr) {
  if (!dateStr || !timeStr) return null
  const mins = parseTimeToMinutes(timeStr)
  if (mins == null) return null
  const d = new Date(`${dateStr}T12:00:00`)
  d.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
  return d
}

/** Elapsed ms from check-in time (HH:mm) on a given calendar date */
export function elapsedMsSinceCheckIn(checkIn, now = new Date(), dateStr = todayDate()) {
  const start = dateTimeFromLog(dateStr, checkIn)
  if (!start) return 0
  const end = now instanceof Date ? now : new Date(now)
  return Math.max(0, end.getTime() - start.getTime())
}

/** Elapsed ms between check-in and check-out on the same day */
export function elapsedMsBetweenTimes(checkIn, checkOut, dateStr = todayDate()) {
  const start = dateTimeFromLog(dateStr, checkIn)
  const end = dateTimeFromLog(dateStr, checkOut)
  if (!start || !end) return 0
  return Math.max(0, end.getTime() - start.getTime())
}

export function elapsedMsFromIso(checkInAt, end = new Date()) {
  if (!checkInAt) return 0
  const start = new Date(checkInAt)
  const finish = end instanceof Date ? end : new Date(end)
  return Math.max(0, finish.getTime() - start.getTime())
}

export function formatElapsedClock(ms) {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':')
}

export function calcWorkHours(checkIn, checkOut) {
  if (!checkIn || !checkOut || checkIn === '-' || checkOut === '-') return '—'
  const inM = parseTimeToMinutes(checkIn)
  const outM = parseTimeToMinutes(checkOut)
  if (inM == null || outM == null) return '—'
  const mins = outM - inM
  if (mins <= 0) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h}h ${m}m`
}

/** Live hours string while still checked in */
export function liveWorkHours(checkIn, now = new Date()) {
  const ms = elapsedMsSinceCheckIn(checkIn, now)
  if (!ms) return '0h 0m'
  const mins = Math.floor(ms / 60000)
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

export function attendanceStatus(checkIn) {
  if (!checkIn || checkIn === '-') return 'on-leave'
  const [h, m] = checkIn.split(':').map(Number)
  if (h > 9 || (h === 9 && m > 15)) return 'late'
  return 'present'
}

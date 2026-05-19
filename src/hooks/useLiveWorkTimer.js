import { useEffect, useState } from 'react'
import {
  todayDate,
  elapsedMsSinceCheckIn,
  elapsedMsBetweenTimes,
  elapsedMsFromIso,
  formatElapsedClock,
  liveWorkHours,
} from '../utils/timeUtils'

/**
 * Work timer: ticks while checked in; after check-out shows final duration (does not reset).
 */
export function useLiveWorkTimer({ checkIn, checkOut, date, checkInAt, checkOutAt }) {
  const [now, setNow] = useState(() => new Date())
  const day = date || todayDate()
  const isRunning = Boolean(checkIn && !checkOut)
  const isCompleted = Boolean(checkIn && checkOut)

  useEffect(() => {
    if (!checkIn) return undefined
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [checkIn, checkOut, checkInAt])

  let ms = 0
  if (isRunning) {
    if (checkInAt) {
      ms = elapsedMsFromIso(checkInAt, now)
    } else {
      ms = elapsedMsSinceCheckIn(checkIn, now, day)
    }
  } else if (isCompleted) {
    if (checkInAt && checkOutAt) {
      ms = elapsedMsFromIso(checkInAt, checkOutAt)
    } else {
      ms = elapsedMsBetweenTimes(checkIn, checkOut, day)
    }
  }

  const clock = formatElapsedClock(ms)
  const label = isRunning
    ? liveWorkHours(checkIn, now)
    : isCompleted
      ? `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m total`
      : '0h 0m'

  return {
    clock,
    label,
    ms,
    isRunning,
    isCompleted,
    hasSession: Boolean(checkIn),
  }
}

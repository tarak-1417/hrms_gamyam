import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import LiveWorkClock from './LiveWorkClock'

/** Persistent work timer on every employee page */
export default function FloatingWorkTimer() {
  const { user } = useAuth()
  const { getTodayTimeLog } = useHrms()
  const today = getTodayTimeLog(user?.employeeId)

  if (!today?.checkIn && !today?.checkOut) return null

  return (
    <div className="fixed bottom-4 left-4 z-40 w-[min(calc(100vw-2rem),280px)] drop-shadow-lg sm:bottom-6 sm:left-6">
      <LiveWorkClock
        checkIn={today.checkIn}
        checkOut={today.checkOut}
        date={today.date}
        checkInAt={today.checkInAt}
        checkOutAt={today.checkOutAt}
        size="md"
        compact
      />
    </div>
  )
}

import { Clock, CheckCircle2 } from 'lucide-react'
import { useLiveWorkTimer } from '../../hooks/useLiveWorkTimer'
import { todayDate } from '../../utils/timeUtils'

export default function LiveWorkClock({
  checkIn,
  checkOut,
  date,
  checkInAt,
  checkOutAt,
  size = 'md',
  compact = false,
}) {
  const { clock, label, isRunning, isCompleted, hasSession } = useLiveWorkTimer({
    checkIn,
    checkOut,
    date: date || todayDate(),
    checkInAt,
    checkOutAt,
  })

  const large = size === 'lg'

  const statusLabel = isRunning
    ? 'Work timer running'
    : isCompleted
      ? 'Today’s work time (completed)'
      : 'Work timer'

  const hint = isRunning
    ? `${label} · since ${checkIn}`
    : isCompleted
      ? `Checked out at ${checkOut} · ${label}`
      : 'Check in to start tracking your work day'

  return (
    <div
      className={`rounded-2xl border-2 bg-gradient-to-br from-primary-light/40 to-white ${
        isRunning
          ? 'border-primary/50 shadow-sm shadow-primary/10'
          : isCompleted
            ? 'border-primary/25'
            : 'border-primary/30'
      } ${large ? 'px-6 py-4' : compact ? 'px-3 py-2.5' : 'px-4 py-3'}`}
    >
      <div className="flex items-center gap-2 text-primary">
        {isCompleted ? (
          <CheckCircle2 className={`${large ? 'h-5 w-5' : 'h-4 w-4'} text-primary`} />
        ) : (
          <Clock className={`${large ? 'h-5 w-5' : 'h-4 w-4'} ${isRunning ? 'animate-pulse' : ''}`} />
        )}
        <span className="text-xs font-semibold uppercase tracking-wide">{statusLabel}</span>
      </div>
      <p
        className={`mt-2 font-mono font-bold tabular-nums tracking-tight text-foreground ${
          large ? 'text-2xl sm:text-3xl' : compact ? 'text-lg' : 'text-xl'
        }`}
      >
        {hasSession ? clock : '00:00:00'}
      </p>
      <p className={`mt-1 text-muted ${large ? 'text-sm' : 'text-xs'}`}>{hint}</p>
    </div>
  )
}

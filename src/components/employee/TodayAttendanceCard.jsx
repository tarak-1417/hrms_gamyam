import { useState } from 'react'
import { LogIn, LogOut, AlertCircle, MapPin, Loader2 } from 'lucide-react'
import Card from '../ui/Card'
import LiveWorkClock from './LiveWorkClock'
import CheckOutModal from './CheckOutModal'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { useGeoCheckIn } from '../../hooks/useGeoCheckIn'
import { formatDisplayDate, todayDate } from '../../utils/timeUtils'
import { formatDistance } from '../../utils/geoLocation'

export default function TodayAttendanceCard({ showTitle = true, compact = false }) {
  const { user } = useAuth()
  const { getTodayTimeLog, recordCheckOut, employeeTasks } = useHrms()
  const {
    checkInWithGeo,
    locating,
    lastError,
    geoRequired,
    geoEnabled,
    attendancePolicy,
  } = useGeoCheckIn()

  const [checkOutOpen, setCheckOutOpen] = useState(false)
  const today = getTodayTimeLog(user?.employeeId)
  const dateLabel = formatDisplayDate(today?.date || todayDate())

  const canCheckIn = !today?.checkIn
  const canCheckOut = Boolean(today?.checkIn && !today?.checkOut)
  const isCheckedIn = Boolean(today?.checkIn && !today?.checkOut)
  const isDoneForDay = Boolean(today?.checkIn && today?.checkOut)

  const office = attendancePolicy?.officeLocations?.[0]

  const handleCheckIn = () => {
    checkInWithGeo(user.employeeId)
  }

  const handleCheckOut = (payload) => {
    recordCheckOut(user.employeeId, payload)
    setCheckOutOpen(false)
  }

  return (
    <>
      {geoEnabled && geoRequired && canCheckIn && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/30 bg-primary-light/70 px-4 py-3 shadow-sm">
          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-medium text-primary-dark">Location-based check-in</p>
            <p className="mt-0.5 text-xs text-muted">
              You must be within{' '}
              <strong className="text-primary-dark">
                {office?.radiusMeters ?? attendancePolicy?.radiusMeters ?? 500} m
              </strong>{' '}
              of <strong className="text-primary-dark">{office?.name ?? 'the office'}</strong> to check
              in. Your browser will ask for
              location permission.
            </p>
          </div>
        </div>
      )}

      {lastError && canCheckIn && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{lastError}</p>
        </div>
      )}

      {!compact && (
        <LiveWorkClock
          checkIn={today?.checkIn}
          checkOut={today?.checkOut}
          date={today?.date}
          checkInAt={today?.checkInAt}
          checkOutAt={today?.checkOutAt}
          size="lg"
        />
      )}

      <Card
        title={showTitle ? 'Today' : undefined}
        subtitle={showTitle ? dateLabel : undefined}
        className={!showTitle ? 'border-2 border-primary/20' : ''}
      >
        {today?.checkInOfficeName && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary-light/40 px-3 py-2 text-sm">
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-foreground">
              Checked in at <strong>{today.checkInOfficeName}</strong>
              {today.checkInDistanceM != null && (
                <span className="text-muted"> · {formatDistance(today.checkInDistanceM)} from office</span>
              )}
            </span>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <TimeBlock label="Portal login" value={today?.portalLogin} hint="When you signed in to HRMS" />
          <TimeBlock
            label="Portal logout"
            value={today?.portalLogout || (today?.portalLogin ? 'Active session' : '—')}
            hint="When you sign out"
          />
          <TimeBlock
            label="Work check-in"
            value={today?.checkIn}
            hint={geoRequired ? 'Verified with GPS' : 'Office / remote start'}
            highlight={canCheckIn}
          />
          <TimeBlock label="Work check-out" value={today?.checkOut} hint="End of work day" />
        </div>

        {isCheckedIn && (
          <p className="mt-4 text-sm font-medium text-primary">
            Timer updates every second while you are checked in
          </p>
        )}

        {isDoneForDay && today?.workHours && today.workHours !== '—' && (
          <p className="mt-4 text-sm text-muted">Work completed today: {today.workHours}</p>
        )}

        {today?.daySummary && (
          <div className="mt-4 rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-medium uppercase text-muted">Today&apos;s summary</p>
            <p className="mt-2 text-sm text-foreground">{today.daySummary}</p>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={!canCheckIn || locating}
            onClick={handleCheckIn}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              canCheckIn && !locating
                ? 'bg-primary text-white shadow-md shadow-primary/25 hover:bg-primary-dark'
                : 'cursor-not-allowed bg-primary/30 text-white/70'
            }`}
          >
            {locating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {locating ? 'Getting location…' : geoRequired ? 'Check in with location' : 'Check in'}
          </button>
          <button
            type="button"
            disabled={!canCheckOut}
            onClick={() => setCheckOutOpen(true)}
            className={`inline-flex items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-semibold transition-all ${
              canCheckOut
                ? 'border-primary text-primary hover:bg-primary-light'
                : 'cursor-not-allowed border-border text-muted'
            }`}
          >
            <LogOut className="h-4 w-4" />
            Check out
          </button>
        </div>
      </Card>

      <CheckOutModal
        open={checkOutOpen}
        onClose={() => setCheckOutOpen(false)}
        checkIn={today?.checkIn}
        tasks={employeeTasks}
        onConfirm={handleCheckOut}
      />
    </>
  )
}

function TimeBlock({ label, value, hint, highlight }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? 'border-primary/50 bg-primary-light/30 ring-1 ring-primary/20' : 'border-border bg-surface'
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-2 text-xl font-bold ${highlight ? 'text-primary' : 'text-foreground'}`}>
        {value || (highlight ? 'Not yet' : '—')}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  )
}

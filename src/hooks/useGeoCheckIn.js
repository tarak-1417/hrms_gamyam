import { useCallback, useState } from 'react'
import { useHrms } from './useHrms'
import {
  getCurrentPosition,
  validateOfficeProximity,
  isGeoCheckInRequired,
  isGeoBypassEnabled,
} from '../utils/geoLocation'

export function useGeoCheckIn() {
  const { attendancePolicy, recordCheckIn, showToast } = useHrms()
  const [locating, setLocating] = useState(false)
  const [lastError, setLastError] = useState(null)

  const checkInWithGeo = useCallback(
    async (employeeId) => {
      setLastError(null)

      if (!isGeoCheckInRequired(attendancePolicy)) {
        recordCheckIn(employeeId, null)
        return { success: true }
      }

      setLocating(true)
      try {
        const position = await getCurrentPosition()
        const result = validateOfficeProximity(position, attendancePolicy)

        if (!result.ok) {
          setLastError(result.message)
          showToast(result.message)
          return { success: false, error: result.message }
        }

        recordCheckIn(employeeId, result.geo)
        showToast(`Checked in at ${result.office.name} (${Math.round(result.distanceMeters)} m away)`)
        return { success: true, geo: result.geo, office: result.office }
      } catch (err) {
        const message = err.message || 'Could not verify location'
        setLastError(message)
        showToast(message)
        return { success: false, error: message }
      } finally {
        setLocating(false)
      }
    },
    [attendancePolicy, recordCheckIn, showToast],
  )

  const geoEnabled = Boolean(attendancePolicy?.geoCheckInEnabled)
  const geoRequired = isGeoCheckInRequired(attendancePolicy)
  const bypass = isGeoBypassEnabled()

  return {
    checkInWithGeo,
    locating,
    lastError,
    geoEnabled,
    geoRequired,
    bypass,
    attendancePolicy,
  }
}

import { useEffect, useRef } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'

/** Records portal sign-in once when employee enters the portal */
export default function PortalSessionTracker() {
  const { user } = useAuth()
  const { recordPortalLogin } = useHrms()
  const tracked = useRef(false)

  useEffect(() => {
    if (user?.role === 'employee' && user.employeeId && !tracked.current) {
      tracked.current = true
      recordPortalLogin(user.employeeId)
    }
  }, [user, recordPortalLogin])

  return null
}

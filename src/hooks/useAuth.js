import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { findUserByCredentials, toAuthUser } from '../data/dataService'
import { loginSuccess, logout, updateSession } from '../store/slices/authSlice'
import { appendAuditLog } from '../store/slices/hrmsSlice'

export function useAuth() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const platformUsers = useSelector((state) => state.platform?.users)
  const maintenanceMode = useSelector((state) => state.platform?.settings?.maintenanceMode)

  const login = useCallback(
    (email, password) => {
      const account = findUserByCredentials(email, password, platformUsers)
      if (account && maintenanceMode && account.role !== 'superadmin') {
        return {
          success: false,
          error: 'Platform is under maintenance. Only Super Admin can sign in.',
        }
      }
      if (account) {
        dispatch(loginSuccess(toAuthUser(account)))
        dispatch(
          appendAuditLog({
            actorName: account.name,
            actorRole: account.role,
            actorEmail: account.email,
            action: 'Signed in',
            category: 'security',
            scope: account.role === 'superadmin' ? 'platform' : 'hr',
            targetType: 'session',
            targetLabel: account.role,
            details: 'Successful authentication',
          }),
        )
        return { success: true, role: account.role }
      }
      const blocked = platformUsers?.find(
        (u) => u.email?.toLowerCase() === email?.toLowerCase() && u.password === password && u.blocked,
      )
      if (blocked) {
        return { success: false, error: 'This account has been blocked. Contact your administrator.' }
      }
      return { success: false, error: 'Invalid email or password' }
    },
    [dispatch, platformUsers, maintenanceMode],
  )

  const handleLogout = useCallback(() => {
    dispatch(logout())
  }, [dispatch])

  const handleUpdateSession = useCallback(
    (patch) => {
      dispatch(updateSession(patch))
    },
    [dispatch],
  )

  return {
    user,
    login,
    logout: handleLogout,
    updateSession: handleUpdateSession,
    isAuthenticated: Boolean(user),
  }
}

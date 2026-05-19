import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { findUserByCredentials } from '../data/dataService'
import { loginSuccess, logout, updateSession } from '../store/slices/authSlice'

export function useAuth() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)

  const login = useCallback(
    (email, password) => {
      const account = findUserByCredentials(email, password)
      if (account) {
        dispatch(loginSuccess({ ...account }))
        return { success: true, role: account.role }
      }
      return { success: false, error: 'Invalid email or password' }
    },
    [dispatch],
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

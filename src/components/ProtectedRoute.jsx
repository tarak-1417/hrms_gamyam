import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const HOME = {
  admin: '/admin',
  manager: '/manager',
  employee: '/employee',
  superadmin: '/superadmin',
}

export default function ProtectedRoute({ children, role }) {
  const { user, isAuthenticated } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (role && user?.role !== role) {
    return <Navigate to={HOME[user?.role] ?? '/login'} replace />
  }

  return children
}

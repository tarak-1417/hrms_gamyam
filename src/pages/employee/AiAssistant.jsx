import { Navigate } from 'react-router-dom'

/** AI is available via the floating robot on all employee pages */
export default function AiAssistant() {
  return <Navigate to="/employee" replace />
}

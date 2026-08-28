import { useAuth } from '../context/AuthContext'
import Login from '../pages/Login'

export default function RequireAuth({ children }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Loading…</p>
      </div>
    )
  }

  if (!user) return <Login />

  return children
}

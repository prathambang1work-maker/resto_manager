import { useAuth } from '../context/AuthContext'
import Card from './Card'

export default function RequireAdmin({ children }) {
  const { role, loading } = useAuth()

  if (loading) return null

  if (role !== 'admin') {
    return (
      <Card title="Access restricted">
        <p className="text-sm text-paper/70">
          This section is for admin accounts only. Ask your admin if you need access.
        </p>
      </Card>
    )
  }

  return children
}

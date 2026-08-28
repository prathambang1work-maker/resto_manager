import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Menu from './pages/Menu'
import Admin from './pages/Admin'
import Kitchen from './pages/Kitchen'
import { AuthProvider, useAuth } from './context/AuthContext'
import RequireAuth from './components/RequireAuth'
import RequireAdmin from './components/RequireAdmin'
import { isSupabaseConfigured } from './utils/supabaseClient'

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupNeeded />
  }

  return (
    <AuthProvider>
      <HashRouter>
        <RequireAuth>
          <RoleRouter />
        </RequireAuth>
      </HashRouter>
    </AuthProvider>
  )
}

/**
 * Kitchen accounts get their own full-screen display with no sidebar —
 * they only ever need one screen. Staff/admin get the normal app shell.
 */
function RoleRouter() {
  const { role, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted">Loading…</p>
      </div>
    )
  }

  if (role === 'kitchen') {
    return <Kitchen />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/menu" element={<Menu />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />
      </Routes>
    </Layout>
  )
}

function SetupNeeded() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-void px-4">
      <div className="max-w-md rounded-xl border border-rail bg-panel p-6 text-center shadow-ticket">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-ember">Setup needed</p>
        <h1 className="mt-2 font-display text-2xl text-paper">Supabase isn't configured yet</h1>
        <p className="mt-3 text-sm text-paper/70">
          Add <code className="text-ember">VITE_SUPABASE_URL</code> and{' '}
          <code className="text-ember">VITE_SUPABASE_ANON_KEY</code> — locally in a{' '}
          <code className="text-ember">.env</code> file, or as environment variables in your
          Netlify site settings — then redeploy. See <code className="text-ember">README.md</code>.
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import { signIn } from '../utils/auth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const result = await signIn(email, password)
    setBusy(false)
    if (!result.ok) setError(result.error || 'Sign in failed.')
    // On success, AuthProvider's onAuthStateChange picks up the session
    // automatically and the app re-renders past this screen.
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-ember">Embercard</p>
        <h1 className="font-display text-3xl text-paper">Sign in</h1>
        <p className="mt-1 text-sm text-paper/60">
          Use the staff or admin account set up for you.
        </p>
      </header>

      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-muted">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              className="w-full rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper focus:border-ember focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-muted">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="w-full rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper focus:border-ember focus:outline-none"
            />
          </div>
          {error && <p className="text-xs text-chili">{error}</p>}
          <Button type="submit" variant="primary" className="w-full" disabled={busy}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Card>
    </div>
  )
}

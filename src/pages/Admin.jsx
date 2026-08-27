import { useEffect, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import {
  isAdminAuthenticated,
  loginAdmin,
  logoutAdmin,
  getAdminCredentials,
  updateAdminCredentials
} from '../utils/auth'
import { getKitchens, addKitchen, updateKitchen, deleteKitchen } from '../utils/storage'

export default function Admin() {
  const [authed, setAuthed] = useState(isAdminAuthenticated())

  return authed ? (
    <AdminPanel onLogout={() => setAuthed(false)} />
  ) : (
    <AdminLogin onSuccess={() => setAuthed(true)} />
  )
}

// ---------------------------------------------------------------------------
// Login screen
// ---------------------------------------------------------------------------

function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const ok = loginAdmin(email, password)
    if (ok) {
      setError('')
      onSuccess()
    } else {
      setError('Incorrect email or password.')
    }
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 pt-10">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-ember">Admin</p>
        <h1 className="font-display text-3xl text-paper">Sign in</h1>
        <p className="mt-1 text-sm text-paper/60">
          Manage kitchens and admin credentials.
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
              placeholder="admin@embercard.app"
              autoComplete="username"
              className="w-full rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper placeholder:text-muted focus:border-ember focus:outline-none"
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
          <Button type="submit" variant="primary" className="w-full">
            Sign in
          </Button>
        </form>
      </Card>

      <p className="text-center font-mono text-[11px] text-muted">
        Default: admin@embercard.app / admin123 — change this after signing in.
        <br />
        This is a browser-only lock, not real security.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Panel (post-login)
// ---------------------------------------------------------------------------

function AdminPanel({ onLogout }) {
  const [kitchens, setKitchens] = useState([])
  const [newKitchenName, setNewKitchenName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')

  const [credEmail, setCredEmail] = useState('')
  const [credPassword, setCredPassword] = useState('')
  const [credConfirm, setCredConfirm] = useState('')
  const [credError, setCredError] = useState('')
  const [credSuccess, setCredSuccess] = useState('')

  useEffect(() => {
    setKitchens(getKitchens())
    setCredEmail(getAdminCredentials().email)
  }, [])

  function handleLogout() {
    logoutAdmin()
    onLogout()
  }

  function handleAddKitchen(e) {
    e.preventDefault()
    if (!newKitchenName.trim()) return
    setKitchens(addKitchen({ name: newKitchenName }))
    setNewKitchenName('')
  }

  function startEdit(kitchen) {
    setEditingId(kitchen.id)
    setEditDraft(kitchen.name)
  }

  function saveEdit(id) {
    if (!editDraft.trim()) return
    setKitchens(updateKitchen(id, { name: editDraft.trim() }))
    setEditingId(null)
  }

  function handleDeleteKitchen(id) {
    setKitchens(deleteKitchen(id))
  }

  function handleCredentialsSubmit(e) {
    e.preventDefault()
    setCredError('')
    setCredSuccess('')

    if (credPassword && credPassword !== credConfirm) {
      setCredError('Passwords do not match.')
      return
    }
    if (!credEmail.trim()) {
      setCredError('Email cannot be empty.')
      return
    }

    updateAdminCredentials({
      email: credEmail,
      password: credPassword || undefined
    })
    setCredPassword('')
    setCredConfirm('')
    setCredSuccess('Credentials updated.')
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-ember">Admin</p>
          <h1 className="font-display text-3xl text-paper">Kitchen &amp; access setup</h1>
          <p className="mt-1 text-sm text-paper/60">
            Manage kitchen stations and admin sign-in credentials.
          </p>
        </div>
        <Button variant="ghost" onClick={handleLogout}>
          Log out
        </Button>
      </header>

      <Card title="Kitchens">
        <form onSubmit={handleAddKitchen} className="flex gap-2">
          <input
            type="text"
            value={newKitchenName}
            onChange={(e) => setNewKitchenName(e.target.value)}
            placeholder="e.g. Kitchen 4"
            className="flex-1 rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper placeholder:text-muted focus:border-ember focus:outline-none"
          />
          <Button type="submit" variant="primary">
            Add kitchen
          </Button>
        </form>

        <div className="mt-4 flex flex-col gap-2">
          {kitchens.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No kitchens yet.</p>
          ) : (
            kitchens.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between rounded-md border border-rail bg-raised px-3 py-2"
              >
                {editingId === k.id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      className="flex-1 rounded-md border border-rail bg-panel px-2 py-1 text-sm text-paper focus:border-ember focus:outline-none"
                    />
                    <Button variant="primary" onClick={() => saveEdit(k.id)}>
                      Save
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="font-display text-base text-paper">{k.name}</p>
                    <div className="flex gap-2">
                      <Button variant="subtle" onClick={() => startEdit(k)}>
                        Rename
                      </Button>
                      <Button variant="danger" onClick={() => handleDeleteKitchen(k.id)}>
                        Delete
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      <Card title="Admin credentials">
        <form onSubmit={handleCredentialsSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-muted">
              Email
            </label>
            <input
              type="email"
              value={credEmail}
              onChange={(e) => setCredEmail(e.target.value)}
              className="w-full rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper focus:border-ember focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-muted">
                New password
              </label>
              <input
                type="password"
                value={credPassword}
                onChange={(e) => setCredPassword(e.target.value)}
                placeholder="Leave blank to keep current"
                className="w-full rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper placeholder:text-muted focus:border-ember focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-muted">
                Confirm password
              </label>
              <input
                type="password"
                value={credConfirm}
                onChange={(e) => setCredConfirm(e.target.value)}
                className="w-full rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper focus:border-ember focus:outline-none"
              />
            </div>
          </div>
          {credError && <p className="text-xs text-chili">{credError}</p>}
          {credSuccess && <p className="text-xs text-sage">{credSuccess}</p>}
          <Button type="submit" variant="primary" className="w-fit">
            Save credentials
          </Button>
        </form>
      </Card>
    </div>
  )
}

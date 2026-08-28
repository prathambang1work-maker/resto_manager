import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import { formatINR } from '../utils/currency'
import { useAuth } from '../context/AuthContext'
import { signOut, updateOwnPassword } from '../utils/auth'
import {
  getKitchens,
  addKitchen,
  updateKitchen,
  deleteKitchen,
  getOrders,
  filterOrders,
  summarizeOrders,
  revenueByDayChart,
  subscribeToTable
} from '../utils/storage'

const RANGE_OPTIONS = [
  { value: '1', label: 'Today' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: 'all', label: 'All time' }
]

export default function Admin() {
  const { user } = useAuth()

  const [kitchens, setKitchens] = useState([])
  const [newKitchenName, setNewKitchenName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState('')

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [rangeFilter, setRangeFilter] = useState('7')
  const [kitchenFilter, setKitchenFilter] = useState('all')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  async function refreshKitchens() {
    setKitchens(await getKitchens())
  }

  async function refreshOrders() {
    setOrders(await getOrders())
  }

  useEffect(() => {
    async function init() {
      await Promise.all([refreshKitchens(), refreshOrders()])
      setLoading(false)
    }
    init()

    const unsubKitchens = subscribeToTable('kitchens', refreshKitchens)
    const unsubOrders = subscribeToTable('orders', refreshOrders)
    return () => {
      unsubKitchens()
      unsubOrders()
    }
  }, [])

  const rangeDays = rangeFilter === 'all' ? null : Number(rangeFilter)

  const filtered = useMemo(
    () => filterOrders(orders, { kitchenId: kitchenFilter, rangeDays }),
    [orders, kitchenFilter, rangeDays]
  )
  const summary = useMemo(() => summarizeOrders(filtered), [filtered])
  const chartDays = rangeDays && rangeDays <= 30 ? rangeDays : 30
  const chart = useMemo(() => revenueByDayChart(filtered, Math.max(chartDays, 2)), [filtered, chartDays])
  const maxDay = Math.max(1, ...chart.map((d) => d.total))

  const todayRevenue = useMemo(
    () => summarizeOrders(filterOrders(orders, { rangeDays: 1 })).totalRevenue,
    [orders]
  )
  const allTimeRevenue = useMemo(() => summarizeOrders(orders).totalRevenue, [orders])

  async function handleAddKitchen(e) {
    e.preventDefault()
    if (!newKitchenName.trim()) return
    setKitchens(await addKitchen({ name: newKitchenName }))
    setNewKitchenName('')
  }

  function startEdit(kitchen) {
    setEditingId(kitchen.id)
    setEditDraft(kitchen.name)
  }

  async function saveEdit(id) {
    if (!editDraft.trim()) return
    setKitchens(await updateKitchen(id, { name: editDraft.trim() }))
    setEditingId(null)
  }

  async function handleDeleteKitchen(id) {
    setKitchens(await deleteKitchen(id))
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }
    const result = await updateOwnPassword(newPassword)
    if (!result.ok) {
      setPasswordError(result.error)
      return
    }
    setNewPassword('')
    setConfirmPassword('')
    setPasswordSuccess('Password updated.')
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-ember">Admin</p>
          <h1 className="font-display text-3xl text-paper">Kitchen &amp; business overview</h1>
          <p className="mt-1 text-sm text-paper/60">Signed in as {user?.email}</p>
        </div>
        <Button variant="ghost" onClick={signOut}>
          Log out
        </Button>
      </header>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Card eyebrow="Quick glance" title="Revenue today" value={formatINR(todayRevenue)} />
            <Card eyebrow="Quick glance" title="Revenue all-time" value={formatINR(allTimeRevenue)} />
          </div>

          <Card eyebrow="Business insights" title="Sales analysis">
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={rangeFilter}
                onChange={(e) => setRangeFilter(e.target.value)}
                className="rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper focus:border-ember focus:outline-none"
              >
                {RANGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <select
                value={kitchenFilter}
                onChange={(e) => setKitchenFilter(e.target.value)}
                className="rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper focus:border-ember focus:outline-none"
              >
                <option value="all">All kitchens</option>
                {kitchens.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Revenue</p>
                <p className="mt-1 font-display text-2xl text-paper">
                  {formatINR(summary.totalRevenue)}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Orders</p>
                <p className="mt-1 font-display text-2xl text-paper">{summary.totalOrders}</p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  Avg order value
                </p>
                <p className="mt-1 font-display text-2xl text-paper">
                  {formatINR(summary.avgOrderValue)}
                </p>
              </div>
            </div>

            <div className="mt-6 flex h-28 items-end gap-2 overflow-x-auto">
              {chart.map((day, idx) => (
                <div key={idx} className="flex min-w-[24px] flex-1 flex-col items-center gap-2">
                  <div
                    className="w-full rounded-t-sm bg-ember/80 transition-all"
                    style={{ height: `${Math.max(4, (day.total / maxDay) * 100)}%` }}
                    title={formatINR(day.total)}
                  />
                  <span className="font-mono text-[9px] uppercase text-muted">{day.label}</span>
                </div>
              ))}
            </div>

            {summary.topItems.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
                  Top items in this range
                </p>
                <div className="flex flex-col gap-1.5">
                  {summary.topItems.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-md border border-rail bg-raised px-3 py-1.5"
                    >
                      <p className="text-sm text-paper/80">{item.name}</p>
                      <p className="font-mono text-xs text-ember">{item.qty} sold</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {summary.totalOrders === 0 && (
              <p className="mt-6 text-sm text-muted">No orders in this range.</p>
            )}
          </Card>
        </>
      )}

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

      <Card title="Change my password">
        <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-muted">
                New password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper focus:border-ember focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-muted">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper focus:border-ember focus:outline-none"
              />
            </div>
          </div>
          {passwordError && <p className="text-xs text-chili">{passwordError}</p>}
          {passwordSuccess && <p className="text-xs text-sage">{passwordSuccess}</p>}
          <Button type="submit" variant="primary" className="w-fit">
            Update password
          </Button>
        </form>
        <p className="mt-4 font-mono text-[11px] text-muted">
          To add or remove staff/admin/kitchen accounts, use the Supabase dashboard — see README.
        </p>
      </Card>
    </div>
  )
}

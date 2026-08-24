import { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import OrderTicket from '../components/OrderTicket'
import {
  getOrders,
  addOrder,
  deleteOrder,
  markOrderCompleted,
  getMenu
} from '../utils/storage'

const EMPTY_FORM = { item: '', quantity: 1, price: '' }

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [menu, setMenu] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    setOrders(getOrders())
    setMenu(getMenu())
  }, [])

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders
    return orders.filter((o) => o.status === filter)
  }, [orders, filter])

  function validate() {
    const next = {}
    if (!form.item.trim()) next.item = 'Name the item.'
    if (!form.quantity || Number(form.quantity) <= 0) next.quantity = 'Quantity must be at least 1.'
    if (form.price === '' || Number(form.price) < 0) next.price = 'Enter a valid price.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    const next = addOrder(form)
    setOrders(next)
    setForm(EMPTY_FORM)
  }

  function handleMenuPick(e) {
    const picked = menu.find((m) => m.id === e.target.value)
    if (picked) {
      setForm((f) => ({ ...f, item: picked.name, price: picked.price }))
    }
  }

  function handleComplete(id) {
    setOrders(markOrderCompleted(id))
  }

  function handleDelete(id) {
    setOrders(deleteOrder(id))
  }

  const total = (Number(form.quantity) || 0) * (Number(form.price) || 0)

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-ember">Orders</p>
        <h1 className="font-display text-3xl text-paper">Ticket rail</h1>
        <p className="mt-1 text-sm text-paper/60">Fire new orders and clear them as they go out.</p>
      </header>

      <Card title="New order">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          {menu.length > 0 && (
            <div className="sm:col-span-4">
              <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-muted">
                Quick add from menu
              </label>
              <select
                onChange={handleMenuPick}
                defaultValue=""
                className="w-full rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper focus:border-ember focus:outline-none"
              >
                <option value="" disabled>
                  Choose a menu item…
                </option>
                {menu.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — ${m.price.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Field label="Item" error={errors.item} className="sm:col-span-2">
            <input
              type="text"
              value={form.item}
              onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))}
              placeholder="Smoked Brisket Bowl"
              className="w-full rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper placeholder:text-muted focus:border-ember focus:outline-none"
            />
          </Field>

          <Field label="Quantity" error={errors.quantity}>
            <input
              type="number"
              min="1"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              className="w-full rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper focus:border-ember focus:outline-none"
            />
          </Field>

          <Field label="Price" error={errors.price}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">
                $
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full rounded-md border border-rail bg-raised py-2 pl-6 pr-3 text-sm text-paper focus:border-ember focus:outline-none"
              />
            </div>
          </Field>

          <div className="flex items-end justify-between gap-4 sm:col-span-4">
            <p className="font-mono text-sm text-muted">
              Total <span className="text-paper">${total.toFixed(2)}</span>
            </p>
            <Button type="submit" variant="primary">
              Fire order
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex items-center gap-2">
        {['all', 'pending', 'completed'].map((key) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wide transition-colors ${
              filter === key
                ? 'border-ember bg-ember/10 text-ember'
                : 'border-rail text-muted hover:text-paper/80'
            }`}
          >
            {key}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filteredOrders.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          filteredOrders.map((order) => (
            <OrderTicket
              key={order.id}
              order={order}
              onComplete={handleComplete}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  )
}

function Field({ label, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-muted">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-chili">{error}</p>}
    </div>
  )
}

function EmptyState({ filter }) {
  const copy =
    filter === 'all'
      ? 'No orders yet. Fire the first one above.'
      : `No ${filter} orders right now.`
  return (
    <div className="rounded-lg border border-dashed border-rail px-6 py-10 text-center">
      <p className="font-display text-lg text-paper/70">{copy}</p>
    </div>
  )
}

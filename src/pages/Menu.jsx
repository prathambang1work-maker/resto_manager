import { useEffect, useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem } from '../utils/storage'

const EMPTY_FORM = { name: '', price: '' }

export default function Menu() {
  const [menu, setMenu] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const [editingId, setEditingId] = useState(null)
  const [editDraft, setEditDraft] = useState(EMPTY_FORM)

  useEffect(() => {
    setMenu(getMenu())
  }, [])

  function validate(data) {
    const next = {}
    if (!data.name.trim()) next.name = 'Name the item.'
    if (data.price === '' || Number(data.price) < 0) next.price = 'Enter a valid price.'
    return next
  }

  function handleSubmit(e) {
    e.preventDefault()
    const validationErrors = validate(form)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return
    setMenu(addMenuItem(form))
    setForm(EMPTY_FORM)
  }

  function startEdit(item) {
    setEditingId(item.id)
    setEditDraft({ name: item.name, price: item.price })
  }

  function saveEdit(id) {
    const validationErrors = validate(editDraft)
    if (Object.keys(validationErrors).length > 0) return
    setMenu(updateMenuItem(id, editDraft))
    setEditingId(null)
  }

  function handleDelete(id) {
    setMenu(deleteMenuItem(id))
  }

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-ember">Menu</p>
        <h1 className="font-display text-3xl text-paper">The book</h1>
        <p className="mt-1 text-sm text-paper/60">What's available to fire tonight.</p>
      </header>

      <Card title="Add menu item">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-muted">
              Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Wood-Fired Flatbread"
              className="w-full rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper placeholder:text-muted focus:border-ember focus:outline-none"
            />
            {errors.name && <p className="mt-1 text-xs text-chili">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block font-mono text-[11px] uppercase tracking-wide text-muted">
              Price
            </label>
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
            {errors.price && <p className="mt-1 text-xs text-chili">{errors.price}</p>}
          </div>

          <div className="flex items-end sm:col-span-1">
            <Button type="submit" variant="primary" className="w-full">
              Add to menu
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {menu.length === 0 ? (
          <div className="rounded-lg border border-dashed border-rail px-6 py-10 text-center sm:col-span-2">
            <p className="font-display text-lg text-paper/70">The book is empty. Add your first item.</p>
          </div>
        ) : (
          menu.map((item) => (
            <div key={item.id} className="rounded-lg border border-rail bg-panel p-4 shadow-ticket">
              {editingId === item.id ? (
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    value={editDraft.name}
                    onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                    className="w-full rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper focus:border-ember focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editDraft.price}
                    onChange={(e) => setEditDraft((d) => ({ ...d, price: e.target.value }))}
                    className="w-full rounded-md border border-rail bg-raised px-3 py-2 text-sm text-paper focus:border-ember focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" onClick={() => saveEdit(item.id)}>
                      Save
                    </Button>
                    <Button variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-base text-paper">{item.name}</p>
                    <p className="font-mono text-sm text-ember">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="subtle" onClick={() => startEdit(item)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(item.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// storage.js
// Single source of truth for persistence + business logic.
// Nothing in components/ or pages/ should touch localStorage directly.
// ---------------------------------------------------------------------------

const ORDERS_KEY = 'embercard:orders'
const MENU_KEY = 'embercard:menu'
const KITCHENS_KEY = 'embercard:kitchens'

/** Safe JSON parse with a fallback value on any failure. */
function safeParse(raw, fallback) {
  if (!raw) return fallback
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch (err) {
    console.error('storage: failed to parse localStorage value', err)
    return fallback
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (err) {
    console.error(`storage: failed to write key "${key}"`, err)
    return false
  }
}

function generateId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
}

// ---------------------------------------------------------------------------
// Seed data — lets a fresh install feel real instead of empty on first run.
// ---------------------------------------------------------------------------

const SEED_KITCHENS = [
  { id: 'kitchen_1', name: 'Kitchen 1' },
  { id: 'kitchen_2', name: 'Kitchen 2' },
  { id: 'kitchen_3', name: 'Kitchen 3' }
]

const SEED_MENU = [
  { id: generateId('item'), name: 'Charred Corn Tacos', price: 180, kitchenId: 'kitchen_1' },
  { id: generateId('item'), name: 'Smoked Brisket Bowl', price: 320, kitchenId: 'kitchen_2' },
  { id: generateId('item'), name: 'Wood-Fired Flatbread', price: 240, kitchenId: 'kitchen_1' },
  { id: generateId('item'), name: 'Cast Iron Cornbread', price: 120, kitchenId: 'kitchen_2' },
  { id: generateId('item'), name: 'Ember Old Fashioned', price: 280, kitchenId: 'kitchen_3' }
]

// ---------------------------------------------------------------------------
// Kitchens
// ---------------------------------------------------------------------------

export function getKitchens() {
  const existing = localStorage.getItem(KITCHENS_KEY)
  if (existing === null) {
    safeWrite(KITCHENS_KEY, SEED_KITCHENS)
    return SEED_KITCHENS
  }
  return safeParse(existing, [])
}

export function addKitchen({ name }) {
  const kitchens = getKitchens()
  const kitchen = { id: generateId('kitchen'), name: name.trim() }
  const next = [...kitchens, kitchen]
  safeWrite(KITCHENS_KEY, next)
  return next
}

export function updateKitchen(id, updates) {
  const kitchens = getKitchens()
  const next = kitchens.map((k) => (k.id === id ? { ...k, ...updates } : k))
  safeWrite(KITCHENS_KEY, next)
  return next
}

export function deleteKitchen(id) {
  const kitchens = getKitchens()
  const next = kitchens.filter((k) => k.id !== id)
  safeWrite(KITCHENS_KEY, next)

  // Unassign this kitchen from any menu items / orders that referenced it,
  // rather than leaving them pointing at a kitchen that no longer exists.
  const menu = getMenu()
  safeWrite(
    MENU_KEY,
    menu.map((item) => (item.kitchenId === id ? { ...item, kitchenId: null } : item))
  )
  const orders = getOrders()
  safeWrite(
    ORDERS_KEY,
    orders.map((order) => (order.kitchenId === id ? { ...order, kitchenId: null } : order))
  )

  return next
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

export function getMenu() {
  const existing = localStorage.getItem(MENU_KEY)
  if (existing === null) {
    safeWrite(MENU_KEY, SEED_MENU)
    return SEED_MENU
  }
  return safeParse(existing, [])
}

export function addMenuItem({ name, price, kitchenId = null }) {
  const menu = getMenu()
  const item = {
    id: generateId('item'),
    name: name.trim(),
    price: Number(price),
    kitchenId
  }
  const next = [...menu, item]
  safeWrite(MENU_KEY, next)
  return next
}

export function updateMenuItem(id, updates) {
  const menu = getMenu()
  const next = menu.map((item) =>
    item.id === id
      ? {
          ...item,
          ...updates,
          price: updates.price !== undefined ? Number(updates.price) : item.price
        }
      : item
  )
  safeWrite(MENU_KEY, next)
  return next
}

export function deleteMenuItem(id) {
  const menu = getMenu()
  const next = menu.filter((item) => item.id !== id)
  safeWrite(MENU_KEY, next)
  return next
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

export function getOrders() {
  const existing = localStorage.getItem(ORDERS_KEY)
  return safeParse(existing, [])
}

export function addOrder({ item, quantity, price, kitchenId = null }) {
  const orders = getOrders()
  const order = {
    id: generateId('order'),
    item: item.trim(),
    quantity: Number(quantity),
    price: Number(price),
    status: 'pending',
    timestamp: new Date().toISOString(),
    kitchenId
  }
  const next = [order, ...orders]
  safeWrite(ORDERS_KEY, next)
  return next
}

export function updateOrder(id, updates) {
  const orders = getOrders()
  const next = orders.map((order) => (order.id === id ? { ...order, ...updates } : order))
  safeWrite(ORDERS_KEY, next)
  return next
}

export function deleteOrder(id) {
  const orders = getOrders()
  const next = orders.filter((order) => order.id !== id)
  safeWrite(ORDERS_KEY, next)
  return next
}

export function markOrderCompleted(id) {
  return updateOrder(id, { status: 'completed' })
}

// ---------------------------------------------------------------------------
// Derived analytics — kept here so pages stay presentation-only.
// ---------------------------------------------------------------------------

function isToday(isoString) {
  const d = new Date(isoString)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function orderTotal(order) {
  return order.quantity * order.price
}

export function getDashboardStats() {
  const orders = getOrders()
  const kitchens = getKitchens()
  const todayOrders = orders.filter((o) => isToday(o.timestamp))
  const totalOrdersToday = todayOrders.length
  const revenueToday = todayOrders.reduce((sum, o) => sum + orderTotal(o), 0)
  const pendingOrders = orders.filter((o) => o.status === 'pending')
  const activeOrders = pendingOrders.length

  const activeByKitchen = kitchens.map((k) => ({
    id: k.id,
    name: k.name,
    active: pendingOrders.filter((o) => o.kitchenId === k.id).length
  }))
  const unassignedActive = pendingOrders.filter((o) => !o.kitchenId).length

  return { totalOrdersToday, revenueToday, activeOrders, activeByKitchen, unassignedActive }
}

export function getAnalytics() {
  const orders = getOrders()
  const totalRevenueAllTime = orders.reduce((sum, o) => sum + orderTotal(o), 0)

  const countsByItem = orders.reduce((acc, o) => {
    acc[o.item] = (acc[o.item] || 0) + o.quantity
    return acc
  }, {})

  let mostOrderedItem = null
  let mostOrderedQty = 0
  for (const [name, qty] of Object.entries(countsByItem)) {
    if (qty > mostOrderedQty) {
      mostOrderedItem = name
      mostOrderedQty = qty
    }
  }

  // Last 7 days revenue, oldest -> newest, for the dashboard sparkline.
  const days = [...Array(7)].map((_, idx) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - idx))
    d.setHours(0, 0, 0, 0)
    return d
  })

  const revenueByDay = days.map((day) => {
    const next = new Date(day)
    next.setDate(next.getDate() + 1)
    const total = orders
      .filter((o) => {
        const t = new Date(o.timestamp)
        return t >= day && t < next
      })
      .reduce((sum, o) => sum + orderTotal(o), 0)
    return { label: day.toLocaleDateString(undefined, { weekday: 'short' }), total }
  })

  return { totalRevenueAllTime, mostOrderedItem, mostOrderedQty, revenueByDay }
}

// ---------------------------------------------------------------------------
// storage.js
// Single source of truth for data access + business logic. Backed by
// Supabase (Postgres) instead of localStorage, so every device sees the
// same orders/menu/kitchens automatically. All functions are async.
// ---------------------------------------------------------------------------

import { supabase } from './supabaseClient'

function logError(context, error) {
  if (error) console.error(`storage: ${context}`, error)
}

// ---------------------------------------------------------------------------
// Kitchens
// ---------------------------------------------------------------------------

export async function getKitchens() {
  const { data, error } = await supabase.from('kitchens').select('*').order('name')
  logError('getKitchens', error)
  return data ?? []
}

export async function addKitchen({ name }) {
  const { error } = await supabase.from('kitchens').insert({ name: name.trim() })
  logError('addKitchen', error)
  return getKitchens()
}

export async function updateKitchen(id, updates) {
  const { error } = await supabase.from('kitchens').update(updates).eq('id', id)
  logError('updateKitchen', error)
  return getKitchens()
}

export async function deleteKitchen(id) {
  // Menu items / orders referencing this kitchen have kitchen_id set to
  // null automatically via the ON DELETE SET NULL foreign key (see schema).
  const { error } = await supabase.from('kitchens').delete().eq('id', id)
  logError('deleteKitchen', error)
  return getKitchens()
}

// ---------------------------------------------------------------------------
// Menu
// ---------------------------------------------------------------------------

function rowToMenuItem(row) {
  return { id: row.id, name: row.name, price: Number(row.price), kitchenId: row.kitchen_id }
}

export async function getMenu() {
  const { data, error } = await supabase.from('menu_items').select('*').order('name')
  logError('getMenu', error)
  return (data ?? []).map(rowToMenuItem)
}

export async function addMenuItem({ name, price, kitchenId = null }) {
  const { error } = await supabase
    .from('menu_items')
    .insert({ name: name.trim(), price: Number(price), kitchen_id: kitchenId || null })
  logError('addMenuItem', error)
  return getMenu()
}

export async function updateMenuItem(id, updates) {
  const payload = {}
  if (updates.name !== undefined) payload.name = updates.name.trim()
  if (updates.price !== undefined) payload.price = Number(updates.price)
  if (updates.kitchenId !== undefined) payload.kitchen_id = updates.kitchenId || null
  const { error } = await supabase.from('menu_items').update(payload).eq('id', id)
  logError('updateMenuItem', error)
  return getMenu()
}

export async function deleteMenuItem(id) {
  const { error } = await supabase.from('menu_items').delete().eq('id', id)
  logError('deleteMenuItem', error)
  return getMenu()
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------

function rowToOrder(row) {
  return {
    id: row.id,
    item: row.item,
    quantity: row.quantity,
    price: Number(row.price),
    status: row.status,
    timestamp: row.created_at,
    kitchenId: row.kitchen_id
  }
}

export async function getOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  logError('getOrders', error)
  return (data ?? []).map(rowToOrder)
}

export async function addOrder({ item, quantity, price, kitchenId = null }) {
  const { error } = await supabase.from('orders').insert({
    item: item.trim(),
    quantity: Number(quantity),
    price: Number(price),
    status: 'pending',
    kitchen_id: kitchenId || null
  })
  logError('addOrder', error)
  return getOrders()
}

export async function updateOrder(id, updates) {
  const payload = {}
  if (updates.status !== undefined) payload.status = updates.status
  if (updates.kitchenId !== undefined) payload.kitchen_id = updates.kitchenId || null
  const { error } = await supabase.from('orders').update(payload).eq('id', id)
  logError('updateOrder', error)
  return getOrders()
}

export async function deleteOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  logError('deleteOrder', error)
  return getOrders()
}

export async function markOrderCompleted(id) {
  return updateOrder(id, { status: 'completed' })
}

/** Pending orders for a single kitchen, oldest first — used by the Kitchen Display. */
export async function getKitchenOrders(kitchenId) {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('kitchen_id', kitchenId)
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  logError('getKitchenOrders', error)
  return (data ?? []).map(rowToOrder)
}

/**
 * Subscribe to order changes for a single kitchen only (used by the Kitchen
 * Display so it doesn't refetch/react to every other kitchen's activity).
 * onInsert fires for brand-new orders (used to trigger the sound alert);
 * onChange fires for any insert/update/delete affecting this kitchen.
 */
export function subscribeToKitchenOrders(kitchenId, { onInsert, onChange } = {}) {
  const channel = supabase
    .channel(`kitchen-orders-${kitchenId}-${Math.random().toString(36).slice(2)}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders', filter: `kitchen_id=eq.${kitchenId}` },
      (payload) => {
        onInsert?.(payload)
        onChange?.(payload)
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `kitchen_id=eq.${kitchenId}` },
      (payload) => onChange?.(payload)
    )
    .subscribe()

  return () => supabase.removeChannel(channel)
}

// ---------------------------------------------------------------------------
// Realtime — lets every open tab/device react instantly to changes made
// anywhere else, without polling.
// ---------------------------------------------------------------------------

/**
 * Subscribe to all inserts/updates/deletes on a table.
 * Returns an unsubscribe function — always call it in a useEffect cleanup.
 */
export function subscribeToTable(table, onChange) {
  const channel = supabase
    .channel(`${table}-changes-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, onChange)
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
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

export async function getDashboardStats() {
  const [orders, kitchens] = await Promise.all([getOrders(), getKitchens()])
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

export async function getAnalytics() {
  const orders = await getOrders()
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

// ---------------------------------------------------------------------------
// Filtered sales analysis — pure functions (no network), used by the Admin
// "Sales analysis" panel so filters recompute instantly against an
// already-fetched order list.
// ---------------------------------------------------------------------------

/** rangeDays: 1 | 7 | 30 | null (null = all time) */
export function filterOrders(orders, { kitchenId = 'all', rangeDays = null } = {}) {
  let result = orders
  if (kitchenId !== 'all') {
    result = result.filter((o) => o.kitchenId === kitchenId)
  }
  if (rangeDays !== null) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - (rangeDays - 1))
    cutoff.setHours(0, 0, 0, 0)
    result = result.filter((o) => new Date(o.timestamp) >= cutoff)
  }
  return result
}

export function summarizeOrders(orders) {
  const totalRevenue = orders.reduce((sum, o) => sum + orderTotal(o), 0)
  const totalOrders = orders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const countsByItem = orders.reduce((acc, o) => {
    acc[o.item] = (acc[o.item] || 0) + o.quantity
    return acc
  }, {})

  const topItems = Object.entries(countsByItem)
    .map(([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  return {
    totalRevenue,
    totalOrders,
    avgOrderValue,
    mostOrderedItem: topItems[0]?.name ?? null,
    mostOrderedQty: topItems[0]?.qty ?? 0,
    topItems
  }
}

/** Daily revenue bars for the given orders, over the last `days` days. */
export function revenueByDayChart(orders, days = 7) {
  const dayList = [...Array(days)].map((_, idx) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - idx))
    d.setHours(0, 0, 0, 0)
    return d
  })

  return dayList.map((day) => {
    const next = new Date(day)
    next.setDate(next.getDate() + 1)
    const total = orders
      .filter((o) => {
        const t = new Date(o.timestamp)
        return t >= day && t < next
      })
      .reduce((sum, o) => sum + orderTotal(o), 0)
    const label =
      days > 7
        ? day.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : day.toLocaleDateString(undefined, { weekday: 'short' })
    return { label, total }
  })
}

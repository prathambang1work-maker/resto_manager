import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { signOut } from '../utils/auth'
import { formatINR } from '../utils/currency'
import {
  getKitchenOrders,
  subscribeToKitchenOrders,
  markOrderCompleted,
  orderTotal,
  getKitchens
} from '../utils/storage'
import { unlockAudio, isAudioUnlocked, playOrderAlert } from '../utils/soundAlert'

export default function Kitchen() {
  const { user, kitchenId } = useAuth()
  const [kitchenName, setKitchenName] = useState('')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [soundOn, setSoundOn] = useState(isAudioUnlocked())
  const [flashId, setFlashId] = useState(null)

  async function refresh() {
    if (!kitchenId) return
    setOrders(await getKitchenOrders(kitchenId))
  }

  useEffect(() => {
    async function init() {
      if (!kitchenId) {
        setLoading(false)
        return
      }
      const kitchens = await getKitchens()
      setKitchenName(kitchens.find((k) => k.id === kitchenId)?.name ?? 'Kitchen')
      await refresh()
      setLoading(false)
    }
    init()

    if (!kitchenId) return
    const unsub = subscribeToKitchenOrders(kitchenId, {
      onInsert: (payload) => {
        playOrderAlert()
        setFlashId(payload.new?.id ?? null)
        setTimeout(() => setFlashId(null), 2000)
      },
      onChange: refresh
    })
    return unsub
  }, [kitchenId])

  function handleEnableSound() {
    unlockAudio()
    setSoundOn(true)
  }

  async function handleMarkReady(id) {
    await markOrderCompleted(id)
    await refresh()
  }

  if (!kitchenId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-void px-4">
        <div className="max-w-md rounded-xl border border-rail bg-panel p-6 text-center shadow-ticket">
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-chili">Not linked</p>
          <h1 className="mt-2 font-display text-2xl text-paper">No kitchen assigned</h1>
          <p className="mt-3 text-sm text-paper/70">
            This account is set to the kitchen role but isn't linked to a kitchen yet. Ask your
            admin to set <code className="text-ember">kitchen_id</code> on your profile.
          </p>
          <button
            onClick={signOut}
            className="mt-4 font-mono text-xs uppercase tracking-wide text-muted hover:text-ember"
          >
            Sign out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-void bg-ember-glow px-4 pb-10 pt-6 sm:px-8">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.14em] text-ember">Kitchen Display</p>
          <h1 className="font-display text-3xl text-paper">{kitchenName}</h1>
          <p className="mt-1 text-sm text-paper/60">{user?.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {!soundOn && (
            <button
              onClick={handleEnableSound}
              className="rounded-md border border-ember/40 bg-ember/10 px-3 py-2 font-mono text-xs uppercase tracking-wide text-ember hover:bg-ember/20"
            >
              🔔 Enable order alerts
            </button>
          )}
          {soundOn && (
            <span className="font-mono text-xs uppercase tracking-wide text-sage">🔔 Alerts on</span>
          )}
          <button
            onClick={signOut}
            className="font-mono text-xs uppercase tracking-wide text-muted hover:text-ember"
          >
            Sign out
          </button>
        </div>
      </header>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : orders.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-2 text-center">
          <p className="font-display text-3xl text-paper/40">All caught up</p>
          <p className="text-sm text-muted">New orders will ring in here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className={`flex flex-col justify-between rounded-xl border p-5 shadow-ticket transition-all ${
                flashId === order.id
                  ? 'border-ember bg-ember/10'
                  : 'border-rail bg-panel'
              }`}
            >
              <div>
                <p className="font-mono text-xs text-muted">
                  #{order.id.slice(0, 8)} · {timeAgo(order.timestamp)}
                </p>
                <p className="mt-1 font-display text-2xl text-paper">{order.item}</p>
                <p className="mt-1 font-mono text-sm text-ember">
                  {order.quantity}× · {formatINR(orderTotal(order))}
                </p>
              </div>
              <button
                onClick={() => handleMarkReady(order.id)}
                className="mt-5 w-full rounded-lg bg-ember py-4 text-center font-display text-lg font-medium text-void transition-colors hover:bg-ember-soft active:bg-ember-dim"
              >
                Mark Ready
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function timeAgo(isoString) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(isoString).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins === 1) return '1 min ago'
  return `${mins} min ago`
}

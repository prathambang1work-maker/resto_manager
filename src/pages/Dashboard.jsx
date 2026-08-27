import { useEffect, useState } from 'react'
import Card from '../components/Card'
import { formatINR } from '../utils/currency'
import { getDashboardStats, getAnalytics } from '../utils/storage'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrdersToday: 0,
    revenueToday: 0,
    activeOrders: 0,
    activeByKitchen: [],
    unassignedActive: 0
  })
  const [analytics, setAnalytics] = useState({
    totalRevenueAllTime: 0,
    mostOrderedItem: null,
    mostOrderedQty: 0,
    revenueByDay: []
  })

  useEffect(() => {
    setStats(getDashboardStats())
    setAnalytics(getAnalytics())
  }, [])

  const maxDay = Math.max(1, ...analytics.revenueByDay.map((d) => d.total))

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-ember">Overview</p>
        <h1 className="font-display text-3xl text-paper">Tonight's board</h1>
        <p className="mt-1 text-sm text-paper/60">
          A live read on orders and revenue since the line opened today.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card eyebrow="Today" title="Orders" value={stats.totalOrdersToday} />
        <Card eyebrow="Today" title="Revenue" value={formatINR(stats.revenueToday)} />
        <Card
          eyebrow="Right now"
          title="Active orders"
          value={stats.activeOrders}
          accent={stats.activeOrders > 0 ? 'firing' : 'clear'}
        />
      </div>

      {stats.activeByKitchen.length > 0 && (
        <Card eyebrow="Right now" title="Kitchen workload">
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {stats.activeByKitchen.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between rounded-md border border-rail bg-raised px-3 py-2"
              >
                <p className="text-sm text-paper/80">{k.name}</p>
                <p className="font-mono text-sm text-ember">{k.active}</p>
              </div>
            ))}
            {stats.unassignedActive > 0 && (
              <div className="flex items-center justify-between rounded-md border border-dashed border-rail px-3 py-2">
                <p className="text-sm text-paper/50">Unassigned</p>
                <p className="font-mono text-sm text-chili">{stats.unassignedActive}</p>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card eyebrow="Last 7 days" title="Revenue trend">
        <div className="mt-4 flex h-32 items-end gap-3">
          {analytics.revenueByDay.map((day, idx) => (
            <div key={idx} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-sm bg-ember/80 transition-all"
                style={{ height: `${Math.max(4, (day.total / maxDay) * 100)}%` }}
                title={formatINR(day.total)}
              />
              <span className="font-mono text-[10px] uppercase text-muted">{day.label}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card eyebrow="All time" title="Total revenue" value={formatINR(analytics.totalRevenueAllTime)} />
        <Card eyebrow="All time" title="Most ordered" value={analytics.mostOrderedItem ?? '—'}>
          {analytics.mostOrderedItem && (
            <p className="mt-1 font-mono text-xs text-muted">{analytics.mostOrderedQty} sold</p>
          )}
        </Card>
      </div>
    </div>
  )
}

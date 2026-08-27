import { useEffect, useState } from 'react'
import Card from '../components/Card'
import { getDashboardStats } from '../utils/storage'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalOrdersToday: 0,
    activeOrders: 0,
    activeByKitchen: [],
    unassignedActive: 0
  })

  useEffect(() => {
    setStats(getDashboardStats())
  }, [])

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-ember">Overview</p>
        <h1 className="font-display text-3xl text-paper">Tonight's board</h1>
        <p className="mt-1 text-sm text-paper/60">
          A live read on order volume and kitchen load since the line opened today.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card eyebrow="Today" title="Orders" value={stats.totalOrdersToday} />
        <Card
          eyebrow="Right now"
          title="Active orders"
          value={stats.activeOrders}
          accent={stats.activeOrders > 0 ? 'firing' : 'clear'}
        />
      </div>

      <Card eyebrow="Right now" title="Kitchen workload">
        {stats.activeByKitchen.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            No kitchens set up yet — add some in Admin.
          </p>
        ) : (
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
        )}
      </Card>
    </div>
  )
}

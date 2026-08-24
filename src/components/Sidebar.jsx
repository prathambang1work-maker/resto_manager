import { NavLink } from 'react-router-dom'

const LINKS = [
  { to: '/', label: 'Dashboard', icon: FlameIcon },
  { to: '/orders', label: 'Orders', icon: TicketIcon },
  { to: '/menu', label: 'Menu', icon: BookIcon }
]

export default function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-rail bg-panel px-4 py-6 md:flex">
      <div className="mb-8 flex items-center gap-2 px-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-ember/15 text-ember">
          <FlameIcon className="h-4 w-4" />
        </span>
        <div>
          <p className="font-display text-lg leading-none text-paper">Embercard</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            Kitchen Console
          </p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? 'bg-ember/12 text-ember'
                  : 'text-paper/65 hover:bg-raised hover:text-paper'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={`h-4 w-4 ${isActive ? 'text-ember' : 'text-muted group-hover:text-paper/80'}`} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-lg border border-rail bg-raised/60 px-3 py-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Status</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-paper/80">
          <span className="h-1.5 w-1.5 rounded-full bg-sage" />
          Line running
        </p>
      </div>
    </aside>
  )
}

function FlameIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c1.5 1.5 2 3.5 2 5.5A6.5 6.5 0 1 1 8 8.7C8.9 6.4 10.6 4 12 2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function TicketIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1.5a1.5 1.5 0 0 0 0 3V15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2.5a1.5 1.5 0 0 0 0-3V8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M14 6v12" stroke="currentColor" strokeWidth="1.6" strokeDasharray="2 2" />
    </svg>
  )
}

function BookIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 4.5C5 3.7 5.7 3 6.5 3H19v15.5c0 .8-.7 1.5-1.5 1.5H6.5A1.5 1.5 0 0 1 5 18.5v-14Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M5 18.5A1.5 1.5 0 0 1 6.5 17H19" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

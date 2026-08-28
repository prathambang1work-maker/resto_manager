import { NavLink } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../context/AuthContext'

const MOBILE_LINKS = [
  { to: '/', label: 'Dashboard' },
  { to: '/orders', label: 'Orders' },
  { to: '/menu', label: 'Menu' }
]

export default function Layout({ children }) {
  const { role } = useAuth()
  const mobileLinks =
    role === 'admin' ? [...MOBILE_LINKS, { to: '/admin', label: 'Admin' }] : MOBILE_LINKS

  return (
    <div className="flex min-h-screen bg-void bg-ember-glow">
      <Sidebar />

      <div className="flex min-h-screen w-full flex-1 flex-col">
        <main className="flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-rail bg-panel/95 backdrop-blur md:hidden">
          {mobileLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-1 flex-col items-center gap-1 py-3 text-xs ${
                  isActive ? 'text-ember' : 'text-muted'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../utils/supabaseClient'
import { getProfile, onAuthStateChange } from '../utils/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session) {
        setProfile(await getProfile(data.session.user.id))
      }
      setLoading(false)
    })

    const { data: listener } = onAuthStateChange(async (nextSession) => {
      setSession(nextSession)
      setProfile(nextSession ? await getProfile(nextSession.user.id) : null)
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [])

  const value = {
    session,
    user: session?.user ?? null,
    role: profile?.role ?? null,
    kitchenId: profile?.kitchen_id ?? null,
    loading
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

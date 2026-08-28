// ---------------------------------------------------------------------------
// auth.js
// Thin wrapper around Supabase Auth. Real server-side authentication —
// unlike the earlier localStorage-based gate, credentials are never stored
// or checked in the browser. Roles ('staff' | 'admin') live in the
// `profiles` table, one row per auth user, set up via the Supabase
// dashboard (see README).
// ---------------------------------------------------------------------------

import { supabase } from './supabaseClient'

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { ok: false, error: error.message }
  return { ok: true, user: data.user }
}

export async function signOut() {
  await supabase.auth.signOut()
}

export async function getCurrentSession() {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, kitchen_id')
    .eq('id', userId)
    .single()
  if (error) {
    console.error('auth: failed to load profile', error)
    return null
  }
  return data
}

export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session))
}

/** Update the currently signed-in user's own password. */
export async function updateOwnPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

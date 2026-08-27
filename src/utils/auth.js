// ---------------------------------------------------------------------------
// auth.js
// Client-side admin login gate for the /admin section.
//
// IMPORTANT: This is a convenience gate, not real security. Credentials and
// the "logged in" flag both live in localStorage, fully readable/editable
// via browser devtools. It stops casual access to kitchen/credential
// settings but must never guard anything sensitive. A genuine login needs
// a real backend with server-side auth.
// ---------------------------------------------------------------------------

const CREDENTIALS_KEY = 'embercard:adminCredentials'
const SESSION_KEY = 'embercard:adminSession'

const DEFAULT_CREDENTIALS = {
  email: 'admin@embercard.app',
  password: 'admin123'
}

function safeParse(raw, fallback) {
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch (err) {
    console.error('auth: failed to parse stored value', err)
    return fallback
  }
}

export function getAdminCredentials() {
  const existing = localStorage.getItem(CREDENTIALS_KEY)
  if (existing === null) {
    localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(DEFAULT_CREDENTIALS))
    return DEFAULT_CREDENTIALS
  }
  return safeParse(existing, DEFAULT_CREDENTIALS)
}

export function updateAdminCredentials({ email, password }) {
  const current = getAdminCredentials()
  const next = {
    email: email?.trim() ? email.trim() : current.email,
    password: password ? password : current.password
  }
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(next))
  return next
}

export function isAdminAuthenticated() {
  return localStorage.getItem(SESSION_KEY) === 'true'
}

export function loginAdmin(email, password) {
  const creds = getAdminCredentials()
  const ok =
    email?.trim().toLowerCase() === creds.email.toLowerCase() && password === creds.password
  if (ok) {
    localStorage.setItem(SESSION_KEY, 'true')
  }
  return ok
}

export function logoutAdmin() {
  localStorage.removeItem(SESSION_KEY)
}

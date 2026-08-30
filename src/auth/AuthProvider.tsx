import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { getIdTokenResult, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { auth } from '../lib/firebase'
import { AuthContext, type AuthValue } from './authContext'
import { hasCalendarAccess } from './access'

function readableError(error: unknown): string { const code = (error as { code?: string }).code; if (code === 'auth/unauthorized-domain') return 'This site is not authorized for Google sign-in.'; if (code === 'auth/popup-blocked') return 'The sign-in popup was blocked. Allow popups and try again.'; if (code === 'auth/popup-closed-by-user') return 'Sign-in was cancelled. Try again when ready.'; if (code === 'auth/network-request-failed') return 'Network error. Check your connection and try again.'; return 'Google sign-in failed. Please try again.' }
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null), [loading, setLoading] = useState(true), [error, setError] = useState<string>()
  useEffect(() => {
    let active = true
    const unsubscribe = onAuthStateChanged(auth, async next => {
      if (!next) { if (active) { setUser(null); setLoading(false) }; return }
      try {
        const token = await getIdTokenResult(next)
        if (!active) return
        if (!hasCalendarAccess(token.claims)) {
          setUser(null); setError('This Google account is not authorized to access the calendar.'); setLoading(false)
          void signOut(auth)
          return
        }
        setUser(next); setLoading(false)
      } catch {
        if (active) { setUser(null); setError('Unable to verify calendar access. Please try again.'); setLoading(false); void signOut(auth) }
      }
    })
    return () => { active = false; unsubscribe() }
  }, [])
  const value = useMemo<AuthValue>(() => ({ user, loading, error, async signIn() { setError(undefined); try { await signInWithPopup(auth, new GoogleAuthProvider()) } catch (reason) { setError(readableError(reason)) } }, async signOut() { setError(undefined); await signOut(auth) } }), [user, loading, error])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

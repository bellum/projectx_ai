import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, vi } from 'vitest'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

const authApi = vi.hoisted(() => ({ observe: vi.fn(), popup: vi.fn(), logout: vi.fn(), token: vi.fn() }))
vi.mock('../lib/firebase', () => ({ auth: {} }))
vi.mock('firebase/auth', () => ({
  GoogleAuthProvider: class GoogleAuthProvider {},
  getIdTokenResult: authApi.token,
  onAuthStateChanged: authApi.observe,
  signInWithPopup: authApi.popup,
  signOut: authApi.logout
}))
function Controls() { const { error, signIn, signOut } = useAuth(); return <><button onClick={() => void signIn()}>Sign in</button><button onClick={() => void signOut()}>Sign out</button>{error && <p role="alert">{error}</p>}</> }
describe('AuthProvider', () => {
  beforeEach(() => { authApi.observe.mockImplementation((_auth: unknown, callback: (user: null) => void) => { callback(null); return vi.fn() }); authApi.popup.mockReset(); authApi.logout.mockReset(); authApi.token.mockReset() })
  it('uses popup sign-in and provides a retryable error', async () => { authApi.popup.mockRejectedValue({ code: 'auth/popup-blocked' }); render(<AuthProvider><Controls/></AuthProvider>); await userEvent.click(screen.getByRole('button', { name: 'Sign in' })); expect(authApi.popup).toHaveBeenCalledOnce(); expect(await screen.findByRole('alert')).toHaveTextContent('Allow popups') })
  it('signs out without using redirect auth', async () => { render(<AuthProvider><Controls/></AuthProvider>); await userEvent.click(screen.getByRole('button', { name: 'Sign out' })); expect(authApi.logout).toHaveBeenCalledOnce() })
})

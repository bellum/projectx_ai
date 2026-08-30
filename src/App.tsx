import { useAuth } from './auth/useAuth'
import { firebaseConfigured } from './lib/firebase'
import { CalendarPage } from './components/CalendarPage'
import { SignInScreen } from './components/SignInScreen'
export default function App() { const { user, loading } = useAuth(); if (loading) return <main className="sign-in"><p>Loading…</p></main>; return user ? <CalendarPage/> : <SignInScreen configured={firebaseConfigured}/> }

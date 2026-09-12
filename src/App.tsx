import { useState } from 'react'
import { useAuth } from './auth/useAuth'
import { firebaseConfigured } from './lib/firebase'
import { CalendarPage } from './components/CalendarPage'
import { InsightsPage } from './components/InsightsPage'
import { SignInScreen } from './components/SignInScreen'
export default function App() { const { user, loading } = useAuth(); const [page, setPage] = useState<'calendar' | 'insights'>('calendar'); if (loading) return <main className="sign-in"><p>Loading…</p></main>; return user ? (page === 'calendar' ? <CalendarPage onInsights={() => setPage('insights')}/> : <InsightsPage onCalendar={() => setPage('calendar')}/>) : <SignInScreen configured={firebaseConfigured}/> }

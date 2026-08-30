import { createContext } from 'react'
import type { User } from 'firebase/auth'

export interface AuthValue { user: User | null; loading: boolean; error?: string; signIn(): Promise<void>; signOut(): Promise<void> }
export const AuthContext = createContext<AuthValue | undefined>(undefined)

import { useState, useEffect } from 'react'
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth'
import type { User } from 'firebase/auth'
import { auth } from '../firebase'

interface UseAuthReturn {
  user: User | null
  authLoading: boolean
  signOut: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  // Start as loading — Firebase resolves from IndexedDB cache in ~50ms.
  // Keeping authLoading:true during this window prevents flashing the auth screen
  // on kiosk restarts when the user is already logged in.
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setAuthLoading(false)
    })
    return unsubscribe
  }, [])

  const signOut = async () => {
    localStorage.removeItem('nimaaz-settings')
    await firebaseSignOut(auth)
  }

  return { user, authLoading, signOut }
}

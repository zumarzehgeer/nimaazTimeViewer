import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { MosqueSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

const STORAGE_KEY = 'nimaaz-settings'

export function mergeWithDefaults(data: Partial<MosqueSettings>): MosqueSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...data,
    iqamahOffsets: { ...DEFAULT_SETTINGS.iqamahOffsets, ...data.iqamahOffsets },
    hadith: { ...DEFAULT_SETTINGS.hadith, ...data.hadith },
  }
}

function getConfigRef(uid: string) {
  return doc(db, 'users', uid, 'config', 'mosque')
}

function loadFromLocalStorage(): MosqueSettings | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    return mergeWithDefaults(JSON.parse(stored))
  } catch {
    return null
  }
}

interface UseFirestoreSettingsReturn {
  firestoreSettings: MosqueSettings | null
  saveToFirestore: (settings: MosqueSettings) => void
}

export function useFirestoreSettings(uid: string | null): UseFirestoreSettingsReturn {
  const [firestoreSettings, setFirestoreSettings] = useState<MosqueSettings | null>(null)
  const migratedRef = useRef(false)

  useEffect(() => {
    if (!uid) {
      setFirestoreSettings(null)
      migratedRef.current = false
      return
    }

    const configRef = getConfigRef(uid)

    const unsubscribe = onSnapshot(configRef, (snapshot) => {
      if (snapshot.exists()) {
        setFirestoreSettings(mergeWithDefaults(snapshot.data() as Partial<MosqueSettings>))
        migratedRef.current = true
      } else if (!migratedRef.current) {
        migratedRef.current = true
        const local = loadFromLocalStorage()
        if (local !== null && local.location !== null) {
          setDoc(configRef, local).catch(console.error)
        }
      }
    })

    return unsubscribe
  }, [uid])

  const saveToFirestore = useCallback(
    (settings: MosqueSettings) => {
      if (!uid) return
      setDoc(getConfigRef(uid), settings).catch(console.error)
    },
    [uid],
  )

  return { firestoreSettings, saveToFirestore }
}

import { useState, useEffect, useCallback } from 'react'
import { doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import type { MosqueSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

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

interface UseFirestoreSettingsReturn {
  firestoreSettings: MosqueSettings | null
  saveToFirestore: (settings: MosqueSettings) => void
}

export function useFirestoreSettings(uid: string | null): UseFirestoreSettingsReturn {
  const [snapshotState, setSnapshotState] = useState<{ uid: string; settings: MosqueSettings } | null>(null)

  useEffect(() => {
    if (!uid) return

    const configRef = getConfigRef(uid)
    let active = true
    const unsubscribe = onSnapshot(configRef, (snapshot) => {
      if (!active) return
      if (snapshot.exists()) {
        setSnapshotState({ uid, settings: mergeWithDefaults(snapshot.data() as Partial<MosqueSettings>) })
      }
    }, (error) => console.error('Could not load account settings', error))

    // Never infer ownership of the legacy shared localStorage entry.
    return () => { active = false; unsubscribe() }
  }, [uid])

  const saveToFirestore = useCallback(
    (settings: MosqueSettings) => {
      if (!uid) return
      setDoc(getConfigRef(uid), settings).catch(console.error)
    },
    [uid],
  )

  return { firestoreSettings: snapshotState?.uid === uid ? snapshotState.settings : null, saveToFirestore }
}

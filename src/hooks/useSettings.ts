import { useState, useCallback, useEffect, useRef } from 'react'
import type { MosqueSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { useFirestoreSettings, mergeWithDefaults } from './useFirestoreSettings'

const STORAGE_KEY = 'nimaaz-settings'

function loadSettings(): MosqueSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Migrate old top-level hadithApiKey to new hadith settings object
      if (typeof parsed.hadithApiKey === 'string' && !parsed.hadith) {
        parsed.hadith = { ...DEFAULT_SETTINGS.hadith }
        delete parsed.hadithApiKey
      }
      return mergeWithDefaults(parsed)
    }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS
}

export function useSettings(uid: string | null = null) {
  const [settings, setSettingsState] = useState<MosqueSettings>(loadSettings)
  const { firestoreSettings, saveToFirestore } = useFirestoreSettings(uid)
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // When Firestore data arrives (from cache or server), overlay it
  useEffect(() => {
    if (firestoreSettings) {
      setSettingsState(firestoreSettings)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(firestoreSettings))
    }
  }, [firestoreSettings])

  // Clear any pending debounced save on unmount
  useEffect(() => {
    return () => { if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current) }
  }, [])

  const setSettings = useCallback(
    (updater: MosqueSettings | ((prev: MosqueSettings) => MosqueSettings)) => {
      setSettingsState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        if (uid) {
          // Debounce Firestore writes to avoid a write per keystroke during rapid changes
          if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
          saveDebounceRef.current = setTimeout(() => saveToFirestore(next), 500)
        }
        return next
      })
    },
    [uid, saveToFirestore],
  )

  return { settings, setSettings }
}

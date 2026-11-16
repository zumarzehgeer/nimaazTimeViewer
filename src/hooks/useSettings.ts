import { useState, useCallback, useEffect, useRef } from 'react'
import type { MosqueSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { useFirestoreSettings, mergeWithDefaults } from './useFirestoreSettings'

export function settingsStorageKey(uid: string) { return `nimaaz-settings:${uid}` }

function loadSettings(uid: string | null): MosqueSettings {
  if (!uid) return DEFAULT_SETTINGS
  try {
    const stored = localStorage.getItem(settingsStorageKey(uid))
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
  const [state, setState] = useState(() => ({ uid, settings: loadSettings(uid) }))
  const { firestoreSettings, saveToFirestore } = useFirestoreSettings(uid)
  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // A new account must never render the previous account's in-memory settings.
  const settings = state.uid === uid ? state.settings : loadSettings(uid)
  useEffect(() => {
    setState({ uid, settings: loadSettings(uid) })
    return () => {
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
      saveDebounceRef.current = null
    }
  }, [uid])

  // When Firestore data arrives (from cache or server), overlay it
  useEffect(() => {
    if (uid && firestoreSettings) {
      setState({ uid, settings: firestoreSettings })
      localStorage.setItem(settingsStorageKey(uid), JSON.stringify(firestoreSettings))
    }
  }, [uid, firestoreSettings])

  const setSettings = useCallback(
    (updater: MosqueSettings | ((prev: MosqueSettings) => MosqueSettings)) => {
      if (!uid) return
      const next = typeof updater === 'function' ? updater(settings) : updater
      setState({ uid, settings: next })
      localStorage.setItem(settingsStorageKey(uid), JSON.stringify(next))
      if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current)
      saveDebounceRef.current = setTimeout(() => saveToFirestore(next), 500)
    },
    [uid, settings, saveToFirestore],
  )

  return { settings, setSettings }
}

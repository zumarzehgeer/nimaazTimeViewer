import { useState, useCallback } from 'react'
import type { MosqueSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

const STORAGE_KEY = 'nimaaz-settings'

function loadSettings(): MosqueSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch { /* ignore */ }
  return DEFAULT_SETTINGS
}

export function useSettings() {
  const [settings, setSettingsState] = useState<MosqueSettings>(loadSettings)

  const setSettings = useCallback((updater: MosqueSettings | ((prev: MosqueSettings) => MosqueSettings)) => {
    setSettingsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { settings, setSettings }
}

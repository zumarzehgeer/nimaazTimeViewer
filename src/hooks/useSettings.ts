import { useState, useCallback } from 'react'
import type { MosqueSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

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
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        iqamahOffsets: { ...DEFAULT_SETTINGS.iqamahOffsets, ...parsed.iqamahOffsets },
        hadith: { ...DEFAULT_SETTINGS.hadith, ...parsed.hadith },
      }
    }
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

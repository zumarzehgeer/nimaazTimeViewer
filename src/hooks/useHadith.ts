import { useState, useEffect, useRef, useCallback } from 'react'
import type { DisplayHadith, HadithCollection, PinnedHadith } from '../types'
import { getRotationSlot, pickHadithTarget, fetchHadith } from '../services/hadith'

interface UseHadithOptions {
  enabled: boolean
  rotationIntervalMinutes: number
  enabledCollections: HadithCollection[]
  apiKey: string
  pinnedHadith: PinnedHadith | null
}

interface UseHadithReturn {
  hadith: DisplayHadith | null
  loading: boolean
  isTransitioning: boolean
}

export function useHadith(options: UseHadithOptions): UseHadithReturn {
  const { enabled, rotationIntervalMinutes, enabledCollections, apiKey, pinnedHadith } = options

  const [hadith, setHadith] = useState<DisplayHadith | null>(null)
  const [loading, setLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const lastSlotRef = useRef<number>(-1)
  const collectionsKey = [...enabledCollections].sort().join(',')

  const apply = useCallback((next: DisplayHadith) => {
    setIsTransitioning(true)
    setTimeout(() => {
      setHadith(next)
      setIsTransitioning(false)
    }, 300)
  }, [])

  const loadHadith = useCallback(
    async (collection: HadithCollection, hadithNumber: number) => {
      if (!apiKey) return
      const cacheKey = `hadith-${collection}-${hadithNumber}`
      const cached = sessionStorage.getItem(cacheKey)

      if (cached) {
        try {
          apply(JSON.parse(cached))
          return
        } catch { /* re-fetch */ }
      }

      setLoading(true)
      try {
        const result = await fetchHadith(collection, hadithNumber, apiKey)
        if (result.english) {
          sessionStorage.setItem(cacheKey, JSON.stringify(result))
          apply(result)
        }
      } catch { /* fail silently */ } finally {
        setLoading(false)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [apiKey, apply],
  )

  // Pinned hadith — load once when pin changes
  const pinnedKey = pinnedHadith ? `${pinnedHadith.collection}-${pinnedHadith.hadithNumber}` : null
  useEffect(() => {
    if (!enabled || !pinnedHadith) return
    loadHadith(pinnedHadith.collection, pinnedHadith.hadithNumber)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pinnedKey, loadHadith])

  // Rotating hadith — only active when no pin
  useEffect(() => {
    if (!enabled || pinnedHadith) return

    const now = new Date()
    lastSlotRef.current = getRotationSlot(now, rotationIntervalMinutes)
    const { collection, hadithNumber } = pickHadithTarget(now, lastSlotRef.current, enabledCollections)
    loadHadith(collection, hadithNumber)

    const id = setInterval(() => {
      const current = new Date()
      const slot = getRotationSlot(current, rotationIntervalMinutes)
      if (slot !== lastSlotRef.current) {
        lastSlotRef.current = slot
        const { collection: c, hadithNumber: n } = pickHadithTarget(current, slot, enabledCollections)
        loadHadith(c, n)
      }
    }, 60_000)

    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, pinnedHadith, rotationIntervalMinutes, collectionsKey, loadHadith])

  useEffect(() => {
    if (!enabled) {
      setHadith(null)
      lastSlotRef.current = -1
    }
  }, [enabled])

  return { hadith, loading, isTransitioning }
}

import { useState, useEffect, useRef, useCallback } from 'react'
import type { DisplayHadith, HadithCollection } from '../types'
import { getRotationSlot, pickHadithTarget, fetchHadith } from '../services/hadith'

interface UseHadithOptions {
  enabled: boolean
  rotationIntervalMinutes: number
  enabledCollections: HadithCollection[]
  apiKey: string
}

interface UseHadithReturn {
  hadith: DisplayHadith | null
  loading: boolean
  isTransitioning: boolean
}

export function useHadith(options: UseHadithOptions): UseHadithReturn {
  const { enabled, rotationIntervalMinutes, enabledCollections, apiKey } = options

  const [hadith, setHadith] = useState<DisplayHadith | null>(null)
  const [loading, setLoading] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const lastSlotRef = useRef<number>(-1)
  const collectionsKey = [...enabledCollections].sort().join(',')

  const loadHadith = useCallback(
    async (now: Date) => {
      if (!apiKey) return
      const { collection, hadithNumber } = pickHadithTarget(now, getRotationSlot(now, rotationIntervalMinutes), enabledCollections)
      const cacheKey = `hadith-${collection}-${hadithNumber}`
      const cached = sessionStorage.getItem(cacheKey)

      const apply = (next: DisplayHadith) => {
        setIsTransitioning(true)
        setTimeout(() => {
          setHadith(next)
          setIsTransitioning(false)
        }, 300)
      }

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
    [rotationIntervalMinutes, collectionsKey, apiKey],
  )

  useEffect(() => {
    if (!enabled) {
      setHadith(null)
      lastSlotRef.current = -1
      return
    }

    const now = new Date()
    lastSlotRef.current = getRotationSlot(now, rotationIntervalMinutes)
    loadHadith(now)

    const id = setInterval(() => {
      const current = new Date()
      const slot = getRotationSlot(current, rotationIntervalMinutes)
      if (slot !== lastSlotRef.current) {
        lastSlotRef.current = slot
        loadHadith(current)
      }
    }, 60_000)

    return () => clearInterval(id)
  }, [enabled, loadHadith, rotationIntervalMinutes])

  return { hadith, loading, isTransitioning }
}

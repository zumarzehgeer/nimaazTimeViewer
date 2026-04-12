import { useState, useEffect, useCallback, useMemo } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { format } from 'date-fns'
import { db } from '../firebase'
import { fetchMonthCalendar } from '../services/aladhan'
import type { LocationState, DayCache, MonthCache } from '../types'
import type { PrayerTimesResult } from '../services/aladhan'

const FAILED_MONTHS_KEY = 'nimaaz-failed-months'

interface UsePrayerCacheReturn {
  getTimingsForDate: (date: Date) => PrayerTimesResult | null
  syncing: boolean
  syncProgress: number
  syncTotal: number
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`
}

function loadFailedMonths(): Set<string> {
  try {
    const stored = localStorage.getItem(FAILED_MONTHS_KEY)
    return stored ? new Set(JSON.parse(stored)) : new Set()
  } catch {
    return new Set()
  }
}

function saveFailedMonths(failed: Set<string>) {
  localStorage.setItem(FAILED_MONTHS_KEY, JSON.stringify([...failed]))
}

export function usePrayerCache(
  uid: string | null,
  location: LocationState | null,
  methodId: number | null,
): UsePrayerCacheReturn {
  const [cache, setCache] = useState<Record<string, DayCache>>({})
  const [syncing, setSyncing] = useState(false)
  const [syncProgress, setSyncProgress] = useState(0)
  // Computed once on mount — month only matters at startup, not mid-session
  const syncTotal = useMemo(() => (new Date().getMonth() + 1 >= 11 ? 2 : 1) * 12, [])

  useEffect(() => {
    if (!uid || !location) return

    let aborted = false
    const { lat, lng } = location
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // Always sync current year; also pre-fetch next year in November/December
    const years = [currentYear]
    if (currentMonth >= 11) years.push(currentYear + 1)

    setSyncProgress(0)
    setCache({})

    const failedMonths = loadFailedMonths()

    const allMonths = years.flatMap((year) =>
      Array.from({ length: 12 }, (_, i) => ({ year, month: i + 1, key: monthKey(year, i + 1) })),
    )
    const docRefs = allMonths.map(({ key }) => doc(db, 'users', uid, 'prayerCache', key))

    async function ensureYears() {
      const newCache: Record<string, DayCache> = {}
      let completed = 0
      let needsSync = false

      // Fetch all Firestore docs in parallel — hits IndexedDB cache instantly when offline
      const snaps = await Promise.all(docRefs.map((ref) => getDoc(ref).catch(() => null)))

      if (aborted) return

      for (let i = 0; i < allMonths.length; i++) {
        if (aborted) return

        const { year, month, key } = allMonths[i]
        const snap = snaps[i]
        let monthData: MonthCache | null = null

        if (snap?.exists()) {
          const stored = snap.data() as MonthCache
          if (stored.lat === lat && stored.lng === lng && stored.methodId === methodId) {
            monthData = stored
            failedMonths.delete(key)
          }
        }

        if (!monthData) {
          needsSync = true
          setSyncing(true)

          try {
            const days = await fetchMonthCalendar(year, month, lat, lng, methodId)
            monthData = { days, fetchedAt: Date.now(), lat, lng, methodId }
            // Queues to IndexedDB if offline, syncs when back online
            setDoc(docRefs[i], monthData).catch(console.error)
            failedMonths.delete(key)
          } catch {
            failedMonths.add(key)
            completed++
            setSyncProgress(completed)
            continue
          }
        }

        for (const day of monthData.days) {
          newCache[day.date] = day
        }
        completed++
        setSyncProgress(completed)
      }

      saveFailedMonths(failedMonths)

      if (!aborted) {
        setCache(newCache)
        if (needsSync) setSyncing(false)
      }
    }

    ensureYears()

    return () => { aborted = true }
  }, [uid, location?.lat, location?.lng, methodId])

  const getTimingsForDate = useCallback(
    (date: Date): PrayerTimesResult | null => {
      const key = format(date, 'dd-MM-yyyy')
      const entry = cache[key]
      if (!entry) return null
      return { timings: entry.timings, hijri: entry.hijri, method: entry.method }
    },
    [cache],
  )

  return { getTimingsForDate, syncing, syncProgress, syncTotal }
}

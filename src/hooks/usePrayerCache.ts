import { useState, useEffect, useCallback, useMemo } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { format } from 'date-fns'
import { db } from '../firebase'
import { fetchMonthCalendar } from '../services/aladhan'
import type { LocationState, DayCache, MonthCache } from '../types'
import type { PrayerTimesResult } from '../services/aladhan'

const FAILED_MONTHS_KEY = 'nimaaz-failed-months'
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

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

      // Fetch all Firestore docs in parallel — hits IndexedDB cache instantly when offline
      const snaps = await Promise.all(docRefs.map((ref) => getDoc(ref).catch(() => null)))

      if (aborted) return

      for (let i = 0; i < allMonths.length; i++) {
        if (aborted) return

        const { year, month, key } = allMonths[i]
        const snap = snaps[i]
        let monthData: MonthCache | null = null
        let staleData: MonthCache | null = null

        if (snap?.exists()) {
          const stored = snap.data() as MonthCache
          const fresh = Date.now() - stored.fetchedAt < CACHE_TTL_MS
          if (fresh && stored.lat === lat && stored.lng === lng && stored.methodId === methodId) {
            monthData = stored
            failedMonths.delete(key)
          } else if (stored.days?.length) {
            staleData = stored // keep as offline fallback if refresh fails
          }
        }

        if (!monthData) {
          setSyncing(true)

          try {
            const days = await fetchMonthCalendar(year, month, lat, lng, methodId)
            monthData = { days, fetchedAt: Date.now(), lat, lng, methodId }
            // Queues to IndexedDB if offline, syncs when back online
            setDoc(docRefs[i], monthData).catch(console.error)
            failedMonths.delete(key)
          } catch {
            if (staleData) {
              monthData = staleData // serve stale times rather than nothing
            } else {
              // Last resort: try the same month from the previous year.
              // Prayer times shift ~1-4 min/year — approximate but far better
              // than a blank screen after a full year offline.
              const prevYearRef = doc(db, 'users', uid!, 'prayerCache', monthKey(year - 1, month))
              try {
                const prevSnap = await getDoc(prevYearRef)
                if (prevSnap.exists()) {
                  const prevData = prevSnap.data() as MonthCache
                  if (prevData.days?.length) {
                    // Re-key dates from the previous year to the current year so
                    // getTimingsForDate("15-01-2027") finds "15-01-2027", not "15-01-2026".
                    // day.date format is "DD-MM-YYYY" — slice(0,6) gives "DD-MM-".
                    monthData = {
                      ...prevData,
                      days: prevData.days.map((d) => ({
                        ...d,
                        date: d.date.slice(0, 6) + year,
                      })),
                    }
                  }
                }
              } catch { /* ignore — truly no data available */ }

              if (!monthData) {
                failedMonths.add(key)
                completed++
                setSyncProgress(completed)
                continue
              }
            }
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
        setSyncing(false)
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

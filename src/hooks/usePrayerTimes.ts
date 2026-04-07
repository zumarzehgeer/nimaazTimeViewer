import { useState, useEffect } from 'react'
import { fetchPrayerTimes, type PrayerTimesResult } from '../services/aladhan'

interface UsePrayerTimesResult {
  data: PrayerTimesResult | null
  loading: boolean
  error: string | null
}

export function usePrayerTimes(
  date: Date | null,
  lat: number | null,
  lng: number | null,
): UsePrayerTimesResult {
  const [data, setData] = useState<PrayerTimesResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (date === null || lat === null || lng === null) return

    let cancelled = false
    setLoading(true)
    setError(null)

    fetchPrayerTimes(date, lat, lng)
      .then((result) => {
        if (!cancelled) {
          setData(result)
          setLoading(false)
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [date?.toDateString(), lat, lng])

  return { data, loading, error }
}

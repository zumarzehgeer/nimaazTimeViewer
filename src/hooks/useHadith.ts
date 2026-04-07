import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { fetchHadith } from '../services/hadith'
import type { DailyHadith } from '../types'

const BUKHARI_COUNT = 7563

export function useHadith(apiKey: string | null, date: Date): { hadith: DailyHadith | null; loading: boolean } {
  const [hadith, setHadith] = useState<DailyHadith | null>(null)
  const [loading, setLoading] = useState(false)

  const dateKey = format(date, 'yyyy-MM-dd')

  useEffect(() => {
    if (!apiKey) {
      setHadith(null)
      return
    }

    const cacheKey = `hadith-${dateKey}`

    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      try {
        setHadith(JSON.parse(cached))
        return
      } catch { /* ignore, re-fetch */ }
    }

    const hadithNumber = (Math.floor(new Date(dateKey).getTime() / 86400000) % BUKHARI_COUNT) + 1
    let cancelled = false

    setLoading(true)
    fetchHadith(apiKey, hadithNumber)
      .then((result) => {
        if (cancelled) return
        if (result.english) {
          sessionStorage.setItem(cacheKey, JSON.stringify(result))
          setHadith(result)
        }
      })
      .catch(() => { /* fail silently */ })
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [apiKey, dateKey])

  return { hadith, loading }
}

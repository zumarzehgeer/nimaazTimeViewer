import { useState, useEffect } from 'react'
import { fetchNextHijriHoliday } from '../services/aladhan'
import type { NextHijriHoliday } from '../types'

export function useNextHijriHoliday(): NextHijriHoliday | null {
  const [holiday, setHoliday] = useState<NextHijriHoliday | null>(null)

  useEffect(() => {
    fetchNextHijriHoliday()
      .then(setHoliday)
      .catch(() => { /* silently ignore — badge just won't show */ })
  }, [])

  return holiday
}

import { useState, useEffect } from 'react'
import type { PrayerEntry } from '../types'

interface CountdownResult {
  nextPrayer: PrayerEntry | null
  countdown: string
}

function parseTime(timeStr: string, baseDate: Date): Date {
  // timeStr is typically "HH:MM" or "HH:MM (BST)" — strip timezone label
  const clean = timeStr.split(' ')[0]
  const [hours, minutes] = clean.split(':').map(Number)
  const d = new Date(baseDate)
  d.setHours(hours, minutes, 0, 0)
  return d
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return '00:00:00'
  const totalSeconds = Math.floor(ms / 1000)
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return [h, m, s].map((v) => String(v).padStart(2, '0')).join(':')
}

export function useCountdown(prayers: PrayerEntry[], date: Date): CountdownResult {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (prayers.length === 0) return { nextPrayer: null, countdown: '00:00:00' }

  // Find the next upcoming prayer
  const next = prayers.find((p) => {
    const prayerTime = parseTime(p.time, date)
    return prayerTime > now
  })

  if (!next) return { nextPrayer: null, countdown: '00:00:00' }

  const prayerDate = parseTime(next.time, date)
  const countdown = formatCountdown(prayerDate.getTime() - now.getTime())

  return { nextPrayer: next, countdown }
}

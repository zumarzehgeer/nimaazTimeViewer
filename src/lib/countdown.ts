import type { PrayerEntry } from '../types/index.ts'

export interface CountdownResult {
  nextPrayer: PrayerEntry | null
  countdown: string
  isTomorrow: boolean
}

function parseTime(value: string, date: Date): number {
  const match = /^(\d{2}):(\d{2})(?:\s.*)?$/.exec(value)
  if (!match) return NaN
  const hours = Number(match[1]), minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return NaN
  const result = new Date(date)
  result.setHours(hours, minutes, 0, 0)
  return result.getTime()
}

function nextAfter(prayers: PrayerEntry[], date: Date, now: Date) {
  return prayers.map((prayer) => ({ prayer, at: parseTime(prayer.time, date) }))
    .filter(({ at }) => Number.isFinite(at) && at > now.getTime())
    .sort((a, b) => a.at - b.at)[0]
}

/** Next adhan in device-local time. At the exact adhan boundary, advance to the next one. */
export function getCountdown(
  prayers: PrayerEntry[], date: Date, now: Date,
  tomorrowPrayers: PrayerEntry[] = [], tomorrowDate?: Date,
): CountdownResult {
  let next = nextAfter(prayers, date, now)
  let isTomorrow = false
  if (!next && tomorrowDate) {
    next = nextAfter(tomorrowPrayers, tomorrowDate, now)
    isTomorrow = next != null
  }
  if (!next) return { nextPrayer: null, countdown: '00:00:00', isTomorrow: false }
  const seconds = Math.floor((next.at - now.getTime()) / 1000)
  const countdown = [Math.floor(seconds / 3600), Math.floor(seconds % 3600 / 60), seconds % 60]
    .map((n) => String(n).padStart(2, '0')).join(':')
  return { nextPrayer: next.prayer, countdown, isTomorrow }
}

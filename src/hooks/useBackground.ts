import type { PrayerTimesData } from '../types'

type TimeOfDay = 'night' | 'dawn' | 'morning' | 'day' | 'afternoon' | 'sunset' | 'evening'

function toMinutes(timeStr: string): number {
  const clean = timeStr.split(' ')[0]
  const [h, m] = clean.split(':').map(Number)
  return h * 60 + m
}

function nowMinutes(): number {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export function getTimeOfDay(timings: PrayerTimesData | null): TimeOfDay {
  if (!timings) return 'night'

  const now = nowMinutes()
  const fajr = toMinutes(timings.Fajr)
  const sunrise = toMinutes(timings.Sunrise)
  const dhuhr = toMinutes(timings.Dhuhr)
  const asr = toMinutes(timings.Asr)
  const maghrib = toMinutes(timings.Maghrib)
  const isha = toMinutes(timings.Isha)

  if (now < fajr) return 'night'
  if (now < sunrise) return 'dawn'
  if (now < dhuhr) return 'morning'
  if (now < asr) return 'day'
  if (now < maghrib) return 'afternoon'
  if (now < isha) return 'sunset'
  return 'evening'
}

export const BACKGROUNDS: Record<TimeOfDay, string> = {
  night:     'from-[#2a2a2a] via-[#3c3c3c] to-[#2a2a2a]',
  dawn:      'from-[#3c3c3c] via-[#11999e] to-[#6decb9]',
  morning:   'from-[#11999e] via-[#6decb9] to-[#f4f4f4]',
  day:       'from-[#f4f4f4] via-[#e0faf4] to-[#f4f4f4]',
  afternoon: 'from-[#f4f4f4] via-[#6decb9] to-[#11999e]',
  sunset:    'from-[#11999e] via-[#3c3c3c] to-[#2a2a2a]',
  evening:   'from-[#2a2a2a] via-[#11999e] to-[#3c3c3c]',
}
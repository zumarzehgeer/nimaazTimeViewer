import type { IqamahOffsets, MosqueSettings, PrayerEntry } from '../types/index.ts'
import { PRAYER_KEYS } from '../types/index.ts'
import type { PrayerTimesResult } from '../services/aladhan.ts'

export function addIqamahTime(adhanTime: string, offsetMinutes: number): string {
  const [h, m] = adhanTime.split(' ')[0].split(':').map(Number)
  const total = ((h * 60 + m + offsetMinutes) % 1440 + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function buildPrayerList(data: PrayerTimesResult, settings: MosqueSettings): PrayerEntry[] {
  const list: PrayerEntry[] = PRAYER_KEYS
    .filter((key) => key !== 'Imsak' && data.timings[key] !== undefined)
    .map((key) => {
      const manual = settings.manualTimes?.[key]
      const adhanTime = manual?.adhan || data.timings[key]
      const iqamahTime = manual?.iqamah
        ?? (key !== 'Sunrise' && key in settings.iqamahOffsets
          ? addIqamahTime(adhanTime, settings.iqamahOffsets[key as keyof IqamahOffsets])
          : null)
      return { name: key === 'Lastthird' ? 'Last Third' : key, key, time: adhanTime, iqamahTime }
    })
  const dhuhrIndex = list.findIndex((p) => p.key === 'Dhuhr')
  if (dhuhrIndex !== -1) {
    const manual = settings.manualTimes?.Jumuah
    const adhanTime = manual?.adhan || settings.jumuahAdhan || list[dhuhrIndex].time
    list.splice(dhuhrIndex + 1, 0, {
      name: "Jumu'ah", key: 'Jumuah', time: adhanTime,
      iqamahTime: manual?.iqamah ?? addIqamahTime(adhanTime, settings.iqamahOffsets.Jumuah),
    })
  }
  return list
}

const CONGREGATIONAL_KEYS = ['Fajr', 'Dhuhr', 'Jumuah', 'Asr', 'Maghrib', 'Isha']

export function filterCongregational(prayers: PrayerEntry[], isFriday: boolean): PrayerEntry[] {
  return prayers.filter((p) => CONGREGATIONAL_KEYS.includes(p.key)
    && !(p.key === 'Dhuhr' && isFriday)
    && !(p.key === 'Jumuah' && !isFriday))
}

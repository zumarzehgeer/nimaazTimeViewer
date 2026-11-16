import { DEFAULT_SETTINGS } from '../types/index.ts'
import type { MosqueSettings } from '../types/index.ts'
import type { PrayerTimesResult } from '../services/aladhan.ts'

export function createDemoSettings(): MosqueSettings {
  return {
    ...DEFAULT_SETTINGS,
    mosqueName: 'Demo Mosque',
    location: { label: 'Sample location · device-local time', lat: 0, lng: 0 },
    iqamahOffsets: { ...DEFAULT_SETTINGS.iqamahOffsets },
    manualTimes: {},
    jumuahAdhan: '13:00',
    announcements: ['Guest demonstration: all prayer times are synthetic.', 'Try Friday, the overnight countdown, or display settings.'],
    hadith: { ...DEFAULT_SETTINGS.hadith, enabled: false, enabledCollections: [] },
  }
}

export const demoSchedule: PrayerTimesResult = {
  timings: { Fajr: '05:30', Sunrise: '06:45', Dhuhr: '12:30', Asr: '15:30', Maghrib: '17:45', Isha: '19:15' },
  hijri: { date: '01-01-1448', day: '1', weekday: { en: 'Sample', ar: '' }, month: { number: 1, en: 'Sample month', ar: '' }, year: '1448' },
  method: 'Synthetic example schedule',
}

export const scenarios = {
  weekday: { label: 'Weekday', at: new Date(2026, 10, 16, 12, 15) },
  friday: { label: 'Friday', at: new Date(2026, 10, 13, 12, 15) },
  overnight: { label: 'After Isha', at: new Date(2026, 10, 16, 23, 30) },
}

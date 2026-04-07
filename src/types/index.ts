export interface PrayerTimesData {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
  [key: string]: string
}

export interface HijriDate {
  date: string
  day: string
  weekday: { en: string; ar: string }
  month: { number: number; en: string; ar: string }
  year: string
}

export interface AladhanResponse {
  code: number
  data: {
    timings: PrayerTimesData
    date: {
      readable: string
      hijri: HijriDate
      gregorian: {
        date: string
        weekday: { en: string }
        month: { en: string; number: number }
        year: string
        day: string
      }
    }
    meta: {
      method: { id: number; name: string }
      school: string
    }
  }
}

export interface LocationState {
  label: string
  lat: number
  lng: number
}

export interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

export interface PrayerEntry {
  name: string
  key: string
  time: string
  iqamahTime: string | null
}

export interface IqamahOffsets {
  Fajr: number
  Dhuhr: number
  Jumuah: number
  Asr: number
  Maghrib: number
  Isha: number
}

export interface DailyHadith {
  number: string
  english: string
  arabic: string
  chapter: string
}

export interface MosqueSettings {
  mosqueName: string
  location: LocationState | null
  iqamahOffsets: IqamahOffsets
  jumuahAdhan: string
  announcements: string[]
  methodId: number | null
  hadithApiKey: string
}

export interface CalculationMethod {
  id: number
  name: string
}

export interface NextHijriHoliday {
  name: string
  daysUntil: number
}

export const PRAYER_KEYS = [
  'Imsak',
  'Fajr',
  'Sunrise',
  'Dhuhr',
  'Asr',
  'Maghrib',
  'Isha',
  'Midnight',
  'Lastthird',
] as const

export const DEFAULT_SETTINGS: MosqueSettings = {
  mosqueName: 'Masjid',
  location: null,
  iqamahOffsets: {
    Fajr: 20,
    Dhuhr: 15,
    Jumuah: 30,
    Asr: 15,
    Maghrib: 5,
    Isha: 15,
  },
  jumuahAdhan: '',
  announcements: [],
  methodId: null,
  hadithApiKey: '',
}

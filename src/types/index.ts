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

export interface ManualPrayerTime {
  adhan?: string   // "HH:MM" 24h — overrides API time when set
  iqamah?: string  // "HH:MM" 24h — overrides offset calculation when set
}

export type HadithCollection =
  | 'sahih-bukhari'
  | 'sahih-muslim'
  | 'al-tirmidhi'
  | 'abu-dawood'
  | 'ibn-e-majah'
  | 'sunan-nasai'
  | 'mishkat'
  | 'musnad-ahmad'
  | 'al-silsila-sahiha'

export const COLLECTION_LABELS: Record<HadithCollection, string> = {
  'sahih-bukhari': 'Sahih Bukhari',
  'sahih-muslim': 'Sahih Muslim',
  'al-tirmidhi': "Jami' al-Tirmidhi",
  'abu-dawood': 'Sunan Abu Dawood',
  'ibn-e-majah': 'Sunan Ibn Majah',
  'sunan-nasai': "Sunan an-Nasa'i",
  'mishkat': 'Mishkat al-Masabih',
  'musnad-ahmad': 'Musnad Ahmad',
  'al-silsila-sahiha': 'Al-Silsila al-Sahiha',
}

export const COLLECTION_COUNTS: Record<HadithCollection, number> = {
  'sahih-bukhari': 7563,
  'sahih-muslim': 7453,
  'al-tirmidhi': 3956,
  'abu-dawood': 5274,
  'ibn-e-majah': 4342,
  'sunan-nasai': 5761,
  'mishkat': 6294,
  'musnad-ahmad': 4305,
  'al-silsila-sahiha': 4358,
}

export interface DisplayHadith {
  number: string
  english: string
  arabic: string
  chapter: string
  source: string
  collection: HadithCollection
}

export interface PinnedHadith {
  collection: HadithCollection
  hadithNumber: number
}

export interface HadithSettings {
  enabled: boolean
  showArabic: boolean
  rotationIntervalMinutes: number
  enabledCollections: HadithCollection[]
  hadithApiKey: string
  pinnedHadith: PinnedHadith | null
}

/** @deprecated use settings.hadith.* instead */
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
  manualTimes: Record<string, ManualPrayerTime>
  jumuahAdhan: string
  announcements: string[]
  methodId: number | null
  hadith: HadithSettings
}

export interface CalculationMethod {
  id: number
  name: string
}

export interface NextHijriHoliday {
  name: string
  daysUntil: number
}

export interface DayCache {
  date: string           // "DD-MM-YYYY" gregorian
  timings: PrayerTimesData
  hijri: HijriDate
  method: string
}

export interface MonthCache {
  days: DayCache[]
  fetchedAt: number
  lat: number
  lng: number
  methodId: number | null
}

export interface UserProfile {
  uid: string
  email: string
  mosqueName: string
  phoneNumber: string
  location: LocationState | null
  createdAt: number
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
  manualTimes: {},
  jumuahAdhan: '',
  announcements: [],
  methodId: null,
  hadith: {
    enabled: true,
    showArabic: false,
    rotationIntervalMinutes: 30,
    enabledCollections: ['sahih-bukhari', 'sahih-muslim', 'al-tirmidhi', 'abu-dawood', 'ibn-e-majah', 'sunan-nasai'],
    hadithApiKey: '',
    pinnedHadith: null,
  },
}

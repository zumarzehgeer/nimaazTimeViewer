import { format } from 'date-fns'
import type { AladhanResponse, PrayerTimesData, HijriDate } from '../types'

const BASE_URL = 'https://api.aladhan.com/v1'

export interface PrayerTimesResult {
  timings: PrayerTimesData
  hijri: HijriDate
  gregorianReadable: string
  method: string
  school: string
}

export async function fetchPrayerTimes(
  date: Date,
  lat: number,
  lng: number,
): Promise<PrayerTimesResult> {
  const dateStr = format(date, 'dd-MM-yyyy')
  const url = `${BASE_URL}/timings/${dateStr}?latitude=${lat}&longitude=${lng}`

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`)
  }

  const json: AladhanResponse = await res.json()

  if (json.code !== 200) {
    throw new Error('Unexpected API response')
  }

  return {
    timings: json.data.timings,
    hijri: json.data.date.hijri,
    gregorianReadable: json.data.date.readable,
    method: json.data.meta.method.name,
    school: json.data.meta.school,
  }
}

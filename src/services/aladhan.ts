import { format, parse, differenceInCalendarDays } from 'date-fns'
import type { AladhanResponse, PrayerTimesData, HijriDate, CalculationMethod, NextHijriHoliday } from '../types'

const BASE_URL = 'https://api.aladhan.com/v1'

export interface PrayerTimesResult {
  timings: PrayerTimesData
  hijri: HijriDate
  method: string
}

export async function fetchPrayerTimes(
  date: Date,
  lat: number,
  lng: number,
  methodId?: number | null,
): Promise<PrayerTimesResult> {
  const dateStr = format(date, 'dd-MM-yyyy')
  let url = `${BASE_URL}/timings/${dateStr}?latitude=${lat}&longitude=${lng}`
  if (methodId != null) url += `&method=${methodId}`

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
    method: json.data.meta.method.name,
  }
}

export async function fetchMethods(): Promise<CalculationMethod[]> {
  const res = await fetch(`${BASE_URL}/methods`)
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
  const json = await res.json()
  // json.data is an object keyed by method id
  return Object.values(json.data as Record<string, { id: number; name: string }>)
    .filter(({ id }) => id !== 99)
    .map(({ id, name }) => ({ id, name }))
    .sort((a, b) => a.id - b.id)
}

export async function fetchNextHijriHoliday(): Promise<NextHijriHoliday> {
  const res = await fetch(`${BASE_URL}/nextHijriHoliday`)
  if (!res.ok) throw new Error(`Request failed with status ${res.status}`)
  const json = await res.json()
  const { hijri, gregorian } = json.data
  const name: string = hijri.holidays?.[0] ?? 'Islamic Holiday'
  const holidayDate = parse(gregorian.date, 'dd-MM-yyyy', new Date())
  const daysUntil = differenceInCalendarDays(holidayDate, new Date())
  return { name, daysUntil }
}

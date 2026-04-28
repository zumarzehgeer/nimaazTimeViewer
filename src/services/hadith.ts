import type { DisplayHadith, HadithCollection } from '../types'
import { COLLECTION_COUNTS, COLLECTION_LABELS } from '../types'

// Server-side proxy — Vite proxies in dev, Vercel serverless function in prod.
// Avoids CORS (hadithapi.com doesn't support it).
const BASE_URL = '/api/hadith'

/**
 * Compute which rotation slot we're in based on the current time and interval.
 */
export function getRotationSlot(now: Date, intervalMinutes: number): number {
  const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes()
  return Math.floor(minutesSinceMidnight / intervalMinutes)
}

/**
 * Deterministically pick a collection and hadith number for a given date + slot.
 * Same date+slot always yields the same hadith — consistent across all displays.
 */
export function pickHadithTarget(
  date: Date,
  slotIndex: number,
  enabledCollections: HadithCollection[],
): { collection: HadithCollection; hadithNumber: number } {
  const collections = enabledCollections.length > 0 ? enabledCollections : (['sahih-bukhari'] as HadithCollection[])
  const daysSinceEpoch = Math.floor(date.getTime() / 86_400_000)
  // Pick collection deterministically
  const collectionIndex = Math.abs((daysSinceEpoch * 7 + slotIndex * 13)) % collections.length
  const collection = collections[collectionIndex]
  // Pick hadith number within that collection
  const count = COLLECTION_COUNTS[collection]
  const hadithNumber = (Math.abs((daysSinceEpoch * 97 + slotIndex * 31)) % count) + 1
  return { collection, hadithNumber }
}

/**
 * Fetch a hadith from hadithapi.com.
 */
export async function fetchHadith(
  collection: HadithCollection,
  hadithNumber: number,
  apiKey: string,
): Promise<DisplayHadith> {
  const url = `${BASE_URL}?apiKey=${apiKey}&book=${collection}&hadithNumber=${hadithNumber}&paginate=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  const item = json?.hadiths?.data?.[0]
  if (!item) throw new Error('No hadith returned')
  return {
    number: String(item.hadithNumber),
    english: item.hadithEnglish ?? '',
    arabic: item.hadithArabic ?? '',
    chapter: item.chapter?.chapterEnglish ?? '',
    source: COLLECTION_LABELS[collection],
    collection,
  }
}

import type { DailyHadith } from '../types'

export async function fetchHadith(apiKey: string, hadithNumber: number): Promise<DailyHadith> {
  const url = `https://hadithapi.com/api/hadiths/?apiKey=${apiKey}&book=sahih-bukhari&hadithNumber=${hadithNumber}&paginate=1`
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
  }
}

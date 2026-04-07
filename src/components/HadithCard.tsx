import type { DailyHadith } from '../types'

interface HadithCardProps {
  hadith: DailyHadith
}

export function HadithCard({ hadith }: HadithCardProps) {
  if (!hadith.english) return null

  return (
    <div className='bg-white/40 rounded-xl px-4 py-3 border border-[#3c3c3c]/8'>
      {hadith.arabic && (
        <p
          className='text-right text-[clamp(0.8rem,1vw,1.1rem)] text-[#3c3c3c]/60 leading-relaxed mb-2 line-clamp-2'
          dir='rtl'
          style={{ fontFamily: "'Noto Naskh Arabic', 'Traditional Arabic', serif" }}
        >
          {hadith.arabic}
        </p>
      )}
      <p className='text-[clamp(0.75rem,0.95vw,1rem)] text-[#3c3c3c]/80 leading-relaxed line-clamp-4'>
        {hadith.english}
      </p>
      <p className='mt-2 text-[clamp(0.6rem,0.75vw,0.8rem)] text-[#11999e] font-medium'>
        Sahih Bukhari · #{hadith.number}
        {hadith.chapter ? ` · ${hadith.chapter}` : ''}
      </p>
    </div>
  )
}

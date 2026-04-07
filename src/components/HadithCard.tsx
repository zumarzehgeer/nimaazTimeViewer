import type { DisplayHadith } from '../types'

interface HadithCardProps {
  hadith: DisplayHadith | null
  loading: boolean
  isTransitioning: boolean
}

export function HadithCard({ hadith, loading, isTransitioning }: HadithCardProps) {
  if (loading && !hadith) {
    return (
      <div className='bg-white/40 rounded-xl px-[clamp(0.75rem,1.5vw,1.5rem)] py-[clamp(0.5rem,1vw,1rem)] border border-[#3c3c3c]/8 animate-pulse'>
        <div className='h-3 bg-[#3c3c3c]/10 rounded w-1/3 mb-3' />
        <div className='h-3 bg-[#3c3c3c]/10 rounded w-3/4 mb-2 ml-auto' />
        <div className='h-3 bg-[#3c3c3c]/10 rounded w-full mb-1' />
        <div className='h-3 bg-[#3c3c3c]/10 rounded w-5/6 mb-1' />
        <div className='h-3 bg-[#3c3c3c]/10 rounded w-4/6' />
      </div>
    )
  }

  if (!hadith?.english) return null

  return (
    <div
      className={`bg-white/40 rounded-xl px-[clamp(0.75rem,1.5vw,1.5rem)] py-[clamp(0.5rem,1vw,1rem)] border border-[#3c3c3c]/8 transition-opacity duration-300 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <p className='text-[clamp(0.65rem,0.85vw,0.95rem)] text-[#11999e] font-semibold uppercase tracking-widest mb-2'>
        Hadith
      </p>

      {hadith.arabic && (
        <p
          className='text-right text-[clamp(0.9rem,1.1vw,1.3rem)] text-[#3c3c3c]/60 leading-relaxed mb-2'
          dir='rtl'
          style={{ fontFamily: "'Noto Naskh Arabic', 'Traditional Arabic', serif" }}
        >
          {hadith.arabic}
        </p>
      )}

      <p className='text-[clamp(0.8rem,1vw,1.15rem)] text-[#3c3c3c]/80 leading-relaxed'>
        {hadith.english}
      </p>

      <p className='mt-2 text-[clamp(0.7rem,0.85vw,0.95rem)] text-[#11999e] font-medium'>
        {hadith.source} · #{hadith.number}
        {hadith.chapter ? ` · ${hadith.chapter}` : ''}
      </p>
    </div>
  )
}

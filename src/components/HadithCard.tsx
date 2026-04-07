import { useState } from 'react'
import type { DisplayHadith } from '../types'

interface HadithCardProps {
  hadith: DisplayHadith | null
  loading: boolean
  isTransitioning: boolean
}

export function HadithCard({ hadith, loading, isTransitioning }: HadithCardProps) {
  const [expanded, setExpanded] = useState(false)

  if (loading && !hadith) {
    return (
      <div className='bg-white/40 rounded-xl px-4 py-3 border border-[#3c3c3c]/8 animate-pulse'>
        <div className='h-3 bg-[#3c3c3c]/10 rounded w-1/3 mb-3' />
        <div className='h-3 bg-[#3c3c3c]/10 rounded w-3/4 mb-2 ml-auto' />
        <div className='h-3 bg-[#3c3c3c]/10 rounded w-full mb-1' />
        <div className='h-3 bg-[#3c3c3c]/10 rounded w-5/6 mb-1' />
        <div className='h-3 bg-[#3c3c3c]/10 rounded w-4/6' />
      </div>
    )
  }

  if (!hadith?.english) return null

  const isLong = hadith.english.length > 220

  return (
    <div
      className={`bg-white/40 rounded-xl px-4 py-3 border border-[#3c3c3c]/8 transition-opacity duration-300 ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <p className='text-[clamp(0.55rem,0.7vw,0.75rem)] text-[#11999e] font-semibold uppercase tracking-widest mb-2'>
        Hadith
      </p>

      {hadith.arabic && (
        <p
          className='text-right text-[clamp(0.8rem,1vw,1.1rem)] text-[#3c3c3c]/60 leading-relaxed mb-2 line-clamp-2'
          dir='rtl'
          style={{ fontFamily: "'Noto Naskh Arabic', 'Traditional Arabic', serif" }}
        >
          {hadith.arabic}
        </p>
      )}

      <p
        className={`text-[clamp(0.75rem,0.95vw,1rem)] text-[#3c3c3c]/80 leading-relaxed ${
          !expanded && isLong ? 'line-clamp-3' : ''
        }`}
      >
        {hadith.english}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className='mt-1 text-[clamp(0.6rem,0.75vw,0.8rem)] text-[#11999e] hover:text-[#11999e]/70 font-medium'
        >
          {expanded ? 'Show less' : 'Read more...'}
        </button>
      )}

      <p className='mt-2 text-[clamp(0.6rem,0.75vw,0.8rem)] text-[#11999e] font-medium'>
        {hadith.source} · #{hadith.number}
        {hadith.chapter ? ` · ${hadith.chapter}` : ''}
      </p>
    </div>
  )
}

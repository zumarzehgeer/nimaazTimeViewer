import { useRef, useEffect } from 'react'
import type { DisplayHadith } from '../types'

interface HadithCardProps {
  hadith: DisplayHadith | null
  loading: boolean
  isTransitioning: boolean
  showArabic: boolean
  isDark: boolean
}

export function HadithCard({ hadith, loading, isTransitioning, showArabic, isDark }: HadithCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const d = isDark

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    let stopped = false
    let scrollStarted = false

    const clearLoop = () => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    }

    const startScroll = () => {
      clearLoop()
      if (stopped) return

      el.scrollTop = 0
      const overflow = el.scrollHeight - el.clientHeight
      if (overflow <= 0) return

      scrollStarted = true
      const pxPerSecond = 16
      let position = 0
      let lastTime: number | null = null

      const tick = (timestamp: number) => {
        if (stopped) return
        if (lastTime === null) { lastTime = timestamp }
        const delta = (timestamp - lastTime) / 1000
        lastTime = timestamp

        position += pxPerSecond * delta
        if (position >= overflow) {
          position = overflow
          el.scrollTop = position
          timerRef.current = setTimeout(() => {
            if (stopped) return
            position = 0
            el.scrollTop = 0
            lastTime = null
            timerRef.current = setTimeout(() => {
              if (stopped) return
              rafRef.current = requestAnimationFrame(tick)
            }, 4000)
          }, 6000)
          return
        }
        el.scrollTop = position
        rafRef.current = requestAnimationFrame(tick)
      }

      timerRef.current = setTimeout(() => {
        if (stopped) return
        rafRef.current = requestAnimationFrame(tick)
      }, 4000)
    }

    const ro = new ResizeObserver(() => {
      if (!scrollStarted) startScroll()
    })
    ro.observe(el)

    return () => {
      stopped = true
      clearLoop()
      ro.disconnect()
    }
  }, [hadith])

  if (loading && !hadith) {
    return (
      <div className={`rounded-xl px-[clamp(0.75rem,1.5vw,1.5rem)] py-[clamp(0.5rem,1vw,1rem)] border animate-pulse transition-colors ${d ? 'bg-[#132628] border-[#11999e]/20' : 'bg-white border-[#11999e]/20'}`}>
        <div className={`h-3 rounded w-1/3 mb-3 ${d ? 'bg-[#11999e]/10' : 'bg-[#11999e]/8'}`} />
        <div className={`h-3 rounded w-3/4 mb-2 ml-auto ${d ? 'bg-[#f0ebe0]/5' : 'bg-[#1a3035]/5'}`} />
        <div className={`h-3 rounded w-full mb-1 ${d ? 'bg-[#f0ebe0]/5' : 'bg-[#1a3035]/5'}`} />
        <div className={`h-3 rounded w-5/6 mb-1 ${d ? 'bg-[#f0ebe0]/5' : 'bg-[#1a3035]/5'}`} />
        <div className={`h-3 rounded w-4/6 ${d ? 'bg-[#f0ebe0]/5' : 'bg-[#1a3035]/5'}`} />
      </div>
    )
  }

  if (!hadith?.english) return null

  return (
    <div
      className={`rounded-xl px-[clamp(0.75rem,1.5vw,1.5rem)] py-[clamp(0.5rem,1vw,1rem)] border transition-opacity duration-300 max-h-full min-h-0 flex flex-col ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      } ${d ? 'bg-[#132628] border-[#11999e]/20' : 'bg-white border-[#11999e]/20'}`}
    >
      <div className='flex-shrink-0 mb-2'>
        <p className='text-[clamp(0.65rem,0.85vw,0.95rem)] text-[#11999e] font-semibold uppercase tracking-widest'>
          Hadith
        </p>
        <p className={`text-[clamp(0.7rem,0.85vw,0.95rem)] font-medium transition-colors ${d ? 'text-[#e8c97e]' : 'text-[#9b6f1a]'}`}>
          {hadith.source} · #{hadith.number}
          {hadith.chapter ? ` · Book of ${hadith.chapter}` : ''}
        </p>
      </div>

      <div ref={containerRef} className='flex-1 min-h-0 overflow-y-scroll' style={{ scrollbarWidth: 'none' }}>
        {showArabic && hadith.arabic && (
          <p
            className={`text-right text-[clamp(0.9rem,1.1vw,1.3rem)] leading-relaxed mb-2 transition-colors ${d ? 'text-[#f0ebe0]/45' : 'text-[#1a3035]/40'}`}
            dir='rtl'
            style={{ fontFamily: "'Noto Naskh Arabic', 'Traditional Arabic', serif" }}
          >
            {hadith.arabic}
          </p>
        )}
        <p className={`text-[clamp(0.8rem,1vw,1.15rem)] leading-relaxed text-justify transition-colors ${d ? 'text-[#f0ebe0]/80' : 'text-[#1a3035]/80'}`}>
          {hadith.english}
        </p>
      </div>
    </div>
  )
}

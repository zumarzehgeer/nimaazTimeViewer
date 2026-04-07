import { useRef, useEffect } from 'react'
import type { DisplayHadith } from '../types'

interface HadithCardProps {
  hadith: DisplayHadith | null
  loading: boolean
  isTransitioning: boolean
  showArabic: boolean
}

export function HadithCard({ hadith, loading, isTransitioning, showArabic }: HadithCardProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const rafRef = useRef<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        const delta = (timestamp - lastTime) / 1000 // seconds elapsed
        lastTime = timestamp

        position += pxPerSecond * delta
        if (position >= overflow) {
          position = overflow
          el.scrollTop = position
          // pause 6s at bottom, then jump to top and pause 4s before restarting
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

      // initial 4s pause before first scroll
      timerRef.current = setTimeout(() => {
        if (stopped) return
        rafRef.current = requestAnimationFrame(tick)
      }, 4000)
    }

    // ResizeObserver fires after the browser has measured the element,
    // guaranteeing clientHeight and scrollHeight are accurate.
    // Only start scroll on the first observation; ignore subsequent resize events.
    const ro = new ResizeObserver(() => {
      if (!scrollStarted) {
        startScroll()
      }
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
      className={`bg-white/40 rounded-xl px-[clamp(0.75rem,1.5vw,1.5rem)] py-[clamp(0.5rem,1vw,1rem)] border border-[#3c3c3c]/8 transition-opacity duration-300 max-h-full min-h-0 flex flex-col ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div className='flex-shrink-0 mb-2'>
        <p className='text-[clamp(0.65rem,0.85vw,0.95rem)] text-[#11999e] font-semibold uppercase tracking-widest'>
          Hadith
        </p>
        <p className='text-[clamp(0.7rem,0.85vw,0.95rem)] text-[#11999e] font-medium'>
          {hadith.source} · #{hadith.number}
          {hadith.chapter ? ` · Book of ${hadith.chapter}` : ''}
        </p>
      </div>

      <div ref={containerRef} className='flex-1 min-h-0 overflow-y-scroll' style={{ scrollbarWidth: 'none' }}>
        {showArabic && hadith.arabic && (
          <p
            className='text-right text-[clamp(0.9rem,1.1vw,1.3rem)] text-[#3c3c3c]/60 leading-relaxed mb-2'
            dir='rtl'
            style={{ fontFamily: "'Noto Naskh Arabic', 'Traditional Arabic', serif" }}
          >
            {hadith.arabic}
          </p>
        )}
        <p className='text-[clamp(0.8rem,1vw,1.15rem)] text-[#3c3c3c]/80 leading-relaxed text-justify'>
          {hadith.english}
        </p>
      </div>
    </div>
  )
}

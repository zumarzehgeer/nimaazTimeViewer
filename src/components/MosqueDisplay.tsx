import { format } from 'date-fns'
import { IconMapPin } from '@tabler/icons-react'
import { PrayerColumn } from './PrayerColumn'
import { AnnouncementTicker } from './AnnouncementTicker'
import { Countdown } from './Countdown'
import type { PrayerEntry, HijriDate, MosqueSettings } from '../types'

interface MosqueDisplayProps {
  now: Date
  prayers: PrayerEntry[]
  nextPrayer: PrayerEntry | null
  countdown: string
  hijri: HijriDate | null
  settings: MosqueSettings
  method: string | null
  onOpenSettings: () => void
}

export function MosqueDisplay({
  now,
  prayers,
  nextPrayer,
  countdown,
  hijri,
  settings,
  method,
  onOpenSettings,
}: MosqueDisplayProps) {
  return (
    <div className="flex flex-col bg-[#FFEDD8]">
      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row">
        {/* Left column — info panel */}
        <div className="w-full lg:w-[55%] flex flex-col px-[clamp(1.5rem,4vw,5rem)] py-[clamp(1rem,2vw,2rem)]">

          {/* Top row: dates left, clock right */}
          <div className="flex items-start justify-between gap-4">
            {/* Dates */}
            <div>
              {settings.location && (
                <p className="text-[clamp(0.7rem,0.9vw,1rem)] text-[#11999e] mb-1 flex items-center gap-0.5">
                  <IconMapPin size={12} strokeWidth={2} />
                  {settings.location.label}
                </p>
              )}
              <p className="text-[clamp(1rem,1.4vw,1.6rem)] font-semibold text-[#3c3c3c]">
                {format(now, 'EEEE, d MMMM yyyy')}
              </p>
              {hijri && (
                <p className="text-[clamp(0.8rem,1vw,1.2rem)] text-[#11999e] font-medium mt-0.5">
                  {hijri.day} {hijri.month.en} {hijri.year} AH
                </p>
              )}
              {method && (
                <p className="text-[clamp(0.65rem,0.8vw,0.9rem)] text-[#3c3c3c]/40 mt-2 font-medium tracking-wide">
                  {method}
                </p>
              )}
            </div>

            {/* Clock */}
            <div className="text-right flex-shrink-0 whitespace-nowrap">
              <span className="text-[clamp(2rem,4.5vw,5.5rem)] font-bold tracking-tight text-[#3c3c3c]"
                style={{ fontVariantNumeric: 'tabular-nums', fontFamily: 'ui-monospace, monospace' }}>
                {format(now, 'hh:mm:ss')}
              </span>
              <span className="text-[clamp(0.8rem,1.2vw,1.4rem)] font-semibold text-[#11999e] ml-1 align-baseline">
                {format(now, 'a')}
              </span>
            </div>
          </div>

          {/* Countdown */}
          <div className="w-full mt-[clamp(1rem,2vw,2.5rem)]">
            <Countdown nextPrayer={nextPrayer} countdown={countdown} />
          </div>

          {/* Announcement ticker — pushed to bottom */}
          <div className="w-full mt-auto pt-[clamp(1rem,2vw,2rem)]">
            <AnnouncementTicker announcements={settings.announcements} />
          </div>
        </div>

        {/* Right column — prayer times */}
        <div className="w-full lg:w-[45%] flex flex-col justify-center gap-[clamp(0.35rem,0.6vw,0.65rem)] px-[clamp(1rem,2vw,3rem)] py-[clamp(1rem,2vw,2rem)]">
          {prayers.map((prayer) => (
            <PrayerColumn
              key={prayer.key}
              prayer={prayer}
              isNext={prayer.key === nextPrayer?.key}
              isPast={false}
            />
          ))}
        </div>
      </div>

      {/* Settings button — bottom-left, icon only */}
      <button
        onClick={onOpenSettings}
        className="fixed bottom-3 left-3 p-1.5 rounded-lg bg-[#3c3c3c]/8 hover:bg-[#3c3c3c]/15 text-[#3c3c3c]/40 hover:text-[#3c3c3c] transition-colors"
        title="Settings"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  )
}

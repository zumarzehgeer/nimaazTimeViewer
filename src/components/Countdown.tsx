import type { PrayerEntry } from '../types'

interface CountdownProps {
  nextPrayer: PrayerEntry | null
  countdown: string
}

export function Countdown({ nextPrayer, countdown }: CountdownProps) {
  if (!nextPrayer) {
    return (
      <div className="rounded-[clamp(0.75rem,1vw,1.5rem)] px-[clamp(1.5rem,3vw,3rem)] py-[clamp(0.75rem,1.5vw,1.5rem)] text-center bg-white shadow-md">
        <p className="text-[clamp(0.875rem,1vw,1.125rem)] text-[#11999e]">
          All prayers completed for today
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[clamp(0.75rem,1vw,1.5rem)] px-[clamp(1.5rem,3vw,3rem)] py-[clamp(0.75rem,1.5vw,1.5rem)] text-center bg-white shadow-md">
      <p className="text-[clamp(0.7rem,0.9vw,1rem)] font-medium mb-1 text-[#11999e]">
        Next prayer &middot; {nextPrayer.name}
      </p>
      <p className="text-[clamp(1.5rem,4vw,4.5rem)] font-bold tabular-nums tracking-tight leading-tight text-[#3c3c3c]">
        {countdown}
      </p>
    </div>
  )
}

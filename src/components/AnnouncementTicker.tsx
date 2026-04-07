import { IconSpeakerphone } from '@tabler/icons-react'

interface AnnouncementTickerProps {
  announcements: string[]
}

export function AnnouncementTicker({ announcements }: AnnouncementTickerProps) {
  if (announcements.length === 0) return null

  const items = [...announcements, ...announcements]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFEDD8] border-t border-[#3c3c3c]/10 overflow-hidden">
      <div className="py-[clamp(0.4rem,0.8vw,0.85rem)] flex w-max animate-marquee whitespace-nowrap">
        {items.map((announcement, i) => (
          <span key={i} className="inline-flex items-center">
            <span className="inline-flex items-center gap-2 bg-white/60 shadow-sm rounded-full px-[clamp(0.6rem,1vw,1rem)] py-[clamp(0.15rem,0.3vw,0.3rem)] mx-[clamp(0.5rem,1.5vw,1.5rem)]">
              <IconSpeakerphone size={14} className="text-[#11999e] flex-shrink-0" strokeWidth={1.75} />
              <span className="text-[clamp(0.8rem,1vw,1.1rem)] font-medium text-[#3c3c3c] tracking-wide">
                {announcement}
              </span>
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

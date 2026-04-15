import { IconSpeakerphone } from '@tabler/icons-react'

interface AnnouncementTickerProps {
  announcements: string[]
  isDark: boolean
}

export function AnnouncementTicker({ announcements, isDark }: AnnouncementTickerProps) {
  if (announcements.length === 0) return null

  const d = isDark
  const items = [...announcements, ...announcements]

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-40 border-t overflow-hidden transition-colors ${d ? 'bg-[#0a1618] border-[#11999e]/20' : 'bg-[#e4f2f2] border-[#11999e]/20'}`}>
      <div className="py-[clamp(0.4rem,0.8vw,0.85rem)] flex w-max animate-marquee whitespace-nowrap">
        {items.map((announcement, i) => (
          <span key={i} className="inline-flex items-center">
            <span className={`inline-flex items-center gap-2 border rounded-full px-[clamp(0.6rem,1vw,1rem)] py-[clamp(0.15rem,0.3vw,0.3rem)] mx-[clamp(0.5rem,1.5vw,1.5rem)] transition-colors ${d ? 'bg-[#132628] border-[#11999e]/15' : 'bg-white border-[#11999e]/15'}`}>
              <IconSpeakerphone size={13} className="text-[#11999e] flex-shrink-0" strokeWidth={1.75} />
              <span className={`text-[clamp(0.8rem,1vw,1.1rem)] font-medium tracking-wide transition-colors ${d ? 'text-[#f0ebe0]' : 'text-[#1a3035]'}`}>
                {announcement}
              </span>
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

interface AnnouncementTickerProps {
  announcements: string[]
}

export function AnnouncementTicker({ announcements }: AnnouncementTickerProps) {
  if (announcements.length === 0) return null

  const text = announcements.join('     •     ')

  return (
    <div className="overflow-hidden rounded-[clamp(0.75rem,1vw,1.5rem)] bg-white shadow-md">
      <div className="py-[clamp(0.5rem,0.8vw,1rem)] animate-marquee whitespace-nowrap">
        <span className="inline-block text-[clamp(0.875rem,1.2vw,1.25rem)] font-medium text-[#11999e]">
          📢&nbsp;&nbsp;{text}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;📢&nbsp;&nbsp;{text}
        </span>
      </div>
    </div>
  )
}

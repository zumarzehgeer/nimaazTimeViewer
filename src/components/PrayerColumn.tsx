import {
  IconSunrise,
  IconSunLow,
  IconSun,
  IconSunHigh,
  IconSunset,
  IconMoon,
  IconMoonStars,
  IconStars,
  IconBuildingMosque,
  type Icon,
} from '@tabler/icons-react';
import type { PrayerEntry } from '../types';

const NO_ADHAN_KEYS = new Set(['Sunrise', 'Midnight', 'Lastthird']);

const ICONS: Record<string, Icon> = {
  Fajr: IconSunrise,
  Sunrise: IconSunLow,
  Dhuhr: IconSun,
  Jumuah: IconBuildingMosque,
  Asr: IconSunHigh,
  Maghrib: IconSunset,
  Isha: IconMoon,
  Midnight: IconMoonStars,
  Lastthird: IconStars,
};

interface PrayerColumnProps {
  prayer: PrayerEntry;
  isNext: boolean;
}

function to12Hour(timeStr: string): string {
  const clean = timeStr.split(' ')[0];
  const [h, m] = clean.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function PrayerColumn({ prayer, isNext }: PrayerColumnProps) {
  const baseCard = 'bg-white shadow-md';
  const nextCard = 'bg-[#11999e] shadow-lg';

  return (
    <div
      className={`
        flex items-center gap-[clamp(0.5rem,1vw,1.5rem)]
        rounded-[clamp(0.75rem,1vw,1.5rem)]
        px-[clamp(0.75rem,1.5vw,2rem)] py-[clamp(0.35rem,0.5vw,0.85rem)]
        transition-all
        ${isNext ? nextCard : `${baseCard} opacity-70`}
      `}
    >
      {/* Icon */}
      <div className='w-[clamp(1rem,2vw,3rem)] flex justify-center flex-shrink-0'>
        {(() => {
          const Icon = ICONS[prayer.key];
          return Icon ? (
            <Icon
              size='clamp(1.5rem,2.5vw,3rem)'
              strokeWidth={1.5}
              className={isNext ? 'text-white' : 'text-[#11999e]'}
            />
          ) : null;
        })()}
      </div>

      {/* Prayer name */}
      <p
        className={`text-[clamp(0.75rem,1vw,1.25rem)] font-semibold uppercase tracking-widest w-[clamp(4rem,6vw,7rem)] flex-shrink-0 ${isNext ? 'text-white' : 'text-[#3c3c3c]'}`}
      >
        {prayer.name}
      </p>

      {/* Adhan time */}
      <div className='flex-1 text-center'>
        {!NO_ADHAN_KEYS.has(prayer.key) && (
          <p
            className={`text-[clamp(9px,0.6vw,0.7rem)] uppercase tracking-wider ${isNext ? 'text-white/70' : 'text-[#3c3c3c]/60'}`}
          >
            Adhan
          </p>
        )}
        <p
          className={`text-[clamp(1rem,1.8vw,2rem)] font-bold ${isNext ? 'text-white' : 'text-[#3c3c3c]'}`}
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {to12Hour(prayer.time)}
        </p>
      </div>

      {/* Iqamah time */}
      <div className='flex-1 text-center'>
        {prayer.iqamahTime ? (
          <>
            <p
              className={`text-[clamp(9px,0.6vw,0.7rem)] uppercase tracking-wider ${isNext ? 'text-white/70' : 'text-[#3c3c3c]/60'}`}
            >
              Iqamah
            </p>
            <p
              className={`text-[clamp(1rem,1.8vw,2rem)] font-semibold ${isNext ? 'text-[#6decb9]' : 'text-[#11999e]'}`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              {to12Hour(prayer.iqamahTime)}
            </p>
          </>
        ) : (
          <div className='invisible'>
            <p className='text-[clamp(9px,0.6vw,0.7rem)]'>Iqamah</p>
            <p className='text-[clamp(1rem,1.8vw,2rem)]'>00:00 AM</p>
          </div>
        )}
      </div>

      {/* Next badge */}
      <div className='w-[clamp(3rem,4vw,5rem)] flex-shrink-0 text-center'>
        {isNext ? (
          <span className='text-[clamp(9px,0.65vw,0.75rem)] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full bg-white/20 text-white'>
            Next
          </span>
        ) : (
          <span className='text-[clamp(9px,0.65vw,0.75rem)] invisible px-3 py-0.5'>Next</span>
        )}
      </div>
    </div>
  );
}

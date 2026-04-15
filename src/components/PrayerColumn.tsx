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
  isDark: boolean;
}

function to12Hour(timeStr: string): string {
  const clean = timeStr.split(' ')[0];
  const [h, m] = clean.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${period}`;
}

export function PrayerColumn({ prayer, isNext, isDark }: PrayerColumnProps) {
  const d = isDark;

  const cardBase = d
    ? 'bg-[#132628] border-[#11999e]/15 opacity-75'
    : 'bg-white border-[#11999e]/12 opacity-90';

  const cardNext = d
    ? 'bg-[#0f3d40] border-[#11999e]/60 pulse-glow'
    : 'bg-[#11999e] border-[#11999e] pulse-glow';

  return (
    <div
      className={`
        flex items-center gap-[clamp(0.5rem,1vw,1.5rem)]
        rounded-[clamp(0.75rem,1vw,1.5rem)]
        px-[clamp(0.75rem,1.5vw,2rem)] py-[clamp(0.35rem,0.6vw,0.9rem)]
        border transition-all
        ${isNext ? cardNext : cardBase}
      `}
    >
      {/* Icon */}
      <div className='w-[clamp(1.25rem,2vw,2.5rem)] flex justify-center flex-shrink-0'>
        {(() => {
          const IconComp = ICONS[prayer.key];
          return IconComp ? (
            <IconComp
              size={20}
              strokeWidth={1.5}
              className={`w-[clamp(1rem,1.8vw,1.8rem)] h-[clamp(1rem,1.8vw,1.8rem)] ${
                isNext
                  ? (d ? 'text-[#6decb9]' : 'text-white')
                  : 'text-[#11999e]'
              }`}
            />
          ) : null;
        })()}
      </div>

      {/* Prayer name */}
      <p
        className={`text-[clamp(0.7rem,0.95vw,1.15rem)] font-bold uppercase tracking-widest w-[clamp(4rem,6vw,7rem)] flex-shrink-0 ${
          isNext
            ? (d ? 'text-[#f0ebe0]' : 'text-white')
            : (d ? 'text-[#f0ebe0]/70' : 'text-[#1a3035]/70')
        }`}
        style={{ fontFamily: "'Nunito Sans', sans-serif" }}
      >
        {prayer.name}
      </p>

      {/* Adhan time */}
      <div className='flex-1 text-center'>
        {!NO_ADHAN_KEYS.has(prayer.key) && (
          <p className={`text-[clamp(9px,0.6vw,0.7rem)] uppercase tracking-wider ${
            isNext
              ? (d ? 'text-[#7ba8ac]' : 'text-white/70')
              : (d ? 'text-[#7ba8ac]' : 'text-[#5a8a8e]')
          }`}>
            Adhan
          </p>
        )}
        <p
          className={`text-[clamp(1rem,1.8vw,2rem)] font-bold tabular-nums ${
            isNext
              ? (d ? 'text-[#f0ebe0]' : 'text-white')
              : (d ? 'text-[#f0ebe0]/80' : 'text-[#1a3035]/80')
          }`}
          style={{ fontFamily: "'Nunito Sans', sans-serif" }}
        >
          {to12Hour(prayer.time)}
        </p>
      </div>

      {/* Iqamah time */}
      <div className='flex-1 text-center'>
        {prayer.iqamahTime ? (
          <>
            <p className={`text-[clamp(9px,0.6vw,0.7rem)] uppercase tracking-wider ${
              isNext
                ? (d ? 'text-[#7ba8ac]' : 'text-white/70')
                : (d ? 'text-[#7ba8ac]' : 'text-[#5a8a8e]')
            }`}>
              Iqamah
            </p>
            <p
              className={`text-[clamp(1rem,1.8vw,2rem)] font-semibold tabular-nums ${
                isNext
                  ? (d ? 'text-[#6decb9]' : 'text-white')
                  : (d ? 'text-[#6decb9]' : 'text-[#0a7a6e]')
              }`}
              style={{ fontFamily: "'Nunito Sans', sans-serif" }}
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
          <span className={`text-[clamp(9px,0.65vw,0.75rem)] font-bold uppercase tracking-widest px-3 py-0.5 rounded-full border ${
            d
              ? 'bg-[#e8c97e]/15 text-[#e8c97e] border-[#e8c97e]/30'
              : 'bg-white/25 text-white border-white/40'
          }`}>
            Next
          </span>
        ) : (
          <span className='text-[clamp(9px,0.65vw,0.75rem)] invisible px-3 py-0.5'>Next</span>
        )}
      </div>
    </div>
  );
}

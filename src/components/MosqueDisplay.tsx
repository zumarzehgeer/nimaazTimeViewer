import { format } from "date-fns";
import { IconMapPin } from "@tabler/icons-react";
import { PrayerColumn } from "./PrayerColumn";
import { AnnouncementTicker } from "./AnnouncementTicker";
import { Countdown } from "./Countdown";
import { HadithCard } from "./HadithCard";
import type {
  PrayerEntry,
  HijriDate,
  MosqueSettings,
  NextHijriHoliday,
  DisplayHadith,
} from "../types";

interface MosqueDisplayProps {
  now: Date;
  prayers: PrayerEntry[];
  nextPrayer: PrayerEntry | null;
  countdown: string;
  hijri: HijriDate | null;
  nextHoliday: NextHijriHoliday | null;
  hadith: DisplayHadith | null;
  hadithLoading: boolean;
  hadithTransitioning: boolean;
  settings: MosqueSettings;
  method: string | null;
  onOpenSettings: () => void;
}

export function MosqueDisplay({
  now,
  prayers,
  nextPrayer,
  countdown,
  hijri,
  nextHoliday,
  hadith,
  hadithLoading,
  hadithTransitioning,
  settings,
  method,
  onOpenSettings,
}: MosqueDisplayProps) {
  return (
    <div className="flex flex-col bg-[#FFEDD8] min-h-screen lg:h-screen lg:overflow-hidden pb-[clamp(2.5rem,4vw,4rem)]">
      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">

        {/* Left column — info panel */}
        <div className="w-full lg:w-[55%] flex flex-col px-[clamp(1rem,3vw,3rem)] py-[clamp(1rem,2vw,2rem)] min-h-0">

          {/* Top section: dates + clock/countdown */}
          <div className="flex flex-col min-h-0 flex-1">
            {/* Dates row */}
            <div className="flex justify-between gap-4 items-center">
              {/* Dates */}
              <div>
                {settings.mosqueName && (
                  <p className="text-[clamp(1.1rem,1.4vw,1.8rem)] font-bold text-[#3c3c3c] leading-tight mb-0.5">
                    {settings.mosqueName}
                  </p>
                )}
                {settings.location && (
                  <p className="text-[clamp(0.75rem,0.9vw,1rem)] text-[#11999e] mb-1 flex items-center gap-0.5">
                    <IconMapPin size={13} strokeWidth={2} />
                    {settings.location.label}
                  </p>
                )}
                <p className="text-[clamp(1rem,1.4vw,1.6rem)] font-semibold text-[#3c3c3c]">
                  {format(now, "EEEE, d MMMM yyyy")}
                </p>
                {hijri && (
                  <p className="text-[clamp(0.85rem,1vw,1.2rem)] text-[#11999e] font-medium mt-0.5">
                    {hijri.day} {hijri.month.en} {hijri.year} AH
                  </p>
                )}
                {nextHoliday && nextHoliday.daysUntil >= 0 && (
                  <p className="text-[clamp(0.7rem,0.85vw,0.9rem)] text-[#11999e]/70 font-medium mt-0.5">
                    {nextHoliday.daysUntil === 0
                      ? `✦ ${nextHoliday.name} — Today!`
                      : `✦ ${nextHoliday.name} in ${nextHoliday.daysUntil} day${nextHoliday.daysUntil !== 1 ? "s" : ""}`}
                  </p>
                )}
                {method && (
                  <p className="text-[clamp(0.7rem,0.9vw,0.9rem)] text-[#3c3c3c]/40 mt-1.5 font-medium tracking-wide">
                    {method}
                  </p>
                )}
              </div>

              {/* Clock + Countdown */}
              <div className="flex-shrink-0 flex flex-col items-end">
                <div className="text-right whitespace-nowrap">
                  <span
                    className="text-[clamp(2rem,3.5vw,4.5rem)] font-bold tracking-tight text-[#3c3c3c]"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {format(now, "hh:mm:ss")}
                  </span>
                  <span className="text-[clamp(0.8rem,1.2vw,1.4rem)] font-semibold text-[#11999e] ml-1 align-baseline">
                    {format(now, "a")}
                  </span>
                </div>
                <div className="mt-[clamp(0.5rem,1vw,1.5rem)] w-full">
                  <Countdown nextPrayer={nextPrayer} countdown={countdown} />
                </div>
              </div>
            </div>

            {/* Daily hadith */}
            {settings.hadith.enabled && (
              <div className="w-full mt-[clamp(0.75rem,1.5vw,2rem)] flex-1 h-0">
                <HadithCard
                  hadith={hadith}
                  loading={hadithLoading}
                  isTransitioning={hadithTransitioning}
                  showArabic={settings.hadith.showArabic}
                />
              </div>
            )}
          </div>

          {/* Prayer times — mobile only (shown below hadith on small screens) */}
          <div className="lg:hidden w-full mt-[clamp(1rem,2vw,2rem)] flex flex-col gap-[clamp(0.4rem,1vw,0.75rem)]">
            {prayers.map((prayer) => (
              <PrayerColumn
                key={prayer.key}
                prayer={prayer}
                isNext={prayer.key === nextPrayer?.key}
              />
            ))}
          </div>

        </div>

        {/* Right column — prayer times (desktop only) */}
        <div className="hidden lg:flex w-full lg:w-[45%] flex-col justify-center gap-[clamp(0.35rem,1vw,1rem)] px-[clamp(1rem,2vw,3rem)] py-[clamp(1rem,2vw,2rem)] min-h-0 border-l border-[#3c3c3c]/10">
          {prayers.map((prayer) => (
            <PrayerColumn
              key={prayer.key}
              prayer={prayer}
              isNext={prayer.key === nextPrayer?.key}
            />
          ))}
        </div>
      </div>

      {/* Bottom banner — full width */}
      <AnnouncementTicker announcements={settings.announcements} />

      {/* Settings button */}
      <button
        onClick={onOpenSettings}
        className="fixed bottom-[clamp(2.5rem,4vw,4rem)] left-4 p-2 rounded-lg bg-[#3c3c3c]/8 hover:bg-[#3c3c3c]/15 text-[#3c3c3c]/40 hover:text-[#3c3c3c] transition-colors z-50"
        title="Settings"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>
    </div>
  );
}

import { format } from "date-fns";
import { IconMapPin, IconSun, IconMoon } from "@tabler/icons-react";
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
  isTomorrow: boolean;
  hijri: HijriDate | null;
  nextHoliday: NextHijriHoliday | null;
  hadith: DisplayHadith | null;
  hadithLoading: boolean;
  hadithTransitioning: boolean;
  settings: MosqueSettings;
  method: string | null;
  onOpenSettings: () => void;
  syncing?: boolean;
  syncProgress?: number;
  syncTotal?: number;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function MosqueDisplay({
  now,
  prayers,
  nextPrayer,
  countdown,
  isTomorrow,
  hijri,
  nextHoliday,
  hadith,
  hadithLoading,
  hadithTransitioning,
  settings,
  method,
  onOpenSettings,
  syncing,
  syncProgress,
  syncTotal,
  isDark,
  onToggleTheme,
}: MosqueDisplayProps) {
  const d = isDark;

  return (
    <div className={`flex flex-col min-h-screen lg:h-screen lg:overflow-hidden pb-[clamp(2.5rem,4vw,4rem)] transition-colors duration-300 ${d ? 'bg-[#0f1c1e] islamic-pattern-dark' : 'bg-[#f2f8f8] islamic-pattern-light'}`}>
      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0">

        {/* Left column — info panel */}
        <div className="w-full lg:w-[55%] flex flex-col px-[clamp(1rem,3vw,3rem)] py-[clamp(1rem,2vw,2rem)] min-h-0">
          <div className="flex flex-col min-h-0 flex-1">

            {/* Dates row */}
            <div className="flex justify-between gap-4 items-start">
              <div>
                {settings.mosqueName && (
                  <p
                    className={`text-[clamp(1.1rem,1.5vw,2rem)] font-bold leading-tight mb-1 transition-colors ${d ? 'text-[#e8c97e]' : 'text-[#9b6f1a]'}`}
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {settings.mosqueName}
                  </p>
                )}
                {settings.location && (
                  <p className="text-[clamp(0.7rem,0.85vw,0.95rem)] text-[#11999e] mb-2 flex items-center gap-1">
                    <IconMapPin size={12} strokeWidth={2} />
                    {settings.location.label}
                  </p>
                )}
                <p className={`text-[clamp(0.95rem,1.3vw,1.5rem)] font-semibold transition-colors ${d ? 'text-[#f0ebe0]' : 'text-[#1a3035]'}`}>
                  {format(now, "EEEE, d MMMM yyyy")}
                </p>
                {hijri && (
                  <p className={`text-[clamp(0.8rem,0.95vw,1.1rem)] font-medium mt-0.5 transition-colors ${d ? 'text-[#e8c97e]' : 'text-[#9b6f1a]'}`}>
                    {hijri.day} {hijri.month.en} {hijri.year} AH
                  </p>
                )}
                {nextHoliday && nextHoliday.daysUntil >= 0 && (
                  <p className={`text-[clamp(0.65rem,0.8vw,0.85rem)] font-medium mt-0.5 transition-colors ${d ? 'text-[#e8c97e]/60' : 'text-[#9b6f1a]/60'}`}>
                    {nextHoliday.daysUntil === 0
                      ? `✦ ${nextHoliday.name} — Today!`
                      : `✦ ${nextHoliday.name} in ${nextHoliday.daysUntil} day${nextHoliday.daysUntil !== 1 ? "s" : ""}`}
                  </p>
                )}
                {method && (
                  <p className={`text-[clamp(0.65rem,0.8vw,0.85rem)] mt-2 font-medium tracking-wide transition-colors ${d ? 'text-[#7ba8ac]' : 'text-[#5a8a8e]'}`}>
                    {method}
                  </p>
                )}
              </div>

              {/* Clock + Countdown */}
              <div className="flex-shrink-0 flex flex-col items-end">
                <div className="text-right whitespace-nowrap">
                  <span
                    className={`text-[clamp(2rem,3.5vw,4.5rem)] font-bold tracking-tight transition-colors ${d ? 'text-[#f0ebe0]' : 'text-[#1a3035]'}`}
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {format(now, "hh:mm:ss")}
                  </span>
                  <span className="text-[clamp(0.8rem,1.1vw,1.3rem)] font-semibold text-[#11999e] ml-1.5 align-baseline">
                    {format(now, "a")}
                  </span>
                </div>
                <div className="mt-[clamp(0.5rem,1vw,1.5rem)] w-full">
                  <Countdown nextPrayer={nextPrayer} countdown={countdown} isTomorrow={isTomorrow} isDark={d} />
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
                  isDark={d}
                />
              </div>
            )}
          </div>

          {/* Prayer times — mobile only */}
          <div className="lg:hidden w-full mt-[clamp(1rem,2vw,2rem)] flex flex-col gap-[clamp(0.4rem,1vw,0.75rem)]">
            {prayers.map((prayer) => (
              <PrayerColumn
                key={prayer.key}
                prayer={prayer}
                isNext={prayer.key === nextPrayer?.key}
                isDark={d}
              />
            ))}
          </div>
        </div>

        {/* Right column — prayer times (desktop) */}
        <div className={`hidden lg:flex w-full lg:w-[45%] flex-col justify-center gap-[clamp(0.35rem,1vw,1rem)] px-[clamp(1rem,2vw,3rem)] py-[clamp(1rem,2vw,2rem)] min-h-0 border-l transition-colors ${d ? 'border-[#11999e]/15' : 'border-[#11999e]/12'}`}>
          {prayers.map((prayer) => (
            <PrayerColumn
              key={prayer.key}
              prayer={prayer}
              isNext={prayer.key === nextPrayer?.key}
              isDark={d}
            />
          ))}
        </div>
      </div>

      {/* Sync progress */}
      {syncing && syncProgress !== undefined && syncTotal !== undefined && (
        <div className={`w-full px-4 py-1 flex items-center gap-3 transition-colors ${d ? 'bg-[#0a1618]' : 'bg-[#e4f2f2]'}`}>
          <div className={`flex-1 h-1 rounded-full overflow-hidden ${d ? 'bg-[#132628]' : 'bg-[#c8e8e8]'}`}>
            <div
              className="h-full bg-[#11999e] rounded-full transition-all duration-500"
              style={{ width: `${(syncProgress / syncTotal) * 100}%` }}
            />
          </div>
          <span className={`text-[0.65rem] whitespace-nowrap transition-colors ${d ? 'text-[#7ba8ac]' : 'text-[#5a8a8e]'}`}>
            Syncing prayer data {syncProgress}/{syncTotal}
          </span>
        </div>
      )}

      <AnnouncementTicker announcements={settings.announcements} isDark={d} />

      {/* Bottom-left buttons */}
      <div className="fixed bottom-[clamp(2.5rem,4vw,4rem)] left-4 flex items-center gap-2 z-50">
        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className={`p-2.5 rounded-lg border transition-colors ${d ? 'bg-[#132628] border-[#11999e]/15 text-[#7ba8ac] hover:text-[#11999e] hover:bg-[#1a3538]' : 'bg-white border-[#11999e]/15 text-[#5a8a8e] hover:text-[#11999e] hover:bg-[#e4f2f2]'}`}
          title={d ? "Switch to light theme" : "Switch to dark theme"}
        >
          {d ? <IconSun size={16} /> : <IconMoon size={16} />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className={`p-2.5 rounded-lg border transition-colors ${d ? 'bg-[#132628] border-[#11999e]/15 text-[#7ba8ac] hover:text-[#11999e] hover:bg-[#1a3538]' : 'bg-white border-[#11999e]/15 text-[#5a8a8e] hover:text-[#11999e] hover:bg-[#e4f2f2]'}`}
          title="Settings"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

import type { PrayerEntry } from "../types";

interface CountdownProps {
  nextPrayer: PrayerEntry | null;
  countdown: string;
  isTomorrow?: boolean;
  isDark: boolean;
}

export function Countdown({ nextPrayer, countdown, isTomorrow, isDark }: CountdownProps) {
  const d = isDark;
  const card = `rounded-[clamp(0.75rem,1vw,1.5rem)] px-[clamp(1.5rem,2vw,3rem)] py-[clamp(0.75rem,1.5vw,1.5rem)] text-center border transition-colors ${d ? 'bg-[#132628] border-[#11999e]/20' : 'bg-white border-[#11999e]/20'}`;

  if (!nextPrayer) {
    return (
      <div className={card}>
        <p className="text-[clamp(0.875rem,1vw,1.125rem)] text-[#11999e]">
          All prayers completed for today
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-between ${card}`}>
      <p className={`text-[clamp(0.6rem,0.8vw,0.85rem)] font-medium uppercase tracking-widest transition-colors ${d ? 'text-[#7ba8ac]' : 'text-[#5a8a8e]'}`}>
        Next Prayer{isTomorrow ? " · Tomorrow" : ""}
      </p>
      <p
        className={`text-[clamp(0.85rem,1.2vw,1.4rem)] font-bold uppercase tracking-wider mt-0.5 transition-colors ${d ? 'text-[#e8c97e]' : 'text-[#9b6f1a]'}`}
        style={{ fontFamily: "'Cinzel', serif" }}
      >
        {nextPrayer.name}
      </p>
      <p
        className={`text-[clamp(1rem,2vw,3rem)] font-bold tracking-tight leading-tight mt-1 transition-colors ${d ? 'text-[#f0ebe0]' : 'text-[#1a3035]'}`}
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {countdown}
      </p>
    </div>
  );
}

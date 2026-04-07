import type { PrayerEntry } from "../types";

interface CountdownProps {
  nextPrayer: PrayerEntry | null;
  countdown: string;
}

export function Countdown({ nextPrayer, countdown }: CountdownProps) {
  if (!nextPrayer) {
    return (
      <div className="rounded-[clamp(0.75rem,1vw,1.5rem)] px-[clamp(1.5rem,3vw,3rem)] py-[clamp(0.75rem,1.5vw,1.5rem)] text-center bg-white shadow-md">
        <p className="text-[clamp(0.875rem,1vw,1.125rem)] text-[#11999e]">
          All prayers completed for today
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-between rounded-[clamp(0.75rem,1vw,1.5rem)] px-[clamp(1.5rem,2vw,3rem)] py-[clamp(0.75rem,1.5vw,1.5rem)] text-center bg-white shadow-md">
      <p className="text-[clamp(0.7rem,1vw,1.25rem)] font-semibold text-[#11999e]">
        Next Prayer &middot;{" "}
        <span className="uppercase">{nextPrayer.name}</span>
      </p>
      <p
        className="text-[clamp(1rem,2vw,3rem)] font-bold tracking-tight leading-tight text-[#3c3c3c] mt-1"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {countdown}
      </p>
    </div>
  );
}

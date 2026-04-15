import { useState, useEffect, useMemo } from 'react';
import { MosqueDisplay } from './components/MosqueDisplay';
import { SettingsModal } from './components/SettingsModal';
import { LocationSearch } from './components/LocationSearch';
import { AuthScreen } from './components/AuthScreen';
import { usePrayerTimes } from './hooks/usePrayerTimes';
import { useCountdown } from './hooks/useCountdown';
import { useClock } from './hooks/useClock';
import { useSettings } from './hooks/useSettings';
import { useAuth } from './hooks/useAuth';
import { usePrayerCache } from './hooks/usePrayerCache';
import { useNextHijriHoliday } from './hooks/useNextHijriHoliday';
import { useHadith } from './hooks/useHadith';
import { getTimeOfDay, BACKGROUNDS } from './hooks/useBackground';
import type { PrayerEntry, LocationState, MosqueSettings } from './types';
import { PRAYER_KEYS } from './types';
import type { PrayerTimesResult } from './services/aladhan';

function addIqamahTime(adhanTime: string, offsetMinutes: number): string {
  const clean = adhanTime.split(' ')[0];
  const [h, m] = clean.split(':').map(Number);
  const total = h * 60 + m + offsetMinutes;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

const DISPLAY_NAMES: Record<string, string> = {
  Lastthird: 'Last Third',
};

const CONGREGATIONAL_KEYS = ['Fajr', 'Dhuhr', 'Jumuah', 'Asr', 'Maghrib', 'Isha'];

function buildPrayerList(data: PrayerTimesResult, settings: MosqueSettings): PrayerEntry[] {
  const list: PrayerEntry[] = PRAYER_KEYS
    .filter((key) => key !== 'Imsak' && data.timings[key] !== undefined)
    .map((key) => ({
      name: DISPLAY_NAMES[key] ?? key,
      key,
      time: data.timings[key],
      iqamahTime:
        key !== 'Sunrise' && key in settings.iqamahOffsets
          ? addIqamahTime(data.timings[key], settings.iqamahOffsets[key as keyof typeof settings.iqamahOffsets])
          : null,
    }));
  const dhuhrIndex = list.findIndex((p) => p.key === 'Dhuhr');
  if (dhuhrIndex !== -1) {
    const jumuahAdhan = settings.jumuahAdhan || list[dhuhrIndex].time;
    list.splice(dhuhrIndex + 1, 0, {
      name: "Jumu'ah",
      key: 'Jumuah',
      time: jumuahAdhan,
      iqamahTime: addIqamahTime(jumuahAdhan, settings.iqamahOffsets.Jumuah),
    });
  }
  return list;
}

function filterCongregational(prayers: PrayerEntry[], isFriday: boolean): PrayerEntry[] {
  return prayers.filter((p) => {
    if (!CONGREGATIONAL_KEYS.includes(p.key)) return false;
    if (p.key === 'Dhuhr' && isFriday) return false;
    if (p.key === 'Jumuah' && !isFriday) return false;
    return true;
  });
}

export default function App() {
  const now = useClock();
  const { user, authLoading, signOut } = useAuth();
  const { settings, setSettings } = useSettings(user?.uid ?? null);
  const [showSettings, setShowSettings] = useState(false);
  const [isDark, setIsDark] = useState<boolean>(() => {
    try { return localStorage.getItem('nimaaz-theme') !== 'light' } catch { return true }
  });
  useEffect(() => {
    try { localStorage.setItem('nimaaz-theme', isDark ? 'dark' : 'light') } catch { /* ignore */ }
  }, [isDark]);
  const [date, setDate] = useState<Date>(() => new Date());
  const nextHoliday = useNextHijriHoliday();
  const { hadith, loading: hadithLoading, isTransitioning: hadithTransitioning } = useHadith({
    enabled: settings.hadith.enabled,
    rotationIntervalMinutes: settings.hadith.rotationIntervalMinutes,
    enabledCollections: settings.hadith.enabledCollections,
    apiKey: settings.hadith.hadithApiKey,
    pinnedHadith: settings.hadith.pinnedHadith,
  });

  // Auto-advance date at midnight (check once per minute)
  useEffect(() => {
    const id = setInterval(() => {
      const today = new Date().toDateString();
      if (date.toDateString() !== today) {
        setDate(new Date());
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [date]);

  const tomorrow = useMemo(() => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    return d;
  }, [date]);

  const { getTimingsForDate, syncing, syncProgress, syncTotal } = usePrayerCache(
    user?.uid ?? null,
    settings.location,
    settings.methodId,
  );

  const cachedData = settings.location ? getTimingsForDate(date) : null;
  const cachedTomorrow = settings.location ? getTimingsForDate(tomorrow) : null;

  // Fall back to live API only when cache doesn't have the day yet
  const { data: apiData, loading, error } = usePrayerTimes(
    !cachedData && settings.location ? date : null,
    settings.location?.lat ?? null,
    settings.location?.lng ?? null,
    settings.methodId,
  );

  const { data: apiTomorrowData } = usePrayerTimes(
    !cachedTomorrow && settings.location ? tomorrow : null,
    settings.location?.lat ?? null,
    settings.location?.lng ?? null,
    settings.methodId,
  );

  const data = cachedData ?? apiData;
  const tomorrowData = cachedTomorrow ?? apiTomorrowData;

  const prayers = data ? buildPrayerList(data, settings) : [];
  const isFriday = date.getDay() === 5;
  const congregationalPrayers = filterCongregational(prayers, isFriday);

  const tomorrowIsFriday = tomorrow.getDay() === 5;
  const tomorrowCongregationalPrayers = tomorrowData
    ? filterCongregational(buildPrayerList(tomorrowData, settings), tomorrowIsFriday)
    : [];

  const { nextPrayer, countdown, isTomorrow } = useCountdown(congregationalPrayers, date, now, tomorrowCongregationalPrayers, tomorrow);

  const timeOfDay = getTimeOfDay(data?.timings ?? null);
  const bgClass = BACKGROUNDS[timeOfDay];
  const loadingScreenDark = ['night', 'dawn', 'sunset', 'evening'].includes(timeOfDay);

  const handleSaveSettings = (newSettings: MosqueSettings) => {
    setSettings(newSettings);
  };

  const handleSetupLocation = (loc: LocationState) => {
    setSettings((prev) => ({ ...prev, location: loc }));
  };

  // Auth loading — Firebase resolves from IndexedDB cache in ~50ms
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-4xl animate-pulse">🕌</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  // First-time setup: no location configured
  if (!settings.location) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4'>
        <div className='w-full max-w-sm sm:max-w-md text-center'>
          <div className='text-5xl md:text-6xl mb-4'>🕌</div>
          <h1 className='text-2xl md:text-3xl font-bold text-white mb-2'>Nimaaz Time Viewer</h1>
          <p className='text-sm md:text-base text-gray-400 mb-8'>Set your mosque location to get started</p>
          <LocationSearch onSelect={handleSetupLocation} />
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && !data) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${bgClass} flex items-center justify-center`}>
        <div className='text-center'>
          <div className='text-4xl md:text-5xl mb-4 animate-pulse'>🕌</div>
          <p className={`text-sm md:text-base ${loadingScreenDark ? 'text-gray-300' : 'text-gray-500'}`}>
            Loading prayer times...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center'>
        <div className='text-center text-white'>
          <div className='text-5xl mb-4'>⚠️</div>
          <p className='text-red-300'>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <MosqueDisplay
        now={now}
        prayers={prayers}
        nextPrayer={nextPrayer}
        countdown={countdown}
        isTomorrow={isTomorrow}
        hijri={data?.hijri ?? null}
        nextHoliday={nextHoliday}
        hadith={hadith}
        hadithLoading={hadithLoading}
        hadithTransitioning={hadithTransitioning}
        settings={settings}
        method={data?.method ?? null}
        onOpenSettings={() => setShowSettings(true)}
        syncing={syncing}
        syncProgress={syncProgress}
        syncTotal={syncTotal}
        isDark={isDark}
        onToggleTheme={() => setIsDark(v => !v)}
      />
      {showSettings && (
        <SettingsModal settings={settings} onSave={handleSaveSettings} onClose={() => setShowSettings(false)} onSignOut={signOut} isDark={isDark} />
      )}
    </>
  );
}

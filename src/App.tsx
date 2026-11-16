import { useState, useEffect, useMemo, useRef } from 'react';
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
import type { LocationState, MosqueSettings } from './types';
import { buildPrayerList, filterCongregational } from './lib/prayers';

export default function App() {
  const now = useClock();
  const { user, authLoading, signOut } = useAuth();
  const [signupPending, setSignupPending] = useState(false);
  const accountUid = signupPending ? null : user?.uid ?? null;
  const { settings, setSettings } = useSettings(accountUid);
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
    accountUid,
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

  // Auto-switch theme: dark after Maghrib, light after Fajr
  const prevAutoTheme = useRef<boolean | null>(null);
  useEffect(() => {
    const fajr = prayers.find(p => p.key === 'Fajr');
    const maghrib = prayers.find(p => p.key === 'Maghrib');
    if (!fajr || !maghrib) return;
    const parseT = (timeStr: string) => {
      const [h, m] = timeStr.split(' ')[0].split(':').map(Number);
      const d = new Date(date);
      d.setHours(h, m, 0, 0);
      return d;
    };
    const shouldBeDark = now < parseT(fajr.time) || now >= parseT(maghrib.time);
    if (prevAutoTheme.current !== shouldBeDark) {
      prevAutoTheme.current = shouldBeDark;
      setIsDark(shouldBeDark);
    }
  }, [now, prayers, date]);

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

  if (!user || signupPending) {
    return <AuthScreen onSignupPendingChange={setSignupPending} />;
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

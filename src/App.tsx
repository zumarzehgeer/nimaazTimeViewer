import { useState, useEffect } from 'react'
import { MosqueDisplay } from './components/MosqueDisplay'
import { SettingsModal } from './components/SettingsModal'
import { LocationSearch } from './components/LocationSearch'
import { usePrayerTimes } from './hooks/usePrayerTimes'
import { useCountdown } from './hooks/useCountdown'
import { useClock } from './hooks/useClock'
import { useSettings } from './hooks/useSettings'
import { getTimeOfDay, BACKGROUNDS } from './hooks/useBackground'
import type { PrayerEntry, LocationState, MosqueSettings } from './types'
import { PRAYER_KEYS } from './types'

function addIqamahTime(adhanTime: string, offsetMinutes: number): string {
  const clean = adhanTime.split(' ')[0]
  const [h, m] = clean.split(':').map(Number)
  const total = h * 60 + m + offsetMinutes
  const newH = Math.floor(total / 60) % 24
  const newM = total % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
}

const DISPLAY_NAMES: Record<string, string> = {
  Lastthird: 'Last Third',
}

const CONGREGATIONAL_KEYS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha']

export default function App() {
  const now = useClock()
  const { settings, setSettings } = useSettings()
  const [showSettings, setShowSettings] = useState(false)
  const [date, setDate] = useState<Date>(() => new Date())

  // Auto-advance date at midnight
  useEffect(() => {
    const today = new Date().toDateString()
    if (date.toDateString() !== today) {
      setDate(new Date())
    }
  }, [now, date])

  const { data, loading, error } = usePrayerTimes(
    settings.location ? date : null,
    settings.location?.lat ?? null,
    settings.location?.lng ?? null,
  )

  const prayers: PrayerEntry[] = data
    ? PRAYER_KEYS.filter((key) => data.timings[key] !== undefined).map((key) => ({
        name: DISPLAY_NAMES[key] ?? key,
        key,
        time: data.timings[key],
        iqamahTime: key !== 'Sunrise' && key in settings.iqamahOffsets
          ? addIqamahTime(data.timings[key], settings.iqamahOffsets[key as keyof typeof settings.iqamahOffsets])
          : null,
      }))
    : []

  const congregationalPrayers = prayers.filter((p) => CONGREGATIONAL_KEYS.includes(p.key))
  const { nextPrayer, countdown } = useCountdown(congregationalPrayers, date)

  const timeOfDay = getTimeOfDay(data?.timings ?? null)
  const bgClass = BACKGROUNDS[timeOfDay]
  const isDark = ['night', 'dawn', 'sunset', 'evening'].includes(timeOfDay)

  const handleSaveSettings = (newSettings: MosqueSettings) => {
    setSettings(newSettings)
  }

  const handleSetupLocation = (loc: LocationState) => {
    setSettings((prev) => ({ ...prev, location: loc }))
  }

  // First-time setup: no location configured
  if (!settings.location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm sm:max-w-md text-center">
          <div className="text-5xl md:text-6xl mb-4">🕌</div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Nimaaz Time Viewer</h1>
          <p className="text-sm md:text-base text-gray-400 mb-8">Set your mosque location to get started</p>
          <LocationSearch onSelect={handleSetupLocation} />
        </div>
      </div>
    )
  }

  // Loading state
  if (loading && !data) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${bgClass} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-4xl md:text-5xl mb-4 animate-pulse">🕌</div>
          <p className={`text-sm md:text-base ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>Loading prayer times...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <MosqueDisplay
        now={now}
        prayers={prayers}
        nextPrayer={nextPrayer}
        countdown={countdown}
        hijri={data?.hijri ?? null}
        settings={settings}
        method={data?.method ?? null}
        onOpenSettings={() => setShowSettings(true)}
      />
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </>
  )
}

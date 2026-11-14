import { useEffect, useRef, useState } from 'react'
import { MosqueDisplay } from '../components/MosqueDisplay'
import { getCountdown } from '../lib/countdown'
import { buildPrayerList, filterCongregational } from '../lib/prayers'
import type { MosqueSettings } from '../types'
import { createDemoSettings, demoSchedule, scenarios } from './fixtures'
import './demo.css'

function SampleSettings({ settings, onSave, onClose }: {
  settings: MosqueSettings; onSave: (value: MosqueSettings) => void; onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef(document.activeElement instanceof HTMLElement ? document.activeElement : null)
  const [name, setName] = useState(settings.mosqueName)
  const [offset, setOffset] = useState(settings.iqamahOffsets.Dhuhr)
  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    return () => { element.close(); opener.current?.focus() }
  }, [])
  return <dialog ref={dialog} className="demo-settings" aria-labelledby="demo-settings-title" onCancel={(event) => { event.preventDefault(); onClose() }}>
    <form onSubmit={(event) => {
      event.preventDefault()
      onSave({ ...settings, mosqueName: name.trim() || 'Demo Mosque', iqamahOffsets: { ...settings.iqamahOffsets, Dhuhr: offset } })
    }}>
      <h2 id="demo-settings-title">Demo display settings</h2>
      <p>Changes last only while this demo is open.</p>
      <label>Display name<input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} /></label>
      <label>Dhuhr iqamah offset (minutes)<input type="number" min="0" max="60" step="1" required value={offset}
        onChange={(e) => setOffset(Number(e.target.value))} /></label>
      <div className="demo-settings-actions">
        <button type="button" onClick={onClose}>Cancel</button>
        <button type="submit">Apply to demo</button>
      </div>
    </form>
  </dialog>
}

export default function DemoApp() {
  const [scenario, setScenario] = useState<keyof typeof scenarios>('weekday')
  const [now, setNow] = useState(() => new Date(scenarios.weekday.at))
  const [settings, setSettings] = useState(createDemoSettings)
  const [isDark, setIsDark] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [resetVersion, setResetVersion] = useState(0)
  useEffect(() => {
    const started = Date.now(), initial = scenarios[scenario].at.getTime()
    setNow(new Date(initial))
    const interval = setInterval(() => setNow(new Date(initial + Date.now() - started)), 1000)
    return () => clearInterval(interval)
  }, [scenario, resetVersion])
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const allPrayers = buildPrayerList(demoSchedule, settings)
  const prayers = filterCongregational(allPrayers, now.getDay() === 5)
  const next = getCountdown(prayers, now, now, filterCongregational(allPrayers, tomorrow.getDay() === 5), tomorrow)
  return <div className="guest-demo">
    <header className="demo-controls">
      <div><h1>Guest demo</h1><p>Synthetic prayer times. Explore a sample display without an account.</p></div>
      <div className="demo-actions">
        <label>Sample day<select value={scenario} onChange={(e) => setScenario(e.target.value as keyof typeof scenarios)}>
          {Object.entries(scenarios).map(([key, value]) => <option key={key} value={key}>{value.label}</option>)}
        </select></label>
        <button onClick={() => { setSettings(createDemoSettings()); setIsDark(true); setScenario('weekday'); setResetVersion((value) => value + 1) }}>Reset demo</button>
        <a href="./">Account sign-in</a>
      </div>
    </header>
    <MosqueDisplay now={now} prayers={prayers} nextPrayer={next.nextPrayer} countdown={next.countdown}
      infoContent={<section className={`demo-info ${isDark ? '' : 'demo-info-light'}`} aria-labelledby="demo-info-title">
        <h2 id="demo-info-title">Explore the daily display</h2>
        <p>Choose Friday to see Jumu'ah, or After Isha for tomorrow's countdown. Open Settings to change the sample display name or iqamah offset.</p>
        <dl><div><dt>Adhan</dt><dd>The scheduled call to prayer. The countdown follows this time.</dd></div>
          <div><dt>Iqamah</dt><dd>The congregation time, set by an offset or a manual override.</dd></div></dl>
        <p className="demo-info-note">This sample uses an example clock and schedule. Changes reset when you reload.</p>
      </section>}
      isTomorrow={next.isTomorrow} hijri={null} nextHoliday={null} hadith={null} hadithLoading={false}
      hadithTransitioning={false} settings={settings} method={demoSchedule.method}
      onOpenSettings={() => setShowSettings(true)} isDark={isDark} onToggleTheme={() => setIsDark((value) => !value)} />
    {showSettings && <SampleSettings settings={settings} onClose={() => setShowSettings(false)}
      onSave={(value) => { setSettings(value); setShowSettings(false) }} />}
  </div>
}

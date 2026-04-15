import { useState, useRef, useCallback, useEffect } from 'react'
import {
  IconCurrentLocation, IconLoader2, IconX, IconEye, IconEyeOff,
  IconBuildingMosque, IconClock, IconSpeakerphone, IconBook, IconUser
} from '@tabler/icons-react'
import { searchCity, reverseGeocode } from '../services/geocoding'
import { fetchMethods } from '../services/aladhan'
import { fetchHadith } from '../services/hadith'
import type { MosqueSettings, NominatimResult, LocationState, CalculationMethod, HadithCollection, DisplayHadith } from '../types'
import { COLLECTION_LABELS, COLLECTION_COUNTS } from '../types'

// Module-level — safe to reference from module-level components
const sectionLabelCls = 'text-xs font-bold text-[#11999e] uppercase tracking-widest block'

function SectionCard({ title, children, action, isDark }: { title: string; children: React.ReactNode; action?: React.ReactNode; isDark: boolean }) {
  return (
    <div className={`rounded-xl border shadow-sm p-4 transition-colors ${isDark ? 'bg-[#1a3538]/40 border-[#11999e]/15' : 'bg-white/60 border-[#11999e]/10'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-[#11999e]" />
          <span className={sectionLabelCls}>{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-[1.375rem] rounded-full transition-colors duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-[#11999e]/40 focus:ring-offset-1 ${checked ? 'bg-[#11999e]' : 'bg-[#3c3c3c]/20'}`}
    >
      <span className={`absolute top-[3px] left-[3px] w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`} />
    </button>
  )
}

interface SettingsModalProps {
  settings: MosqueSettings
  onSave: (settings: MosqueSettings) => void
  onClose: () => void
  onSignOut?: () => void
  isDark?: boolean
}

type SettingsTab = 'general' | 'prayers' | 'announcements' | 'hadith' | 'account'

export function SettingsModal({ settings, onSave, onClose, onSignOut, isDark = false }: SettingsModalProps) {
  const d = isDark
  const [draft, setDraft] = useState<MosqueSettings>({ ...settings })
  const [cityQuery, setCityQuery] = useState(settings.location?.label ?? '')
  const [cityResults, setCityResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [announcementInput, setAnnouncementInput] = useState('')
  const [detecting, setDetecting] = useState(false)
  const [methods, setMethods] = useState<CalculationMethod[]>([])
  const [loadingMethods, setLoadingMethods] = useState(true)
  const [showApiKey, setShowApiKey] = useState(false)
  const [collectionsError, setCollectionsError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [pinCollection, setPinCollection] = useState<HadithCollection>(
    settings.hadith.pinnedHadith?.collection ?? 'sahih-bukhari'
  )
  const [pinNumber, setPinNumber] = useState<string>(
    settings.hadith.pinnedHadith?.hadithNumber?.toString() ?? ''
  )
  const [pinPreview, setPinPreview] = useState<DisplayHadith | null>(null)
  const [pinLoading, setPinLoading] = useState(false)
  const [pinError, setPinError] = useState<string | null>(null)

  const handleFetchPreview = async () => {
    const n = parseInt(pinNumber)
    const max = COLLECTION_COUNTS[pinCollection]
    if (!n || n < 1 || n > max) { setPinError(`Enter a number between 1 and ${max}`); return }
    if (!draft.hadith.hadithApiKey) { setPinError('API key required'); return }
    setPinError(null)
    setPinLoading(true)
    try {
      const result = await fetchHadith(pinCollection, n, draft.hadith.hadithApiKey)
      setPinPreview(result)
    } catch {
      setPinError('Failed to fetch — check number and API key')
    } finally {
      setPinLoading(false)
    }
  }

  const handlePinSave = () => {
    const n = parseInt(pinNumber)
    if (!n || n < 1) return
    setDraft((prev) => ({ ...prev, hadith: { ...prev.hadith, pinnedHadith: { collection: pinCollection, hadithNumber: n } } }))
    setPinPreview(null)
  }

  const handlePinClear = () => {
    setDraft((prev) => ({ ...prev, hadith: { ...prev.hadith, pinnedHadith: null } }))
    setPinPreview(null)
    setPinError(null)
  }

  useEffect(() => {
    fetchMethods().then(setMethods).catch(() => {}).finally(() => setLoadingMethods(false))
  }, [])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const handleCityInput = useCallback((value: string) => {
    setCityQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) { setCityResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try { setCityResults(await searchCity(value)) } catch { /* ignore */ }
      setSearching(false)
    }, 400)
  }, [])

  const handleCitySelect = (result: NominatimResult) => {
    const parts = result.display_name.split(', ')
    const label = parts.length >= 2 ? `${parts[0]}, ${parts[parts.length - 1]}` : result.display_name
    const loc: LocationState = { label, lat: parseFloat(result.lat), lng: parseFloat(result.lon) }
    setDraft((prev) => ({ ...prev, location: loc }))
    setCityQuery(label)
    setCityResults([])
  }

  const handleDetect = () => {
    if (!navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const label = await reverseGeocode(latitude, longitude)
          setDraft((prev) => ({ ...prev, location: { label, lat: latitude, lng: longitude } }))
          setCityQuery(label)
        } catch {
          setDraft((prev) => ({ ...prev, location: { label: 'My Location', lat: latitude, lng: longitude } }))
          setCityQuery('My Location')
        }
        setDetecting(false)
      },
      () => setDetecting(false),
    )
  }

  const addAnnouncement = () => {
    const text = announcementInput.trim()
    if (!text) return
    setDraft((prev) => ({ ...prev, announcements: [...prev.announcements, text] }))
    setAnnouncementInput('')
  }

  const removeAnnouncement = (index: number) => {
    setDraft((prev) => ({ ...prev, announcements: prev.announcements.filter((_, i) => i !== index) }))
  }

  const updateIqamah = (key: string, minutes: number) => {
    setDraft((prev) => ({ ...prev, iqamahOffsets: { ...prev.iqamahOffsets, [key]: minutes } }))
  }

  // Theme-aware class helpers
  const modalBg    = d ? 'bg-[#132628] border-[#11999e]/15'          : 'bg-[#FFF8F0] border-[#11999e]/10'
  const sidebarBg  = d ? 'bg-[#0d1e20] border-[#11999e]/15'          : 'bg-[#FFF3E8] border-[#11999e]/10'
  const footerBg   = d ? 'bg-[#0d1e20] border-[#11999e]/15'          : 'bg-[#FFF3E8] border-[#11999e]/10'
  const inputCls   = `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#11999e]/40 focus:border-[#11999e]/50 transition-colors ${
    d ? 'border-[#11999e]/25 bg-[#0d1e20]/80 text-[#f0ebe0] placeholder-[#7ba8ac]'
      : 'border-[#11999e]/20 bg-white/70 text-[#3c3c3c] placeholder-[#3c3c3c]/40'
  }`
  const subLabelCls = `text-xs font-semibold uppercase tracking-wide mb-1.5 block ${d ? 'text-[#7ba8ac]' : 'text-[#3c3c3c]/60'}`
  const mutedText   = d ? 'text-[#7ba8ac]' : 'text-[#3c3c3c]/40'
  const bodyText    = d ? 'text-[#f0ebe0]' : 'text-[#3c3c3c]'
  const rowBg       = d ? 'bg-[#0d1e20] border-[#11999e]/15'          : 'bg-[#FFF8F0] border-[#11999e]/10'
  const inlineInput = `px-2 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#11999e]/30 transition-colors ${
    d ? 'border-[#11999e]/20 bg-[#132628] text-[#f0ebe0]'
      : 'border-[#11999e]/20 bg-white text-[#3c3c3c]'
  }`

  const TABS = [
    { key: 'general'       as SettingsTab, label: 'General',  Icon: IconBuildingMosque },
    { key: 'prayers'       as SettingsTab, label: 'Prayers',  Icon: IconClock },
    { key: 'announcements' as SettingsTab, label: 'Notices',  Icon: IconSpeakerphone },
    { key: 'hadith'        as SettingsTab, label: 'Hadith',   Icon: IconBook },
    { key: 'account'       as SettingsTab, label: 'Account',  Icon: IconUser },
  ] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 animate-backdrop-enter">
      <div className={`rounded-2xl shadow-2xl w-full max-w-[680px] max-h-[92vh] flex flex-col border animate-modal-enter overflow-hidden transition-colors ${modalBg}`}>

        {/* Header — always teal gradient, white strokes pattern */}
        <div className="relative overflow-hidden rounded-t-2xl bg-gradient-to-r from-[#11999e] to-[#0d7a7f] px-5 py-4 flex-shrink-0">
          <div className="absolute inset-0 islamic-pattern-dark pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <IconBuildingMosque size={18} className="text-white" strokeWidth={1.75} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-tight">Settings</h2>
                <p className="text-[11px] text-white/60 font-medium">{draft.mosqueName || 'Mosque'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/15 hover:bg-white/25 text-white/80 hover:text-white transition-colors"
            >
              <IconX size={16} />
            </button>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative">

          {/* Desktop sidebar */}
          <nav className={`hidden md:flex flex-col w-44 flex-shrink-0 border-r py-3 gap-0.5 px-2 transition-colors ${sidebarBg}`}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all
                  ${activeTab === tab.key
                    ? 'bg-[#11999e] text-white shadow-sm'
                    : d ? 'text-[#7ba8ac] hover:text-[#f0ebe0] hover:bg-[#11999e]/10' : 'text-[#3c3c3c]/60 hover:text-[#3c3c3c] hover:bg-[#11999e]/10'
                  }`}
              >
                <tab.Icon size={16} strokeWidth={activeTab === tab.key ? 2 : 1.75} className="flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
            <div className={`mt-auto px-3 pt-3 border-t ${d ? 'border-[#11999e]/10' : 'border-[#11999e]/10'}`}>
              <p className={`text-[10px] font-medium tracking-wide ${mutedText}`}>Nimaaz Time</p>
            </div>
          </nav>

          {/* Mobile top tab strip */}
          <div className={`md:hidden absolute top-0 left-0 right-0 z-10 border-b transition-colors ${sidebarBg}`}>
            <div className="flex overflow-x-auto px-3 py-1.5 gap-1" style={{ scrollbarWidth: 'none' }}>
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${activeTab === tab.key
                      ? 'bg-[#11999e] text-white'
                      : d ? 'text-[#7ba8ac] hover:text-[#f0ebe0]' : 'text-[#3c3c3c]/50 hover:text-[#3c3c3c]'
                    }`}
                >
                  <tab.Icon size={13} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto px-4 py-4 md:pt-4 pt-14 min-h-0 flex flex-col gap-4">

            {/* ── General ── */}
            {activeTab === 'general' && (
              <>
                <SectionCard title="Mosque Name" isDark={d}>
                  <input
                    type="text"
                    value={draft.mosqueName}
                    onChange={(e) => setDraft((prev) => ({ ...prev, mosqueName: e.target.value }))}
                    placeholder="e.g. Masjid Al-Nur"
                    className={inputCls}
                  />
                </SectionCard>

                <SectionCard title="Location" isDark={d}>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={cityQuery}
                        onChange={(e) => handleCityInput(e.target.value)}
                        placeholder="Search city..."
                        className={inputCls}
                      />
                      {searching && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2">
                          <IconLoader2 size={14} className="animate-spin text-[#11999e]/50" />
                        </span>
                      )}
                    </div>
                    <button
                      onClick={handleDetect}
                      disabled={detecting}
                      title="Use my location"
                      className={`px-3 py-2 border border-[#11999e]/20 rounded-lg hover:bg-[#11999e]/10 text-[#11999e] disabled:opacity-50 transition-colors ${d ? 'bg-[#0d1e20]/80' : 'bg-white/70'}`}
                    >
                      {detecting ? <IconLoader2 size={18} className="animate-spin" /> : <IconCurrentLocation size={18} />}
                    </button>
                  </div>
                  {cityResults.length > 0 && (
                    <ul className={`mt-1.5 border border-[#11999e]/15 rounded-xl overflow-hidden shadow-sm ${d ? 'bg-[#0d1e20]' : 'bg-white'}`}>
                      {cityResults.map((r) => (
                        <li
                          key={r.place_id}
                          onMouseDown={() => handleCitySelect(r)}
                          className={`px-3 py-2 text-sm hover:bg-[#11999e]/8 cursor-pointer truncate transition-colors ${bodyText}`}
                        >
                          {r.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                  {draft.location && (
                    <p className="mt-2 text-xs text-[#11999e]/60 flex items-center gap-1">
                      <IconCurrentLocation size={11} />
                      {draft.location.label} ({draft.location.lat.toFixed(4)}, {draft.location.lng.toFixed(4)})
                    </p>
                  )}
                </SectionCard>

                <SectionCard title="Calculation Method" isDark={d}>
                  <select
                    value={draft.methodId ?? ''}
                    onChange={(e) => setDraft((prev) => ({ ...prev, methodId: e.target.value === '' ? null : parseInt(e.target.value) }))}
                    disabled={loadingMethods}
                    className={`${inputCls} cursor-pointer disabled:opacity-50`}
                  >
                    <option value="">Auto (recommended)</option>
                    {methods.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  {loadingMethods && (
                    <p className={`mt-1.5 text-xs flex items-center gap-1.5 ${mutedText}`}>
                      <IconLoader2 size={12} className="animate-spin text-[#11999e]" /> Loading methods...
                    </p>
                  )}
                </SectionCard>
              </>
            )}

            {/* ── Prayers ── */}
            {activeTab === 'prayers' && (
              <>
                <SectionCard title="Iqamah Offsets" isDark={d}>
                  <p className={`text-xs mb-3 -mt-1 ${mutedText}`}>Minutes after Adhan for each prayer</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((key) => (
                      <label key={key} className={`flex items-center gap-2.5 rounded-lg px-3 py-2 border ${rowBg}`}>
                        <span className="text-xs font-semibold text-[#11999e] w-14 flex-shrink-0">{key}</span>
                        <input
                          type="number"
                          min={0}
                          max={60}
                          value={draft.iqamahOffsets[key]}
                          onChange={(e) => updateIqamah(key, parseInt(e.target.value) || 0)}
                          className={`w-14 text-center ${inlineInput}`}
                        />
                        <span className={`text-xs ${mutedText}`}>min</span>
                      </label>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard title="Jumu'ah" isDark={d}>
                  <div className="flex flex-col gap-2.5">
                    <label className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${rowBg}`}>
                      <span className="text-xs font-semibold text-[#11999e] w-24 flex-shrink-0">Adhan Time</span>
                      <input
                        type="time"
                        value={draft.jumuahAdhan}
                        onChange={(e) => setDraft((prev) => ({ ...prev, jumuahAdhan: e.target.value }))}
                        className={inlineInput}
                      />
                      {!draft.jumuahAdhan && <span className={`text-xs italic ${mutedText}`}>defaults to Dhuhr</span>}
                    </label>
                    <label className={`flex items-center gap-3 rounded-lg px-3 py-2.5 border ${rowBg}`}>
                      <span className="text-xs font-semibold text-[#11999e] w-24 flex-shrink-0">Iqamah After</span>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={draft.iqamahOffsets.Jumuah}
                        onChange={(e) => updateIqamah('Jumuah', parseInt(e.target.value) || 0)}
                        className={`w-16 text-center ${inlineInput}`}
                      />
                      <span className={`text-xs ${mutedText}`}>min</span>
                    </label>
                  </div>
                </SectionCard>
              </>
            )}

            {/* ── Announcements ── */}
            {activeTab === 'announcements' && (
              <SectionCard title="Announcements" isDark={d}>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={announcementInput}
                    onChange={(e) => setAnnouncementInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addAnnouncement()}
                    placeholder="Add announcement text..."
                    className={inputCls}
                  />
                  <button onClick={addAnnouncement} className="px-4 py-2 bg-[#11999e] text-white text-sm font-medium rounded-lg hover:bg-[#0d7a7f] transition-colors flex-shrink-0">
                    Add
                  </button>
                </div>
                {draft.announcements.length === 0 ? (
                  <p className={`text-xs text-center py-4 italic ${mutedText}`}>No announcements yet</p>
                ) : (
                  <ul className="space-y-1.5 max-h-48 overflow-y-auto">
                    {draft.announcements.map((a, i) => (
                      <li key={i} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg border ${rowBg} ${bodyText}`}>
                        <IconSpeakerphone size={13} className="text-[#11999e] flex-shrink-0" />
                        <span className="flex-1 truncate">{a}</span>
                        <button onClick={() => removeAnnouncement(i)} className={`hover:text-red-400 transition-colors flex-shrink-0 ${mutedText}`}>
                          <IconX size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </SectionCard>
            )}

            {/* ── Hadith ── */}
            {activeTab === 'hadith' && (
              <>
                {/* Enable toggle */}
                <div className={`rounded-xl border shadow-sm p-4 flex items-center justify-between transition-colors ${d ? 'bg-[#1a3538]/40 border-[#11999e]/15' : 'bg-white/60 border-[#11999e]/10'}`}>
                  <div>
                    <span className="text-xs font-bold text-[#11999e] uppercase tracking-widest block mb-0.5">Daily Hadith</span>
                    <p className={`text-xs ${mutedText}`}>Show a rotating hadith on the display</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs ${mutedText}`}>{draft.hadith.enabled ? 'On' : 'Off'}</span>
                    <Toggle checked={draft.hadith.enabled} onChange={(v) => setDraft((prev) => ({ ...prev, hadith: { ...prev.hadith, enabled: v } }))} />
                  </div>
                </div>

                {draft.hadith.enabled && (
                  <>
                    <SectionCard title="Display Options" isDark={d}>
                      <div className="flex items-center justify-between py-1">
                        <div>
                          <span className={`text-sm font-medium ${bodyText}`}>Show Arabic Text</span>
                          <p className={`text-xs mt-0.5 ${mutedText}`}>Display original Arabic alongside translation</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs ${mutedText}`}>{draft.hadith.showArabic ? 'On' : 'Off'}</span>
                          <Toggle checked={draft.hadith.showArabic} onChange={(v) => setDraft((prev) => ({ ...prev, hadith: { ...prev.hadith, showArabic: v } }))} />
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="API Configuration" isDark={d}>
                      <div className="space-y-4">
                        <div>
                          <span className={subLabelCls}>API Key</span>
                          <div className="relative">
                            <input
                              type={showApiKey ? 'text' : 'password'}
                              value={draft.hadith.hadithApiKey}
                              onChange={(e) => setDraft((prev) => ({ ...prev, hadith: { ...prev.hadith, hadithApiKey: e.target.value } }))}
                              placeholder="Paste your hadithapi.com key..."
                              className={`${inputCls} pr-10`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowApiKey((v) => !v)}
                              className={`absolute right-3 top-1/2 -translate-y-1/2 hover:text-[#11999e] transition-colors ${mutedText}`}
                            >
                              {showApiKey ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                            </button>
                          </div>
                          <p className={`mt-1.5 text-xs ${mutedText}`}>
                            Free key at{' '}
                            <a href="https://hadithapi.com" target="_blank" rel="noreferrer" className="text-[#11999e] hover:underline font-medium">
                              hadithapi.com ↗
                            </a>
                          </p>
                        </div>
                        <div>
                          <span className={subLabelCls}>Rotation Interval</span>
                          <select
                            value={draft.hadith.rotationIntervalMinutes}
                            onChange={(e) => setDraft((prev) => ({ ...prev, hadith: { ...prev.hadith, rotationIntervalMinutes: parseInt(e.target.value) } }))}
                            className={`${inputCls} cursor-pointer`}
                          >
                            <option value={15}>Every 15 minutes</option>
                            <option value={30}>Every 30 minutes</option>
                            <option value={45}>Every 45 minutes</option>
                            <option value={60}>Every hour</option>
                          </select>
                        </div>
                      </div>
                    </SectionCard>

                    <SectionCard title="Pin Specific Hadith" isDark={d} action={
                      draft.hadith.pinnedHadith ? (
                        <button onClick={handlePinClear} className="text-xs text-red-400 hover:text-red-500 font-medium transition-colors">Clear pin</button>
                      ) : undefined
                    }>
                      {draft.hadith.pinnedHadith && (
                        <div className="mb-3 flex items-center gap-2 bg-[#11999e]/8 rounded-lg px-3 py-2 border border-[#11999e]/15">
                          <IconBook size={13} className="text-[#11999e]" />
                          <p className="text-xs text-[#11999e] font-medium">
                            Pinned: {COLLECTION_LABELS[draft.hadith.pinnedHadith.collection]} #{draft.hadith.pinnedHadith.hadithNumber}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2 mb-2">
                        <select
                          value={pinCollection}
                          onChange={(e) => { setPinCollection(e.target.value as HadithCollection); setPinPreview(null); setPinError(null) }}
                          className={`flex-1 px-2 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#11999e]/30 cursor-pointer transition-colors ${d ? 'border-[#11999e]/20 bg-[#0d1e20] text-[#f0ebe0]' : 'border-[#11999e]/20 bg-white/70 text-[#3c3c3c]'}`}
                        >
                          {(Object.entries(COLLECTION_LABELS) as [HadithCollection, string][]).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          max={COLLECTION_COUNTS[pinCollection]}
                          value={pinNumber}
                          onChange={(e) => { setPinNumber(e.target.value); setPinPreview(null); setPinError(null) }}
                          placeholder={`1–${COLLECTION_COUNTS[pinCollection]}`}
                          className={`w-24 px-2 py-1.5 border rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-[#11999e]/30 transition-colors ${d ? 'border-[#11999e]/20 bg-[#0d1e20] text-[#f0ebe0]' : 'border-[#11999e]/20 bg-white/70 text-[#3c3c3c]'}`}
                        />
                        <button
                          onClick={handleFetchPreview}
                          disabled={pinLoading}
                          className="px-3 py-1.5 bg-[#11999e]/8 border border-[#11999e]/20 hover:bg-[#11999e]/15 text-[#11999e] text-xs rounded-lg disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5 font-medium transition-colors"
                        >
                          {pinLoading ? <IconLoader2 size={13} className="animate-spin" /> : null}
                          Preview
                        </button>
                      </div>
                      {pinError && <p className="text-xs text-red-400 mb-2">{pinError}</p>}
                      {pinPreview && (
                        <div className={`rounded-xl p-3 mb-2 border border-[#11999e]/15 transition-colors ${d ? 'bg-[#0d1e20]' : 'bg-[#FFF8F0]'}`}>
                          <p className="text-xs text-[#11999e] font-semibold mb-1">{pinPreview.source} #{pinPreview.number}</p>
                          <p className={`text-xs line-clamp-3 leading-relaxed ${d ? 'text-[#f0ebe0]/70' : 'text-[#3c3c3c]/70'}`}>{pinPreview.english}</p>
                          <button onClick={handlePinSave} className="mt-2.5 px-3 py-1.5 bg-[#11999e] text-white text-xs rounded-lg hover:bg-[#0d7a7f] font-medium transition-colors">
                            Pin this hadith
                          </button>
                        </div>
                      )}
                      <p className={`text-xs leading-relaxed ${d ? 'text-[#7ba8ac]/70' : 'text-[#3c3c3c]/35'}`}>When pinned, rotation pauses and this hadith always shows.</p>
                    </SectionCard>

                    <SectionCard title="Enabled Collections" isDark={d}>
                      <div className="grid grid-cols-2 gap-1.5">
                        {(Object.entries(COLLECTION_LABELS) as [HadithCollection, string][]).map(([key, label]) => {
                          const isChecked = draft.hadith.enabledCollections.includes(key)
                          return (
                            <label
                              key={key}
                              className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg border transition-all ${
                                isChecked
                                  ? d ? 'border-[#11999e]/40 bg-[#11999e]/15 text-[#11999e]' : 'border-[#11999e]/30 bg-[#11999e]/8 text-[#11999e]'
                                  : d ? 'border-[#11999e]/10 bg-[#0d1e20]/50 text-[#7ba8ac] hover:border-[#11999e]/20' : 'border-[#3c3c3c]/10 bg-white/50 text-[#3c3c3c]/50 hover:border-[#11999e]/15'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...draft.hadith.enabledCollections, key]
                                    : draft.hadith.enabledCollections.filter((c) => c !== key)
                                  if (next.length === 0) { setCollectionsError('At least one collection must be enabled'); return }
                                  setCollectionsError(null)
                                  setDraft((prev) => ({ ...prev, hadith: { ...prev.hadith, enabledCollections: next } }))
                                }}
                                className="w-3.5 h-3.5 rounded accent-[#11999e] flex-shrink-0"
                              />
                              <span className="truncate text-xs font-medium">{label}</span>
                            </label>
                          )
                        })}
                      </div>
                      {collectionsError && <p className="mt-2 text-xs text-red-400">{collectionsError}</p>}
                    </SectionCard>
                  </>
                )}
              </>
            )}

            {/* ── Account ── */}
            {activeTab === 'account' && (
              <SectionCard title="Account" isDark={d}>
                <p className={`text-xs mb-4 -mt-1 ${mutedText}`}>Manage your mosque account</p>
                {onSignOut ? (
                  <button onClick={onSignOut} className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-500 border border-red-200/60 bg-red-50/60 hover:bg-red-100/60 hover:border-red-300/60 transition-colors">
                    Sign Out
                  </button>
                ) : (
                  <p className={`text-xs text-center py-4 italic ${mutedText}`}>Not signed in</p>
                )}
              </SectionCard>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className={`flex-shrink-0 px-4 py-3.5 border-t rounded-b-2xl flex gap-2.5 transition-colors ${footerBg}`}>
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2.5 border rounded-xl text-sm font-medium transition-colors ${
              d ? 'border-[#11999e]/15 text-[#7ba8ac] hover:text-[#f0ebe0] hover:bg-[#1a3538]/50' : 'border-[#3c3c3c]/15 text-[#3c3c3c]/60 hover:text-[#3c3c3c] hover:bg-white/50'
            }`}
          >
            Cancel
          </button>
          <button
            onClick={() => { onSave(draft); onClose() }}
            className="flex-1 px-4 py-2.5 bg-[#11999e] hover:bg-[#0d7a7f] text-white rounded-xl text-sm font-semibold shadow-sm transition-colors"
          >
            Save Settings
          </button>
        </div>

      </div>
    </div>
  )
}

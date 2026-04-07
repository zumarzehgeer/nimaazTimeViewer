import { useState, useRef, useCallback, useEffect } from 'react'
import { IconCurrentLocation, IconLoader2, IconX, IconEye, IconEyeOff } from '@tabler/icons-react'
import { searchCity, reverseGeocode } from '../services/geocoding'
import { fetchMethods } from '../services/aladhan'
import { fetchHadith } from '../services/hadith'
import type { MosqueSettings, NominatimResult, LocationState, CalculationMethod, HadithCollection, DisplayHadith } from '../types'
import { COLLECTION_LABELS, COLLECTION_COUNTS } from '../types'

interface SettingsModalProps {
  settings: MosqueSettings
  onSave: (settings: MosqueSettings) => void
  onClose: () => void
}

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Pin-specific hadith state
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
    if (!n || n < 1 || n > max) {
      setPinError(`Enter a number between 1 and ${max}`)
      return
    }
    if (!draft.hadith.hadithApiKey) {
      setPinError('API key required')
      return
    }
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
    setDraft((d) => ({ ...d, hadith: { ...d.hadith, pinnedHadith: { collection: pinCollection, hadithNumber: n } } }))
    setPinPreview(null)
  }

  const handlePinClear = () => {
    setDraft((d) => ({ ...d, hadith: { ...d.hadith, pinnedHadith: null } }))
    setPinPreview(null)
    setPinError(null)
  }

  useEffect(() => {
    fetchMethods()
      .then(setMethods)
      .catch(() => { /* silently ignore */ })
      .finally(() => setLoadingMethods(false))
  }, [])

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current) }, [])

  const handleCityInput = useCallback((value: string) => {
    setCityQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) {
      setCityResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const results = await searchCity(value)
        setCityResults(results)
      } catch { /* ignore */ }
      setSearching(false)
    }, 400)
  }, [])

  const handleCitySelect = (result: NominatimResult) => {
    const parts = result.display_name.split(', ')
    const label = parts.length >= 2 ? `${parts[0]}, ${parts[parts.length - 1]}` : result.display_name
    const loc: LocationState = { label, lat: parseFloat(result.lat), lng: parseFloat(result.lon) }
    setDraft((d) => ({ ...d, location: loc }))
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
          const loc: LocationState = { label, lat: latitude, lng: longitude }
          setDraft((d) => ({ ...d, location: loc }))
          setCityQuery(label)
        } catch {
          setDraft((d) => ({ ...d, location: { label: 'My Location', lat: latitude, lng: longitude } }))
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
    setDraft((d) => ({ ...d, announcements: [...d.announcements, text] }))
    setAnnouncementInput('')
  }

  const removeAnnouncement = (index: number) => {
    setDraft((d) => ({
      ...d,
      announcements: d.announcements.filter((_, i) => i !== index),
    }))
  }

  const updateIqamah = (key: string, minutes: number) => {
    setDraft((d) => ({
      ...d,
      iqamahOffsets: { ...d.iqamahOffsets, [key]: minutes },
    }))
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const smallInputCls = 'px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const sectionLabelCls = 'text-sm font-semibold text-gray-700 mb-2 block'
  const subLabelCls = 'text-xs font-medium text-gray-500 mb-1.5 block'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <IconX size={18} />
            </button>
          </div>

          {/* Mosque Name */}
          <div className="mb-5">
            <span className={sectionLabelCls}>Mosque Name</span>
            <input
              type="text"
              value={draft.mosqueName}
              onChange={(e) => setDraft((d) => ({ ...d, mosqueName: e.target.value }))}
              className={inputCls}
            />
          </div>

          <hr className="border-gray-100 mb-5" />

          {/* Location */}
          <div className="mb-5">
            <span className={sectionLabelCls}>Location</span>
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
                    <IconLoader2 size={14} className="animate-spin text-gray-400" />
                  </span>
                )}
              </div>
              <button
                onClick={handleDetect}
                disabled={detecting}
                title="Use my location"
                className={`px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50`}
              >
                {detecting
                  ? <IconLoader2 size={18} className="animate-spin text-gray-400" />
                  : <IconCurrentLocation size={18} className="text-gray-500" />
                }
              </button>
            </div>
            {cityResults.length > 0 && (
              <ul className="mt-1 border border-gray-200 rounded-lg overflow-hidden">
                {cityResults.map((r) => (
                  <li
                    key={r.place_id}
                    onMouseDown={() => handleCitySelect(r)}
                    className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer truncate"
                  >
                    {r.display_name}
                  </li>
                ))}
              </ul>
            )}
            {draft.location && (
              <p className="mt-1 text-xs text-gray-400">
                {draft.location.label} ({draft.location.lat.toFixed(4)}, {draft.location.lng.toFixed(4)})
              </p>
            )}
          </div>

          <hr className="border-gray-100 mb-5" />

          {/* Calculation Method */}
          <div className="mb-5">
            <span className={sectionLabelCls}>Calculation Method</span>
            <select
              value={draft.methodId ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, methodId: e.target.value === '' ? null : parseInt(e.target.value) }))}
              disabled={loadingMethods}
              className={`${inputCls} disabled:opacity-50`}
            >
              <option value="">Auto (recommended)</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {loadingMethods && (
              <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
                <IconLoader2 size={12} className="animate-spin" /> Loading methods...
              </p>
            )}
          </div>

          <hr className="border-gray-100 mb-5" />

          {/* Iqamah Offsets */}
          <div className="mb-5">
            <span className={sectionLabelCls}>Iqamah Offsets <span className="font-normal text-gray-400">(minutes after Adhan)</span></span>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((key) => (
                <label key={key} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-16">{key}</span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={draft.iqamahOffsets[key]}
                    onChange={(e) => updateIqamah(key, parseInt(e.target.value) || 0)}
                    className={`w-16 text-center ${smallInputCls}`}
                  />
                  <span className="text-xs text-gray-400">min</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-gray-100 mb-5" />

          {/* Jumu'ah */}
          <div className="mb-5">
            <span className={sectionLabelCls}>Jumu'ah</span>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-24">Adhan time</span>
                <input
                  type="time"
                  value={draft.jumuahAdhan}
                  onChange={(e) => setDraft((d) => ({ ...d, jumuahAdhan: e.target.value }))}
                  className={smallInputCls}
                />
                {!draft.jumuahAdhan && <span className="text-xs text-gray-400">defaults to Dhuhr</span>}
              </label>
              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-24">Iqamah after</span>
                <input
                  type="number"
                  min={0}
                  max={60}
                  value={draft.iqamahOffsets.Jumuah}
                  onChange={(e) => updateIqamah('Jumuah', parseInt(e.target.value) || 0)}
                  className={`w-16 text-center ${smallInputCls}`}
                />
                <span className="text-xs text-gray-400">min</span>
              </label>
            </div>
          </div>

          <hr className="border-gray-100 mb-5" />

          {/* Announcements */}
          <div className="mb-6">
            <span className={sectionLabelCls}>Announcements</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={announcementInput}
                onChange={(e) => setAnnouncementInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAnnouncement()}
                placeholder="Add announcement..."
                className={inputCls}
              />
              <button
                onClick={addAnnouncement}
                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            {draft.announcements.length > 0 && (
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {draft.announcements.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <span className="flex-1 truncate">{a}</span>
                    <button
                      onClick={() => removeAnnouncement(i)}
                      className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      <IconX size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <hr className="border-gray-100 mb-5" />

          {/* Daily Hadith */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className={sectionLabelCls.replace('mb-2', 'mb-0')}>Daily Hadith</span>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-xs text-gray-500">{draft.hadith.enabled ? 'On' : 'Off'}</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={draft.hadith.enabled}
                    onChange={(e) => setDraft((d) => ({ ...d, hadith: { ...d.hadith, enabled: e.target.checked } }))}
                    className="sr-only"
                  />
                  <div className={`w-10 h-5 rounded-full transition-colors ${draft.hadith.enabled ? 'bg-blue-600' : 'bg-gray-200'}`} />
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${draft.hadith.enabled ? 'translate-x-5' : ''}`} />
                </div>
              </label>
            </div>

            {draft.hadith.enabled && (
              <div className="bg-gray-50 rounded-xl p-3 space-y-4">

                {/* API Key */}
                <div>
                  <span className={subLabelCls}>API Key</span>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={draft.hadith.hadithApiKey}
                      onChange={(e) => setDraft((d) => ({ ...d, hadith: { ...d.hadith, hadithApiKey: e.target.value } }))}
                      placeholder="Paste your hadithapi.com key..."
                      className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-400">
                    Free key at{' '}
                    <a href="https://hadithapi.com" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
                      hadithapi.com ↗
                    </a>
                  </p>
                </div>

                {/* Rotation interval */}
                <div>
                  <span className={subLabelCls}>Rotation interval</span>
                  <select
                    value={draft.hadith.rotationIntervalMinutes}
                    onChange={(e) => setDraft((d) => ({ ...d, hadith: { ...d.hadith, rotationIntervalMinutes: parseInt(e.target.value) } }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value={15}>Every 15 minutes</option>
                    <option value={30}>Every 30 minutes</option>
                    <option value={45}>Every 45 minutes</option>
                    <option value={60}>Every hour</option>
                  </select>
                </div>

                {/* Pin specific hadith */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={subLabelCls.replace('mb-1.5', 'mb-0')}>Pin specific hadith</span>
                    {draft.hadith.pinnedHadith && (
                      <button onClick={handlePinClear} className="text-xs text-red-400 hover:text-red-600">
                        Clear pin
                      </button>
                    )}
                  </div>
                  {draft.hadith.pinnedHadith && (
                    <p className="text-xs text-blue-500 mb-2">
                      Pinned: {COLLECTION_LABELS[draft.hadith.pinnedHadith.collection]} #{draft.hadith.pinnedHadith.hadithNumber}
                    </p>
                  )}
                  <div className="flex gap-2 mb-2">
                    <select
                      value={pinCollection}
                      onChange={(e) => { setPinCollection(e.target.value as HadithCollection); setPinPreview(null); setPinError(null) }}
                      className="flex-1 px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
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
                      className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                    <button
                      onClick={handleFetchPreview}
                      disabled={pinLoading}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-700 text-xs rounded-lg disabled:opacity-50 whitespace-nowrap flex items-center gap-1.5"
                    >
                      {pinLoading ? <IconLoader2 size={13} className="animate-spin" /> : null}
                      Preview
                    </button>
                  </div>
                  {pinError && <p className="text-xs text-red-400 mb-2">{pinError}</p>}
                  {pinPreview && (
                    <div className="bg-white rounded-lg p-2.5 mb-2 border border-gray-100">
                      <p className="text-xs text-blue-500 font-medium mb-1">{pinPreview.source} #{pinPreview.number}</p>
                      <p className="text-xs text-gray-600 line-clamp-3">{pinPreview.english}</p>
                      <button
                        onClick={handlePinSave}
                        className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
                      >
                        Pin this hadith
                      </button>
                    </div>
                  )}
                  <p className="text-xs text-gray-400">When pinned, rotation is paused and this hadith always shows.</p>
                </div>

                {/* Collections */}
                <div>
                  <span className={subLabelCls}>Collections</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(Object.entries(COLLECTION_LABELS) as [HadithCollection, string][]).map(([key, label]) => (
                      <label key={key} className="flex items-center gap-2 cursor-pointer text-sm text-gray-600 py-1">
                        <input
                          type="checkbox"
                          checked={draft.hadith.enabledCollections.includes(key)}
                          onChange={(e) => {
                            const next = e.target.checked
                              ? [...draft.hadith.enabledCollections, key]
                              : draft.hadith.enabledCollections.filter((c) => c !== key)
                            if (next.length === 0) {
                              setCollectionsError('At least one collection must be enabled')
                              return
                            }
                            setCollectionsError(null)
                            setDraft((d) => ({ ...d, hadith: { ...d.hadith, enabledCollections: next } }))
                          }}
                          className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                        />
                        <span className="truncate">{label}</span>
                      </label>
                    ))}
                  </div>
                  {collectionsError && (
                    <p className="mt-1.5 text-xs text-red-400">{collectionsError}</p>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => { onSave(draft); onClose() }}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Save Settings
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

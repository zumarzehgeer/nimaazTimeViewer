import { useState, useRef, useCallback, useEffect } from 'react'
import { IconCurrentLocation, IconLoader2 } from '@tabler/icons-react'
import { searchCity, reverseGeocode } from '../services/geocoding'
import { fetchMethods } from '../services/aladhan'
import type { MosqueSettings, NominatimResult, LocationState, CalculationMethod } from '../types'

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
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetchMethods()
      .then(setMethods)
      .catch(() => { /* silently ignore — dropdown stays empty */ })
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Settings</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-2xl leading-none"
            >
              &times;
            </button>
          </div>

          {/* Mosque Name */}
          <div className="mb-5">
            <span className="text-sm font-semibold text-gray-700 mb-2 block">Mosque Name</span>
            <input
              type="text"
              value={draft.mosqueName}
              onChange={(e) => setDraft((d) => ({ ...d, mosqueName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <hr className="border-gray-100 mb-5" />

          {/* Location */}
          <div className="mb-5">
            <span className="text-sm font-semibold text-gray-700 mb-2 block">Location</span>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={cityQuery}
                  onChange={(e) => handleCityInput(e.target.value)}
                  placeholder="Search city..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">...</span>
                )}
              </div>
              <button onClick={handleDetect} disabled={detecting} title="Use my location" className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
                {detecting
                  ? <IconLoader2 size={18} className="animate-spin text-gray-400" />
                  : <IconCurrentLocation size={18} className="text-gray-500" />
                }
              </button>
            </div>
            {cityResults.length > 0 && (
              <ul className="mt-1 border border-gray-200 rounded-lg overflow-hidden">
                {cityResults.map((r) => (
                  <li key={r.place_id} onMouseDown={() => handleCitySelect(r)} className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer truncate">
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
            <span className="text-sm font-semibold text-gray-700 mb-2 block">Calculation Method</span>
            <select
              value={draft.methodId ?? ''}
              onChange={(e) => setDraft((d) => ({ ...d, methodId: e.target.value === '' ? null : parseInt(e.target.value) }))}
              disabled={loadingMethods}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="">Auto (recommended)</option>
              {methods.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            {loadingMethods && <p className="mt-1 text-xs text-gray-400">Loading methods...</p>}
          </div>

          <hr className="border-gray-100 mb-5" />

          {/* Iqamah Offsets */}
          <div className="mb-5">
            <span className="text-sm font-semibold text-gray-700 mb-2 block">Iqamah Offsets (minutes after Adhan)</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {(['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const).map((key) => (
                <label key={key} className="flex items-center gap-2">
                  <span className="text-sm text-gray-600 w-16">{key}</span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={draft.iqamahOffsets[key]}
                    onChange={(e) => updateIqamah(key, parseInt(e.target.value) || 0)}
                    className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-400">min</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-gray-100 mb-5" />

          {/* Jumu'ah */}
          <div className="mb-5">
            <span className="text-sm font-semibold text-gray-700 mb-2 block">Jumu'ah</span>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2">
                <span className="text-sm text-gray-600 w-24">Adhan time</span>
                <input
                  type="time"
                  value={draft.jumuahAdhan}
                  onChange={(e) => setDraft((d) => ({ ...d, jumuahAdhan: e.target.value }))}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs text-gray-400">min</span>
              </label>
            </div>
          </div>

          <hr className="border-gray-100 mb-5" />

          {/* Announcements */}
          <div className="mb-6">
            <span className="text-sm font-semibold text-gray-700 mb-2 block">Announcements</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={announcementInput}
                onChange={(e) => setAnnouncementInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addAnnouncement()}
                placeholder="Add announcement..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={addAnnouncement} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Add</button>
            </div>
            {draft.announcements.length > 0 && (
              <ul className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {draft.announcements.map((a, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <span className="flex-1 truncate">{a}</span>
                    <button onClick={() => removeAnnouncement(i)} className="text-red-400 hover:text-red-600 text-lg leading-none">&times;</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Save */}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
              Cancel
            </button>
            <button onClick={() => { onSave(draft); onClose() }} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

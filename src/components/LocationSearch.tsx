import { useState, useRef, useCallback, useEffect } from 'react'
import { searchCity, reverseGeocode } from '../services/geocoding'
import type { LocationState, NominatimResult } from '../types'

interface LocationSearchProps {
  onSelect: (location: LocationState) => void
}

export function LocationSearch({ onSelect }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleInput = useCallback((value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.trim().length < 2) {
      setResults([])
      setOpen(false)
      return
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await searchCity(value)
        setResults(res)
        setOpen(res.length > 0)
      } catch {
        setResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }, [])

  const handleSelect = (result: NominatimResult) => {
    // Build a concise label: city, country
    const parts = result.display_name.split(', ')
    const label = parts.length >= 2 ? `${parts[0]}, ${parts[parts.length - 1]}` : result.display_name
    setQuery(label)
    setOpen(false)
    onSelect({ label, lat: parseFloat(result.lat), lng: parseFloat(result.lon) })
  }

  const handleDetect = () => {
    if (!navigator.geolocation) return
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        try {
          const label = await reverseGeocode(latitude, longitude)
          setQuery(label)
          onSelect({ label, lat: latitude, lng: longitude })
        } catch {
          onSelect({ label: 'My Location', lat: latitude, lng: longitude })
        } finally {
          setDetecting(false)
        }
      },
      () => setDetecting(false),
    )
  }

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full max-w-sm sm:max-w-md mx-auto mb-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Search city..."
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searching && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
              ...
            </span>
          )}
        </div>
        <button
          onClick={handleDetect}
          disabled={detecting}
          title="Use my location"
          className="px-3 py-2.5 rounded-xl border border-gray-200 bg-white shadow-sm hover:bg-blue-50 hover:border-blue-300 transition-colors disabled:opacity-50"
        >
          {detecting ? (
            <svg className="w-5 h-5 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>
      </div>

      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {results.map((r) => (
            <li
              key={r.place_id}
              onMouseDown={() => handleSelect(r)}
              className="px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer truncate"
            >
              {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

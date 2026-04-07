import type { NominatimResult } from '../types'

const NOMINATIM = 'https://nominatim.openstreetmap.org'

export async function searchCity(query: string): Promise<NominatimResult[]> {
  const url = `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en' },
  })
  if (!res.ok) throw new Error('Geocoding search failed')
  return res.json()
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `${NOMINATIM}/reverse?lat=${lat}&lon=${lng}&format=json`
  const res = await fetch(url, {
    headers: { 'Accept-Language': 'en' },
  })
  if (!res.ok) throw new Error('Reverse geocoding failed')
  const data = await res.json()
  const city =
    data.address?.city ??
    data.address?.town ??
    data.address?.village ??
    data.address?.county ??
    'Unknown location'
  const country = data.address?.country ?? ''
  return country ? `${city}, ${country}` : city
}

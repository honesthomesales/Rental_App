'use client'

import { useState } from 'react'
import { MapPin, Loader2 } from 'lucide-react'

interface AddressGeocoderProps {
  address: string
  city: string
  state: string
  zipCode: string
  onCoordinatesFound: (latitude: number, longitude: number) => void
  disabled?: boolean
}

export default function AddressGeocoder({ 
  address, 
  city, 
  state, 
  zipCode, 
  onCoordinatesFound, 
  disabled = false 
}: AddressGeocoderProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const geocodeAddress = async () => {
    if (!address || !city || !state) {
      setError('Please fill in address, city, and state first')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Build the full address
      const fullAddress = `${address}, ${city}, ${state} ${zipCode}`.trim()
      
      // Check if Google Maps API key is available
      const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      if (googleApiKey && googleApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        // Use Google Maps Geocoding API
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${googleApiKey}`
        )

        if (!response.ok) {
          throw new Error('Failed to geocode address')
        }

        const data = await response.json()

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0]
          const location = result.geometry.location
          const latitude = location.lat
          const longitude = location.lng
          
          onCoordinatesFound(latitude, longitude)
          setError(null)
        } else if (data.status === 'ZERO_RESULTS') {
          setError('Address not found. Please check the address and try again.')
        } else if (data.status === 'OVER_QUERY_LIMIT') {
          setError('Geocoding service limit reached. Please try again later.')
        } else {
          setError(`Geocoding error: ${data.status}`)
        }
      } else {
        // Fallback to OpenStreetMap Nominatim API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1&addressdetails=1`
        )

        if (!response.ok) {
          throw new Error('Failed to geocode address')
        }

        const data = await response.json()

        if (data && data.length > 0) {
          const result = data[0]
          const latitude = parseFloat(result.lat)
          const longitude = parseFloat(result.lon)
          
          onCoordinatesFound(latitude, longitude)
          setError(null)
        } else {
          setError('Address not found. Please check the address and try again.')
        }
      }
    } catch (err) {
      console.error('Geocoding error:', err)
      setError('Failed to get coordinates. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={geocodeAddress}
        disabled={disabled || loading || !address || !city || !state}
        className="btn btn-secondary text-sm w-full"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Getting Coordinates...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 mr-2" />
            Get Coordinates from Address (Google Maps)
          </>
        )}
      </button>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      <p className="text-xs text-gray-500">
        Uses Google Maps Geocoding API for high accuracy. Free for up to 40,000 lookups/month.
      </p>
    </div>
  )
} 

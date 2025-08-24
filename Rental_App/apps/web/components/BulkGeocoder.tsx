'use client'

import { useState } from 'react'
import { MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { PropertiesService } from '@rental-app/api'
import type { Property } from '@rental-app/api'
import toast from 'react-hot-toast'

interface BulkGeocoderProps {
  properties: Property[]
  onPropertiesUpdated: () => void
}

export default function BulkGeocoder({ properties, onPropertiesUpdated }: BulkGeocoderProps) {
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<{
    success: number
    failed: number
    skipped: number
    errors: string[]
  }>({ success: 0, failed: 0, skipped: 0, errors: [] })

  const propertiesWithoutCoords = properties.filter(p => !p.latitude || !p.longitude)

  const geocodeProperty = async (property: Property): Promise<{ success: boolean; error?: string }> => {
    if (!property.address || !property.city || !property.state) {
      return { success: false, error: 'Missing address information' }
    }

    try {
      const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code || ''}`.trim()
      
      // Check if Google Maps API key is available
      const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      
      if (googleApiKey && googleApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
        // Use Google Maps Geocoding API
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${googleApiKey}`
        )

        if (!response.ok) {
          return { success: false, error: 'Geocoding service error' }
        }

        const data = await response.json()

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const result = data.results[0]
          const location = result.geometry.location
          const latitude = location.lat
          const longitude = location.lng
          
          // Update the property with coordinates
          const updateResponse = await PropertiesService.update(property.id, {
            latitude,
            longitude
          })

          if (updateResponse.success) {
            return { success: true }
          } else {
            return { success: false, error: 'Failed to update property' }
          }
        } else if (data.status === 'ZERO_RESULTS') {
          return { success: false, error: 'Address not found' }
        } else if (data.status === 'OVER_QUERY_LIMIT') {
          return { success: false, error: 'API quota exceeded' }
        } else {
          return { success: false, error: `Geocoding error: ${data.status}` }
        }
      } else {
        // Fallback to OpenStreetMap Nominatim API
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1&addressdetails=1`
        )

        if (!response.ok) {
          return { success: false, error: 'Geocoding service error' }
        }

        const data = await response.json()

        if (data && data.length > 0) {
          const result = data[0]
          const latitude = parseFloat(result.lat)
          const longitude = parseFloat(result.lon)
          
          // Update the property with coordinates
          const updateResponse = await PropertiesService.update(property.id, {
            latitude,
            longitude
          })

          if (updateResponse.success) {
            return { success: true }
          } else {
            return { success: false, error: 'Failed to update property' }
          }
        } else {
          return { success: false, error: 'Address not found' }
        }
      }
    } catch (err) {
      return { success: false, error: 'Network error' }
    }
  }

  const startBulkGeocoding = async () => {
    if (propertiesWithoutCoords.length === 0) {
      toast('All properties already have coordinates!')
      return
    }

    setLoading(true)
    setProgress(0)
    setResults({ success: 0, failed: 0, skipped: 0, errors: [] })

    const errors: string[] = []

    for (let i = 0; i < propertiesWithoutCoords.length; i++) {
      const property = propertiesWithoutCoords[i]
      setProgress(((i + 1) / propertiesWithoutCoords.length) * 100)

      const result = await geocodeProperty(property)
      
      if (result.success) {
        setResults(prev => ({ ...prev, success: prev.success + 1 }))
      } else {
        setResults(prev => ({ 
          ...prev, 
          failed: prev.failed + 1,
          errors: [...prev.errors, `${property.name}: ${result.error}`]
        }))
      }

      // Add a small delay to be respectful to the geocoding service
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    setLoading(false)
    
    if (results.success > 0) {
      toast.success(`Successfully geocoded ${results.success} properties!`)
      onPropertiesUpdated()
    }
    
    if (results.failed > 0) {
      toast.error(`Failed to geocode ${results.failed} properties`)
    }
  }

  if (propertiesWithoutCoords.length === 0) {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-800 font-medium">All properties have coordinates!</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-blue-900">Bulk Geocoding</h3>
          <span className="text-xs text-blue-600">
            {propertiesWithoutCoords.length} properties need coordinates
          </span>
        </div>
        
        <p className="text-sm text-blue-700 mb-3">
          Automatically convert addresses to coordinates for all properties without location data.
        </p>

        <button
          onClick={startBulkGeocoding}
          disabled={loading}
          className="btn btn-primary text-sm w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Geocoding Properties... ({Math.round(progress)}%)
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              Geocode {propertiesWithoutCoords.length} Properties
            </>
          )}
        </button>

        {loading && (
          <div className="mt-3">
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {!loading && (results.success > 0 || results.failed > 0) && (
          <div className="mt-3 space-y-2">
            <div className="flex items-center text-sm">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-green-700">{results.success} properties updated</span>
            </div>
            {results.failed > 0 && (
              <div className="flex items-center text-sm">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-red-700">{results.failed} properties failed</span>
              </div>
            )}
          </div>
        )}
      </div>

      {results.errors.length > 0 && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
          <h4 className="text-sm font-medium text-red-900 mb-2">Errors:</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {results.errors.map((error, index) => (
              <div key={index} className="text-xs text-red-700">{error}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
} 
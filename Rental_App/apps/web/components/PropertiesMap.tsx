'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  latitude?: number
  longitude?: number
  monthly_rent?: number
  property_type?: string
  status?: string
}

interface PropertiesMapProps {
  properties: Property[]
  height?: string
}

// Create a completely client-side only map component
const ClientOnlyMap = dynamic(() => import('./ClientOnlyMap'), {
  ssr: false,
  loading: () => (
    <div className="bg-gray-100 rounded-lg flex items-center justify-center" style={{ height: '400px' }}>
      <div className="text-center text-gray-500">
        <div className="text-lg font-medium mb-2">Loading Map...</div>
      </div>
    </div>
  )
})

export default function PropertiesMap({ properties, height = '400px' }: PropertiesMapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render anything on server side
  if (!isClient) {
    return (
      <div 
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium mb-2">Loading Map...</div>
        </div>
      </div>
    )
  }

  // Filter properties that have coordinates
  const propertiesWithCoords = properties.filter(p => p.latitude && p.longitude)

  if (propertiesWithCoords.length === 0) {
    return (
      <div 
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center text-gray-500">
          <div className="text-lg font-medium mb-2">No Properties with Location Data</div>
          <div className="text-sm">Add latitude and longitude coordinates to your properties to see them on the map</div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height }}>
      <ClientOnlyMap properties={propertiesWithCoords} />
    </div>
  )
} 
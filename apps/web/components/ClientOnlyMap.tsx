'use client'

import { useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  latitude?: number
  longitude?: number
  // monthly_rent removed - rent data comes from RENT_leases
  property_type?: string
  status?: string
}

interface ClientOnlyMapProps {
  properties: Property[]
}

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

export default function ClientOnlyMap({ properties }: ClientOnlyMapProps) {
  const mapRef = useRef<L.Map>(null)

  // Calculate center point if we have properties with coordinates
  const center = properties.length > 0 
    ? [
        properties.reduce((sum, p) => sum + (p.latitude || 0), 0) / properties.length,
        properties.reduce((sum, p) => sum + (p.longitude || 0), 0) / properties.length
      ]
    : [39.8283, -98.5795] // Default to center of US

  useEffect(() => {
    if (mapRef.current && properties.length > 0) {
      const bounds = L.latLngBounds(properties.map(p => [p.latitude!, p.longitude!]))
      mapRef.current.fitBounds(bounds, { padding: [20, 20] })
    }
  }, [properties])

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={10}
      style={{ height: '100%', width: '100%' }}
      ref={mapRef}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {properties.map((property) => (
        <Marker
          key={property.id}
          position={[property.latitude!, property.longitude!]}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-gray-900 mb-1">{property.name}</h3>
              <p className="text-sm text-gray-600 mb-1">{property.address}</p>
              <p className="text-sm text-gray-600 mb-2">{property.city}, {property.state}</p>
              {/* Rent amount removed - comes from lease data */}
              {property.property_type && (
                <p className="text-xs text-gray-500 capitalize">
                  {property.property_type}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
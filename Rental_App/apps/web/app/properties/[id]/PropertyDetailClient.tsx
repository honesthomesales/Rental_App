'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PropertiesService, type PropertyUI, type Property } from '@rental-app/api'
import { ArrowLeft, Home, MapPin, DollarSign, Calendar, User, Building } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function PropertyDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [property, setProperty] = useState<PropertyUI<Property> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadProperty(id)
    }
  }, [id])

  const loadProperty = async (id: string) => {
    try {
      setLoading(true)
      const response = await PropertiesService.getById(id)
      
      if (response.success && response.data) {
        setProperty(response.data)
      } else {
        toast.error('Property not found')
        router.push('/')
      }
    } catch (error) {
      toast.error('Error loading property')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Property Not Found</h2>
          <button
            onClick={() => router.push('/')}
            className="btn btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Property Details</h1>
          </div>
          <Link
            href={`/properties/${property.id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit Property
          </Link>
        </div>

        {/* Property Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Property Information</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Home className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Address:</span>
                  <span className="font-semibold">{property.address || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">City:</span>
                  <span className="font-semibold">{property.city || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Monthly Rent:</span>
                  <span className="font-semibold">${property.monthly_rent?.toFixed(2) || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Building className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Type:</span>
                  <span className="font-semibold">{property.property_type || 'N/A'}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Details</h2>
              <div className="space-y-3">
                {property.notes && (
                  <div>
                    <span className="text-gray-600">Notes:</span>
                    <p className="text-gray-900 mt-1">{property.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

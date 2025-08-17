'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PropertiesService } from '@rental-app/api'
import type { Property } from '@rental-app/api'
import { Plus, Search, Edit, Trash2, Users, Home, MapPin, Link as LinkIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { TenantLinkModal } from '@/components/TenantLinkModal'
import { extractRentCadence, formatRentWithCadence } from '../../lib/utils'

export default function PropertiesPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showTenantModal, setShowTenantModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const response = await PropertiesService.getAll()
      
      if (response.success && response.data) {
        setProperties(response.data)
      } else {
        console.error('Failed to load properties:', response.error)
        toast.error('Failed to load properties')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error loading properties')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (propertyId: string) => {
    if (!confirm('Are you sure you want to delete this property?')) return

    try {
      const response = await PropertiesService.delete(propertyId)
      
      if (response.success) {
        toast.success('Property deleted successfully')
        loadProperties() // Reload the list
      } else {
        console.error('Delete error:', response.error)
        toast.error('Failed to delete property')
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('Error deleting property')
    }
  }

  const handleOpenTenantModal = (property: Property) => {
    setSelectedProperty(property)
    setShowTenantModal(true)
  }

  const handleCloseTenantModal = () => {
    setShowTenantModal(false)
    setSelectedProperty(null)
  }

  const handleTenantLinkSuccess = () => {
    loadProperties() // Reload properties to update any tenant counts
  }

  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.city.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rented':
        return 'bg-green-100 text-green-800'
      case 'empty':
        return 'bg-gray-100 text-gray-800'
      case 'owner_finance':
        return 'bg-blue-100 text-blue-800'
      case 'lease_purchase':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'rented':
        return 'Rented'
      case 'empty':
        return 'Empty'
      case 'owner_finance':
        return 'Owner Finance'
      case 'lease_purchase':
        return 'Lease Purchase'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Properties</h1>
              <p className="text-gray-600">Manage your rental properties</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Properties</p>
                <p className="text-2xl font-bold text-primary-600">{properties.length}</p>
              </div>
              <button
                onClick={() => router.push('/properties/new')}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="card mb-6">
          <div className="card-content">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length === 0 ? (
          <div className="card">
            <div className="card-content text-center py-12">
              <Home className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No properties found' : 'No properties yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first property'
                }
              </p>
              {!searchTerm && (
                <button
                  onClick={() => router.push('/properties/new')}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <div key={property.id} className="card hover:shadow-lg transition-shadow">
                <div className="card-content">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {property.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <MapPin className="w-4 h-4 mr-1" />
                        {property.city}, {property.state}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                      {getStatusLabel(property.status)}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type:</span>
                      <span className="font-medium capitalize">{property.property_type}</span>
                    </div>
                    {property.bedrooms && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Bedrooms:</span>
                        <span className="font-medium">{property.bedrooms}</span>
                      </div>
                    )}
                    {property.bathrooms && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Bathrooms:</span>
                        <span className="font-medium">{property.bathrooms}</span>
                      </div>
                    )}
                    {property.monthly_rent && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Rent:</span>
                        <span className="font-medium text-green-600">
                          {(() => {
                            const rentCadence = extractRentCadence(property.notes || undefined)
                            return formatRentWithCadence(property.monthly_rent || 0, rentCadence)
                          })()}
                        </span>
                      </div>
                    )}
                    {property.tenants && property.tenants.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center text-sm text-gray-600 mb-2">
                          <Users className="w-4 h-4 mr-1" />
                          <span className="font-medium">Linked Tenants ({property.tenants.length})</span>
                        </div>
                        <div className="space-y-1">
                          {property.tenants.slice(0, 2).map((tenant) => (
                            <div key={tenant.id} className="text-xs text-gray-600">
                              • {tenant.first_name} {tenant.last_name}
                              {tenant.monthly_rent && (
                                <span className="text-green-600 ml-1">
                                  (${tenant.monthly_rent.toLocaleString()}/mo)
                                </span>
                              )}
                            </div>
                          ))}
                          {property.tenants.length > 2 && (
                            <div className="text-xs text-gray-500">
                              +{property.tenants.length - 2} more tenants
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/properties/${property.id}`)}
                      className="btn btn-sm btn-secondary flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleOpenTenantModal(property)}
                      className="btn btn-sm btn-primary"
                    >
                      <LinkIcon className="w-4 h-4 mr-1" />
                      Link Tenants
                    </button>
                    <button
                      onClick={() => handleDelete(property.id)}
                      className="btn btn-sm btn-danger"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tenant Link Modal */}
      {showTenantModal && selectedProperty && (
        <TenantLinkModal
          propertyId={selectedProperty.id}
          propertyName={selectedProperty.name}
          onClose={handleCloseTenantModal}
          onSuccess={handleTenantLinkSuccess}
        />
      )}
    </div>
  )
} 
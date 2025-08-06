'use client'

import { useState, useEffect, useMemo, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { PropertiesService } from '@rental-app/api'
import type { Property } from '@rental-app/api'
import { Plus, Search, Edit, Trash2, Users, Home, MapPin, Link as LinkIcon, Map, List, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { TenantLinkModal } from '@/components/TenantLinkModal'
import { PropertyInfoSheet } from '@/components/PropertyInfoSheet'
import PropertiesMap from '@/components/PropertiesMap'
import BulkGeocoder from '@/components/BulkGeocoder'
import { extractRentCadence, formatRentWithCadence } from '../../lib/utils'

// Loading component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
)

// Property Table Row Component
const PropertyTableRow = ({ property, onDelete, onOpenTenantModal, onOpenInfoSheet, onEdit }: {
  property: Property & { effectiveStatus: string }
  onDelete: (id: string) => void
  onOpenTenantModal: (property: Property) => void
  onOpenInfoSheet: (property: Property) => void
  onEdit: (id: string) => void
}) => {
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

  return (
    <tr key={property.id} className="hover:bg-gray-50">
      <td className="px-6 py-4">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-900 truncate">
            {property.name}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {property.address}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center text-sm text-gray-900">
          <MapPin className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
          <span className="truncate">{property.city}, {property.state}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="text-sm text-gray-900 capitalize">
          {property.property_type || 'N/A'}
        </div>
        {(property.bedrooms || property.bathrooms) && (
          <div className="text-sm text-gray-500">
            {property.bedrooms && `${property.bedrooms} bed`}
            {property.bedrooms && property.bathrooms && ' • '}
            {property.bathrooms && `${property.bathrooms} bath`}
          </div>
        )}
        {property.square_feet && (
          <div className="text-sm text-gray-500">
            {property.square_feet.toLocaleString()} sq ft
          </div>
        )}
      </td>
      <td className="px-6 py-4">
        {property.monthly_rent ? (
          <div className="text-sm font-medium text-green-600">
            {(() => {
              const rentCadence = extractRentCadence(property.notes || undefined)
              return formatRentWithCadence(property.monthly_rent || 0, rentCadence)
            })()}
          </div>
        ) : (
          <div className="text-sm text-gray-500">N/A</div>
        )}
      </td>
      <td className="px-6 py-4">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(property.effectiveStatus)}`}>
          {getStatusLabel(property.effectiveStatus)}
        </span>
      </td>
      <td className="px-6 py-4">
        {(() => {
          if (property.tenants && property.tenants.length > 0) {
            return (
              <div className="space-y-1">
                {property.tenants.map((tenant, index) => (
                  <div key={tenant.id} className="flex items-center text-sm text-gray-900">
                    <Users className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                    <span className="truncate">
                      {tenant.first_name} {tenant.last_name}
                    </span>
                  </div>
                ))}
              </div>
            )
          } else {
            return <div className="text-sm text-gray-500">No tenants</div>
          }
        })()}
      </td>
      <td className="px-6 py-4 text-right text-sm font-medium whitespace-nowrap">
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => onOpenInfoSheet(property)}
            className="bg-purple-100 text-purple-700 px-3 py-2 rounded text-xs hover:bg-purple-200 flex items-center transition-colors"
          >
            <FileText className="w-3 h-3 mr-1" />
            Info
          </button>
          <button
            onClick={() => onEdit(property.id)}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded text-xs hover:bg-gray-200 flex items-center transition-colors"
          >
            <Edit className="w-3 h-3 mr-1" />
            Edit
          </button>
          <button
            onClick={() => onOpenTenantModal(property)}
            className="bg-blue-100 text-blue-700 px-3 py-2 rounded text-xs hover:bg-blue-200 flex items-center transition-colors"
          >
            <LinkIcon className="w-3 h-3 mr-1" />
            Link
          </button>
          <button
            onClick={() => onDelete(property.id)}
            className="bg-red-100 text-red-700 px-3 py-2 rounded text-xs hover:bg-red-200 flex items-center transition-colors"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function PropertiesPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showTenantModal, setShowTenantModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [showInfoSheet, setShowInfoSheet] = useState(false)
  const [selectedInfoProperty, setSelectedInfoProperty] = useState<Property | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')

  // Memoize the loadProperties function
  const loadProperties = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    loadProperties()
  }, [loadProperties])

  // Memoize the delete handler
  const handleDelete = useCallback(async (propertyId: string) => {
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
  }, [loadProperties])

  // Memoize modal handlers
  const handleOpenTenantModal = useCallback((property: Property) => {
    setSelectedProperty(property)
    setShowTenantModal(true)
  }, [])

  const handleCloseTenantModal = useCallback(() => {
    setShowTenantModal(false)
    setSelectedProperty(null)
  }, [])

  const handleTenantLinkSuccess = useCallback(() => {
    loadProperties() // Reload properties to update any tenant counts
  }, [loadProperties])

  const handleOpenInfoSheet = useCallback((property: Property) => {
    setSelectedInfoProperty(property)
    setShowInfoSheet(true)
  }, [])

  const handleCloseInfoSheet = useCallback(() => {
    setShowInfoSheet(false)
    setSelectedInfoProperty(null)
  }, [])

  const handleInfoSheetUpdate = useCallback(() => {
    loadProperties() // Reload properties to get updated data
  }, [loadProperties])

  const handleEdit = useCallback((propertyId: string) => {
    router.push(`/properties/${propertyId}`)
  }, [router])

  // Memoize properties with status calculation
  const propertiesWithStatus = useMemo(() => {
    return properties.map(property => {
      const hasTenants = property.tenants && property.tenants.length > 0;
      const effectiveStatus = hasTenants ? (property.status || 'rented') : 'empty';
      
      return {
        ...property,
        effectiveStatus
      };
    });
  }, [properties]);

  // Memoize filtered and sorted properties
  const filteredProperties = useMemo(() => {
    return propertiesWithStatus
      .filter(property =>
        property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        property.city.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // Sort empty properties to the top
        if (a.effectiveStatus === 'empty' && b.effectiveStatus !== 'empty') return -1;
        if (a.effectiveStatus !== 'empty' && b.effectiveStatus === 'empty') return 1;
        
        // Then sort by name
        return a.name.localeCompare(b.name);
      });
  }, [propertiesWithStatus, searchTerm]);

  // Memoize search handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  // Memoize view mode handler
  const handleViewModeChange = useCallback((mode: 'list' | 'map') => {
    setViewMode(mode)
  }, [])

  if (loading) {
    return <LoadingSpinner />
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
                <p className="text-2xl font-bold text-blue-600">{properties.length}</p>
              </div>
              <button
                onClick={() => router.push('/properties/new')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search, Filters, and View Toggle */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`p-2 rounded-lg border transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 border-blue-300 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleViewModeChange('map')}
                  className={`p-2 rounded-lg border transition-colors ${
                    viewMode === 'map' 
                      ? 'bg-blue-100 border-blue-300 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Map className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Geocoding Tool */}
        <div className="mb-6">
          <BulkGeocoder 
            properties={properties} 
            onPropertiesUpdated={loadProperties}
          />
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="mb-6">
            <Suspense fallback={<div className="h-[500px] bg-gray-100 animate-pulse rounded-lg"></div>}>
              <PropertiesMap properties={filteredProperties} height="500px" />
            </Suspense>
          </div>
        )}

        {/* Properties List */}
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-center py-12">
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
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center mx-auto transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Property
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="overflow-x-auto w-full">
              <table className="w-full min-w-[1400px]">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                      Property
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      Type & Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Rent
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      Tenants
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">
                      
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <Suspense fallback={<tr><td colSpan={7} className="px-6 py-4"><div className="h-16 bg-gray-100 animate-pulse rounded"></div></td></tr>}>
                    {filteredProperties.map((property) => (
                      <PropertyTableRow
                        key={property.id}
                        property={property}
                        onDelete={handleDelete}
                        onOpenTenantModal={handleOpenTenantModal}
                        onOpenInfoSheet={handleOpenInfoSheet}
                        onEdit={handleEdit}
                      />
                    ))}
                  </Suspense>
                </tbody>
              </table>
            </div>
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

      {/* Property Information Sheet */}
      {showInfoSheet && selectedInfoProperty && (
        <PropertyInfoSheet
          property={selectedInfoProperty}
          isOpen={showInfoSheet}
          onClose={handleCloseInfoSheet}
          onUpdate={handleInfoSheetUpdate}
        />
      )}
    </div>
  )
} 
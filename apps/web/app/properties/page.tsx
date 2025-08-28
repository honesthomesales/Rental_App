'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { PropertiesService, TenantsService, LeasesService } from '@rental-app/api'
import type { Property } from '@rental-app/api'
import { Plus, Search, Edit, Trash2, Users, Home, MapPin, Link as LinkIcon, Map, List, Calendar, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { TenantLinkModal } from '@/components/TenantLinkModal'
import PropertiesMap from '@/components/PropertiesMap'
import BulkGeocoder from '@/components/BulkGeocoder'
import { extractRentCadence, formatRentWithCadence } from '../../lib/utils'

export default function PropertiesPage() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showTenantModal, setShowTenantModal] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list')
  
  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'status' | 'rent' | 'address' | 'premium' | 'type'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadProperties()
  }, [])

  const loadProperties = async () => {
    try {
      setLoading(true)
      const response = await PropertiesService.getAll()
      
      if (response.success && response.data) {
        console.log('✅ Properties loaded:', response.data)
        setProperties(response.data)
      } else {
        console.error('❌ Failed to load properties:', response.error)
        toast.error('Failed to load properties')
      }
    } catch (error) {
      console.error('💥 Error loading properties:', error)
      toast.error('Error loading properties')
    } finally {
      setLoading(false)
    }
  }

  // Sort properties based on current sort field and direction
  const sortedProperties = useMemo(() => {
    if (!properties.length) return []
    
    return [...properties].sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortField) {
        case 'name':
          aValue = a.name?.toLowerCase() || ''
          bValue = b.name?.toLowerCase() || ''
          break
        case 'status':
          aValue = a.status?.toLowerCase() || ''
          bValue = b.status?.toLowerCase() || ''
          break
        case 'rent':
          aValue = a.active_leases?.[0]?.rent || a.monthly_rent || 0
          bValue = b.active_leases?.[0]?.rent || b.monthly_rent || 0
          break
        case 'address':
          aValue = a.address?.toLowerCase() || ''
          bValue = b.address?.toLowerCase() || ''
          break
        case 'premium':
          aValue = a.insurance_premium || 0
          bValue = b.insurance_premium || 0
          break
        case 'type':
          aValue = a.property_type?.toLowerCase() || ''
          bValue = b.property_type?.toLowerCase() || ''
          break
        default:
          return 0
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [properties, sortField, sortDirection])

  // Handle sort column click
  const handleSort = (field: 'name' | 'status' | 'rent' | 'address' | 'premium' | 'type') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
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

  const handleMarkVacant = async (property: Property) => {
    if (!confirm('Are you sure you want to mark this property as vacant? This will end all active leases.')) return

    try {
      // If there are active leases, end them by updating their end dates to yesterday and status to 'vacant'
      if (property.active_leases && property.active_leases.length > 0) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const yesterdayStr = yesterday.toISOString().split('T')[0]
        
        for (const lease of property.active_leases) {
          await LeasesService.update(lease.id, {
            lease_end_date: yesterdayStr,
            status: 'vacant'
          })
        }
      }
      
      // Update property status to empty
      await PropertiesService.update(property.id, {
        status: 'empty'
      })

      toast.success('Property marked as vacant successfully')
      
      // Reload properties to reflect the changes
      await loadProperties()
    } catch (error) {
      console.error('Error marking property vacant:', error)
      toast.error('Error marking property vacant')
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
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
              <div className="flex space-x-6">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Properties</p>
                  <p className="text-2xl font-bold text-blue-600">{properties.length}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Rented</p>
                  <p className="text-2xl font-bold text-green-600">{properties.filter(p => p.status === 'rented').length}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Empty</p>
                  <p className="text-2xl font-bold text-gray-600">{properties.filter(p => p.status === 'empty').length}</p>
                </div>
              </div>
              <div className="flex space-x-3">
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
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search, Filters, and View Toggle */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1">
                <div className="flex space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search properties..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="rented">Rented</option>
                    <option value="empty">Empty</option>
                    <option value="owner_finance">Owner Finance</option>
                    <option value="lease_purchase">Lease Purchase</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg border transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-blue-100 border-blue-300 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('map')}
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
            <PropertiesMap properties={sortedProperties.filter(property => {
              if (searchTerm && !property.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
                  !property.address.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false
              }
              if (statusFilter !== 'all' && property.status !== statusFilter) {
                return false
              }
              return true
            })} height="500px" />
          </div>
        )}

        {/* Properties List */}
        {sortedProperties.filter(property => {
          if (searchTerm && !property.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
              !property.address.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false
          }
          if (statusFilter !== 'all' && property.status !== statusFilter) {
            return false
          }
          return true
        }).length === 0 ? (
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
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">
                      Actions
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px] cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Property
                        {sortField === 'name' && (
                          <span className="ml-1 text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('address')}
                    >
                      <div className="flex items-center">
                        Location
                        {sortField === 'address' && (
                          <span className="ml-1 text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px] cursor-pointer hover:bg-gray-100 select-none" onClick={() => handleSort('type')}>
                      <div className="flex items-center">
                        Type & Details
                        {sortField === 'type' && (
                          <span className="ml-1 text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('rent')}
                    >
                      <div className="flex items-center">
                        Rent
                        {sortField === 'rent' && (
                          <span className="ml-1 text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('premium')}
                    >
                      <div className="flex items-center">
                        <Shield className="w-4 h-4 mr-1" />
                        Insurance
                        {sortField === 'premium' && (
                          <span className="ml-1 text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px] cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {sortField === 'status' && (
                          <span className="ml-1 text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      Active Leases
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProperties.filter(property => {
                    if (searchTerm && !property.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
                        !property.address.toLowerCase().includes(searchTerm.toLowerCase())) {
                      return false
                    }
                    if (statusFilter !== 'all' && property.status !== statusFilter) {
                      return false
                    }
                    return true
                  }).map((property) => (
                    <tr 
                      key={property.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onDoubleClick={() => router.push(`/properties/edit/?id=${property.id}`)}
                      title="Double-click to edit property"
                    >
                      <td className="px-3 py-2">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => router.push(`/properties/edit/?id=${property.id}`)}
                            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                            title={`Edit ${property.name}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenTenantModal(property)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
                            title="Link tenant"
                          >
                            <LinkIcon className="w-4 h-4" />
                          </button>

                          {property.status === 'rented' && property.active_lease_count && property.active_lease_count > 0 && (
                            <button
                              onClick={() => handleMarkVacant(property)}
                              className="p-1.5 text-orange-600 hover:text-orange-800 hover:bg-orange-100 rounded transition-colors"
                              title="Mark property as vacant and end lease"
                            >
                              <Home className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                            title="Delete property"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
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
                        {(() => {
                          // Priority 1: Active lease rent (most accurate - tenant is actually paying this)
                          if (property.active_leases && property.active_leases.length > 0) {
                            const activeLease = property.active_leases[0]
                            return (
                              <div className="text-sm font-medium text-green-600">
                                ${activeLease.rent.toLocaleString()}/{activeLease.rent_cadence || 'monthly'}
                                <div className="text-xs text-gray-500">(Lease)</div>
                              </div>
                            )
                          }
                          // Priority 2: Property base monthly rent (fallback when no tenant)
                          else if (property.monthly_rent) {
                            return (
                              <div className="text-sm font-medium text-blue-600">
                                ${property.monthly_rent.toLocaleString()}/month
                                <div className="text-xs text-gray-500">(Base)</div>
                              </div>
                            )
                          }
                          // No active leases or tenants - show $0 to indicate no income
                          else {
                            return (
                              <div className="text-sm font-medium text-red-600">
                                $0/month
                                <div className="text-xs text-gray-500">(No Tenant)</div>
                              </div>
                            )
                          }
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        {property.insurance_premium ? (
                          <div className="text-sm font-medium text-blue-600">
                            ${property.insurance_premium.toLocaleString()}/year
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500">N/A</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(property.status)}`}>
                          {getStatusLabel(property.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {(() => {
                          if (property.active_lease_count && property.active_lease_count > 0) {
                            return (
                              <div className="space-y-1">
                                {property.active_leases?.map((lease, index) => (
                                  <div key={lease.id} className="flex items-center text-sm text-gray-900">
                                    <Calendar className="w-4 h-4 mr-1 text-gray-400 flex-shrink-0" />
                                    <span className="truncate">
                                      ${lease.rent.toLocaleString()} - {new Date(lease.lease_start_date).toLocaleDateString()} to {new Date(lease.lease_end_date).toLocaleDateString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )
                          } else {
                            return <div className="text-sm text-gray-500">No active leases</div>
                          }
                        })()}
                      </td>
                    </tr>
                  ))}
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
    </div>
  )
} 
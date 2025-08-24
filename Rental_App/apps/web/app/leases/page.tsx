'use client'

import { useState, useEffect } from 'react'
import { LeasesService, TenantsService, PropertiesService } from '@rental-app/api'
import type { Lease, Tenant, Property } from '@rental-app/api'
import { Plus, Search, Edit, Trash2, Calendar, DollarSign, Home, User } from 'lucide-react'
import toast from 'react-hot-toast'

interface LeaseWithDetails extends Lease {
  tenant?: Tenant;
  property?: Property;
}

export default function LeasesPage() {
  const [leases, setLeases] = useState<LeaseWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingLease, setEditingLease] = useState<Lease | null>(null)

  useEffect(() => {
    loadLeases()
  }, [])

  const loadLeases = async () => {
    try {
      setLoading(true)
      console.log('🔄 Loading leases...')
      
      const response = await LeasesService.getAll()
      
      if (response.success && response.data) {
        console.log('✅ Leases loaded successfully')
        console.log('📋 Total leases:', response.data.length)
        
        // Fetch tenant and property details for each lease
        const leasesWithDetails = await Promise.all(
          response.data.map(async (lease) => {
            const [tenantResponse, propertyResponse] = await Promise.all([
              TenantsService.getById(lease.tenant_id),
              PropertiesService.getById(lease.property_id)
            ])
            
            return {
              ...lease,
              tenant: tenantResponse.success && tenantResponse.data ? tenantResponse.data : undefined,
              property: propertyResponse.success && propertyResponse.data ? propertyResponse.data : undefined
            }
          })
        )
        
        setLeases(leasesWithDetails)
        console.log('📋 Leases with details:', leasesWithDetails.length)
      } else {
        console.error('❌ Failed to load leases:', response.error)
        toast.error('Failed to load leases')
      }
    } catch (error) {
      console.error('Error loading leases:', error)
      toast.error('Error loading leases')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const isLeaseActive = (lease: Lease) => {
    const today = new Date()
    const startDate = new Date(lease.lease_start_date)
    const endDate = new Date(lease.lease_end_date)
    return today >= startDate && today <= endDate
  }

  const filteredLeases = leases.filter(lease => {
    const matchesSearch = 
      lease.tenant?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.tenant?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.property?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lease.property?.address?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || lease.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const activeLeasesCount = leases.filter(lease => isLeaseActive(lease)).length
  const pendingLeasesCount = leases.filter(lease => lease.status === 'pending').length
  const expiredLeasesCount = leases.filter(lease => lease.status === 'expired').length

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leases</h1>
          <p className="text-gray-600 mt-2">Manage property leases and rental agreements</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Lease
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Leases</p>
              <p className="text-2xl font-bold text-gray-900">{leases.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Home className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{activeLeasesCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingLeasesCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Expired</p>
              <p className="text-2xl font-bold text-gray-900">{expiredLeasesCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by tenant name or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="w-full md:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leases Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading leases...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lease Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeases.map((lease) => (
                  <tr key={lease.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lease.tenant ? `${lease.tenant.first_name} ${lease.tenant.last_name}` : 'Unknown Tenant'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Email: N/A
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Home className="w-5 h-5 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lease.property?.name || 'Unknown Property'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lease.property?.address || 'No address'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDate(lease.lease_start_date)} - {formatDate(lease.lease_end_date)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {isLeaseActive(lease) ? 'Currently Active' : 'Not Active'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm font-medium text-gray-900">
                          ${lease.rent.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {lease.rent_cadence}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lease.status)}`}>
                        {lease.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditingLease(lease)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this lease?')) {
                            // Handle delete
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {!loading && filteredLeases.length === 0 && (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No leases found</p>
            <p className="text-sm text-gray-500 mt-2">
              {searchTerm || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Create your first lease to get started'}
            </p>
          </div>
        )}
      </div>

      {/* TODO: Add Create/Edit Lease Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Lease</h3>
            <p className="text-gray-600 mb-4">Lease creation modal coming soon...</p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

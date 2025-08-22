'use client'

import { useState, useEffect } from 'react'
import { TenantsService } from '@rental-app/api'
import type { Tenant } from '@rental-app/api'
import { Plus, Search, Edit, Trash2, Users, Phone, Mail, Calendar, DollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  useEffect(() => {
    loadTenants()
  }, [])

  const loadTenants = async () => {
    try {
      setLoading(true)
      const response = await TenantsService.getAll()
      
      if (response.success && response.data) {
        setTenants(response.data)
      } else {
        toast.error('Failed to load tenants')
      }
    } catch (error) {
      toast.error('Error loading tenants')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (tenantId: string) => {
    if (!confirm('Are you sure you want to delete this tenant?')) return

    try {
      const response = await TenantsService.delete(tenantId)
      
      if (response.success) {
        toast.success('Tenant deleted successfully')
        loadTenants() // Reload the list
      } else {
        toast.error(response.error || 'Failed to delete tenant')
      }
    } catch (error) {
      toast.error('Error deleting tenant')
    }
  }

  const filteredTenants = tenants.filter(tenant =>
    tenant.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tenant.phone?.includes(searchTerm)
  )

  const getLateStatusColor = (status: string) => {
    switch (status) {
      case 'on_time':
        return 'bg-green-100 text-green-800'
      case 'late_5_days':
        return 'bg-yellow-100 text-yellow-800'
      case 'late_10_days':
        return 'bg-orange-100 text-orange-800'
      case 'eviction_notice':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getLateStatusLabel = (status: string) => {
    switch (status) {
      case 'on_time':
        return 'On Time'
      case 'late_5_days':
        return '5 Days Late'
      case 'late_10_days':
        return '10 Days Late'
      case 'eviction_notice':
        return 'Eviction Notice'
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
              <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
              <p className="text-gray-600">Manage your rental tenants</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Tenants</p>
                <p className="text-2xl font-bold text-primary-600">{tenants.length}</p>
              </div>
              
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid View
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List View
                </button>
              </div>
              
              <Link
                href="/tenants/new"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Tenant
              </Link>
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
                    placeholder="Search tenants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tenants Display */}
        {filteredTenants.length === 0 ? (
          <div className="card">
            <div className="card-content text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No tenants found' : 'No tenants yet'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Get started by adding your first tenant'
                }
              </p>
              {!searchTerm && (
                <Link href="/tenants/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tenant
                </Link>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTenants.map((tenant) => (
                  <div key={tenant.id} className="card hover:shadow-lg transition-shadow">
                    <div className="card-content">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            {tenant.first_name} {tenant.last_name}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLateStatusColor(tenant.late_status)}`}>
                              {getLateStatusLabel(tenant.late_status)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mb-4">
                        {tenant.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {tenant.phone}
                          </div>
                        )}
                        {tenant.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            {tenant.email}
                          </div>
                        )}
                        {tenant.properties && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Property:</span> {tenant.properties.name}
                          </div>
                        )}
                        {tenant.leases && tenant.leases.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Rent:</span> ${tenant.leases[0].rent.toLocaleString()}/month
                          </div>
                        )}
                        {tenant.leases && tenant.leases.length > 0 && tenant.leases[0].lease_start_date && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Lease Start:</span> {new Date(tenant.leases[0].lease_start_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Link
                          href={`/tenants/${tenant.id}`}
                          className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 flex items-center flex-1 justify-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(tenant.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 flex items-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tenant
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contact
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Property
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rent
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredTenants.map((tenant) => (
                        <tr key={tenant.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {tenant.first_name} {tenant.last_name}
                              </div>
                              {tenant.leases && tenant.leases.length > 0 && tenant.leases[0].lease_start_date && (
                                <div className="text-xs text-gray-500">
                                  Since: {new Date(tenant.leases[0].lease_start_date).toLocaleDateString()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm text-gray-900 space-y-1">
                              {tenant.phone && (
                                <div className="flex items-center">
                                  <Phone className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                                  <span className="truncate max-w-32">{tenant.phone}</span>
                                </div>
                              )}
                              {tenant.email && (
                                <div className="flex items-center">
                                  <Mail className="w-4 h-4 mr-2 text-gray-400 flex-shrink-0" />
                                  <span className="truncate max-w-40">{tenant.email}</span>
                                </div>
                              )}
                              {!tenant.phone && !tenant.email && (
                                <span className="text-gray-500">No contact info</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            <div className="truncate max-w-32">
                              {tenant.properties?.name || 'No property assigned'}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-900">
                            {tenant.leases && tenant.leases.length > 0 
                              ? `$${tenant.leases[0].rent.toLocaleString()}/month` 
                              : tenant.monthly_rent 
                                ? `$${tenant.monthly_rent.toLocaleString()}/month` 
                                : 'Not set'}
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLateStatusColor(tenant.late_status)}`}>
                              {getLateStatusLabel(tenant.late_status)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-sm font-medium">
                            <div className="flex space-x-2">
                              <Link
                                href={`/tenants/${tenant.id}`}
                                className="text-blue-600 hover:text-blue-900 flex items-center"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Edit
                              </Link>
                              <button
                                onClick={() => handleDelete(tenant.id)}
                                className="text-red-600 hover:text-red-900 flex items-center"
                              >
                                <Trash2 className="w-4 h-4 mr-1" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 
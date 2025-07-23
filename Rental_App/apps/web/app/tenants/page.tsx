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
              <Link
                href="/tenants/new"
                className="btn btn-primary"
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

        {/* Tenants Grid */}
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
                <Link href="/tenants/new" className="btn btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tenant
                </Link>
              )}
            </div>
          </div>
        ) : (
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
                    {tenant.monthly_rent && (
                      <div className="flex items-center text-sm text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        ${tenant.monthly_rent.toLocaleString()}/month
                      </div>
                    )}
                    {tenant.move_in_date && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        Moved in: {new Date(tenant.move_in_date).toLocaleDateString()}
                      </div>
                    )}
                    {tenant.properties && (
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Property:</span> {tenant.properties.name}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Link
                      href={`/tenants/${tenant.id}`}
                      className="btn btn-sm btn-secondary flex-1"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(tenant.id)}
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
    </div>
  )
} 
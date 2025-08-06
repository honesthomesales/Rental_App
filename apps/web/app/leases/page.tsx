'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Eye, Search, Filter } from 'lucide-react'
import toast from 'react-hot-toast'
import { TenantsService, LeasesService } from '@rental-app/api'
import { LeaseModal } from '@/components/LeaseModal'
import { ConfirmDialog } from '@/components/ConfirmDialog'

interface Lease {
  id: string
  tenant_id: string
  property_id: string
  lease_start_date: string
  lease_end_date: string
  rent: number
  rent_cadence: string
  move_in_fee: number
  late_fee_amount: number
  lease_pdf_url?: string
  status: string
  notes?: string
  created_at: string
  updated_at: string
  tenant?: {
    first_name: string
    last_name: string
    email?: string
  }
  property?: {
    name: string
    address: string
  }
}

export default function LeasesPage() {
  const [leases, setLeases] = useState<Lease[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingLease, setEditingLease] = useState<Lease | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletingLease, setDeletingLease] = useState<Lease | null>(null)

  useEffect(() => {
    loadLeases()
  }, [])

  const loadLeases = async () => {
    try {
      setLoading(true)
      // Use TenantsService to get all tenants with their lease information
      const response = await TenantsService.getAll()
      if (response.success && response.data) {
        console.log('Tenants data:', response.data)
        
        // Transform tenant data to lease format
        const leaseData = response.data
          .filter(tenant => tenant.leases && tenant.leases.length > 0)
          .flatMap(tenant => 
            tenant.leases!.map(lease => ({
              ...lease,
              tenant: {
                id: tenant.id,
                first_name: tenant.first_name,
                last_name: tenant.last_name,
                email: tenant.email,
                phone: tenant.phone
              },
              property: tenant.properties
            }))
          )
        
        console.log('Transformed lease data:', leaseData)
        setLeases(leaseData)
      } else {
        console.error('Failed to load tenants:', response.error)
        toast.error('Failed to load leases')
      }
    } catch (error) {
      console.error('Error loading leases:', error)
      toast.error('Error loading leases')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLease = () => {
    setEditingLease(null)
    setShowModal(true)
  }

  const handleEditLease = (lease: Lease) => {
    setEditingLease(lease)
    setShowModal(true)
  }

  const handleDeleteLease = (lease: Lease) => {
    setDeletingLease(lease)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingLease) return

    try {
      const response = await LeasesService.delete(deletingLease.id)
      
      if (response.success) {
        toast.success('Lease deleted successfully')
        loadLeases() // Reload the list
      } else {
        console.error('Delete error:', response.error)
        toast.error('Failed to delete lease')
      }
    } catch (error) {
      console.error('Error deleting lease:', error)
      toast.error('Error deleting lease')
    } finally {
      setShowDeleteDialog(false)
      setDeletingLease(null)
    }
  }

  const handleModalClose = () => {
    setShowModal(false)
    setEditingLease(null)
  }

  const handleModalSave = async () => {
    await loadLeases()
    handleModalClose()
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'expired':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'terminated':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active'
      case 'expired':
        return 'Expired'
      case 'pending':
        return 'Pending'
      case 'terminated':
        return 'Terminated'
      default:
        return status
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
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
              <h1 className="text-3xl font-bold text-gray-900">Leases</h1>
              <p className="text-gray-600">Manage rental leases and agreements</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Leases</p>
                <p className="text-2xl font-bold text-primary-600">{leases.length}</p>
              </div>
              <button
                onClick={handleCreateLease}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>New Lease</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by tenant name, property name, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredLeases.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leases found</h3>
            <p className="text-gray-500 mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first lease agreement.'
              }
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <button
                onClick={handleCreateLease}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
              >
                Create First Lease
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Tenant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Rent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-1/6">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeases.map((lease) => (
                    <tr key={lease.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lease.tenant?.first_name && lease.tenant?.last_name 
                              ? `${lease.tenant.first_name} ${lease.tenant.last_name}`
                              : 'No tenant assigned'
                            }
                          </div>
                          {lease.tenant?.email && (
                            <div className="text-sm text-gray-500">{lease.tenant.email}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lease.property?.name || 'No property assigned'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {lease.property?.address || ''}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatCurrency(lease.rent)}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {lease.rent_cadence}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(lease.lease_start_date)}
                        </div>
                        <div className="text-sm text-gray-500">
                          to {formatDate(lease.lease_end_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(lease.status)}`}>
                          {getStatusLabel(lease.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleEditLease(lease)}
                            className="text-primary-600 hover:text-primary-900 p-1 rounded hover:bg-gray-100"
                            title="Edit lease"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLease(lease)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-gray-100"
                            title="Delete lease"
                          >
                            <Trash2 className="h-4 w-4" />
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
      </div>

      {/* Lease Modal */}
      {showModal && (
        <LeaseModal
          lease={editingLease}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Lease"
        message={`Are you sure you want to delete the lease for ${deletingLease?.tenant?.first_name} ${deletingLease?.tenant?.last_name}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </div>
  )
} 
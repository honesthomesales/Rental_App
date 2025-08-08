'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TenantsService, PropertiesService } from '@rental-app/api'
import type { Tenant, Property } from '@rental-app/api'
import { ArrowLeft, Edit, Save, X, Phone, Mail, Calendar, DollarSign, MapPin, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function TenantDetailClient({ tenantId }: { tenantId: string }) {
  const router = useRouter()

  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Partial<Tenant>>({})

  useEffect(() => {
    if (tenantId) {
      loadTenant()
      loadProperties()
    } else {
      router.push('/tenants')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId])

  const loadTenant = async () => {
    try {
      setLoading(true)
      const response = await TenantsService.getById(tenantId)
      if (response.success && response.data) {
        setTenant(response.data)
        setFormData(response.data)
      } else {
        toast.error('Failed to load tenant')
        router.push('/tenants')
      }
    } catch (error) {
      toast.error('Error loading tenant')
      router.push('/tenants')
    } finally {
      setLoading(false)
    }
  }

  const loadProperties = async () => {
    try {
      const response = await PropertiesService.getAll()
      if (response.success && response.data) {
        setProperties(response.data)
      }
    } catch (error) {
      console.error('Error loading properties:', error)
    }
  }

  const handleSave = async () => {
    try {
      if (!tenant) return
      const { id, ...updateData } = formData
      const response = await TenantsService.update(tenant.id, updateData)
      if (response.success && response.data) {
        setTenant(response.data)
        setFormData(response.data)
        setEditing(false)
        toast.success('Tenant updated successfully')
      } else {
        toast.error(response.error || 'Failed to update tenant')
      }
    } catch (error) {
      toast.error('Error updating tenant')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this tenant?')) return
    try {
      const response = await TenantsService.delete(tenantId)
      if (response.success) {
        toast.success('Tenant deleted successfully')
        router.push('/tenants')
      } else {
        toast.error(response.error || 'Failed to delete tenant')
      }
    } catch (error) {
      toast.error('Error deleting tenant')
    }
  }

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

  if (!tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Tenant not found</h1>
          <button
            onClick={() => router.push('/tenants')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Tenants
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/tenants')}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Tenants
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              {tenant.first_name} {tenant.last_name}
            </h1>
          </div>
          <div className="flex space-x-3">
            {editing ? (
              <>
                <button onClick={handleSave} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </button>
                <button onClick={() => { setEditing(false); setFormData(tenant) }} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </button>
                <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                  Delete
                </button>
              </>
            )}
          </div>
        </div>
        <div className="mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getLateStatusColor(tenant.late_status)}`}>
            {getLateStatusLabel(tenant.late_status)}
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  {editing ? (
                    <input type="text" value={formData.first_name || ''} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <p className="text-gray-900">{tenant.first_name}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  {editing ? (
                    <input type="text" value={formData.last_name || ''} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <p className="text-gray-900">{tenant.last_name}</p>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                {editing ? (
                  <input type="email" value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <div className="flex items-center text-gray-900">
                    <Mail className="w-4 h-4 mr-2" />
                    {tenant.email || 'No email provided'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                {editing ? (
                  <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                ) : (
                  <div className="flex items-center text-gray-900">
                    <Phone className="w-4 h-4 mr-2" />
                    {tenant.phone || 'No phone provided'}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                {editing ? (
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Name" value={formData.emergency_contact_name || ''} onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    <input type="tel" placeholder="Phone" value={formData.emergency_contact_phone || ''} onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ) : (
                  <div className="text-gray-900">
                    {tenant.emergency_contact_name && tenant.emergency_contact_phone ? (
                      <div>
                        <p>{tenant.emergency_contact_name}</p>
                        <p className="text-gray-600">{tenant.emergency_contact_phone}</p>
                      </div>
                    ) : (
                      'No emergency contact provided'
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Lease Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
                {editing ? (
                  <select value={formData.property_id || ''} onChange={(e) => setFormData({ ...formData, property_id: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select a property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.name} - {property.address}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center text-gray-900">
                    <MapPin className="w-4 h-4 mr-2" />
                    {tenant.properties ? (
                      <span>{tenant.properties.name} - {tenant.properties.address}</span>
                    ) : (
                      'No property assigned'
                    )}
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease Start Date</label>
                  {editing ? (
                    <input type="date" value={formData.lease_start_date || ''} onChange={(e) => setFormData({ ...formData, lease_start_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <div className="flex items-center text-gray-900">
                      <Calendar className="w-4 h-4 mr-2" />
                      {tenant.lease_start_date ? new Date(tenant.lease_start_date).toLocaleDateString() : 'Not set'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lease End Date</label>
                  {editing ? (
                    <input type="date" value={formData.lease_end_date || ''} onChange={(e) => setFormData({ ...formData, lease_end_date: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <div className="flex items-center text-gray-900">
                      <Calendar className="w-4 h-4 mr-2" />
                      {tenant.lease_end_date ? new Date(tenant.lease_end_date).toLocaleDateString() : 'Not set'}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent</label>
                  {editing ? (
                    <input type="number" step="0.01" value={formData.monthly_rent || ''} onChange={(e) => setFormData({ ...formData, monthly_rent: parseFloat(e.target.value) || undefined })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <div className="flex items-center text-gray-900">
                      <DollarSign className="w-4 h-4 mr-2" />
                      {tenant.monthly_rent ? `$${tenant.monthly_rent.toLocaleString()}` : 'Not set'}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text.sm font-medium text-gray-700 mb-1">Security Deposit</label>
                  {editing ? (
                    <input type="number" step="0.01" value={formData.security_deposit || ''} onChange={(e) => setFormData({ ...formData, security_deposit: parseFloat(e.target.value) || undefined })} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  ) : (
                    <div className="flex items-center text-gray-900">
                      <DollarSign className="w-4 h-4 mr-2" />
                      {tenant.security_deposit ? `$${tenant.security_deposit.toLocaleString()}` : 'Not set'}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lease Document</label>
                {tenant.lease_pdf_url ? (
                  <div className="flex items-center text-blue-600 hover:text-blue-800">
                    <FileText className="w-4 h-4 mr-2" />
                    <a href={tenant.lease_pdf_url} target="_blank" rel="noopener noreferrer">View Lease Document</a>
                  </div>
                ) : (
                  <p className="text-gray-500">No lease document uploaded</p>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Late Fees Owed</label>
              <div className="flex items-center text-gray-900">
                <DollarSign className="w-4 h-4 mr-2" />
                ${(tenant.late_fees_owed || 0).toLocaleString()}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Payment Date</label>
              <div className="flex items-center text-gray-900">
                <Calendar className="w-4 h-4 mr-2" />
                {tenant.last_payment_date ? new Date(tenant.last_payment_date).toLocaleDateString() : 'No payments yet'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Active Status</label>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tenant.is_active === true ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {tenant.is_active === true ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            {editing ? (
              <textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add any additional notes..." />
            ) : (
              <p className="text-gray-900">{tenant.notes || 'No notes available'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



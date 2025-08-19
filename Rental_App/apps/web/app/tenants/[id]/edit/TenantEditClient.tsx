'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TenantsService, type TenantUI, type Tenant } from '@rental-app/api'
import { ArrowLeft, Save, User, Phone, Mail, Calendar, MapPin, Building } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function TenantEditClient({ id }: { id: string }) {
  const router = useRouter()
  const [tenant, setTenant] = useState<TenantUI<Tenant> | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    move_in_date: '',
    notes: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  })

  useEffect(() => {
    if (id) {
      loadTenant(id)
    }
  }, [id])

  const loadTenant = async (id: string) => {
    try {
      setLoading(true)
      const response = await TenantsService.getById(id)
      
      if (response.success && response.data) {
        const tenantData = response.data
        setTenant(tenantData)
        setFormData({
          first_name: tenantData.first_name || '',
          last_name: tenantData.last_name || '',
          phone: tenantData.phone || '',
          email: tenantData.email || '',
          move_in_date: tenantData.move_in_date ? tenantData.move_in_date.split('T')[0] : '',
          notes: tenantData.notes || '',
          emergency_contact_name: tenantData.emergency_contact_name || '',
          emergency_contact_phone: tenantData.emergency_contact_phone || ''
        })
      } else {
        toast.error('Tenant not found')
        router.push('/tenants')
      }
    } catch (error) {
      toast.error('Error loading tenant')
      router.push('/tenants')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSaving(true)
      const updateData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        email: formData.email,
        move_in_date: formData.move_in_date,
        notes: formData.notes,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone
      }

      const response = await TenantsService.update(id, updateData)
      
      if (response.success) {
        toast.success('Tenant updated successfully')
        router.push(`/tenants/${id}`)
      } else {
        toast.error('Failed to update tenant')
      }
    } catch (error) {
      toast.error('Error updating tenant')
    } finally {
      setSaving(false)
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tenant Not Found</h2>
          <button
            onClick={() => router.push('/tenants')}
            className="btn btn-primary"
          >
            Back to Tenants
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
              href={`/tenants/${id}`}
              className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tenant
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Edit Tenant</h1>
          </div>
        </div>

        {/* Edit Form */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Move-in Date
                </label>
                <input
                  type="date"
                  name="move_in_date"
                  value={formData.move_in_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="flex justify-end space-x-4">
              <Link
                href={`/tenants/${id}`}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TenantsService, type TenantUI, type Tenant } from '@rental-app/api'
import { ArrowLeft, User, Phone, Mail, Calendar, MapPin, Building, Edit } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function TenantDetailClient({ id }: { id: string }) {
  const router = useRouter()
  const [tenant, setTenant] = useState<TenantUI<Tenant> | null>(null)
  const [loading, setLoading] = useState(true)

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
        setTenant(response.data)
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
              href="/tenants"
              className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-md border border-gray-300 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Tenants
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Tenant Details</h1>
          </div>
          <Link
            href={`/tenants/edit-${tenant.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Tenant
          </Link>
        </div>

        {/* Tenant Details */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Name:</span>
                  <span className="font-semibold">{tenant.first_name} {tenant.last_name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-semibold">{tenant.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold">{tenant.email || 'N/A'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">Move-in Date:</span>
                  <span className="font-semibold">
                    {tenant.move_in_date ? new Date(tenant.move_in_date).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Details</h2>
              <div className="space-y-3">
                {tenant.notes && (
                  <div>
                    <span className="text-gray-600">Notes:</span>
                    <p className="text-gray-900 mt-1">{tenant.notes}</p>
                  </div>
                )}
                {tenant.emergency_contact_name && (
                  <div>
                    <span className="text-gray-600">Emergency Contact:</span>
                    <p className="text-gray-900 mt-1">{tenant.emergency_contact_name}</p>
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

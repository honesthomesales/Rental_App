'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { TenantsService } from '@rental-app/api'
import type { Tenant } from '@rental-app/api'
import { TenantForm } from '@/components/TenantForm'
import toast from 'react-hot-toast'

export default function EditTenantPage() {
  const params = useParams()
  const router = useRouter()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      loadTenant(params.id as string)
    }
  }, [params.id])

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

  const handleSuccess = (updatedTenant: Tenant) => {
    toast.success('Tenant updated successfully!')
    router.push(`/tenants`)
  }

  const handleCancel = () => {
    if (tenant) {
      router.push(`/tenants`)
    } else {
      router.push('/tenants')
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
    <TenantForm
      tenant={tenant}
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
} 
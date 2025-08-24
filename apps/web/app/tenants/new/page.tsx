'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Tenant } from '@rental-app/api'
import { TenantForm } from '@/components/TenantForm'
import toast from 'react-hot-toast'

export default function NewTenantPage() {
  const router = useRouter()

  const handleSuccess = (newTenant: Tenant) => {
    toast.success('Tenant created successfully!')
    router.push(`/tenants`)
  }

  const handleCancel = () => {
    router.push('/tenants')
  }

  return (
    <TenantForm
      onSuccess={handleSuccess}
      onCancel={handleCancel}
    />
  )
} 
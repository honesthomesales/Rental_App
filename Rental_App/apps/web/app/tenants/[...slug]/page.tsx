'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TenantEditClient from '../[id]/edit/TenantEditClient'

export default function TenantCatchAllPage({ params }: { params: { slug: string[] } }) {
  const router = useRouter()
  const [isValidRoute, setIsValidRoute] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tenantId, setTenantId] = useState<string | null>(null)

  useEffect(() => {
    if (params.slug && params.slug.length >= 2) {
      const [id, action] = params.slug
      
      // Check if this is an edit route
      if (action === 'edit' && id && !id.startsWith('example-id')) {
        setTenantId(id)
        setIsValidRoute(true)
      } else {
        // Invalid route, redirect to tenants page
        router.push('/tenants')
      }
    } else {
      // Invalid route, redirect to tenants page
      router.push('/tenants')
    }
    setLoading(false)
  }, [params.slug, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tenant editor...</p>
        </div>
      </div>
    )
  }

  if (!isValidRoute || !tenantId) {
    return null // Will redirect
  }

  return <TenantEditClient id={tenantId} />
}

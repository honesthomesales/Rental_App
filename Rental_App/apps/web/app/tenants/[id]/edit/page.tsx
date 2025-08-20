'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import TenantEditClient from './TenantEditClient'

export default function TenantEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isValidId, setIsValidId] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if this is a valid tenant ID
    // For now, accept any ID that's not an example ID
    if (params.id && !params.id.startsWith('example-id')) {
      setIsValidId(true)
    } else {
      // Redirect to tenants page for invalid IDs
      router.push('/tenants')
    }
    setLoading(false)
  }, [params.id, router])

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

  if (!isValidId) {
    return null // Will redirect
  }

  return <TenantEditClient id={params.id} />
}

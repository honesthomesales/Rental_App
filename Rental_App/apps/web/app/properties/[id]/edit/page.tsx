'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PropertyEditClient from './PropertyEditClient'

export default function PropertyEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isValidId, setIsValidId] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if this is a valid property ID
    // For now, accept any ID that's not an example ID
    if (params.id && !params.id.startsWith('example-id')) {
      setIsValidId(true)
    } else {
      // Redirect to properties page for invalid IDs
      router.push('/properties')
    }
    setLoading(false)
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading property editor...</p>
        </div>
      </div>
    )
  }

  if (!isValidId) {
    return null // Will redirect
  }

  return <PropertyEditClient id={params.id} />
}

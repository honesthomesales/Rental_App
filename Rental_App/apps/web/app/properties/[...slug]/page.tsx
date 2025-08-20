'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import PropertyEditClient from '../[id]/edit/PropertyEditClient'

export default function PropertyCatchAllPage({ params }: { params: { slug: string[] } }) {
  const router = useRouter()
  const [isValidRoute, setIsValidRoute] = useState(false)
  const [loading, setLoading] = useState(true)
  const [propertyId, setPropertyId] = useState<string | null>(null)

  useEffect(() => {
    if (params.slug && params.slug.length >= 2) {
      const [id, action] = params.slug
      
      // Check if this is an edit route
      if (action === 'edit' && id && !id.startsWith('example-id')) {
        setPropertyId(id)
        setIsValidRoute(true)
      } else {
        // Invalid route, redirect to properties page
        router.push('/properties')
      }
    } else {
      // Invalid route, redirect to properties page
      router.push('/properties')
    }
    setLoading(false)
  }, [params.slug, router])

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

  if (!isValidRoute || !propertyId) {
    return null // Will redirect
  }

  return <PropertyEditClient id={propertyId} />
}

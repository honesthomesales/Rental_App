'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import PropertyEditClient from './properties/[id]/edit/PropertyEditClient'
import TenantEditClient from './tenants/[id]/edit/TenantEditClient'

export default function NotFound() {
  const router = useRouter()
  const pathname = usePathname()
  const [component, setComponent] = useState<React.ReactNode>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Parse the path to determine what component to render
    const pathParts = pathname?.split('/').filter(Boolean) || []
    
    if (pathParts.length >= 3) {
      const [section, id, action] = pathParts
      
      if (action === 'edit') {
        if (section === 'properties' && id) {
          setComponent(<PropertyEditClient id={id} />)
        } else if (section === 'tenants' && id) {
          setComponent(<TenantEditClient id={id} />)
        } else {
          // Invalid route, redirect to home
          router.push('/')
        }
      } else {
        // Not an edit route, redirect to home
        router.push('/')
      }
    } else {
      // Invalid route, redirect to home
      router.push('/')
    }
    
    setLoading(false)
  }, [pathname, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (component) {
    return component
  }

  // Default 404 content
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go Home
        </button>
      </div>
    </div>
  )
}

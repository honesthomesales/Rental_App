import { Suspense } from 'react'
import { TenantDetailClient } from './TenantDetailClient'

export async function generateStaticParams() {
  // For static export, we need to provide some fallback IDs
  // In a real app, you might fetch these from your database
  return [
    // Example IDs for development/testing
    { id: 'example-tenant-1' },
    { id: 'example-tenant-2' },
    { id: 'new-tenant' },
    { id: 'demo-tenant' },
    { id: 'test-tenant' },
    
    // Common UUID patterns that might be used
    { id: '00000000-0000-0000-0000-000000000000' },
    { id: '11111111-1111-1111-1111-111111111111' },
    { id: '22222222-2222-2222-2222-222222222222' },
    { id: '33333333-3333-3333-3333-333333333333' },
    { id: '44444444-4444-4444-4444-444444444444' }
  ]
}

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TenantDetailClient id={params.id} />
    </Suspense>
  )
} 
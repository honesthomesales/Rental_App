import { Suspense } from 'react'
import { PropertyDetailClient } from './PropertyDetailClient'

export async function generateStaticParams() {
  // For static export, we need to provide some fallback IDs
  // In a real app, you might fetch these from your database
  // We'll provide a comprehensive set of IDs to cover common scenarios
  return [
    // Example IDs for development/testing
    { id: 'example-property-1' },
    { id: 'example-property-2' },
    { id: 'new-property' },
    { id: 'demo-property' },
    { id: 'test-property' },
    
    // Common UUID patterns that might be used
    { id: '00000000-0000-0000-0000-000000000000' },
    { id: '11111111-1111-1111-1111-111111111111' },
    { id: '22222222-2222-2222-2222-222222222222' },
    { id: '33333333-3333-3333-3333-333333333333' },
    { id: '44444444-4444-4444-4444-444444444444' },
    { id: '55555555-5555-5555-5555-555555555555' },
    { id: '66666666-6666-6666-6666-666666666666' },
    { id: '77777777-7777-7777-7777-777777777777' },
    { id: '88888888-8888-8888-8888-888888888888' },
    { id: '99999999-9999-9999-9999-999999999999' },
    
    // Add the specific ID that was causing the error
    { id: 'e2e9451a-2912-4f32-817c-64a4d4ad7621' }
  ]
}

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertyDetailClient id={params.id} />
    </Suspense>
  )
} 

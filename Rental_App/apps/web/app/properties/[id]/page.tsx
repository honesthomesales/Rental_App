import { Suspense } from 'react'
import PropertyDetailClient from './PropertyDetailClient'

// Ensure static export works for this dynamic segment
export const dynamicParams = false;

export async function generateStaticParams() {
  // Provide at least one concrete param so Next can statically export this route.
  // Use 'example-id' unless the file already imports or expects a different param shape.
  return [{ id: 'example-id' }];
}

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertyDetailClient id={params.id} />
    </Suspense>
  )
} 

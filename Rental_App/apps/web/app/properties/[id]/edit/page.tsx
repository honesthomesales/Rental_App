import { Suspense } from 'react'
import PropertyEditClient from './PropertyEditClient'

// This ensures the edit page is generated during static export
export const dynamicParams = false;

export async function generateStaticParams() {
  // Generate multiple example IDs to ensure edit routes are available
  return [
    { id: 'example-id-1' },
    { id: 'example-id-2' },
    { id: 'example-id-3' },
    { id: 'example-id-4' },
    { id: 'example-id-5' }
  ];
}

export default function PropertyEditPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertyEditClient id={params.id} />
    </Suspense>
  )
}

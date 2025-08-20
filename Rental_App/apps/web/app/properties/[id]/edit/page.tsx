import { Suspense } from 'react'
import PropertyEditClient from './PropertyEditClient'

// Ensure static export works for this dynamic segment
export const dynamicParams = false;

export async function generateStaticParams() {
  // Provide at least one concrete param so Next can statically export this route.
  // Use 'example-id' unless the file already imports or expects a different param shape.
  return [{ id: 'example-id' }];
}

export default function PropertyEditPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertyEditClient id={params.id} />
    </Suspense>
  )
}

import { Suspense } from 'react'
import PropertyEditClient from './PropertyEditClient'

// Enable client-side routing for dynamic segments
export const dynamicParams = true;

export default function PropertyEditPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertyEditClient id={params.id} />
    </Suspense>
  )
}

import { Suspense } from 'react'
import PropertyDetailClient from './PropertyDetailClient'

export async function generateStaticParams() {
  return [{ id: 'example-id' }]
}

export default function PropertyDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertyDetailClient id={params.id} />
    </Suspense>
  )
} 

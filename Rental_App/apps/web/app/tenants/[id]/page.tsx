import { Suspense } from 'react'
import TenantDetailClient from './TenantDetailClient'

export async function generateStaticParams() {
  return [{ id: 'example-id' }]
}

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TenantDetailClient id={params.id} />
    </Suspense>
  )
} 
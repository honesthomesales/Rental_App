import { Suspense } from 'react'
import TenantEditClient from './TenantEditClient'

// Enable client-side routing for dynamic segments
export const dynamicParams = true;

export default function TenantEditPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TenantEditClient id={params.id} />
    </Suspense>
  )
}

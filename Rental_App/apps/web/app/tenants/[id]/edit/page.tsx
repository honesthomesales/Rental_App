import { Suspense } from 'react'
import TenantEditClient from './TenantEditClient'

export default function TenantEditPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TenantEditClient id={params.id} />
    </Suspense>
  )
}

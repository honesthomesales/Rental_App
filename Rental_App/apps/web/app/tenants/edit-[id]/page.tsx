import { Suspense } from 'react'
import TenantEditClient from '../[id]/edit/TenantEditClient'

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

export default function TenantEditPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TenantEditClient id={params.id} />
    </Suspense>
  )
}

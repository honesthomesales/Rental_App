import { Suspense } from 'react'
import EditTransactionClient from '../[id]/edit/EditTransactionClient'

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

export default function PaymentEditPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditTransactionClient id={params.id} />
    </Suspense>
  )
}

import { Suspense } from 'react'
import PaymentEditClient from './PaymentEditClient'

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

export default function PaymentEditPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentEditClient id={params.id} />
    </Suspense>
  )
}

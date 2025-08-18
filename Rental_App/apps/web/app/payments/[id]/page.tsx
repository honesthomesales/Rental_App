import { Suspense } from 'react'
import PaymentDetailClient from './PaymentDetailClient'

export async function generateStaticParams() {
  return [{ id: 'example-id' }]
}

export default function PaymentDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PaymentDetailClient id={params.id} />
    </Suspense>
  )
}


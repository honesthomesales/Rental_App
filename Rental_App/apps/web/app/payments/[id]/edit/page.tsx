import { Suspense } from 'react'
import EditTransactionClient from './EditTransactionClient'

export async function generateStaticParams() {
  return [{ id: 'example-id' }]
}

export default function EditTransactionPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EditTransactionClient id={params.id} />
    </Suspense>
  )
}

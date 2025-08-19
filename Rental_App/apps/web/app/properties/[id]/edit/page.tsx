import { Suspense } from 'react'
import PropertyEditClient from './PropertyEditClient'

export default function PropertyEditPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertyEditClient id={params.id} />
    </Suspense>
  )
}

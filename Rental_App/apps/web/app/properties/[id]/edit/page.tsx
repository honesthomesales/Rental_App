import { Suspense } from 'react'
import PropertyEditClient from './PropertyEditClient'

// Ensure static export works for this dynamic segment
export const dynamicParams = false;

export async function generateStaticParams() {
  // Match the parent layout's static params exactly
  const ids = [
    'example-id-1',
    'example-id-2', 
    'example-id-3',
    'example-id-4',
    'example-id-5'
  ];
  
  return ids.map(id => ({ id }));
}

export default function PropertyEditPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertyEditClient id={params.id} />
    </Suspense>
  )
}

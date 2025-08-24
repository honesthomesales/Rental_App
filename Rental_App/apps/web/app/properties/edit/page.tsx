'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function PropertyEditContent() {
  const sp = useSearchParams();
  const id = sp.get('id');
  if (!id) return <div>Missing property id.</div>;
  // TODO: Render the existing PropertyEditForm component here and pass id.
  return <div data-testid="property-edit">Edit Property {id}</div>;
}

export default function PropertyEditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PropertyEditContent />
    </Suspense>
  );
}

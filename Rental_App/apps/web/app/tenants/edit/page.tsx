'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function TenantEditContent() {
  const sp = useSearchParams();
  const id = sp.get('id');
  if (!id) return <div>Missing tenant id.</div>;
  // TODO: Render the existing TenantEditForm component here and pass id.
  return <div data-testid="tenant-edit">Edit Tenant {id}</div>;
}

export default function TenantEditPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TenantEditContent />
    </Suspense>
  );
}

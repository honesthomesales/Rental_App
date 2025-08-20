import TenantEditClient from '../../[id]/edit/TenantEditClient'

// Generate static params for known tenant IDs
export async function generateStaticParams() {
  // For now, return an empty array to let Next.js handle this as a dynamic route
  // In production, you could fetch actual tenant IDs from your database
  return []
}

export default function TenantEditPage({ params }: { params: { id: string } }) {
  return <TenantEditClient id={params.id} />
}

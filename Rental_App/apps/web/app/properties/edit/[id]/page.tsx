import PropertyEditClient from '../../[id]/edit/PropertyEditClient'

// Generate static params for known property IDs
export async function generateStaticParams() {
  // For now, return an empty array to let Next.js handle this as a dynamic route
  // In production, you could fetch actual property IDs from your database
  return []
}

export default function PropertyEditPage({ params }: { params: { id: string } }) {
  return <PropertyEditClient id={params.id} />
}

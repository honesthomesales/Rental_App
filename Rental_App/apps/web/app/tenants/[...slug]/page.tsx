import TenantEditClient from '../[id]/edit/TenantEditClient'

// Required for static export with catch-all routes
export async function generateStaticParams() {
  // Return an empty array to let Next.js handle this as a dynamic route
  // In production, you could fetch actual tenant IDs from your database
  return []
}

export default function TenantCatchAllPage({ params }: { params: { slug: string[] } }) {
  // Server-side validation
  if (!params.slug || params.slug.length < 2) {
    return null // Invalid route
  }

  const [id, action] = params.slug
  
  // Check if this is an edit route
  if (action !== 'edit' || !id || id.startsWith('example-id')) {
    return null // Invalid route
  }

  return <TenantEditClient id={id} />
}

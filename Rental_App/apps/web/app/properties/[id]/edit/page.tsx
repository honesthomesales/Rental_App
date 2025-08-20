import PropertyEditClient from './PropertyEditClient'

// For static export, we need to generate static params
// Since we can't know all property IDs at build time, we'll create a fallback approach
export async function generateStaticParams() {
  // Return an empty array to let Next.js handle this as a dynamic route
  // In production, you could fetch actual property IDs from your database
  return []
}

// This tells Next.js to generate pages for new params at request time
export const dynamicParams = true

export default function PropertyEditPage({ params }: { params: { id: string } }) {
  return <PropertyEditClient id={params.id} />
}

// Pre-generate no params by default for static export
export async function generateStaticParams() {
  return []
}

// Only pre-rendered IDs will be available on static hosting
export const dynamicParams = false

export default function TenantIdLayout({ children }: { children: React.ReactNode }) {
  return children
}



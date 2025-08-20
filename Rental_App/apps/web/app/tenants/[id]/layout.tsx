export const dynamicParams = false;

export async function generateStaticParams() {
  // Generate multiple example IDs to ensure edit routes are available
  // Each ID will generate both the main page and edit route
  const ids = [
    'example-id-1',
    'example-id-2', 
    'example-id-3',
    'example-id-4',
    'example-id-5'
  ];
  
  // Return the IDs - Next.js will automatically generate both [id]/page.tsx and [id]/edit/page.tsx
  return ids.map(id => ({ id }));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

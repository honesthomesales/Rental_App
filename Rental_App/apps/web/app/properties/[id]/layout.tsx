export const dynamicParams = false;

export async function generateStaticParams() {
  // Generate multiple example IDs to ensure edit routes are available
  // Include both the main page and edit routes
  return [
    { id: 'example-id-1' },
    { id: 'example-id-2' },
    { id: 'example-id-3' },
    { id: 'example-id-4' },
    { id: 'example-id-5' }
  ];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

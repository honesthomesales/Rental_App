export const dynamicParams = false;

export async function generateStaticParams() {
  // Generate multiple example IDs to ensure edit routes are available
  return [
    { id: 'example-id-1' },
    { id: 'example-id-2' },
    { id: 'example-id-3' }
  ];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

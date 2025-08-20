export const dynamicParams = false;

export async function generateStaticParams() {
  // Provide at least one concrete param; children like /edit will inherit it
  return [{ id: 'example-id' }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

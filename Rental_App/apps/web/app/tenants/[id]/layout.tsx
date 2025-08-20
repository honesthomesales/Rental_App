export const dynamicParams = false;

export async function generateStaticParams() {
  return [{ id: 'example-id' }];
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

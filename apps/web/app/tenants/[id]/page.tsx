import TenantDetailClient from './ClientPage'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tenant Detail',
}

export async function generateStaticParams() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (supabaseUrl && supabaseAnonKey) {
      const { createClient } = await import('@supabase/supabase-js')
      const client = createClient(supabaseUrl, supabaseAnonKey)
      const { data } = await client.from('RENT_tenants').select('id').order('created_at', { ascending: false }).limit(20)
      const ids = (data || []).map((row: any) => ({ id: row.id }))
      if (ids.length > 0) {
        return ids
      }
    }
  } catch {}
  // Fallback to a placeholder route so export can complete
  return [{ id: 'placeholder' }]
}

export const dynamicParams = false

export default function Page({ params }: { params: { id: string } }) {
  return <TenantDetailClient tenantId={params.id} />
}



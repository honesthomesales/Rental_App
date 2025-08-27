import { createClient } from '@supabase/supabase-js'

interface CollectionsParams {
  start: string // yyyy-mm-dd
  end: string   // yyyy-mm-dd
  tenantId?: string
  propertyId?: string
}

interface PaymentWithRelations {
  id: string
  amount: number
  date_paid: string
  tenant_id: string
  property_id: string
  RENT_tenants: {
    first_name: string
    last_name: string
  }
  RENT_properties: {
    name: string
  }
}

interface CollectionsResult {
  totalCollected: number
  paymentCount: number
  dateRange: {
    start: string
    end: string
  }
  breakdown: {
    byTenant?: Array<{
      tenantId: string
      tenantName: string
      amount: number
      paymentCount: number
    }>
    byProperty?: Array<{
      propertyId: string
      propertyName: string
      amount: number
      paymentCount: number
    }>
  }
}

/**
 * Get total collections for a date range with optional tenant/property filters
 */
export async function getCollectedTotal(params: CollectionsParams): Promise<CollectionsResult> {
  const { start, end, tenantId, propertyId } = params
  
  // Get Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    // Build the base query
    let query = supabase
      .from('RENT_payments')
      .select(`
        id, 
        amount, 
        date_paid, 
        tenant_id, 
        property_id, 
        RENT_tenants!inner(first_name, last_name), 
        RENT_properties!inner(name)
      `)
      .gte('date_paid', start)
      .lte('date_paid', end)
      .eq('status', 'completed')
    
    // Apply filters
    if (tenantId) {
      query = query.eq('tenant_id', tenantId)
    }
    
    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }
    
    // Execute query
    const { data: payments, error } = await query as { data: PaymentWithRelations[] | null, error: any }
    
    if (error) {
      throw new Error(`Failed to fetch payments: ${error.message}`)
    }
    
    if (!payments) {
      return {
        totalCollected: 0,
        paymentCount: 0,
        dateRange: { start, end },
        breakdown: {}
      }
    }
    
    // Calculate totals
    const totalCollected = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
    const paymentCount = payments.length
    
    // Build breakdown by tenant if no tenant filter
    let breakdownByTenant: CollectionsResult['breakdown']['byTenant'] | undefined
    if (!tenantId) {
      const tenantMap = new Map<string, { amount: number; paymentCount: number; name: string }>()
      
      payments.forEach(payment => {
        const tenantKey = payment.tenant_id || 'unknown'
        const tenantName = payment.RENT_tenants 
          ? `${payment.RENT_tenants.first_name} ${payment.RENT_tenants.last_name}`
          : 'Unknown Tenant'
        
        if (tenantMap.has(tenantKey)) {
          const existing = tenantMap.get(tenantKey)!
          existing.amount += payment.amount || 0
          existing.paymentCount += 1
        } else {
          tenantMap.set(tenantKey, {
            amount: payment.amount || 0,
            paymentCount: 1,
            name: tenantName
          })
        }
      })
      
      breakdownByTenant = Array.from(tenantMap.entries()).map(([tenantId, data]) => ({
        tenantId,
        tenantName: data.name,
        amount: data.amount,
        paymentCount: data.paymentCount
      }))
    }
    
    // Build breakdown by property if no property filter
    let breakdownByProperty: CollectionsResult['breakdown']['byProperty'] | undefined
    if (!propertyId) {
      const propertyMap = new Map<string, { amount: number; paymentCount: number; name: string }>()
      
      payments.forEach(payment => {
        const propertyKey = payment.property_id || 'unknown'
        const propertyName = payment.RENT_properties?.name || 'Unknown Property'
        
        if (propertyMap.has(propertyKey)) {
          const existing = propertyMap.get(propertyKey)!
          existing.amount += payment.amount || 0
          existing.paymentCount += 1
        } else {
          propertyMap.set(propertyKey, {
            amount: payment.amount || 0,
            paymentCount: 1,
            name: propertyName
          })
        }
      })
      
      breakdownByProperty = Array.from(propertyMap.entries()).map(([propertyId, data]) => ({
        propertyId,
        propertyName: data.name,
        amount: data.amount,
        paymentCount: data.paymentCount
      }))
    }
    
    return {
      totalCollected,
      paymentCount,
      dateRange: { start, end },
      breakdown: {
        byTenant: breakdownByTenant,
        byProperty: breakdownByProperty
      }
    }
    
  } catch (error) {
    console.error('Collections reporting error:', error)
    throw error
  }
}

/**
 * Get collections summary for dashboard
 */
export async function getCollectionsSummary(): Promise<{
  thisMonth: number
  lastMonth: number
  thisYear: number
  lastYear: number
}> {
  try {
    const now = new Date()
    const thisMonth = now.getMonth()
    const thisYear = now.getFullYear()
    
    // This month
    const thisMonthStart = new Date(thisYear, thisMonth, 1).toISOString().split('T')[0]
    const thisMonthEnd = new Date(thisYear, thisMonth + 1, 0).toISOString().split('T')[0]
    const thisMonthResult = await getCollectedTotal({ start: thisMonthStart, end: thisMonthEnd })
    
    // Last month
    const lastMonthStart = new Date(thisYear, thisMonth - 1, 1).toISOString().split('T')[0]
    const lastMonthEnd = new Date(thisYear, thisMonth, 0).toISOString().split('T')[0]
    const lastMonthResult = await getCollectedTotal({ start: lastMonthStart, end: lastMonthEnd })
    
    // This year
    const thisYearStart = new Date(thisYear, 0, 1).toISOString().split('T')[0]
    const thisYearEnd = new Date(thisYear, 11, 31).toISOString().split('T')[0]
    const thisYearResult = await getCollectedTotal({ start: thisYearStart, end: thisYearEnd })
    
    // Last year
    const lastYearStart = new Date(thisYear - 1, 0, 1).toISOString().split('T')[0]
    const lastYearEnd = new Date(thisYear - 1, 11, 31).toISOString().split('T')[0]
    const lastYearResult = await getCollectedTotal({ start: lastYearStart, end: lastYearEnd })
    
    return {
      thisMonth: thisMonthResult.totalCollected,
      lastMonth: lastMonthResult.totalCollected,
      thisYear: thisYearResult.totalCollected,
      lastYear: lastYearResult.totalCollected
    }
    
  } catch (error) {
    console.error('Collections summary error:', error)
    throw error
  }
}

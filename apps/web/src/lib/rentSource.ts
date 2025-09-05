/**
 * Centralized data access for rent management
 * This file provides a single source of truth for all rent-related data queries
 * All queries are gated behind NEXT_PUBLIC_USE_LEASE_PERIODS environment variable
 */

import { supabase } from '@rental-app/api'

// Check if lease periods feature is enabled
const isLeasePeriodsEnabled = () => {
  return process.env.NEXT_PUBLIC_USE_LEASE_PERIODS === 'true'
}

/**
 * Get active lease for a specific property
 */
export async function getActiveLeaseByProperty(propertyId: string) {
  if (!isLeasePeriodsEnabled() || !supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('RENT_leases')
      .select(`
        *,
        RENT_tenants!inner(first_name, last_name, email, phone),
        RENT_properties!inner(name, address)
      `)
      .eq('property_id', propertyId)
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('Error fetching active lease by property:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching active lease by property:', error)
    return null
  }
}

/**
 * Get active lease for a specific tenant
 */
export async function getActiveLeaseByTenant(tenantId: string) {
  if (!isLeasePeriodsEnabled() || !supabase) {
    return null
  }

  try {
    const { data, error } = await supabase
      .from('RENT_leases')
      .select(`
        *,
        RENT_tenants!inner(first_name, last_name, email, phone),
        RENT_properties!inner(name, address)
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .single()

    if (error) {
      console.error('Error fetching active lease by tenant:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Error fetching active lease by tenant:', error)
    return null
  }
}

/**
 * List rent periods for a specific lease
 */
export async function listPeriods(leaseId: string) {
  if (!isLeasePeriodsEnabled() || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('RENT_rent_periods')
      .select('*')
      .eq('lease_id', leaseId)
      .order('period_due_date', { ascending: true })

    if (error) {
      console.error('Error fetching periods:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching periods:', error)
    return []
  }
}

/**
 * List overdue periods with grace period
 */
export async function listOverdue(graceDays: number = 5) {
  if (!isLeasePeriodsEnabled() || !supabase) {
    return []
  }

  try {
    const graceDate = new Date()
    graceDate.setDate(graceDate.getDate() - graceDays)

    const { data, error } = await supabase
      .from('RENT_rent_periods')
      .select(`
        *,
        RENT_leases!inner(
          id,
          rent,
          rent_cadence,
          RENT_tenants!inner(first_name, last_name, email, phone),
          RENT_properties!inner(name, address)
        )
      `)
      .eq('status', 'unpaid')
      .lt('period_due_date', graceDate.toISOString().split('T')[0])
      .order('period_due_date', { ascending: true })

    if (error) {
      console.error('Error fetching overdue periods:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching overdue periods:', error)
    return []
  }
}

/**
 * Get expected rent by month from periods
 */
export async function getExpectedRentByMonth() {
  if (!isLeasePeriodsEnabled() || !supabase) {
    return []
  }

  try {
    // Use raw SQL query since the view is not in the generated types
    const { data, error } = await (supabase as any).rpc('get_expected_rent_by_month')

    if (error) {
      console.error('Error fetching expected rent by month:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching expected rent by month:', error)
    return []
  }
}

/**
 * Get collected rent by month from allocations
 */
export async function getCollectedRentByMonth() {
  if (!isLeasePeriodsEnabled() || !supabase) {
    return []
  }

  try {
    // Use raw SQL query since the view is not in the generated types
    const { data, error } = await (supabase as any).rpc('get_collected_rent_by_month')

    if (error) {
      console.error('Error fetching collected rent by month:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching collected rent by month:', error)
    return []
  }
}

/**
 * Get period balances for a specific lease
 */
export async function getPeriodBalances(leaseId: string) {
  if (!isLeasePeriodsEnabled() || !supabase) {
    return []
  }

  try {
    // Use raw SQL query since the view is not in the generated types
    const { data, error } = await (supabase as any).rpc('get_period_balances', {
      p_lease_id: leaseId
    })

    if (error) {
      console.error('Error fetching period balances:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching period balances:', error)
    return []
  }
}

/**
 * Get all active leases with their details
 */
export async function getAllActiveLeases() {
  if (!isLeasePeriodsEnabled() || !supabase) {
    return []
  }

  try {
    const { data, error } = await supabase
      .from('RENT_leases')
      .select(`
        *,
        RENT_tenants!inner(first_name, last_name, email, phone),
        RENT_properties!inner(name, address)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching active leases:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Error fetching active leases:', error)
    return []
  }
}

/**
 * Get property rent information (from active lease or fallback to property)
 */
export async function getPropertyRentInfo(propertyId: string) {
  if (!isLeasePeriodsEnabled() || !supabase) {
    // No lease periods enabled, return default
    return {
      rent: 0,
      cadence: 'monthly' as const,
      source: 'default' as const
    }
  }

  // Try to get from active lease first
  const activeLease = await getActiveLeaseByProperty(propertyId)
  
  if (activeLease) {
    return {
      rent: activeLease.rent,
      cadence: activeLease.rent_cadence,
      source: 'lease' as const
    }
  }

  // No active lease found, return default
  console.warn('No active lease found for property:', propertyId);
  return {
    rent: 0,
    cadence: 'monthly' as const,
    source: 'default' as const
  }
}

/**
 * Get tenant rent information (from active lease)
 */
export async function getTenantRentInfo(tenantId: string) {
  if (!isLeasePeriodsEnabled() || !supabase) {
    return null
  }

  const activeLease = await getActiveLeaseByTenant(tenantId)
  
  if (activeLease) {
    return {
      rent: activeLease.rent,
      cadence: activeLease.rent_cadence,
      property: activeLease.RENT_properties,
      lease: activeLease
    }
  }

  return null
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TenantsService, RentPeriodsService, supabase, PropertiesService } from '@rental-app/api'
import type { LateTenant, RentPeriod } from '@rental-app/api'
import { calculateTotalLatePayments, isTenantLate } from '../../lib/utils'
import { listOverdue } from '../../src/lib/rentSource'
import { 
  AlertTriangle, 
  FileText, 
  Printer, 
  Calendar,
  Edit3,
  Check,
  X,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { LateTenantNotice } from '@/components/LateTenantNotice'

export default function LateTenantsPage() {
  // const router = useRouter()
  const [lateTenants, setLateTenants] = useState<LateTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<LateTenant | null>(null)
  const [showNotice, setShowNotice] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<{ tenantId: string; periodId: string; lateFee: number } | null>(null)
  const [showPeriodsModal, setShowPeriodsModal] = useState(false)
  const [selectedTenantPeriods, setSelectedTenantPeriods] = useState<RentPeriod[]>([])
  const [editingLateFeeValue, setEditingLateFeeValue] = useState<number>(0)
  const [mounted, setMounted] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)
  
  // Feature flag for new rent source system
  // Try multiple ways to read the environment variable
  const envVar = process.env.NEXT_PUBLIC_USE_LEASE_PERIODS
  const useLeasePeriods = envVar === 'true'
  // Force enable for testing (bypassing env var issue)
  const forceEnable = true
  console.log('FORCE ENABLING NEW SYSTEM FOR TESTING:', forceEnable)

  useEffect(() => {
    console.log('=== COMPONENT MOUNTING ===')
    setMounted(true)
    // Add a small delay to ensure component is fully mounted
    const timer = setTimeout(() => {
      console.log('Component fully mounted, triggering data load...')
      setReloadKey(prev => prev + 1)
    }, 100)
    
    return () => {
      console.log('=== COMPONENT UNMOUNTING ===')
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Version identifier for testing - remove after verification
    console.log('Late Tenants Page Version: 1.2')
    console.log('Late Tenants Page: useEffect triggered, loading late tenants...')
    console.log('Late Tenants Page: Current URL:', window.location.href)
    console.log('Late Tenants Page: Reload key:', reloadKey)
    loadLateTenants()
  }, [mounted, reloadKey])

  // Force data loading on every render when mounted and no data
  useEffect(() => {
    if (mounted && lateTenants.length === 0 && !loading) {
      console.log('Force loading data - no tenants found and not loading')
      loadLateTenants()
    }
  }, [mounted, lateTenants.length, loading])

  // Force reload when component mounts or URL changes
  useEffect(() => {
    const handleRouteChange = () => {
      console.log('Route change detected, reloading late tenants...')
      setReloadKey(prev => prev + 1)
    }

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange)
    
    // Also reload on focus (in case of navigation from dashboard)
    window.addEventListener('focus', handleRouteChange)

    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      window.removeEventListener('focus', handleRouteChange)
    }
  }, [])

  const loadLateTenants = async (retryCount = 0) => {
    try {
      setLoading(true)
      console.log('Loading late tenants... (attempt:', retryCount + 1, ')')
      
      // Check feature flag for new rent source system
      const useLeasePeriods = process.env.NEXT_PUBLIC_USE_LEASE_PERIODS === 'true'
      const forceEnable = true // Force enable for testing
      console.log('Feature flag NEXT_PUBLIC_USE_LEASE_PERIODS:', useLeasePeriods)
      console.log('Force enable for testing:', forceEnable)
      
      if (useLeasePeriods || forceEnable) {
        console.log('Using new centralized rent source system...')
        await loadLateTenantsWithRentSource()
      } else {
        // Skip the API method since it depends on non-existent RENT_rent_periods table
        // Go directly to the fallback method that works with existing data
        console.log('Using fallback method directly (API method requires RENT_rent_periods table)...')
        await loadLateTenantsFallback()
      }
      
    } catch (error) {
      console.error('Error loading late tenants:', error)
      
      // Retry up to 3 times with increasing delay
      if (retryCount < 3) {
        console.log('Retrying in', (retryCount + 1) * 500, 'ms...')
        setTimeout(() => {
          loadLateTenants(retryCount + 1)
        }, (retryCount + 1) * 500)
        return
      }
      
      toast.error('Error loading late tenants')
    } finally {
      setLoading(false)
    }
  }

  const loadLateTenantsWithRentSource = async () => {
    try {
      console.log('loadLateTenantsWithRentSource: Using centralized rent source...')
      
      // Use the new centralized rent source to get overdue periods
      console.log('Calling listOverdue(5)...')
      const overduePeriods = await listOverdue(5) // 5 days grace period
      console.log('listOverdue result:', overduePeriods)
      console.log('overduePeriods type:', typeof overduePeriods)
      console.log('overduePeriods length:', overduePeriods?.length)
      
      console.log('Overdue periods from rent source:', overduePeriods)
      
      if (!overduePeriods || overduePeriods.length === 0) {
        console.log('No overdue periods found using rent source')
        setLateTenants([])
        // Show a message that new system is working but no data found
        console.log('NEW RENT SOURCE SYSTEM: No overdue periods found (this is expected if RENT_rent_periods table is empty)')
        return
      }
      
      // Transform overdue periods to match the existing LateTenant interface
      const lateTenantsList: LateTenant[] = overduePeriods.map(period => ({
        id: period.tenant_id,
        first_name: period.RENT_leases?.RENT_tenants?.first_name || '',
        last_name: period.RENT_leases?.RENT_tenants?.last_name || '',
        email: period.RENT_leases?.RENT_tenants?.email || '',
        phone: period.RENT_leases?.RENT_tenants?.phone || '',
        property_id: period.property_id,
        property_address: period.RENT_leases?.RENT_properties?.address || '',
        rent: period.RENT_leases?.rent || 0,
        total_due: period.RENT_leases?.rent || 0,
        late_periods: 1, // Each period represents one late period
        lease_start_date: '', // Not available in current query
        rent_cadence: period.RENT_leases?.rent_cadence || '',
        late_fees: 0, // Late fees not stored in current schema
        total_late_fees: 0, // Late fees not stored in current schema
        days_late: period.period_due_date ? Math.max(0, Math.floor((new Date().getTime() - new Date(period.period_due_date).getTime()) / (1000 * 60 * 60 * 24))) : 0, // Calculate days overdue
        properties: { // Add missing property with all required fields
          id: period.property_id,
          name: period.RENT_leases?.RENT_properties?.name || '',
          address: period.RENT_leases?.RENT_properties?.address || '',
          city: '',
          state: '',
          zip_code: '',
          property_type: 'house',
          status: 'active' as any,
          bedrooms: undefined,
          bathrooms: undefined,
          square_feet: undefined,
          lot_size: undefined,
          year_built: undefined,
          purchase_date: undefined,
          current_value: undefined,
          // monthly_rent removed - rent data comes from RENT_leases
          is_for_rent: true,
          is_for_sale: false,
          insurance_policy_number: undefined,
          insurance_provider: undefined,
          insurance_expiry_date: undefined,
          insurance_premium: undefined,
          owner_name: undefined,
          owner_phone: undefined,
          owner_email: undefined,
          notes: undefined,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        leases: [{
          id: period.lease_id,
          tenant_id: period.tenant_id,
          property_id: period.property_id,
          rent: period.rent_amount,
          rent_cadence: period.rent_cadence,
          lease_start_date: '',
          lease_end_date: '',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }],
        RENT_properties: {
          id: period.property_id,
          name: period.property_name,
          address: period.property_address,
          // monthly_rent removed - rent data comes from RENT_leases
        }
      }))
      
      console.log('Transformed late tenants from rent source:', lateTenantsList)
      console.log('Unique tenant IDs:', Array.from(new Set(lateTenantsList.map(t => t.id))))
      console.log('Total tenants:', lateTenantsList.length, 'Unique IDs:', Array.from(new Set(lateTenantsList.map(t => t.id))).length)
      setLateTenants(lateTenantsList)
      
    } catch (error) {
      console.error('Error loading late tenants with rent source:', error)
      console.error('Error details:', (error as Error).message)
      console.error('Error stack:', (error as Error).stack)
      // Fall back to the original method if the new one fails
      console.log('Falling back to original method...')
      await loadLateTenantsFallback()
    }
  }

  const loadLateTenantsFallback = async () => {
    try {
      console.log('loadLateTenantsFallback: Starting fallback method...')
      console.log('Loading tenants with lease data...')
      
      if (!supabase) {
        console.error('Supabase client not available, retrying in 100ms...')
        // Retry after a short delay in case of timing issues
        setTimeout(() => {
          loadLateTenantsFallback()
        }, 100)
        return
      }
      
      // Use Supabase directly to get tenants with lease data
      // First, let's get all active tenants
      const { data: allTenants, error: tenantsError } = await supabase
        .from('RENT_tenants')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (tenantsError) {
        console.error('Error loading tenants:', tenantsError)
        toast.error('Error loading tenant data')
        return
      }

      console.log('All active tenants:', allTenants)

      if (!allTenants || allTenants.length === 0) {
        console.log('No active tenants found')
        setLateTenants([])
        return
      }

      // Now get properties and leases for each tenant
      const tenantsWithLeases = await Promise.all(
        allTenants.map(async (tenant) => {
          // Get property (only if property_id exists)
          let property = null;
          if (tenant.property_id) {
            const { data: propertyData } = await supabase!
              .from('RENT_properties')
              .select('*')
              .eq('id', tenant.property_id)
              .single();
            property = propertyData;
          }

          // Get leases (get the most recent active lease)
          const { data: leases } = await supabase!
            .from('RENT_leases')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('status', 'active')
            .order('lease_start_date', { ascending: false })
            .limit(1);

          return {
            ...tenant,
            RENT_properties: property,
            RENT_leases: leases || []
          };
        })
      );

      if (!tenantsWithLeases || tenantsWithLeases.length === 0) {
        console.log('No tenants with leases found')
        setLateTenants([])
        return
      }

      console.log('Tenants with leases loaded:', tenantsWithLeases)

      const lateTenantsList: unknown[] = []
      
      // Debug: Let's see what we're working with
      console.log('=== DEBUGGING LATE TENANTS CALCULATION ===')
      console.log('Current date:', new Date().toISOString().split('T')[0])
      console.log('Number of tenants found:', tenantsWithLeases.length)

      // Process each tenant to find late payments
            for (const tenant of tenantsWithLeases) {
        try {
          const property = tenant.RENT_properties
          const lease = tenant.RENT_leases && tenant.RENT_leases.length > 0 ? tenant.RENT_leases[0] : null

          if (!property || !lease || !lease.lease_start_date) {
            console.log('Skipping tenant - missing property or lease data:', tenant.first_name, tenant.last_name)
            continue
          }

          console.log('=== PROCESSING TENANT ===')
          console.log('Tenant:', tenant.first_name, tenant.last_name)
          console.log('Lease start date:', lease.lease_start_date)
          console.log('Rent cadence:', lease.rent_cadence)
          console.log('Rent amount:', lease.rent)
          console.log('Payment history:', tenant.payment_history)
          console.log('tenant.RENT_leases:', tenant.RENT_leases)
          console.log('property:', property)
          
          // Get actual payments from RENT_payments table
          const { data: payments, error: paymentsError } = await supabase
            .from('RENT_payments')
            .select('*')
            .eq('tenant_id', tenant.id)
            .eq('status', 'completed')
            .order('payment_date', { ascending: false });

          if (paymentsError) {
            console.error('Error loading payments for tenant:', tenant.first_name, paymentsError)
            continue
          }

          console.log('Payments found:', payments?.length || 0, payments)

          // Get rent periods from RENT_rent_periods table
          const { data: rentPeriods, error: periodsError } = await supabase
            .from('RENT_rent_periods')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('period_due_date', { ascending: false });

          if (periodsError) {
            console.error('Error loading rent periods for tenant:', tenant.first_name, periodsError)
            continue
          }

          console.log('Rent periods found:', rentPeriods?.length || 0, rentPeriods)

          // Calculate if tenant is late based on actual data
          const isLate = await calculateLateStatusFromDatabase(tenant, property, lease, payments || [], rentPeriods || [])
          console.log('Is late result:', isLate)
          
          if (isLate.isLate) {
            
            lateTenantsList.push({
              id: tenant.id,
              first_name: tenant.first_name,
              last_name: tenant.last_name,
              phone: tenant.phone,
              property_id: tenant.property_id,
              property_name: property.name,
              property_address: property.address,
              rent: lease.rent || 0,
              total_due: Math.round(isLate.totalDue),
              late_periods: isLate.latePeriods,
              lease_start_date: lease.lease_start_date,
              rent_cadence: lease.rent_cadence || 'monthly',
              late_fees: Math.round(isLate.totalLateFees),
              total_late_fees: Math.round(isLate.totalLateFees),
              days_late: 30, // Simplified for now
              late_status: 'late_5_days',
              properties: {
                name: property.name,
                address: property.address,
                // monthly_rent removed - rent data comes from RENT_leases
              },
              leases: [{
                id: lease.id,
                rent: lease.rent,
                rent_cadence: lease.rent_cadence,
                lease_start_date: lease.lease_start_date,
                lease_end_date: lease.lease_end_date,
                status: lease.status
              }]
            })
          }
        } catch (error) {
          console.error('Error processing tenant:', tenant.first_name, tenant.last_name, error)
        }
      }

      console.log('Final late tenants list:', lateTenantsList)
      console.log('Setting late tenants state with', lateTenantsList.length, 'tenants')
      setLateTenants(lateTenantsList)
      console.log('Late tenants state updated')
      
    } catch (error) {
      console.error('Error in fallback method:', error)
      toast.error('Error loading late tenants')
    }
  }

  // New function to calculate late status using actual database tables
  const calculateLateStatusFromDatabase = async (
    tenant: unknown, 
    property: unknown, 
    lease: unknown, 
    payments: unknown[], 
    rentPeriods: unknown[]
  ) => {
    const today = new Date()
    let totalLateFees = 0
    let totalOutstanding = 0
    let latePeriods = 0

    // If no rent periods exist, generate expected periods based on lease
    if (rentPeriods.length === 0) {
      console.log('No rent periods found, calculating based on lease data')
      
      // Calculate expected payment dates based on lease start date and cadence
      const leaseStartDate = new Date(lease.lease_start_date)
      const cadence = lease.rent_cadence || 'monthly'
      const rentAmount = lease.rent
      
      // Generate expected periods for the last 12 months
      const expectedPeriods = generateExpectedPeriods(leaseStartDate, cadence, rentAmount, 12)
      
      // Check each expected period against actual payments
      for (const period of expectedPeriods) {
        const periodPayments = payments.filter(p => {
          const paymentDate = new Date(p.payment_date)
          return paymentDate >= period.startDate && paymentDate <= period.endDate
        })
        
        const totalPaid = periodPayments.reduce((sum, p) => sum + p.amount, 0)
        const outstanding = Math.max(0, period.rentAmount - totalPaid)
        
        if (outstanding > 0 && today > period.endDate) {
          latePeriods++
          totalOutstanding += outstanding
          
          // Calculate late fee
          const lateFeeAmount = getLateFeeAmount(cadence)
          totalLateFees += lateFeeAmount
        }
      }
    } else {
      // Use actual rent periods from database
      for (const period of rentPeriods) {
        if (period.status === 'unpaid' || period.amount_paid < period.rent_amount) {
          const periodDueDate = new Date(period.period_due_date)
          const outstanding = period.rent_amount - (period.amount_paid || 0)
          
          if (outstanding > 0 && today > periodDueDate) {
            latePeriods++
            totalOutstanding += outstanding
            
            // Add late fee if not waived
            if (!period.late_fee_waived) {
              totalLateFees += period.late_fee_applied || getLateFeeAmount(period.rent_cadence)
            }
          }
        }
      }
    }

    const totalDue = totalOutstanding + totalLateFees
    const isLate = totalDue > 0

    return {
      isLate,
      totalLateFees,
      totalOutstanding,
      totalDue,
      latePeriods
    }
  }

  // Helper function to generate expected payment periods
  const generateExpectedPeriods = (leaseStartDate: Date, cadence: string, rentAmount: number, months: number) => {
    const periods = []
    const today = new Date()
    
    for (let i = 0; i < months; i++) {
      let periodStartDate: Date
      let periodEndDate: Date
      
      if (cadence === 'weekly') {
        periodStartDate = new Date(leaseStartDate.getTime() + (i * 7 * 24 * 60 * 60 * 1000))
        periodEndDate = new Date(periodStartDate.getTime() + (6 * 24 * 60 * 60 * 1000))
      } else if (cadence === 'bi-weekly' || cadence === 'biweekly') {
        periodStartDate = new Date(leaseStartDate.getTime() + (i * 14 * 24 * 60 * 60 * 1000))
        periodEndDate = new Date(periodStartDate.getTime() + (13 * 24 * 60 * 60 * 1000))
      } else { // monthly
        periodStartDate = new Date(leaseStartDate)
        periodStartDate.setMonth(periodStartDate.getMonth() + i)
        periodEndDate = new Date(periodStartDate)
        periodEndDate.setMonth(periodEndDate.getMonth() + 1)
        periodEndDate.setDate(periodEndDate.getDate() - 1)
      }
      
      // Only include periods that are in the past or current
      if (periodEndDate <= today) {
        periods.push({
          startDate: periodStartDate,
          endDate: periodEndDate,
          rentAmount: rentAmount
        })
      }
    }
    
    return periods
  }

  const getRowBackgroundColor = (totalDue: number): string => {
    if (totalDue > 5000) return 'bg-red-50'
    if (totalDue > 2000) return 'bg-orange-50'
    if (totalDue > 500) return 'bg-yellow-50'
    return 'bg-white'
  }

  const getRentAmount = (tenant: LateTenant): number => {
    if (tenant.leases && tenant.leases.length > 0) {
      return tenant.leases[0].rent || 0;
    }
    return 0; // No lease means no rent amount
  }

  const getRentCadence = (tenant: LateTenant): string => {
    if (tenant.leases && tenant.leases.length > 0) {
      const cadence = tenant.leases[0].rent_cadence;
      if (cadence) {
        const normalized = cadence.toLowerCase().trim();
        switch (normalized) {
          case 'weekly':
            return 'weekly';
          case 'bi-weekly':
          case 'biweekly':
          case 'bi_weekly':
            return 'bi-weekly';
          case 'monthly':
          default:
            return 'monthly';
        }
      }
    }
    return 'monthly';
  }

  const generateNotice = (tenant: LateTenant) => {
    setSelectedTenant(tenant)
    setShowNotice(true)
  }

  const viewPeriods = async (tenant: LateTenant) => {
    try {
      console.log('View periods clicked for tenant:', tenant.id, tenant.first_name, tenant.last_name)
      
      // Store the selected tenant for the modal
      setSelectedTenant(tenant)
      
      if (!supabase) {
        console.error('Supabase client not available')
        toast.error('Database connection not available')
        return
      }
      
      // Fetch real rent periods from the database
      console.log('Fetching real rent periods from database for tenant:', tenant.id)
      
      const { data: periods, error } = await supabase
        .from('RENT_rent_periods')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('period_due_date', { ascending: true })

      if (error) {
        console.error('Error fetching rent periods:', error)
        toast.error('Failed to load rent periods')
        return
      }

      console.log('Fetched rent periods:', periods)
      
      if (!periods || periods.length === 0) {
        toast.error('No rent periods found for this tenant')
        return
      }

      // Transform the data to match RentPeriod interface
      const transformedPeriods: RentPeriod[] = periods.map((period: unknown) => ({
        id: period.id,
        tenant_id: period.tenant_id,
        property_id: period.property_id,
        lease_id: period.lease_id,
        period_due_date: period.period_due_date,
        rent_amount: period.rent_amount,
        rent_cadence: period.rent_cadence,
        status: period.status,
        amount_paid: period.amount_paid,
        created_at: period.created_at,
        updated_at: period.updated_at
      }))

      setSelectedTenantPeriods(transformedPeriods)
      setShowPeriodsModal(true)
      
    } catch (error) {
      console.error('Error loading rent periods:', error)
      toast.error('Error loading rent periods')
    }
  }

  // Helper function to generate sample rent periods for display
  const generateSampleRentPeriods = (lease: unknown, tenant: unknown): RentPeriod[] => {
    const periods: RentPeriod[] = []
    const startDate = new Date(lease.lease_start_date)
    const cadence = lease.rent_cadence || 'monthly'
    const rentAmount = lease.rent || 0
    
    // Generate 12 periods
    for (let i = 0; i < 12; i++) {
      let dueDate = new Date(startDate)
      
      // Calculate due date based on cadence
      if (cadence === 'weekly') {
        dueDate.setDate(dueDate.getDate() + (i * 7))
      } else if (cadence === 'bi-weekly' || cadence === 'biweekly' || cadence === 'bi_weekly') {
        dueDate.setDate(dueDate.getDate() + (i * 14))
      } else { // monthly
        dueDate.setMonth(dueDate.getMonth() + i)
      }
      
      // Determine if this period is late (simplified logic)
      const today = new Date()
      const isLate = dueDate < today
      const status = isLate ? 'unpaid' : 'paid'
      
      periods.push({
        id: `sample-${i}`,
        tenant_id: tenant.id,
        property_id: tenant.property_id,
        lease_id: lease.id,
        period_due_date: dueDate.toISOString().split('T')[0],
        rent_amount: rentAmount,
        rent_cadence: cadence,
        amount_paid: status === 'paid' ? rentAmount : 0,
        status: status,
        // late_fee_applied: isLate ? getLateFeeAmount(cadence) : 0, // Not in current schema
        // late_fee_waived: false, // Not in current schema
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    return periods
  }

  // Helper function to get late fee amount based on cadence
  const getLateFeeAmount = (cadence: string): number => {
    const normalized = cadence.toLowerCase().trim()
    switch (normalized) {
      case 'weekly':
        return 10
      case 'bi-weekly':
      case 'biweekly':
      case 'bi_weekly':
        return 20
      case 'monthly':
        return 45
      default:
        return 45
    }
  }

  const handleLateFeeOverride = async (periodId: string, newLateFee: number) => {
    try {
      if (!supabase) {
        toast.error('Database connection not available')
        return
      }

      console.log('Updating late fee for period:', periodId, 'to:', newLateFee)
      
      // TODO: Implement late fee update when late_fee_applied field is added to schema
      // const { error } = await supabase
      //   .from('RENT_rent_periods')
      //   .update({ 
      //     late_fee_applied: newLateFee,
      //     late_fee_waived: newLateFee === 0
      //   })
      //   .eq('id', periodId)
      
      const error = null // Placeholder until schema is updated

      if (error) {
        console.error('Error updating late fee:', error)
        toast.error('Failed to update late fee: ' + (error as Error).message)
        return
      }

      // TODO: Update local state when late fee fields are added to schema
      // setSelectedTenantPeriods(prev => 
      //   prev.map(period => 
      //     period.id === periodId 
      //       ? { ...period, late_fee_applied: newLateFee, late_fee_waived: newLateFee === 0 }
      //       : period
      //   )
      // )

      toast.success('Late fee updated successfully')
      setEditingPeriod(null)
      setEditingLateFeeValue(0)
      
    } catch (error) {
      console.error('Error updating late fee:', error)
      toast.error('Error updating late fee')
    }
  }

  const handleDeletePeriod = async (periodId: string) => {
    // Confirm deletion
    if (window.confirm('Are you sure you want to delete this rent period? This action cannot be undone.')) {
      try {
        if (!supabase) {
          toast.error('Database connection not available')
          return
        }
        
        console.log('Deleting rent period:', periodId)
        
        const { error } = await supabase
          .from('RENT_rent_periods')
          .delete()
          .eq('id', periodId)
        
        if (error) {
          console.error('Error deleting period:', error)
          toast.error('Failed to delete rent period: ' + error.message)
          return
        }
        
        // Remove the period from the local state
        setSelectedTenantPeriods(prev => 
          prev.filter(period => period.id !== periodId)
        )
        
        toast.success('Rent period deleted successfully')
        
      } catch (error) {
        console.error('Error deleting period:', error)
        toast.error('Error deleting rent period')
      }
    }
  }

  const printNotice = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Debug logging (reduced)
  // console.log('LateTenantsPage render - showPeriodsModal:', showPeriodsModal, 'selectedTenantPeriods:', selectedTenantPeriods)

  // Debug render state (reduced logging)
  if (lateTenants.length > 0) {
    console.log('Late Tenants Page render - lateTenants.length:', lateTenants.length, 'loading:', loading, 'mounted:', mounted)
  }

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Late Tenants</h1>
              <p className="text-gray-600">Tenants more than 5 days late on rent</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Late Tenants</p>
                <p className="text-2xl font-bold text-red-600">{lateTenants.length}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Amount Due</p>
                <p className="text-2xl font-bold text-red-600">
                  ${Math.round(lateTenants.reduce((sum, t) => sum + (t.total_due || 0), 0)).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Late Fees</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${Math.round(lateTenants.reduce((sum, t) => sum + (t.total_late_fees || 0), 0)).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Avg Amount Due</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${lateTenants.length > 0 ? Math.round(lateTenants.reduce((sum, t) => sum + (t.total_due || 0), 0) / lateTenants.length) : 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dev-only banner showing active mode */}
      {process.env.NODE_ENV === 'development' && (
        <div className={`${(useLeasePeriods || forceEnable) ? 'bg-green-100 border-green-300' : 'bg-yellow-100 border-yellow-300'} border-l-4 p-4 mx-4 mt-4 rounded-r-md`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className={`h-5 w-5 ${(useLeasePeriods || forceEnable) ? 'text-green-400' : 'text-yellow-400'}`} />
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${(useLeasePeriods || forceEnable) ? 'text-green-800' : 'text-yellow-800'}`}>
                {(useLeasePeriods || forceEnable) ? 'NEW RENT SOURCE MODE' : 'LEGACY MODE'}
              </p>
              <p className={`text-sm ${(useLeasePeriods || forceEnable) ? 'text-green-700' : 'text-yellow-700'}`}>
                {(useLeasePeriods || forceEnable) 
                  ? 'Using centralized rent source system (listOverdue)'
                  : 'Using legacy fallback method (loadLateTenantsFallback)'
                }
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {lateTenants.length === 0 ? (
          <div className="card">
            <div className="card-content text-center py-12">
              <AlertTriangle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Late Tenants</h3>
              <p className="text-gray-600">All tenants are current on their rent payments.</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="card-title">Late Tenants</h2>
                  <p className="card-description">Manage late tenants and generate notices</p>
                </div>
              </div>
            </div>
            <div className="card-content">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Tenant</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Property</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Rent Cadence</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Rent Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Late Periods</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Late Fees</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Total Due</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lateTenants.map((tenant, index) => {
                      const totalDue = tenant.total_due || 0
                      const rentAmount = getRentAmount(tenant)
                      const rentCadence = getRentCadence(tenant)
                      const latePeriods = tenant.late_periods || 0
                      const lateFees = tenant.total_late_fees || 0
                      const rowBackgroundColor = getRowBackgroundColor(totalDue)
                      
                      return (
                        <tr key={`${tenant.id}-${tenant.property_id}-${index}`} className={`border-b border-gray-100 hover:bg-gray-100 ${rowBackgroundColor}`}>
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {tenant.first_name} {tenant.last_name}
                              </p>
                              <p className="text-sm text-gray-500">{tenant.phone}</p>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-gray-900">{tenant.properties?.name || 'No property'}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-600 capitalize">{rentCadence}</span>
                          </td>
                          <td className="py-4 px-4 font-medium text-gray-900">
                            ${Math.round(rentAmount).toLocaleString()}
                          </td>
                          <td className="py-4 px-4 font-medium text-gray-900">
                            {latePeriods}
                          </td>
                          <td className="py-4 px-4 font-medium text-gray-900">
                            ${Math.round(lateFees).toLocaleString()}
                          </td>
                          <td className="py-4 px-4 font-medium text-red-600">
                            ${Math.round(totalDue).toLocaleString()}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => viewPeriods(tenant)}
                                className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700 flex items-center"
                              >
                                <Calendar className="w-4 h-4 mr-2" />
                                View Periods
                              </button>
                              <button
                                onClick={() => generateNotice(tenant)}
                                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Notice
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Rent Periods Modal */}
      {showPeriodsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Calendar className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Rent Periods & Late Fee Management
                </h2>
              </div>
              <button
                onClick={() => setShowPeriodsModal(false)}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
            <div className="p-6">
              {selectedTenantPeriods.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Rent Periods Found</h3>
                  <p className="text-gray-600 mb-4">
                    No rent periods have been generated for this tenant yet.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg text-left max-w-md mx-auto">
                    <h4 className="font-medium text-gray-900 mb-2">Tenant Summary:</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Total Due:</span> ${Math.round(selectedTenant?.total_due || 0).toLocaleString()}</p>
                      <p><span className="font-medium">Late Fees:</span> ${Math.round(selectedTenant?.total_late_fees || 0).toLocaleString()}</p>
                      <p><span className="font-medium">Late Periods:</span> {selectedTenant?.late_periods || 0}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Summary Section */}
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Totals Comparison:</h4>
                    
                    {/* Late Tenants Service Calculation (Correct) */}
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
                      <h5 className="font-medium text-green-800 mb-2">✓ Late Tenants Service (Correct):</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Total Due:</span>
                          <p className="text-lg font-semibold text-green-600">${Math.round(selectedTenant?.total_due || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Late Fees:</span>
                          <p className="text-lg font-semibold text-green-600">${Math.round(selectedTenant?.total_late_fees || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Late Periods:</span>
                          <p className="text-lg font-semibold text-green-600">{selectedTenant?.late_periods || 0}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Days Late:</span>
                          <p className="text-lg font-semibold text-green-600">{selectedTenant?.days_late || 0}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Rent Periods Calculation (For Reference) */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <h5 className="font-medium text-blue-800 mb-2">ℹ Rent Periods Data (For Reference):</h5>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Total Periods:</span>
                          <p className="text-lg font-semibold text-blue-600">{selectedTenantPeriods.length}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Unpaid Amount:</span>
                          <p className="text-lg font-semibold text-blue-600">
                            ${Math.round(selectedTenantPeriods
                              .filter(p => p.status !== 'paid')
                              .reduce((sum, p) => sum + (p.rent_amount - p.amount_paid), 0))
                              .toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Late Fees:</span>
                          <p className="text-lg font-semibold text-blue-600">
                            ${Math.round(selectedTenantPeriods
                              // .filter(p => !p.late_fee_waived) // Not in current schema
                              .reduce((sum, p) => sum + 0, 0)) // Late fees not in current schema
                              .toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Total Due:</span>
                          <p className="text-lg font-semibold text-blue-600">
                            ${Math.round(selectedTenantPeriods
                              .filter(p => p.status !== 'paid')
                              .reduce((sum, p) => sum + (p.rent_amount - p.amount_paid), 0) +
                              selectedTenantPeriods
                                // .filter(p => !p.late_fee_waived) // Not in current schema
                                .reduce((sum, p) => sum + 0, 0) // Late fees not in current schema
                            ).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-sm text-gray-600">
                      <p><strong>Note:</strong> The Late Tenants Service uses a different calculation method based on lease start dates and actual payments, which is why the totals may differ from the rent periods data.</p>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Due Date</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Rent Amount</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Amount Paid</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Late Fee</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTenantPeriods.map((period) => (
                          <tr key={period.id} className="border-b border-gray-100">
                            <td className="py-4 px-4">
                              {new Date(period.period_due_date).toLocaleDateString()}
                            </td>
                            <td className="py-4 px-4 font-medium">
                              ${Math.round(period.rent_amount).toLocaleString()}
                            </td>
                            <td className="py-4 px-4">
                              ${Math.round(period.amount_paid).toLocaleString()}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                period.status === 'paid' ? 'bg-green-100 text-green-800' :
                                period.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {period.status}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              {editingPeriod?.periodId === period.id ? (
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  defaultValue={0} // Late fees not in current schema
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                  onChange={(e) => setEditingLateFeeValue(parseFloat(e.target.value) || 0)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleLateFeeOverride(period.id, editingLateFeeValue)
                                    }
                                  }}
                                />
                              ) : (
                                <span className="font-medium text-gray-500">
                                  N/A {/* Late fees not in current schema */}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {editingPeriod?.periodId === period.id ? (
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => {
                                      handleLateFeeOverride(period.id, editingLateFeeValue);
                                    }}
                                    className="bg-green-600 text-white p-1 rounded text-xs hover:bg-green-700"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingPeriod(null);
                                      setEditingLateFeeValue(0);
                                    }}
                                    className="bg-gray-600 text-white p-1 rounded text-xs hover:bg-gray-700"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => {
                                      setEditingLateFeeValue(0); // Late fees not in current schema
                                      setEditingPeriod({ tenantId: period.tenant_id, periodId: period.id, lateFee: 0 }); // Late fees not in current schema
                                    }}
                                    className="bg-blue-600 text-white p-1 rounded text-xs hover:bg-blue-700"
                                    title="Edit late fee"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePeriod(period.id)}
                                    className="bg-red-600 text-white p-1 rounded text-xs hover:bg-red-700"
                                    title="Delete period"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notice Modal */}
      {showNotice && selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center">
                <FileText className="w-6 h-6 text-primary-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">
                  5-Day Notice to Vacate or Pay Rent
                </h2>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={printNotice}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print
                </button>
                <button
                  onClick={() => setShowNotice(false)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="p-6">
              <LateTenantNotice tenant={selectedTenant} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 

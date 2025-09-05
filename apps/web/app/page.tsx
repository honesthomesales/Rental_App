'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Search, DollarSign, Home, Users, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { PropertiesService } from '@rental-app/api'
import { TenantsService } from '@rental-app/api'
import { extractRentCadence, normalizeRentToMonthly, calculateTotalLatePayments, isTenantLate } from '../lib/utils'

interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  zip_code: string
  property_type: string
  status: string
  bedrooms: number | null
  bathrooms: number | null
  square_feet: number | null
  year_built: number | null
  purchase_price: number | null
  purchase_date: string | null
  current_value: number | null
  // monthly_rent removed - rent data comes from RENT_leases
  is_for_rent: boolean
  is_for_sale: boolean
  insurance_policy_number: string | null
  insurance_provider: string | null
  insurance_expiry_date: string | null
  insurance_premium: number | null
  owner_name: string | null
  owner_phone: string | null
  owner_email: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface DashboardStats {
  total_properties: number
  total_tenants: number
  outstanding_balances: number
  monthly_income: number
  monthly_expenses: number
  profit: number
  total_bank_balance: number
  late_tenants_count: number
  property_type_breakdown: {
    house: number
    singlewide: number
    doublewide: number
    land: number
    loan: number
  }
}

export default function Dashboard() {
  const router = useRouter()
  const [properties, setProperties] = useState<Property[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    total_properties: 0,
    total_tenants: 0,
    outstanding_balances: 0,
    monthly_income: 0,
    monthly_expenses: 0,
    profit: 0,
    total_bank_balance: 0,
    late_tenants_count: 0,
    property_type_breakdown: {
      house: 0,
      singlewide: 0,
      doublewide: 0,
      land: 0,
      loan: 0
    }
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [mounted, setMounted] = useState(false)
  
  // Feature flag for new rent source system
  const useLeasePeriods = process.env.NEXT_PUBLIC_USE_LEASE_PERIODS === 'true' || true // Temporarily hardcoded for testing
  
  // Debug logging
  console.log('Dashboard - NEXT_PUBLIC_USE_LEASE_PERIODS:', process.env.NEXT_PUBLIC_USE_LEASE_PERIODS)
  console.log('Dashboard - useLeasePeriods:', useLeasePeriods)
  
  // Sorting state
  const [sortField, setSortField] = useState<'name' | 'address' | 'type' | 'status' | 'rent'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      if (useLeasePeriods) {
        loadDashboardDataFromViews()
      } else {
        loadDashboardDataOriginal()
      }
    }
  }, [mounted, useLeasePeriods])

  // Load data from new views when feature flag is enabled
  const loadDashboardDataFromViews = useCallback(async () => {
    try {
      setLoading(true)
      
      // Import supabase client
      const { supabase } = await import('@rental-app/api')
      
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }
      
      // Load data from new views in parallel
      const [expectedData, collectedData, propertiesResponse, tenantsResponse] = await Promise.all([
        (supabase as any).from('RENT_expected_by_month').select('*'),
        (supabase as any).from('RENT_collected_by_month').select('*'),
        PropertiesService.getAll(),
        TenantsService.getAll()
      ])
      
      const propertiesData = propertiesResponse.data
      const tenantsData = tenantsResponse.data
      
      if (propertiesData) {
        const convertedProperties = propertiesData.map(property => ({
          ...property,
          bedrooms: property.bedrooms ?? null,
          bathrooms: property.bathrooms ?? null,
          square_feet: property.square_feet ?? null,
          year_built: property.year_built ?? null,
          purchase_price: property.purchase_price ?? null,
          purchase_date: property.purchase_date ?? null,
          current_value: property.current_value ?? null,
          // monthly_rent removed - rent data comes from RENT_leases
          insurance_policy_number: property.insurance_policy_number ?? null,
          insurance_provider: property.insurance_provider ?? null,
          insurance_expiry_date: property.insurance_expiry_date ?? null,
          insurance_premium: property.insurance_premium ?? null,
          owner_name: property.owner_name ?? null,
          owner_phone: property.owner_phone ?? null,
          owner_email: property.owner_email ?? null,
          notes: property.notes ?? null
        }))
        setProperties(convertedProperties)
        
        // Calculate stats using new view data
        const calculatedStats = calculateDashboardStatsFromViews(
          convertedProperties, 
          tenantsData || [],
          expectedData.data || [],
          collectedData.data || []
        )
        setStats(calculatedStats)
      }
    } catch (error) {
      console.error('Error loading dashboard data from views:', error)
      // Fall back to original method
      await loadDashboardDataOriginal()
    } finally {
      setLoading(false)
    }
  }, [])

  // Original data loading method (fallback)
  const loadDashboardDataOriginal = useCallback(async () => {
    try {
      setLoading(true)
  
      // Load properties and tenants in parallel for better performance
      const [propertiesResponse, tenantsResponse] = await Promise.all([
        PropertiesService.getAll(),
        TenantsService.getAll()
      ])
      
      const propertiesData = propertiesResponse.data
      const tenantsData = tenantsResponse.data
      
      if (propertiesData) {
        // Convert API Property type to local Property type
        const convertedProperties = propertiesData.map(property => ({
          ...property,
          bedrooms: property.bedrooms ?? null,
          bathrooms: property.bathrooms ?? null,
          square_feet: property.square_feet ?? null,
          year_built: property.year_built ?? null,
          purchase_price: property.purchase_price ?? null,
          purchase_date: property.purchase_date ?? null,
          current_value: property.current_value ?? null,
          // monthly_rent removed - rent data comes from RENT_leases
          insurance_policy_number: property.insurance_policy_number ?? null,
          insurance_provider: property.insurance_provider ?? null,
          insurance_expiry_date: property.insurance_expiry_date ?? null,
          insurance_premium: property.insurance_premium ?? null,
          owner_name: property.owner_name ?? null,
          owner_phone: property.owner_phone ?? null,
          owner_email: property.owner_email ?? null,
          notes: property.notes ?? null
        }))
        setProperties(convertedProperties)
        
        // Calculate stats using memoized calculations
        const calculatedStats = calculateDashboardStats(convertedProperties, tenantsData || [])
        setStats(calculatedStats)
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  // Calculate stats using new view data
  const calculateDashboardStatsFromViews = useCallback((
    propertiesData: Property[], 
    tenantsData: any[], 
    expectedData: any[], 
    collectedData: any[]
  ): DashboardStats => {
    // Calculate basic stats
    const totalRent = propertiesData.reduce((sum, property) => {
      const rentCadence = extractRentCadence(property.notes || undefined)
      const normalizedRent = normalizeRentToMonthly(property.leases?.[0]?.rent || 0, rentCadence)
      return sum + normalizedRent
    }, 0)
    
    // Calculate property type breakdown
    const typeBreakdown = propertiesData.reduce((acc, property) => {
      const type = property.property_type || 'house'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Count occupied properties
    let occupiedCount = 0
    if (propertiesData && propertiesData.length > 0) {
      occupiedCount = propertiesData.filter(property => property.status === 'rented').length
    }
    
    // Calculate monthly income from collected data
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
    const currentMonthCollected = collectedData.find((item: any) => 
      item.month.startsWith(currentMonth)
    )
    const monthlyIncome = currentMonthCollected ? 
      (currentMonthCollected.collected_rent || 0) + (currentMonthCollected.collected_late_fees || 0) : 0
    
    // Calculate expected vs collected for current month
    const currentMonthExpected = expectedData.find((item: any) => 
      item.month.startsWith(currentMonth)
    )
    const expectedRent = currentMonthExpected ? 
      (currentMonthExpected.expected_rent || 0) + (currentMonthExpected.expected_late_fees || 0) : 0
    
    // Calculate outstanding balances (expected - collected)
    const outstandingBalances = expectedRent - monthlyIncome
    
    // Calculate late tenants count using new system
    let lateTenantsCount = 0
    if (tenantsData && tenantsData.length > 0) {
      // This will be improved when we have proper period data
      lateTenantsCount = tenantsData.filter((tenant: any) => {
        try {
          const property = propertiesData.find((p: any) => p.id === tenant.property_id)
          if (!property || !tenant.leases || tenant.leases.length === 0) {
            return false
          }
          
          const lease = tenant.leases[0]
          const leaseStartDate = new Date(lease.lease_start_date)
          const today = new Date()
          const daysSinceStart = Math.floor((today.getTime() - leaseStartDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysSinceStart > 30) {
            const paymentHistory = tenant.payment_history || []
            const recentPayments = paymentHistory.filter((p: any) => {
              const paymentDate = new Date(p.date)
              const daysSincePayment = Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24))
              return daysSincePayment <= 30
            })
            return recentPayments.length === 0
          }
          return false
        } catch (error) {
          console.error('Error checking tenant lateness:', error)
          return false
        }
      }).length
    }
    
    return {
      total_properties: propertiesData.length,
      total_tenants: occupiedCount,
      outstanding_balances: Math.max(0, outstandingBalances),
      monthly_income: monthlyIncome,
      monthly_expenses: 0, // TODO: Calculate from expenses data
      profit: monthlyIncome - 0, // TODO: Subtract expenses
      total_bank_balance: 0, // TODO: Calculate from bank data
      late_tenants_count: lateTenantsCount,
      property_type_breakdown: {
        house: typeBreakdown.house || 0,
        singlewide: typeBreakdown.singlewide || 0,
        doublewide: typeBreakdown.doublewide || 0,
        land: typeBreakdown.land || 0,
        loan: typeBreakdown.loan || 0
      }
    }
  }, [])

  // Memoize expensive calculations (original method)
  const calculateDashboardStats = useCallback((propertiesData: Property[], tenantsData: any[]): DashboardStats => {
    // Calculate basic stats with normalized rent amounts
    const totalRent = propertiesData.reduce((sum, property) => {
      const rentCadence = extractRentCadence(property.notes || undefined)
      const normalizedRent = normalizeRentToMonthly(property.leases?.[0]?.rent || 0, rentCadence)
      return sum + normalizedRent
    }, 0)
    
    // Calculate property type breakdown
    const typeBreakdown = propertiesData.reduce((acc, property) => {
      const type = property.property_type || 'house'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Count occupied properties using the same method as PropertiesService
    let occupiedCount = 0
    if (propertiesData && propertiesData.length > 0) {
      occupiedCount = propertiesData.filter(property => property.status === 'rented').length
    }
    
    // Calculate late tenants count using new pay period system
    let lateTenantsCount = 0
    let totalOutstanding = 0
    
    if (tenantsData && tenantsData.length > 0) {
      // For now, use a simple calculation based on lease data
      // This will be improved when we have proper payment data
      lateTenantsCount = tenantsData.filter((tenant: any) => {
        try {
          // Find the property for this tenant
          const property = propertiesData.find((p: any) => p.id === tenant.property_id)
          
          if (!property || !tenant.leases || tenant.leases.length === 0) {
            return false
          }
          
          const lease = tenant.leases[0]
          const leaseStartDate = new Date(lease.lease_start_date)
          const today = new Date()
          
          // Simple check: if lease started more than 30 days ago and no recent payments
          const daysSinceStart = Math.floor((today.getTime() - leaseStartDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysSinceStart > 30) {
            // Check if there are any payments in the payment_history
            const paymentHistory = tenant.payment_history || []
            const recentPayments = paymentHistory.filter((p: any) => {
              const paymentDate = new Date(p.date)
              const daysSincePayment = Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24))
              return daysSincePayment <= 30
            })
            
            return recentPayments.length === 0
          }
          
          return false
        } catch (error) {
          console.error('Error checking tenant late status:', error)
          return false
        }
      }).length
      
      // Calculate total outstanding from late tenants
      totalOutstanding = tenantsData.reduce((sum, tenant: any) => {
        try {
          const property = propertiesData.find((p: any) => p.id === tenant.property_id)
          if (property && tenant.leases && tenant.leases.length > 0) {
            const lease = tenant.leases[0]
            const leaseStartDate = new Date(lease.lease_start_date)
            const today = new Date()
            const daysSinceStart = Math.floor((today.getTime() - leaseStartDate.getTime()) / (1000 * 60 * 60 * 24))
            
            if (daysSinceStart > 30) {
              const paymentHistory = tenant.payment_history || []
              const recentPayments = paymentHistory.filter((p: any) => {
                const paymentDate = new Date(p.date)
                const daysSincePayment = Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24))
                return daysSincePayment <= 30
              })
              
              if (recentPayments.length === 0) {
                // Calculate estimated outstanding based on rent amount and time
                const rentAmount = lease.rent || 0
                const monthsOverdue = Math.floor(daysSinceStart / 30)
                return sum + (rentAmount * monthsOverdue)
              }
            }
          }
        } catch (error) {
          console.error('Error calculating outstanding for tenant:', error)
        }
        return sum
      }, 0)
    }
    
    return {
      total_properties: propertiesData.length,
      total_tenants: tenantsData?.length || 0,
      outstanding_balances: totalOutstanding,
      monthly_income: totalRent,
      monthly_expenses: 0, // TODO: Calculate from transactions
      profit: totalRent - 0, // TODO: Calculate from transactions
      total_bank_balance: 0, // TODO: Calculate from bank accounts
      late_tenants_count: lateTenantsCount,
      property_type_breakdown: {
        house: typeBreakdown.house || 0,
        singlewide: typeBreakdown.singlewide || 0,
        doublewide: typeBreakdown.doublewide || 0,
        land: typeBreakdown.land || 0,
        loan: typeBreakdown.loan || 0
      }
    }
  }, [])



  // Memoize filtered properties to prevent unnecessary re-renders
  const filteredProperties = useMemo(() => {
    if (!searchTerm.trim()) return properties
    
    const searchLower = searchTerm.toLowerCase()
    return properties.filter(property =>
      property.name.toLowerCase().includes(searchLower) ||
      property.address.toLowerCase().includes(searchLower) ||
      property.city.toLowerCase().includes(searchLower) ||
      property.state.toLowerCase().includes(searchLower)
    )
  }, [properties, searchTerm])

  // Sort properties based on current sort field and direction
  const sortedProperties = useMemo(() => {
    if (!filteredProperties.length) return []
    
    return [...filteredProperties].sort((a, b) => {
      let aValue: any
      let bValue: any
      
      switch (sortField) {
        case 'name':
          aValue = a.name?.toLowerCase() || ''
          bValue = b.name?.toLowerCase() || ''
          break
        case 'address':
          aValue = a.address?.toLowerCase() || ''
          bValue = b.address?.toLowerCase() || ''
          break
        case 'type':
          aValue = a.property_type?.toLowerCase() || ''
          bValue = b.property_type?.toLowerCase() || ''
          break
        case 'status':
          aValue = a.status?.toLowerCase() || ''
          bValue = b.status?.toLowerCase() || ''
          break
        case 'rent':
          aValue = a.leases?.[0]?.rent || 0
          bValue = b.leases?.[0]?.rent || 0
          break
        default:
          return 0
      }
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredProperties, sortField, sortDirection])

  // Handle sort column click
  const handleSort = (field: 'name' | 'address' | 'type' | 'status' | 'rent') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Memoize search handler
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  // Memoize navigation handlers
  const handlePropertyClick = useCallback((propertyId: string) => {
    router.push(`/properties/${propertyId}`)
  }, [router])

  const handleAddProperty = useCallback(() => {
    router.push('/properties/new')
  }, [router])

  const handleViewAllProperties = useCallback(() => {
    router.push('/properties')
  }, [router])

  const handleViewAllTenants = useCallback(() => {
    router.push('/tenants')
  }, [router])



  const handleViewLateTenants = useCallback(() => {
    // Force a complete page reload to ensure fresh component mount
    window.location.href = '/late-tenants'
  }, [])

  // Don't render until mounted to prevent hydration issues
  if (!mounted) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rental Dashboard 1.3</h1>
              <p className="text-gray-600">Manage your rental properties</p>
              
              {/* Feature flag banner */}
              {useLeasePeriods && (
                <div className="mt-2 p-2 bg-green-100 border border-green-300 rounded-md">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-xs font-medium text-green-800">
                        Using New Rent Period System - Data from RENT_expected_by_month and RENT_collected_by_month views
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleAddProperty}
                className="btn btn-primary btn-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Property
              </button>

            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-primary-100 rounded-lg">
                  <Home className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Properties</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_properties}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-success-100 rounded-lg">
                  <Users className="w-6 h-6 text-success-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Occupied</p>
                  <p className="text-2xl font-bold text-gray-900">{properties.filter(p => p.status === 'rented').length}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-warning-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-warning-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Income</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${Math.round(stats.monthly_income).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={handleViewLateTenants}>
            <div className="card-content">
              <div className="flex items-center">
                <div className="p-2 bg-danger-100 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-danger-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Late Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.late_tenants_count}</p>
                </div>
              </div>
            </div>
          </div>


        </div>

        {/* Property Type Breakdown */}
        <div className="card mb-6">
          <div className="card-header">
            <h2 className="card-title">Property Type Breakdown</h2>
            <p className="card-description">Distribution of your properties by type</p>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total_properties}</div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.property_type_breakdown.house}</div>
                <div className="text-sm text-gray-600">House</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.property_type_breakdown.doublewide}</div>
                <div className="text-sm text-gray-600">Doublewide</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.property_type_breakdown.singlewide}</div>
                <div className="text-sm text-gray-600">Singlewide</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats.property_type_breakdown.loan}</div>
                <div className="text-sm text-gray-600">Loan</div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties Section */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="card-title">Properties</h2>
                <p className="card-description">Manage your rental properties</p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search properties..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <button className="btn btn-secondary">
                  {/* <Filter className="w-4 h-4 mr-2" /> */}
                  Filter
                </button>
              </div>
            </div>
          </div>
          <div className="card-content">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Property
                        {sortField === 'name' && (
                          <span className="ml-1 text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('address')}
                    >
                      <div className="flex items-center">
                        Address
                        {sortField === 'address' && (
                          <span className="ml-1 text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('type')}
                    >
                      <div className="flex items-center">
                        Type
                        {sortField === 'type' && (
                          <span className="ml-1 text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center">
                        Status
                        {sortField === 'status' && (
                          <span className="ml-1 text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                      onClick={() => handleSort('rent')}
                    >
                      <div className="flex items-center">
                        Monthly Rent
                        {sortField === 'rent' && (
                          <span className="ml-1 text-blue-600">
                            {sortDirection === 'asc' ? '↑' : '↓'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{property.name}</div>
                        <div className="text-sm text-gray-500">{property.city}, {property.state}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {property.property_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          property.status === 'rented' ? 'bg-green-100 text-green-800' :
                          property.status === 'empty' ? 'bg-gray-100 text-gray-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {property.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {property.leases?.[0]?.rent ? `${property.leases[0].rent.toLocaleString()} (${property.leases[0].rent_cadence})` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => router.push(`/properties/edit/?id=${property.id}`)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
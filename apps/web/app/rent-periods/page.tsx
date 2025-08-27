'use client'

import { useState, useEffect, useCallback } from 'react'
import { TenantsService, PropertiesService, RentPeriodsService } from '@rental-app/api'
import { calculateTotalLatePayments, isTenantLate } from '../../lib/utils'
import { 
  AlertTriangle, 
  FileText, 
  Calendar,
  DollarSign,
  Home,
  Search,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

interface RentPeriod {
  id: string
  tenant_id: string
  property_id: string
  lease_id: string
  period_due_date: string
  rent_amount: number
  rent_cadence: string
  status: 'paid' | 'unpaid' | 'partial'
  amount_paid: number
  late_fee_applied: number
  late_fee_waived: boolean
  due_date_override: string | null
  notes: string | null
  created_at: string
  updated_at: string
  is_selected?: boolean
}

interface TenantWithPeriods {
  id: string
  first_name: string
  last_name: string
  property_id: string
  property_name: string
  property_address: string
  rent: number
  total_owed: number
  late_periods: number
  lease_start_date: string
  rent_cadence: string
  rent_periods: RentPeriod[]
}

export default function RentPeriodsPage() {
  const [tenants, setTenants] = useState<TenantWithPeriods[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(new Set())
  const [selectedPeriods, setSelectedPeriods] = useState<Set<string>>(new Set())
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadRentPeriods()
  }, [])

  const loadRentPeriods = async () => {
    try {
      setLoading(true)
      
      // Get all tenants with late payments
      const response = await TenantsService.getLateTenants()
      
      if (response.success && response.data) {
        // Transform the data and add rent periods
        const tenantsWithPeriods: TenantWithPeriods[] = await Promise.all(
          response.data.map(async (tenant: any) => {
            // Get rent periods for this tenant
            let rentPeriods: RentPeriod[] = []
            try {
              const periodsResponse = await TenantsService.getTenantRentPeriods(tenant.id)
              if (periodsResponse?.success && periodsResponse.data) {
                rentPeriods = periodsResponse.data
              }
            } catch (error) {
              console.log(`No rent periods found for tenant ${tenant.id}:`, error)
              // This is expected if the RENT_rent_periods table doesn't exist yet
            }
            
            // Add mock data for demonstration (remove this once the table is created)
            if (rentPeriods.length === 0) {
              rentPeriods = [
                {
                  id: `mock-${tenant.id}-1`,
                  tenant_id: tenant.id,
                  property_id: tenant.property_id || '',
                  lease_id: '',
                  period_due_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
                  rent_amount: tenant.properties?.monthly_rent || 1200,
                  rent_cadence: 'monthly',
                  status: 'unpaid' as const,
                  amount_paid: 0,
                  late_fee_applied: 45,
                  late_fee_waived: false,
                  due_date_override: null,
                  notes: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                },
                {
                  id: `mock-${tenant.id}-2`,
                  tenant_id: tenant.id,
                  property_id: tenant.property_id || '',
                  lease_id: '',
                  period_due_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days ago
                  rent_amount: tenant.properties?.monthly_rent || 1200,
                  rent_cadence: 'monthly',
                  status: 'unpaid' as const,
                  amount_paid: 0,
                  late_fee_applied: 45,
                  late_fee_waived: false,
                  due_date_override: null,
                  notes: null,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ]
            }
            
            return {
              id: tenant.id,
              first_name: tenant.first_name,
              last_name: tenant.last_name,
              property_id: tenant.property_id,
              property_name: tenant.properties?.name || 'Unknown Property',
              property_address: tenant.properties?.address || '',
              rent: tenant.properties?.monthly_rent || 0,
              total_owed: tenant.total_due || 0,
              late_periods: tenant.late_periods || 0,
              lease_start_date: tenant.leases?.[0]?.lease_start_date || '',
              rent_cadence: tenant.leases?.[0]?.rent_cadence || 'monthly',
              rent_periods: rentPeriods.map(period => ({
                ...period,
                is_selected: false
              }))
            }
          })
        )
        
        setTenants(tenantsWithPeriods)
      } else {
        console.error('Failed to load tenants')
        toast.error('Failed to load rent periods data')
      }
    } catch (error) {
      console.error('Error loading rent periods:', error)
      toast.error('Error loading rent periods data')
    } finally {
      setLoading(false)
    }
  }

  const handleTenantSelect = (tenantId: string, checked: boolean) => {
    const newSelected = new Set(selectedTenants)
    if (checked) {
      newSelected.add(tenantId)
    } else {
      newSelected.delete(tenantId)
    }
    setSelectedTenants(newSelected)
    
    // Clear period selections when tenant is deselected
    if (!checked) {
      const newPeriods = new Set(selectedPeriods)
      tenants.find(t => t.id === tenantId)?.rent_periods.forEach(period => {
        newPeriods.delete(period.id)
      })
      setSelectedPeriods(newPeriods)
    }
  }

  const handlePeriodSelect = (periodId: string, checked: boolean) => {
    const newSelected = new Set(selectedPeriods)
    if (checked) {
      newSelected.add(periodId)
    } else {
      newSelected.delete(periodId)
    }
    setSelectedPeriods(newSelected)
  }

  const handleSelectAllTenants = (checked: boolean) => {
    if (checked) {
      setSelectedTenants(new Set(tenants.map(t => t.id)))
    } else {
      setSelectedTenants(new Set())
      setSelectedPeriods(new Set())
    }
  }

  const handleSelectAllPeriods = (checked: boolean) => {
    if (checked) {
      const allPeriodIds = tenants
        .filter(t => selectedTenants.has(t.id))
        .flatMap(t => t.rent_periods)
        .map(p => p.id)
      setSelectedPeriods(new Set(allPeriodIds))
    } else {
      setSelectedPeriods(new Set())
    }
  }

  const handleWaiveLateFees = async () => {
    if (selectedPeriods.size === 0) {
      toast.error('Please select at least one period to waive late fees')
      return
    }

    if (!confirm(`Are you sure you want to waive late fees for ${selectedPeriods.size} selected period(s)?`)) {
      return
    }

    try {
      setUpdating(true)
      
      console.log('Attempting to waive late fees for periods:', Array.from(selectedPeriods))
      
      // Call the API to waive late fees for all selected periods
      const response = await RentPeriodsService.waiveLateFees(Array.from(selectedPeriods))
      
      console.log('API response:', response)
      
      if (response.success && response.data) {
        toast.success(`Late fees waived successfully for ${response.data.length} period(s)`)
        
        // Update local state without refreshing the page
        setTenants(prevTenants => 
          prevTenants.map(tenant => ({
            ...tenant,
            rent_periods: (tenant.rent_periods || []).map(period => 
              period && period.id && selectedPeriods.has(period.id)
                ? { ...period, late_fee_waived: true, is_selected: false }
                : period
            )
          }))
        )
        
        // Clear selections
        setSelectedPeriods(new Set())
        setSelectedTenants(new Set())
      } else {
        console.error('Failed to waive late fees:', response.error)
        toast.error(response.error || 'Failed to waive late fees')
      }
    } catch (error) {
      console.error('Error waiving late fees:', error)
      toast.error('Error waiving late fees')
    } finally {
      setUpdating(false)
    }
  }

  const filteredTenants = tenants.filter(tenant => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        tenant.first_name.toLowerCase().includes(searchLower) ||
        tenant.last_name.toLowerCase().includes(searchLower) ||
        tenant.property_name.toLowerCase().includes(searchLower) ||
        tenant.property_address.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const getRentCadenceDisplay = (cadence: string): string => {
    const normalized = cadence.toLowerCase().trim()
    switch (normalized) {
      case 'weekly':
        return 'Weekly'
      case 'bi-weekly':
      case 'biweekly':
      case 'bi_weekly':
        return 'Bi-weekly'
      case 'monthly':
      default:
        return 'Monthly'
    }
  }

  const getRentCadencePriority = (cadence: string): number => {
    const normalized = cadence.toLowerCase().trim()
    switch (normalized) {
      case 'weekly':
        return 1
      case 'bi-weekly':
      case 'biweekly':
      case 'bi_weekly':
        return 2
      case 'monthly':
      default:
        return 3
    }
  }

  const sortedTenants = filteredTenants.sort((a, b) => {
    const priorityA = getRentCadencePriority(a.rent_cadence)
    const priorityB = getRentCadencePriority(b.rent_cadence)
    if (priorityA !== priorityB) {
      return priorityA - priorityB
    }
    return b.total_owed - a.total_owed // Then by total owed (highest first)
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Loading rent periods...</p>
        </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Rent Periods & Late Fee Management</h1>
              <p className="text-gray-600">Manage rent periods and waive late fees in bulk</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={loadRentPeriods}
                disabled={updating}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${updating ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Calendar className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                New Payment Allocation System Active
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  This page now uses the new payment allocation system that automatically:
                </p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Calculates late fees based on cadence (Weekly: $10, Bi-weekly: $20, Monthly: $45)</li>
                  <li>Applies 5-day grace period before late fees</li>
                  <li>Allocates payments FIFO to cover late fees first, then rent</li>
                  <li>Creates future periods automatically when prepaying</li>
                  <li>Maintains audit trail in RENT_payment_allocations table</li>
                </ul>
                <p className="mt-2 font-medium">
                  To use this system, create payments through the Payments page and they will be automatically allocated.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Tenants</h3>
            <p className="text-3xl font-bold text-blue-600">{tenants.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Outstanding</h3>
            <p className="text-3xl font-bold text-red-600">
              ${tenants.reduce((sum, tenant) => sum + tenant.total_owed, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Selected Periods</h3>
            <p className="text-3xl font-bold text-green-600">{selectedPeriods.size}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Late Periods</h3>
            <p className="text-3xl font-bold text-red-600">
              {tenants.reduce((sum, tenant) => sum + tenant.late_periods, 0)}
            </p>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedPeriods.size > 0 && tenants.some(t => (t.rent_periods || []).length > 0) && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  Bulk Actions - {selectedPeriods.size} period(s) selected
                </h3>
                <p className="text-sm text-blue-700">
                  You can waive late fees for all selected periods at once
                </p>
              </div>
              <button
                onClick={handleWaiveLateFees}
                disabled={updating}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {updating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Waive Late Fees
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Bulk Actions Disabled Message */}
        {tenants.length > 0 && tenants.every(t => (t.rent_periods || []).length === 0) && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Bulk Actions Currently Unavailable
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Late fee waiver functionality requires the RENT_rent_periods database table to be created first.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mock Data Notice */}
        {tenants.length > 0 && tenants.some(t => (t.rent_periods || []).length > 0) && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Demo Mode Active
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    Mock rent period data is being displayed for demonstration purposes. You can test the selection and bulk actions functionality.
                  </p>
                  <p className="mt-1">
                    <strong>Note:</strong> These are not real database records. Create the RENT_rent_periods table to enable real functionality.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search tenants or properties..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedTenants.size === tenants.length && tenants.length > 0}
                    onChange={(e) => handleSelectAllTenants(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Select All Tenants</span>
                </label>
                {selectedTenants.size > 0 && (
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedPeriods.size === tenants
                        .filter(t => selectedTenants.has(t.id))
                        .flatMap(t => t.rent_periods).length && 
                        tenants.filter(t => selectedTenants.has(t.id)).flatMap(t => t.rent_periods).length > 0}
                      onChange={(e) => handleSelectAllPeriods(e.target.checked)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Select All Periods</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tenants and Rent Periods */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Rent Periods & Late Fees</h2>
            <p className="text-xs text-gray-500 mt-1">
              Sorted by payment cadence: Weekly (1) → Bi-weekly (2) → Monthly (3), then by total amount owed
            </p>
          </div>
          
          {/* Info about missing rent periods table */}
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Rent Periods Table Not Available
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    The RENT_rent_periods database table has not been created yet. This page will show tenant information 
                    but cannot display individual rent periods or allow late fee waivers until the table is set up.
                  </p>
                  <p className="mt-1">
                    <strong>To enable full functionality:</strong>
                  </p>
                  <ol className="list-decimal list-inside mt-1 space-y-1">
                    <li>Go to your Supabase dashboard</li>
                    <li>Open the SQL Editor</li>
                    <li>Run the migration file: <code className="bg-blue-100 px-1 rounded">supabase/migrations/005_create_rent_periods_table.sql</code></li>
                    <li>Refresh this page</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
          
          {sortedTenants.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {searchTerm ? 'No tenants found matching your search' : 'No tenants with late payments found'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sortedTenants.map((tenant) => (
                <div key={tenant.id} className="p-6">
                  {/* Tenant Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedTenants.has(tenant.id)}
                          onChange={(e) => handleTenantSelect(tenant.id, e.target.checked)}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </label>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {tenant.first_name} {tenant.last_name}
                        </h3>
                        <p className="text-sm text-gray-600">{tenant.property_address}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500">
                            Rent: ${tenant.rent.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-500">
                            Cadence: {getRentCadenceDisplay(tenant.rent_cadence)}
                          </span>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            getRentCadencePriority(tenant.rent_cadence) === 1 ? 'bg-red-100 text-red-800' :
                            getRentCadencePriority(tenant.rent_cadence) === 2 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            Priority {getRentCadencePriority(tenant.rent_cadence)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Total Owed</p>
                      <p className="text-2xl font-bold text-red-600">
                        ${tenant.total_owed.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Rent Periods Table */}
                  {tenant.rent_periods.length > 0 && (
                    <div className="ml-8">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <label className="flex items-center">
                                  <input
                                    type="checkbox"
                                    checked={tenant.rent_periods.every(p => selectedPeriods.has(p.id))}
                                    onChange={(e) => {
                                      tenant.rent_periods.forEach(period => {
                                        if (e.target.checked) {
                                          setSelectedPeriods(prev => {
                                            const newSet = new Set(prev)
                                            newSet.add(period.id)
                                            return newSet
                                          })
                                        } else {
                                          setSelectedPeriods(prev => {
                                            const newSet = new Set(prev)
                                            newSet.delete(period.id)
                                            return newSet
                                          })
                                        }
                                      })
                                    }}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                </label>
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Due Date
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rent Amount
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount Paid
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Late Fees
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Days Late
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {(tenant.rent_periods || []).filter(period => period && period.id).map((period) => (
                              <tr key={period.id} className={(period.late_fee_applied || 0) > 0 && !period.late_fee_waived ? 'bg-red-50' : 'bg-green-50'}>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <label className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={selectedPeriods.has(period.id)}
                                      onChange={(e) => handlePeriodSelect(period.id, e.target.checked)}
                                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                  </label>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {period.period_due_date ? new Date(period.period_due_date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  ${(period.rent_amount || 0).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  ${(period.amount_paid || 0).toLocaleString()}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <span className={`text-sm font-medium ${
                                    (period.late_fee_applied || 0) > 0 && !period.late_fee_waived ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    ${period.late_fee_waived ? '0 (Waived)' : (period.late_fee_applied || 0).toLocaleString()}
                                  </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                    (period.status || 'unpaid') === 'paid' ? 'bg-green-100 text-green-800' :
                                    (period.status || 'unpaid') === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {(period.status || 'unpaid').charAt(0).toUpperCase() + (period.status || 'unpaid').slice(1)}
                                  </span>
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                  {(() => {
                                    const dueDate = new Date(period.period_due_date)
                                    const today = new Date()
                                    const graceEnd = new Date(dueDate)
                                    graceEnd.setDate(graceEnd.getDate() + 5)
                                    const daysLate = today > graceEnd ? Math.floor((today.getTime() - graceEnd.getTime()) / (1000 * 60 * 60 * 24)) : 0
                                    
                                    return daysLate > 0 ? (
                                      <span className="text-red-600 font-medium">{daysLate}</span>
                                    ) : (
                                      <span className="text-green-600">0</span>
                                    )
                                  })()}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {tenant.rent_periods.length === 0 && (
                    <div className="ml-8 text-center py-4 text-gray-500">
                      <p>No rent periods found for this tenant</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Rent periods will be created automatically when payments are made using the new allocation system
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

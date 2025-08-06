'use client'

import { useState, useEffect } from 'react'
import { TenantsService } from '@rental-app/api'
import type { LateTenant } from '@rental-app/api'
import { 
  AlertTriangle, 
  FileText, 
  Printer, 
  Calendar,
  DollarSign,
  Home,
  Search
} from 'lucide-react'
import toast from 'react-hot-toast'
import { LateTenantNotice } from '@/components/LateTenantNotice'

export default function LateTenantsPage() {
  const [lateTenants, setLateTenants] = useState<LateTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<LateTenant | null>(null)
  const [showNotice, setShowNotice] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadLateTenants()
  }, [])

  const loadLateTenants = async () => {
    try {
      setLoading(true)
      const response = await TenantsService.getLateTenants()
      
      console.log('Late tenants response:', response)
      
      if (response.success && response.data) {
        console.log('Late tenants data:', response.data)
        // Sort tenants by total due (largest to smallest)
        const sortedTenants = sortTenantsByTotalDue(response.data)
        console.log('Sorted tenants:', sortedTenants)
        setLateTenants(sortedTenants)
      } else {
        console.error('Failed to load late tenants:', response.error)
        toast.error('Failed to load late tenants')
      }
    } catch (error) {
      console.error('Error loading late tenants:', error)
      toast.error('Error loading late tenants')
    } finally {
      setLoading(false)
    }
  }

  // Sort tenants by total due (largest to smallest)
  const sortTenantsByTotalDue = (tenants: LateTenant[]): LateTenant[] => {
    return [...tenants].sort((a, b) => {
      const totalDueA = calculateTotalDue(a)
      const totalDueB = calculateTotalDue(b)
      return totalDueB - totalDueA // Largest to smallest
    })
  }

  const calculateTotalDue = (tenant: LateTenant): number => {
    console.log('Calculating total due for tenant:', tenant.first_name, tenant.last_name)
    console.log('Tenant total_due:', tenant.total_due)
    console.log('Tenant total_late_fees:', tenant.total_late_fees)
    console.log('Tenant total_outstanding:', tenant.total_outstanding)
    
    if (tenant.total_due !== undefined) {
      console.log('Using API total_due:', tenant.total_due)
      return tenant.total_due;
    }
    
    const calculated = TenantsService.calculateTotalDue(tenant);
    console.log('Calculated total due:', calculated)
    return calculated;
  }

  const calculateDaysLate = (tenant: LateTenant): number => {
    // Use the calculated days late from the API if available
    if (tenant.days_late !== undefined) {
      return tenant.days_late;
    }
    
    // Fallback calculation if not provided by API
    const lastPaymentDate = tenant.last_payment_date ? new Date(tenant.last_payment_date) : null
    const today = new Date()
    return lastPaymentDate ? Math.floor((today.getTime() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24)) : 30
  }

  const getRentAmount = (tenant: LateTenant): number => {
    // Use property monthly rent (consistent with API)
    if (tenant.properties?.monthly_rent) {
      return tenant.properties.monthly_rent;
    }
    // Fallback to lease rent or tenant monthly rent
    if (tenant.leases && tenant.leases.length > 0) {
      return tenant.leases[0].rent || 0;
    }
    return tenant.monthly_rent || 0;
  }

  const getRentCadence = (tenant: LateTenant): string => {
    // Extract cadence from property notes (consistent with API)
    if (tenant.properties?.notes) {
      const notes = tenant.properties.notes.toLowerCase();
      if (notes.includes('weekly')) {
        return 'weekly';
      } else if (notes.includes('bi-weekly') || notes.includes('biweekly') || notes.includes('bi_weekly')) {
        return 'bi-weekly';
      }
    }
    
    // Fallback to lease cadence
    if (tenant.leases && tenant.leases.length > 0) {
      const cadence = tenant.leases[0].rent_cadence;
      if (cadence) {
        // Normalize the cadence format for display
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

  const getLatePeriods = (tenant: LateTenant): number => {
    return tenant.late_periods || 0
  }

  // Calculate total amount due across all late tenants
  const calculateTotalDueAllProperties = (): number => {
    return filteredLateTenants.reduce((total, tenant) => {
      return total + calculateTotalDue(tenant)
    }, 0)
  }

  // Filter late tenants based on search term
  const filteredLateTenants = lateTenants.filter(tenant => {
    const matchesSearch = 
      tenant.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.properties?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.properties?.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.properties?.city?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  const generateNotice = (tenant: LateTenant) => {
    setSelectedTenant(tenant)
    setShowNotice(true)
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
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Due All Properties</p>
                <p className="text-2xl font-bold text-red-600">${calculateTotalDueAllProperties().toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Late Tenants</p>
                <p className="text-2xl font-bold text-red-600">{filteredLateTenants.length}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by tenant name, property name, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredLateTenants.length === 0 ? (
          <div className="card">
            <div className="card-content text-center py-12">
              <AlertTriangle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No Late Tenants Found' : 'No Late Tenants'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search criteria.'
                  : 'All tenants are current on their rent payments.'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="card-title">Late Tenants</h2>
                  <p className="card-description">Generate 5-day notices for overdue tenants</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Sorted by payment cadence: Weekly (1) → Bi-weekly (2) → Monthly (3)
                  </p>
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
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Days Late</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Rent Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Late Periods</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Late Fees</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Total Due</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLateTenants.map((tenant) => {
                      const totalDue = calculateTotalDue(tenant)
                      const daysLate = calculateDaysLate(tenant)
                      const rentAmount = getRentAmount(tenant)
                      const rentCadence = getRentCadence(tenant)
                      const latePeriods = getLatePeriods(tenant)
                      const lateFees = tenant.total_late_fees || tenant.late_fees_owed || 0
                      
                      return (
                        <tr key={tenant.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                          <td className="py-4 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {daysLate} days
                            </span>
                          </td>
                          <td className="py-4 px-4 font-medium text-gray-900">
                            ${rentAmount.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 font-medium text-gray-900">
                            {latePeriods}
                          </td>
                          <td className="py-4 px-4 font-medium text-gray-900">
                            ${lateFees.toLocaleString()}
                          </td>
                          <td className="py-4 px-4 font-medium text-red-600">
                            ${totalDue.toLocaleString()}
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => generateNotice(tenant)}
                              className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 flex items-center"
                            >
                              <FileText className="w-4 h-4 mr-2" />
                              Generate Notice
                            </button>
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
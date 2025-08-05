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
  Home
} from 'lucide-react'
import toast from 'react-hot-toast'
import { LateTenantNotice } from '@/components/LateTenantNotice'

export default function LateTenantsPage() {
  const [lateTenants, setLateTenants] = useState<LateTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<LateTenant | null>(null)
  const [showNotice, setShowNotice] = useState(false)

  useEffect(() => {
    loadLateTenants()
  }, [])

  const loadLateTenants = async () => {
    try {
      setLoading(true)
      const response = await TenantsService.getLateTenants()
      
      if (response.success && response.data) {
        // Sort tenants by payment cadence: weekly first, then bi-weekly, then monthly
        const sortedTenants = sortTenantsByCadence(response.data)
        setLateTenants(sortedTenants)
      } else {
        toast.error('Failed to load late tenants')
      }
    } catch (error) {
      toast.error('Error loading late tenants')
    } finally {
      setLoading(false)
    }
  }

  // Sort tenants by payment cadence: weekly first, then bi-weekly, then monthly
  const sortTenantsByCadence = (tenants: LateTenant[]): LateTenant[] => {
    const getCadencePriority = (tenant: LateTenant): number => {
      const cadence = getRentCadence(tenant)
      
      switch (cadence) {
        case 'weekly':
          return 1
        case 'bi-weekly':
          return 2
        case 'monthly':
          return 3
        default:
          return 3 // Default to monthly priority
      }
    }

    return [...tenants].sort((a, b) => {
      const priorityA = getCadencePriority(a)
      const priorityB = getCadencePriority(b)
      return priorityA - priorityB
    })
  }

  const calculateTotalDue = (tenant: LateTenant): number => {
    if (tenant.total_due !== undefined) {
      return tenant.total_due;
    }
    return TenantsService.calculateTotalDue(tenant);
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
    if (tenant.leases && tenant.leases.length > 0) {
      return tenant.leases[0].rent || 0;
    }
    return tenant.monthly_rent || 0;
  }

  const getRentCadence = (tenant: LateTenant): string => {
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
    if (tenant.late_periods !== undefined) {
      return tenant.late_periods;
    }
    return 0;
  }

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
                <p className="text-sm text-gray-600">Total Late Tenants</p>
                <p className="text-2xl font-bold text-red-600">{lateTenants.length}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

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
                    {lateTenants.map((tenant) => {
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
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600 capitalize">{rentCadence}</span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                rentCadence === 'weekly' ? 'bg-red-100 text-red-800' :
                                rentCadence === 'bi-weekly' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {rentCadence === 'weekly' ? '1' : rentCadence === 'bi-weekly' ? '2' : '3'}
                              </span>
                            </div>
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
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TenantsService, PropertiesService } from '@rental-app/api'
import { calculateTotalLatePayments, isTenantLate } from '../../lib/utils'
import LatePaymentDetailsModal from '../../components/LatePaymentDetailsModal'

interface LateTenant {
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
  late_payment_info: any
}

export default function LatePaymentsPage() {
  const router = useRouter()
  const [lateTenants, setLateTenants] = useState<LateTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<LateTenant | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    loadLatePayments()
  }, [])

  const loadLatePayments = async () => {
    try {
      setLoading(true)
      
      // Load all tenants with lease data
      const tenantsResponse = await TenantsService.getAll()
      const tenantsData = tenantsResponse.data
      
      // Load all properties
      const propertiesResponse = await PropertiesService.getAll()
      const propertiesData = propertiesResponse.data
      
      if (!tenantsData || !propertiesData) {
        console.error('Failed to load data')
        return
      }

      const lateTenantsList: LateTenant[] = []

      // Process each tenant to find late payments (same logic as dashboard)
      tenantsData.forEach((tenant: any) => {
        try {
          // Find the property for this tenant
          const property = propertiesData.find((p: any) => p.id === tenant.property_id)
          if (!property) return

          // Get lease data from the joined leases table
          const lease = tenant.leases && tenant.leases.length > 0 ? tenant.leases[0] : null
          if (!lease || !lease.lease_start_date) return

          // Use the same logic as dashboard
          const tenantWithLease = { ...tenant, lease_start_date: lease.lease_start_date }
          const propertyWithNotes = { ...property, notes: property.notes || '' }
          
          const isLate = isTenantLate(tenantWithLease, propertyWithNotes)
          
          if (isLate) {
            const latePaymentInfo = calculateTotalLatePayments(tenantWithLease, propertyWithNotes)
            
            lateTenantsList.push({
              id: tenant.id,
              first_name: tenant.first_name,
              last_name: tenant.last_name,
              property_id: tenant.property_id,
              property_name: property.name,
              property_address: property.address,
              rent: property.monthly_rent || 0,
              total_owed: latePaymentInfo.totalDue,
              late_periods: latePaymentInfo.latePeriods,
              lease_start_date: lease.lease_start_date,
              rent_cadence: lease.rent_cadence || 'monthly',
              late_payment_info: latePaymentInfo
            })
          }
        } catch (error) {
          console.error('Error processing tenant:', tenant.first_name, tenant.last_name, error)
        }
      })

      // Sort by payment cadence first (weekly, bi-weekly, monthly), then by total amount owed
      lateTenantsList.sort((a, b) => {
        // First, sort by cadence priority
        const getCadencePriority = (cadence: string): number => {
          const normalized = cadence.toLowerCase().trim();
          
          switch (normalized) {
            case 'weekly':
              return 1;
            case 'bi-weekly':
            case 'biweekly':
            case 'bi_weekly':
              return 2;
            case 'monthly':
            default:
              return 3;
          }
        };

        const priorityA = getCadencePriority(a.rent_cadence);
        const priorityB = getCadencePriority(b.rent_cadence);

        // If cadence priorities are different, sort by cadence
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        // If cadence is the same, sort by total amount owed (highest first)
        return b.total_owed - a.total_owed;
      });
      
      setLateTenants(lateTenantsList)
    } catch (error) {
      console.error('Error loading late payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDetailsClick = (tenant: LateTenant) => {
    setSelectedTenant(tenant)
    setShowModal(true)
  }

  const handleModalClose = () => {
    setShowModal(false)
    setSelectedTenant(null)
  }

  const handleModalSave = async (updatedData: any) => {
    // Here you would save the updated data to the database
    
    
    // Reload the data to reflect changes
    await loadLatePayments()
    handleModalClose()
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
              <h1 className="text-3xl font-bold text-gray-900">Late Payments</h1>
              <p className="text-gray-600">Manage tenants with outstanding balances</p>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Late Tenants</h3>
            <p className="text-3xl font-bold text-red-600">{lateTenants.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Outstanding</h3>
            <p className="text-3xl font-bold text-red-600">
              ${lateTenants.reduce((sum, tenant) => sum + tenant.total_owed, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Average Per Tenant</h3>
            <p className="text-3xl font-bold text-red-600">
              ${lateTenants.length > 0 ? (lateTenants.reduce((sum, tenant) => sum + tenant.total_owed, 0) / lateTenants.length).toFixed(0) : 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900">Total Late Periods</h3>
            <p className="text-3xl font-bold text-red-600">
              {lateTenants.reduce((sum, tenant) => sum + tenant.late_periods, 0)}
            </p>
          </div>
        </div>

        {/* Late Payments Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Late Payment Details</h2>
            <p className="text-xs text-gray-500 mt-1">
              Sorted by payment cadence: Weekly (1) → Bi-weekly (2) → Monthly (3), then by total amount owed
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rent Cadence
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Owed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Late Periods
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {lateTenants.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {tenant.first_name} {tenant.last_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tenant.property_address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 capitalize">{tenant.rent_cadence}</span>
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                          tenant.rent_cadence.toLowerCase() === 'weekly' ? 'bg-red-100 text-red-800' :
                          tenant.rent_cadence.toLowerCase() === 'bi-weekly' || tenant.rent_cadence.toLowerCase() === 'biweekly' || tenant.rent_cadence.toLowerCase() === 'bi_weekly' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {tenant.rent_cadence.toLowerCase() === 'weekly' ? '1' : 
                           tenant.rent_cadence.toLowerCase() === 'bi-weekly' || tenant.rent_cadence.toLowerCase() === 'biweekly' || tenant.rent_cadence.toLowerCase() === 'bi_weekly' ? '2' : '3'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${tenant.rent.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-red-600">
                        ${tenant.total_owed.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{tenant.late_periods}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleDetailsClick(tenant)}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 px-3 py-1 rounded-md transition-colors"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {lateTenants.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No late payments found</p>
            </div>
          )}
        </div>
      </main>

      {/* Details Modal */}
      {showModal && selectedTenant && (
        <LatePaymentDetailsModal
          tenant={selectedTenant}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  )
} 
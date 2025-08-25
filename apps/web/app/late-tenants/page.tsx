'use client'

import { useState, useEffect } from 'react'
import { TenantsService, RentPeriodsService, supabase } from '@rental-app/api'
import type { LateTenant, RentPeriod } from '@rental-app/api'
import { 
  AlertTriangle, 
  FileText, 
  Printer, 
  Calendar,
  Edit3,
  Check,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { LateTenantNotice } from '@/components/LateTenantNotice'

export default function LateTenantsPage() {
  const [lateTenants, setLateTenants] = useState<LateTenant[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTenant, setSelectedTenant] = useState<LateTenant | null>(null)
  const [showNotice, setShowNotice] = useState(false)
  const [editingPeriod, setEditingPeriod] = useState<{ tenantId: string; periodId: string; lateFee: number } | null>(null)
  const [showPeriodsModal, setShowPeriodsModal] = useState(false)
  const [selectedTenantPeriods, setSelectedTenantPeriods] = useState<RentPeriod[]>([])
  const [editingLateFeeValue, setEditingLateFeeValue] = useState<number>(0)

  useEffect(() => {
    loadLateTenants()
  }, [])

  const loadLateTenants = async () => {
    try {
      setLoading(true)
      const response = await TenantsService.getLateTenants()
      
      if (response.success && response.data) {
        // The API now returns properly calculated values
        setLateTenants(response.data)
      } else {
        toast.error('Failed to load late tenants')
      }
    } catch (error) {
      toast.error('Error loading late tenants')
    } finally {
      setLoading(false)
    }
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
      console.log('Tenant data:', tenant)
      
      // Store the selected tenant for the modal
      setSelectedTenant(tenant)
      
      // Get rent periods - temporarily commented out due to missing service method
      // const periodsResponse = await RentPeriodsService.getTenantRentPeriods(tenant.id)
      // console.log('Rent periods response:', periodsResponse)
      
      // Get actual payments to match the late tenants calculation
      if (!supabase) {
        console.error('Supabase client not available')
        toast.error('Database connection not available')
        return
      }
      
      const { data: paymentsData } = await supabase
        .from('RENT_payments')
        .select('id, amount, payment_date, payment_type')
        .eq('tenant_id', tenant.id)
        .order('payment_date', { ascending: false })
      
      console.log('Payments data:', paymentsData)
      
      // Temporarily comment out rent periods logic due to missing service methods
      /*
      if (periodsResponse.success && periodsResponse.data && periodsResponse.data.length > 0) {
        console.log('Setting tenant periods:', periodsResponse.data)
        console.log('Number of periods found:', periodsResponse.data.length)
        
        setSelectedTenantPeriods(periodsResponse.data)
        setShowPeriodsModal(true)
        console.log('Modal should now be visible, showPeriodsModal:', true)
      } else {
        // No rent periods found - try to generate them automatically
        console.log('No rent periods found, attempting to generate them...')
        toast.success('Generating rent periods for this tenant...')
        
        try {
          // Get tenant's lease information
          const { data: leases } = await supabase
            .from('RENT_leases')
            .select('*')
            .eq('tenant_id', tenant.id)
            .order('lease_start_date', { ascending: false })
            .limit(1)
          
          if (leases && leases.length > 0) {
            const lease = leases[0]
            // Generate rent periods using the service
            const generateResponse = await RentPeriodsService.createRentPeriods(tenant, lease)
            
            if (generateResponse.success && generateResponse.data) {
              console.log('Successfully generated rent periods:', generateResponse.data)
              setSelectedTenantPeriods(generateResponse.data)
              setShowPeriodsModal(true)
              toast.success('Rent periods generated successfully')
            } else {
              console.error('Failed to generate rent periods:', generateResponse.error)
              toast.error('Failed to generate rent periods. Please run the generation script.')
              // Still show the modal with basic info
              setShowPeriodsModal(true)
            }
          } else {
            console.log('No leases found for tenant')
            toast.error('No lease information found for this tenant. Please add a lease first.')
            // Still show the modal with basic info
            setShowPeriodsModal(true)
          }
        } catch (error) {
          console.error('Error generating rent periods:', error)
          toast.error('Error generating rent periods. Please run the generation script.')
          // Still show the modal with basic info
          setShowPeriodsModal(true)
        }
      }
      */
      
      // For now, just show the modal with basic info
      setShowPeriodsModal(true)
    } catch (error) {
      console.error('Error loading rent periods:', error)
      toast.error('Error loading rent periods')
    }
  }

  const handleLateFeeOverride = async (periodId: string, newLateFee: number) => {
    try {
      // Temporarily commented out due to missing service method
      /*
      const response = await RentPeriodsService.updateRentPeriod(periodId, {
        late_fee_applied: newLateFee,
        late_fee_waived: newLateFee === 0
      })

      if (response.success) {
        toast.success('Late fee updated successfully')
        setEditingPeriod(null)
        setEditingLateFeeValue(0)
        // Reload the late tenants to get updated calculations
        await loadLateTenants()
      } else {
        toast.error('Failed to update late fee')
      }
      */
      
      // For now, just show a success message
      toast.success('Late fee update functionality temporarily disabled')
      setEditingPeriod(null)
      setEditingLateFeeValue(0)
    } catch (error) {
      toast.error('Error updating late fee')
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

  // Debug logging
  console.log('LateTenantsPage render - showPeriodsModal:', showPeriodsModal, 'selectedTenantPeriods:', selectedTenantPeriods)

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
                  ${lateTenants.reduce((sum, t) => sum + (t.total_due || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Total Late Fees</p>
                <p className="text-2xl font-bold text-orange-600">
                  ${lateTenants.reduce((sum, t) => sum + (t.total_late_fees || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Avg Amount Due</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ${lateTenants.length > 0 ? (lateTenants.reduce((sum, t) => sum + (t.total_due || 0), 0) / lateTenants.length).toFixed(0) : 0}
                </p>
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
                    {lateTenants.map((tenant) => {
                      const totalDue = tenant.total_due || 0
                      const rentAmount = getRentAmount(tenant)
                      const rentCadence = getRentCadence(tenant)
                      const latePeriods = tenant.late_periods || 0
                      const lateFees = tenant.total_late_fees || 0
                      const rowBackgroundColor = getRowBackgroundColor(totalDue)
                      
                      return (
                        <tr key={tenant.id} className={`border-b border-gray-100 hover:bg-gray-100 ${rowBackgroundColor}`}>
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
                      <p><span className="font-medium">Total Due:</span> ${(selectedTenant?.total_due || 0).toLocaleString()}</p>
                      <p><span className="font-medium">Late Fees:</span> ${(selectedTenant?.total_late_fees || 0).toLocaleString()}</p>
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
                          <p className="text-lg font-semibold text-green-600">${(selectedTenant?.total_due || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Late Fees:</span>
                          <p className="text-lg font-semibold text-green-600">${(selectedTenant?.total_late_fees || 0).toLocaleString()}</p>
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
                            ${selectedTenantPeriods
                              .filter(p => p.status !== 'paid')
                              .reduce((sum, p) => sum + (p.rent_amount - p.amount_paid), 0)
                              .toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Late Fees:</span>
                          <p className="text-lg font-semibold text-blue-600">
                            ${selectedTenantPeriods
                              .filter(p => !p.late_fee_waived)
                              .reduce((sum, p) => sum + p.late_fee_applied, 0)
                              .toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Total Due:</span>
                          <p className="text-lg font-semibold text-blue-600">
                            ${(selectedTenantPeriods
                              .filter(p => p.status !== 'paid')
                              .reduce((sum, p) => sum + (p.rent_amount - p.amount_paid), 0) +
                              selectedTenantPeriods
                                .filter(p => !p.late_fee_waived)
                                .reduce((sum, p) => sum + p.late_fee_applied, 0)
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
                              ${period.rent_amount.toLocaleString()}
                            </td>
                            <td className="py-4 px-4">
                              ${period.amount_paid.toLocaleString()}
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
                                  defaultValue={period.late_fee_applied}
                                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                  onChange={(e) => setEditingLateFeeValue(parseFloat(e.target.value) || 0)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      handleLateFeeOverride(period.id, editingLateFeeValue)
                                    }
                                  }}
                                />
                              ) : (
                                <span className={`font-medium ${period.late_fee_waived ? 'text-gray-500 line-through' : 'text-red-600'}`}>
                                  ${period.late_fee_applied.toLocaleString()}
                                  {period.late_fee_waived && ' (waived)'}
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
                                <button
                                  onClick={() => {
                                    setEditingLateFeeValue(period.late_fee_applied);
                                    setEditingPeriod({ tenantId: period.tenant_id, periodId: period.id, lateFee: period.late_fee_applied });
                                  }}
                                  className="bg-blue-600 text-white p-1 rounded text-xs hover:bg-blue-700"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </button>
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
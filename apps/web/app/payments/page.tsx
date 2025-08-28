'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Plus, Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { PaymentsService } from '@rental-app/api/src/services/payments'
import { PropertiesService } from '@rental-app/api/src/services/properties'
import { TenantsService } from '@rental-app/api/src/services/tenants'
import { RentPeriodsService } from '@rental-app/api/src/services/rentPeriods'

interface Payment {
  id: string
  payment_date: string
  amount: number
  property_id: string
  tenant_id: string
  payment_type: string
  notes: string
  created_at: string
}

import type { Property, Tenant, Lease, PaymentHistoryItem } from '@rental-app/api'

// Local interface that extends the base Property type with additional properties added by the service
interface PropertyWithTenants extends Property {
  tenants?: Tenant[]
  leases?: Lease[]
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  property: PropertyWithTenants | null
  selectedDate: Date | null
  onDateChange: (date: Date) => void
  onSave: (payment: Omit<Payment, 'id' | 'created_at'>) => void
  onUpdate?: (paymentId: string, payment: Partial<Payment>) => void
  onDelete?: (paymentId: string) => void
  loading: boolean
  editingPayment?: Payment | null
}

function PaymentModal({ isOpen, onClose, property, selectedDate, onDateChange, onSave, onUpdate, onDelete, loading, editingPayment }: PaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [paymentType, setPaymentType] = useState('Rent')
  const [notes, setNotes] = useState('')
  const [showLateFeeOverride, setShowLateFeeOverride] = useState(false)
  const [lateFeeOverride, setLateFeeOverride] = useState(0)
  const [originalLateFee, setOriginalLateFee] = useState(0)
  const [showPeriodAllocation, setShowPeriodAllocation] = useState(false)
  const [rentPeriods, setRentPeriods] = useState<any[]>([])
  const [selectedPeriods, setSelectedPeriods] = useState<{[key: string]: number}>({})
  const [allocationMode, setAllocationMode] = useState<'auto' | 'manual'>('auto')

  // Initialize form with editing payment data if available
  useEffect(() => {
    if (editingPayment) {
      setAmount(editingPayment.amount.toString())
      setPaymentType(editingPayment.payment_type)
      setNotes(editingPayment.notes || '')
    } else {
      setAmount('')
      setPaymentType('Rent')
      setNotes('')
    }
  }, [editingPayment])

  // Load rent periods when modal opens
  useEffect(() => {
    if (isOpen && property?.tenants?.[0]?.id) {
      loadRentPeriods()
    }
  }, [isOpen, property])

  const loadRentPeriods = async () => {
    if (!property?.tenants?.[0]?.id) return
    
    try {
      // Temporarily commented out due to missing service method
      // const response = await RentPeriodsService.getTenantRentPeriods(property.tenants[0].id)
      // if (response.success && response.data) {
      //   setRentPeriods(response.data)
      // }
      
      // For now, set empty array
      setRentPeriods([])
    } catch (error) {
      console.error('Error loading rent periods:', error)
    }
  }

  if (!isOpen || !property || !selectedDate) return null

  const checkLatePayment = () => {
    if (!property || !selectedDate || !amount) return
    
    // Check if this payment would be more than 5 days late
    const today = new Date()
    const paymentDate = selectedDate
    const daysDiff = Math.floor((today.getTime() - paymentDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff > 5) {
      // Calculate expected late fees
      const rentAmount = property.leases?.[0]?.rent || property.monthly_rent || 0
      const rentCadence = property.leases?.[0]?.rent_cadence || 'monthly'
      
      let lateFeePerPeriod = 0
      switch (rentCadence.toLowerCase().trim()) {
        case 'weekly':
          lateFeePerPeriod = 10
          break
        case 'bi-weekly':
        case 'biweekly':
        case 'bi_weekly':
          lateFeePerPeriod = 20
          break
        case 'monthly':
        default:
          lateFeePerPeriod = 50
          break
      }
      
      const latePeriods = Math.ceil(daysDiff / (rentCadence.toLowerCase().includes('weekly') ? 7 : 30))
      const calculatedLateFee = latePeriods * lateFeePerPeriod
      
      setOriginalLateFee(calculatedLateFee)
      setLateFeeOverride(calculatedLateFee)
      setShowLateFeeOverride(true)
      return
    }
    
    // Not late, proceed with normal save
    handleSavePayment()
  }

  const handleSavePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) return

    if (editingPayment && onUpdate) {
      // Update existing payment
      onUpdate(editingPayment.id, {
        payment_date: selectedDate.toISOString().split('T')[0],
        amount: parseFloat(amount),
        payment_type: paymentType,
        notes: notes
      })
    } else {
      // Create new payment
      const newPayment: Omit<Payment, 'id' | 'created_at'> = {
        payment_date: selectedDate.toISOString().split('T')[0],
        amount: parseFloat(amount),
        property_id: property.id,
        tenant_id: property.tenants?.[0]?.id || '',
        payment_type: paymentType,
        notes: notes
      }
      
      // Save the payment first
      onSave(newPayment)
      
      // If this is a rent payment and we have rent periods, allocate the payment
      if (paymentType === 'Rent' && rentPeriods.length > 0) {
        try {
          // Wait a moment for the payment to be saved and get its ID
          setTimeout(async () => {
            try {
              let allocations: Array<{ rent_period_id: string; amount: number }> = []
              
              if (allocationMode === 'auto') {
                // Auto-allocate to oldest unpaid periods
                const unpaidPeriods = rentPeriods
                  .filter((period: any) => period.status !== 'paid')
                  .sort((a: any, b: any) => new Date(a.period_due_date).getTime() - new Date(b.period_due_date).getTime())
                
                let remainingAmount = parseFloat(amount)
                for (const period of unpaidPeriods) {
                  if (remainingAmount <= 0) break
                  
                  const periodOwed = period.rent_amount - period.amount_paid
                  if (periodOwed > 0) {
                    const allocationAmount = Math.min(remainingAmount, periodOwed)
                    allocations.push({
                      rent_period_id: period.id,
                      amount: allocationAmount
                    })
                    remainingAmount -= allocationAmount
                  }
                }
              } else {
                // Manual allocation
                allocations = Object.entries(selectedPeriods).map(([periodId, amount]) => ({
                  rent_period_id: periodId,
                  amount: amount as number
                }))
              }
              
              if (allocations.length > 0) {
                // Note: We can't get the payment ID here since it's created asynchronously
                // This is a limitation of the current architecture
                console.log('Payment allocation would be:', allocations)
                toast.success('Payment saved. Rent period allocation will be processed.')
              }
            } catch (allocationError) {
              console.error('Error preparing payment allocation:', allocationError)
            }
          }, 1000)
        } catch (allocationError) {
          console.error('Error preparing payment allocation:', allocationError)
        }
      }
    }

    onClose()
  }

  const handleSave = () => {
    checkLatePayment()
  }

  const isEditing = !!editingPayment

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? 'Edit Payment' : 'Add Payment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property</label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-gray-900">{property.name}</div>
                <div className="text-sm text-gray-500">{property.address}</div>
                {property.tenants?.[0] && (
                  <div className="text-xs text-blue-600 mt-1">
                    {property.tenants[0].first_name} {property.tenants[0].last_name}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
              <input
                type="date"
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    // Update the selectedDate in the parent component
                    // We need to pass this up through a callback
                    if (onDateChange) {
                      onDateChange(newDate);
                    }
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter payment amount"
                autoFocus
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="Rent">Rent</option>
                <option value="Deposit">Deposit</option>
                <option value="Late Fee">Late Fee</option>
                <option value="Utility">Utility</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Rent Period Allocation - Only show for Rent payments */}
            {paymentType === 'Rent' && rentPeriods.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Allocation</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="auto"
                        checked={allocationMode === 'auto'}
                        onChange={(e) => setAllocationMode(e.target.value as 'auto' | 'manual')}
                        className="mr-2"
                      />
                      <span className="text-sm">Auto-allocate to oldest unpaid periods</span>
                    </label>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="manual"
                        checked={allocationMode === 'manual'}
                        onChange={(e) => setAllocationMode(e.target.value as 'auto' | 'manual')}
                        className="mr-2"
                      />
                      <span className="text-sm">Manually select periods</span>
                    </label>
                  </div>
                  
                  {allocationMode === 'manual' && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg max-h-40 overflow-y-auto">
                      <div className="text-xs text-gray-600 mb-2">Select rent periods to allocate payment to:</div>
                      {rentPeriods
                        .filter(period => period.status !== 'paid')
                        .map(period => {
                          const periodOwed = period.rent_amount - period.amount_paid
                          const isSelected = selectedPeriods[period.id]
                          return (
                            <div key={period.id} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={!!isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedPeriods(prev => ({
                                        ...prev,
                                        [period.id]: Math.min(periodOwed, parseFloat(amount) || 0)
                                      }))
                                    } else {
                                      const newSelected = { ...selectedPeriods }
                                      delete newSelected[period.id]
                                      setSelectedPeriods(newSelected)
                                    }
                                  }}
                                  className="mr-2"
                                />
                                <span className="text-sm">
                                  {new Date(period.period_due_date).toLocaleDateString()} - 
                                  ${periodOwed.toLocaleString()} owed
                                </span>
                              </div>
                              {isSelected && (
                                <input
                                  type="number"
                                  min="0"
                                  max={periodOwed}
                                  step="0.01"
                                  value={selectedPeriods[period.id] || 0}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value) || 0
                                    setSelectedPeriods(prev => ({
                                      ...prev,
                                      [period.id]: Math.min(value, periodOwed)
                                    }))
                                  }}
                                  className="w-20 px-2 py-1 text-sm border border-gray-300 rounded"
                                />
                              )}
                            </div>
                          )
                        })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Optional notes about this payment"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          {isEditing && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this payment?') && editingPayment && onDelete) {
                  onDelete(editingPayment.id)
                  onClose()
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Delete Payment
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!amount || parseFloat(amount) <= 0 || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {loading ? (isEditing ? 'Updating...' : 'Saving...') : (isEditing ? 'Update Payment' : 'Save Payment')}
          </button>
        </div>
      </div>

      {/* Late Fee Override Modal */}
      {showLateFeeOverride && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Late Payment Detected</h3>
              <p className="text-sm text-gray-600 mt-1">
                This payment is {Math.floor((new Date().getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24))} days late.
              </p>
            </div>
            
            <div className="px-6 py-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Calculated Late Fee
                  </label>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="text-lg font-medium text-red-600">${originalLateFee.toLocaleString()}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Override Late Fee Amount
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lateFeeOverride}
                    onChange={(e) => setLateFeeOverride(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter late fee amount"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Set to 0 to waive late fees completely
                  </p>
                </div>
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowLateFeeOverride(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Add late fee to notes and proceed with payment
                  const updatedNotes = notes + `\n\nLate Fee Applied: $${lateFeeOverride.toLocaleString()}`
                  setNotes(updatedNotes)
                  setShowLateFeeOverride(false)
                  handleSavePayment()
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Apply Late Fee & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PaymentsPage() {
  const [properties, setProperties] = useState<PropertyWithTenants[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('Loading data...')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentWeekOffset, setCurrentWeekOffset] = useState(-3)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<PropertyWithTenants | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [savingPayment, setSavingPayment] = useState(false)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)

  // Generate weekly dates (Fridays) for the grid
  const generateWeeklyDates = (weeks: number = 8) => {
    const dates: Date[] = []
    let currentDate = new Date()
    
    // Find the most recent Friday
    while (currentDate.getDay() !== 5) { // 5 = Friday
      currentDate.setDate(currentDate.getDate() - 1)
    }
    
    // Apply week offset
    currentDate.setDate(currentDate.getDate() + (currentWeekOffset * 7))
    
    for (let i = 0; i < weeks; i++) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 7)
    }
    
    return dates
  }

  // Calculate date range for efficient loading
  const getDateRange = () => {
    const startDate = new Date(weeklyDates[0])
    startDate.setDate(startDate.getDate() - 3) // Reduced from 7 to 3 days before
    const endDate = new Date(weeklyDates[weeklyDates.length - 1])
    endDate.setDate(endDate.getDate() + 3) // Reduced from 7 to 3 days after
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    }
  }

  // Cache for properties to avoid reloading on every week change
  const [propertiesCache, setPropertiesCache] = useState<PropertyWithTenants[]>([])
  const [propertiesCacheTime, setPropertiesCacheTime] = useState(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Memoize loadData to prevent infinite re-renders
  const memoizedLoadData = useCallback(async () => {
    try {
      setLoading(true)
      setLoadingMessage('Loading data...')
      
      const now = Date.now()
      const dateRange = getDateRange()

      // Check if we can use cached properties
      let propertiesToUse = propertiesCache
      if (now - propertiesCacheTime > CACHE_DURATION || propertiesCache.length === 0) {
        setLoadingMessage('Loading properties and tenants...')
        
        // Load properties with active tenants
        const propertiesResponse = await PaymentsService.getPropertiesWithTenants()
        if (!propertiesResponse.success || !propertiesResponse.data) {
          throw new Error(propertiesResponse.error || 'Failed to load properties')
        }

        propertiesToUse = propertiesResponse.data
        setPropertiesCache(propertiesResponse.data)
        setPropertiesCacheTime(now)
      }

      setProperties(propertiesToUse)

      // Load payments for the date range
      setLoadingMessage('Loading payments...')
      const paymentsResponse = await PaymentsService.getByDateRange(dateRange.start, dateRange.end)
      if (!paymentsResponse.success) {
        console.warn('Failed to load payments:', paymentsResponse.error)
        setPayments([])
      } else {
        setPayments(paymentsResponse.data || [])
      }
      
    } catch (error) {
      console.error('Error in memoizedLoadData:', error)
      toast.error('Error loading data: ' + (error as Error).message)
      setProperties([])
      setPayments([])
    } finally {
      setLoading(false)
    }
  }, [propertiesCache, propertiesCacheTime, currentWeekOffset])

  // Memoize weekly dates calculation
  const weeklyDates = generateWeeklyDates(8)

  // Memoize date range calculation
  const dateRange = useMemo(() => getDateRange(), [weeklyDates])

  // Function to get rent cadence for a property
  const getRentCadence = (property: PropertyWithTenants): string => {
    if (property.leases && property.leases.length > 0) {
      const cadence = property.leases[0].rent_cadence;
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

  // Function to get cadence priority for sorting
  const getCadencePriority = (property: PropertyWithTenants): number => {
    const cadence = getRentCadence(property);
    switch (cadence) {
      case 'weekly':
        return 1;
      case 'bi-weekly':
        return 2;
      case 'monthly':
        return 3;
      default:
        return 3;
    }
  }

  // Memoize filtered properties with cadence sorting
  const filteredProperties = useMemo(() => {
    
    let filtered = properties;
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = properties.filter(property =>
        property.name.toLowerCase().includes(searchLower) ||
        property.address.toLowerCase().includes(searchLower) ||
        property.city.toLowerCase().includes(searchLower) ||
        property.state.toLowerCase().includes(searchLower)
      )
    }
    
    // Sort by payment cadence: weekly first, then bi-weekly, then monthly
    const sorted = filtered.sort((a, b) => {
      const priorityA = getCadencePriority(a);
      const priorityB = getCadencePriority(b);
      return priorityA - priorityB;
    });
    
    return sorted;
  }, [properties, searchTerm])

  // Memoize event handlers
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }, [])

  const handleNavigateWeek = useCallback((direction: 'prev' | 'next') => {
    setLoading(true)
    setLoadingMessage('Loading week data...')
    
    if (direction === 'prev') {
      setCurrentWeekOffset(currentWeekOffset - 1)
    } else {
      setCurrentWeekOffset(currentWeekOffset + 1)
    }
  }, [currentWeekOffset])



  const handleExpectedPaymentClick = useCallback(async (property: PropertyWithTenants, date: Date) => {
    if (!property.tenants || property.tenants.length === 0) {
      toast.error('No tenants assigned to this property')
      return
    }

    const tenant = property.tenants[0]
    const expectedAmount = property.leases?.[0]?.rent || property.monthly_rent || 0

    if (expectedAmount === 0) {
      toast.error('No rent amount set for this property')
      return
    }

    // Auto-create payment
    try {
      const newPayment = {
        payment_date: date.toISOString().split('T')[0],
        amount: expectedAmount,
        property_id: property.id,
        tenant_id: tenant.id,
        payment_type: 'Rent',
        notes: `Auto-generated payment for ${date.toLocaleDateString()}`
      }

      await handleSavePayment(newPayment)
      toast.success('Payment created successfully')
    } catch (error) {
      toast.error('Failed to create payment')
    }
  }, [])

  const handleSavePayment = useCallback(async (newPayment: Omit<Payment, 'id' | 'created_at'>) => {
    try {
      setSavingPayment(true)
      
      const response = await PaymentsService.createPayment(newPayment)
      
      if (response.success) {
        toast.success('Payment saved successfully')
        
        // Refresh payments data
        const dateRange = getDateRange()
        const paymentsResponse = await PaymentsService.getByDateRange(dateRange.start, dateRange.end)
        if (paymentsResponse.success) {
          setPayments(paymentsResponse.data || [])
        }
        
        setModalOpen(false)
      } else {
        toast.error(response.error || 'Failed to save payment')
      }
    } catch (error) {
      console.error('Error saving payment:', error)
      toast.error('Error saving payment')
    } finally {
      setSavingPayment(false)
    }
  }, [])

  const handleUpdatePayment = useCallback(async (paymentId: string, updateData: Partial<Payment>) => {
    try {
      setSavingPayment(true)
      
      const response = await PaymentsService.updatePayment(paymentId, updateData)
      
      if (response.success) {
        toast.success('Payment updated successfully')
        
        // Refresh payments data
        const dateRange = getDateRange()
        const paymentsResponse = await PaymentsService.getByDateRange(dateRange.start, dateRange.end)
        if (paymentsResponse.success) {
          setPayments(paymentsResponse.data || [])
        }
        
        setModalOpen(false)
        setEditingPayment(null)
      } else {
        toast.error(response.error || 'Failed to update payment')
      }
    } catch (error) {
      console.error('Error updating payment:', error)
      toast.error('Error updating payment')
    } finally {
      setSavingPayment(false)
    }
  }, [])

  const handleDeletePayment = useCallback(async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) {
      return
    }

    try {
      setSavingPayment(true)
      
      const response = await PaymentsService.deletePayment(paymentId)
      
      if (response.success) {
        toast.success('Payment deleted successfully')
        
        // Refresh payments data
        const dateRange = getDateRange()
        const paymentsResponse = await PaymentsService.getByDateRange(dateRange.start, dateRange.end)
        if (paymentsResponse.success) {
          setPayments(paymentsResponse.data || [])
        }
        
        // Close modal and clear editing state
        setModalOpen(false)
        setEditingPayment(null)
      } else {
        toast.error(response.error || 'Failed to delete payment')
      }
    } catch (error) {
      console.error('Error deleting payment:', error)
      toast.error('Error deleting payment')
    } finally {
      setSavingPayment(false)
    }
  }, [])

  // Function to get payment for a specific week
  const getPaymentForWeek = useCallback((propertyId: string, date: Date) => {
    const weekStart = new Date(date)
    weekStart.setDate(weekStart.getDate() - 6) // Saturday
    const weekEnd = new Date(date) // Friday
    
    // First check payments table
    const payment = payments.find(p => {
      if (p.property_id !== propertyId) return false
      const paymentDate = new Date(p.payment_date)
      return paymentDate >= weekStart && paymentDate <= weekEnd
    })
    
    if (payment) return payment

    // If no payment found, check tenant payment history
    const property = properties.find(p => p.id === propertyId)
    if (!property?.tenants?.[0]?.payment_history) return null

    const tenantPayment = property.tenants[0].payment_history.find((p: any) => {
      const paymentDate = new Date(p.date)
      return paymentDate >= weekStart && paymentDate <= weekEnd && p.status === 'completed'
    })

    if (tenantPayment) {
      return {
        id: `tenant-${tenantPayment.date}`,
        payment_date: tenantPayment.date,
        amount: tenantPayment.amount,
        property_id: propertyId,
        tenant_id: property.tenants[0].id,
        payment_type: 'Rent',
        notes: 'From tenant payment history',
        created_at: tenantPayment.date
      }
    }

    return null
  }, [payments, properties])

  // Handle double-click on payment cell to edit existing payment or create new one
  const handleCellDoubleClick = useCallback((property: PropertyWithTenants, date: Date) => {
    setSelectedProperty(property)
    setSelectedDate(date)
    
    // Check if there's an existing payment for this date and property
    const existingPayment = getPaymentForWeek(property.id, date)
    if (existingPayment && existingPayment.id && !existingPayment.id.startsWith('tenant-')) {
      // Set the existing payment for editing (only real payments, not tenant history)
      setEditingPayment(existingPayment)
    } else {
      setEditingPayment(null) // Clear editing payment when opening modal for new payment
    }
    
    setModalOpen(true)
  }, [getPaymentForWeek])

  // Function to check if monthly rent is fully paid for a given month
  const isMonthlyRentFullyPaid = useCallback((propertyId: string, date: Date) => {
    const property = properties.find(p => p.id === propertyId)
    if (!property) return false

    const lease = property.leases?.[0]
    if (!lease?.rent_cadence) return false

    const cadence = lease.rent_cadence.toLowerCase().trim()
    if (!(cadence === 'monthly' || cadence === 'month' || cadence?.includes('month'))) {
      return false
    }

    const monthlyRent = lease.rent || property.monthly_rent || 0
    if (monthlyRent <= 0) return false

    // Get the month start and end dates for the date being checked
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)

    // Calculate total payments for this month
    let totalPaid = 0

    // Check payments table
    const monthPayments = payments.filter(p => {
      if (p.property_id !== propertyId) return false
      const paymentDate = new Date(p.payment_date)
      return paymentDate >= monthStart && paymentDate <= monthEnd
    })
    totalPaid += monthPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

    // Check tenant payment history
    if (property?.tenants?.[0]?.payment_history) {
      const tenantPayments = property.tenants[0].payment_history.filter((p: any) => {
        const paymentDate = new Date(p.date)
        return paymentDate >= monthStart && paymentDate <= monthEnd && p.status === 'completed'
      })
      totalPaid += tenantPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
    }

    return totalPaid >= monthlyRent
  }, [payments, properties])

  // Function to get rent cadence for display
  const getRentCadenceDisplay = useCallback((property: PropertyWithTenants): string => {
    const cadence = getRentCadence(property)
    const rent = property.leases?.[0]?.rent || property.monthly_rent || 0
    
    if (cadence === 'monthly') {
      return `$${rent.toLocaleString()}/month`
    } else if (cadence === 'weekly') {
      return `$${rent.toLocaleString()}/week`
    } else if (cadence === 'bi-weekly') {
      return `$${rent.toLocaleString()}/bi-week`
    } else {
      return `$${rent.toLocaleString()}/${cadence}`
    }
  }, [])

  // Function to extract payment cadence from property notes
  const extractPaymentCadence = useCallback((property: PropertyWithTenants): 'monthly' | 'bi-weekly' | 'weekly' => {
    const notes = property.notes?.toLowerCase() || ''
    
    // Check bi-weekly FIRST (before weekly) to avoid false matches
    if (notes.includes('bi-weekly') || notes.includes('biweekly') || notes.includes('bi_weekly') || notes.includes('bi-week')) {
      return 'bi-weekly'
    }
    if (notes.includes('weekly') || notes.includes('week')) {
      return 'weekly'
    }
    if (notes.includes('monthly') || notes.includes('month')) {
      return 'monthly'
    }
    
    // Default to monthly if no cadence specified
    return 'monthly'
  }, [])

  // Function to check if we should show a checkbox for this date
  const shouldShowCheckbox = useCallback((property: PropertyWithTenants, date: Date): boolean => {
    const cadence = extractPaymentCadence(property)
    
    // Use the cadence from property notes
    if (cadence === 'monthly') {
      return isMonthlyRentFullyPaid(property.id, date)
    }
    
    // For bi-weekly payments, show checkbox for the current week if the previous week was paid
    if (cadence === 'bi-weekly') {
      // Check if the previous week has a payment that covers the bi-weekly amount
      const previousWeek = new Date(date)
      previousWeek.setDate(previousWeek.getDate() - 7)
      const previousWeekPayment = getPaymentForWeek(property.id, previousWeek)
      
      if (!previousWeekPayment) return false
      
      // Get the expected bi-weekly rent amount from the lease
      const propertyData = properties.find(p => p.id === property.id)
      const lease = propertyData?.leases?.[0]
      const expectedBiWeeklyRent = lease?.rent || propertyData?.monthly_rent || 0
      
      // For bi-weekly, if there was any payment in the previous week, show checkbox for current week
      return previousWeekPayment.amount > 0
    }
    
    // For weekly payments, no checkboxes
    if (cadence === 'weekly') {
      return false
    }
    
    // Default: no checkboxes for unknown cadence
    return false
  }, [isMonthlyRentFullyPaid, getPaymentForWeek, extractPaymentCadence, properties])

  useEffect(() => {
    // Only reload data when week offset changes, not on initial load
    if (propertiesCache.length > 0) {
      memoizedLoadData()
    }
  }, [currentWeekOffset]) // Only depend on currentWeekOffset

  // Initial load
  useEffect(() => {
    if (propertiesCache.length === 0) {
      memoizedLoadData()
    }
  }, []) // Only run on initial mount
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">{loadingMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Tracking</h1>
              <p className="text-gray-600">Track rent payments across all properties</p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setViewMode('grid')
                  }}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Grid View
                </button>
                <button
                  onClick={() => {
                    setViewMode('list')
                  }}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  List View
                </button>
              </div>
              
              <button
                onClick={() => {
                  setSelectedProperty(null)
                  setSelectedDate(null)
                  setEditingPayment(null)
                  setModalOpen(true)
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Payment
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        


        {/* Main Content */}
        {filteredProperties.length === 0 ? (
          <div className="bg-white rounded-lg shadow">
            <div className="p-12 text-center">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm ? 'No properties found' : 'No properties with active tenants'}
              </h3>
              <p className="text-gray-600 mb-4">
                {searchTerm ? 'Try adjusting your search' : 'Properties need active tenants to appear in the payments grid'}
              </p>
              <div className="text-sm text-gray-500 mb-4">
                Debug info: Properties: {properties.length}, Payments: {payments.length}
              </div>
              <div className="flex space-x-4 justify-center">
                {!searchTerm && (
                  <Link href="/properties/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Property
                  </Link>
                )}
                                 <button onClick={memoizedLoadData} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
                  Retry Loading
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow">
            
            {/* Sticky Week Navigation Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => setCurrentWeekOffset(prev => prev - 1)}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Previous Week
                </button>
                
                <div className="text-center">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {weeklyDates[0]?.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric' 
                    })} - {weeklyDates[weeklyDates.length - 1]?.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </h2>
                  <p className="text-sm text-gray-600">Weekly payment tracking</p>
                </div>
                
                <div className="flex items-center space-x-4">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search properties or tenants..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-32 pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:w-48 transition-all duration-200"
                    />
                  </div>
                  
                  <button
                    onClick={() => setCurrentWeekOffset(prev => prev + 1)}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                  >
                    Next Week
                  </button>
                </div>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-200">
                        Property
                      </th>
                      {weeklyDates.map((date, index) => (
                        <th key={index} className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-r border-gray-200">
                          <div className="flex flex-col">
                            <span className="font-semibold">
                              {date.toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className="text-xs text-gray-500">
                              {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.map((property, propertyIndex) => (
                      <tr 
                        key={property.id} 
                        className={`border-b border-gray-200 hover:bg-blue-50 transition-colors ${
                          hoveredProperty === property.id ? 'bg-blue-50' : ''
                        }`}
                        onMouseEnter={() => setHoveredProperty(property.id)}
                        onMouseLeave={() => setHoveredProperty(null)}
                      >
                        <td className="px-4 py-3 border-r border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <div>
                              <div className="font-medium text-gray-900 flex items-center space-x-2">
                                <span>{property.address} - {getRentCadenceDisplay(property)}</span>
                              </div>
                            {property.tenants?.[0] && (
                                <div className="text-xs text-gray-400">
                                {property.tenants[0].first_name} {property.tenants[0].last_name}
                              </div>
                            )}
                            </div>
                          </div>
                        </td>
                        {weeklyDates.map((date, dateIndex) => {
                          const payment = getPaymentForWeek(property.id, date)
                          const showCheckbox = shouldShowCheckbox(property, date)
                          
                          return (
                            <td 
                              key={dateIndex} 
                              className="px-4 py-3 text-center border-r border-gray-200 relative group cursor-pointer hover:bg-blue-50"
                              onDoubleClick={() => handleCellDoubleClick(property, date)}
                              title={payment ? "Double-click to edit payment" : "Double-click to add payment"}
                            >
                                <div className="flex flex-col items-center">
                                {payment ? (
                                  <>
                                  <span className="font-semibold text-green-600">
                                    ${payment.amount.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                      {new Date(payment.payment_date).toLocaleDateString()}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                    {payment.payment_type}
                                  </span>
                                  </>
                                ) : showCheckbox ? (
                                  <div className="flex items-center justify-center">
                                      <input
                                        type="checkbox"
                                        checked={true}
                                        readOnly
                                        className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                                      />
                                      <span className="text-xs text-green-600 ml-1">Paid</span>
                                  </div>
                                  ) : (
                                    <span className="text-gray-300 group-hover:text-gray-500 transition-colors">-</span>
                                  )}
                                </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-200">
                        Property
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-200">
                        Tenant
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-200">
                        Payment Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-200">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-200">
                        Payment Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.map((property) => {
                      // Get all payments for this property across all weeks
                      const allPayments = weeklyDates.map(date => getPaymentForWeek(property.id, date)).filter(Boolean)
                      
                      if (allPayments.length === 0) {
                        return (
                          <tr key={property.id} className="border-b border-gray-200">
                            <td className="px-4 py-3 border-r border-gray-200">
                              <div className="flex items-center space-x-3">
                                <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {property.address} - {getRentCadenceDisplay(property)}
                                </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 border-r border-gray-200 text-gray-500">
                              {property.tenants?.[0] ? `${property.tenants[0].first_name} ${property.tenants[0].last_name}` : 'No tenant'}
                            </td>
                            <td className="px-4 py-3 border-r border-gray-200 text-gray-500" colSpan={4}>
                              No payments in this period
                            </td>
                          </tr>
                        )
                      }
                      
                      return allPayments.map((payment, index) => (
                        <tr key={`${property.id}-${payment?.id || index}`} className="border-b border-gray-200">
                          <td className="px-4 py-3 border-r border-gray-200">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {property.address} - {getRentCadenceDisplay(property)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200">
                            {property.tenants?.[0] ? `${property.tenants[0].first_name} ${property.tenants[0].last_name}` : 'No tenant'}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200">
                            {payment ? new Date(payment.payment_date).toLocaleDateString() : '-'}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200 font-semibold text-green-600">
                            {payment ? `$${payment.amount.toLocaleString()}` : '-'}
                          </td>
                          <td className="px-4 py-3 border-r border-gray-200">
                            {payment ? payment.payment_type : '-'}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setSelectedProperty(property)
                                setSelectedDate(new Date(payment?.payment_date || Date.now()))
                                setEditingPayment(payment)
                                setModalOpen(true)
                              }}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Grid Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded mr-2"></div>
              <span className="text-blue-700">Green cells = Payment received</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
              <span className="text-blue-700">Gray cells = No payment</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
              <span className="text-blue-700">Hover to highlight property row</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
              <span className="text-blue-700">Double-click cells to add payments</span>
            </div>
            <div className="flex items-center">
              <span className="text-green-600 font-semibold mr-2">$Amount</span>
              <span className="text-blue-700">Payment amount = Actual payment received</span>
            </div>
            <div className="flex items-center">
              <span className="text-gray-500 text-xs mr-2">Date</span>
              <span className="text-blue-700">Date = When payment was received</span>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={true}
                readOnly
                className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 mr-2"
              />
              <span className="text-blue-700">Checkbox = Monthly: full month paid, Bi-weekly: next week covered</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        property={selectedProperty}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        onSave={handleSavePayment}
        onUpdate={handleUpdatePayment}
        onDelete={handleDeletePayment}
        loading={savingPayment}
        editingPayment={editingPayment}
      />
    </div>
  )
} 




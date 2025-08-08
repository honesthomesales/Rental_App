'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Plus, Search, ChevronLeft, ChevronRight, X } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { PaymentsService, PropertiesService, TenantsService } from '@rental-app/api'

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

import type { Property as BaseProperty, Tenant as BaseTenant, PaymentStatus } from '@rental-app/api'

interface Property extends BaseProperty {
  tenants?: Tenant[]
  leases?: Lease[]
}

interface Tenant extends BaseTenant {
  payment_history: Array<{
    date: string
    amount: number
    status: PaymentStatus
  }>
}

interface Lease {
  id: string
  rent_cadence: string
  rent: number
  lease_start_date: string
  lease_end_date: string
  status: string
}

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  property: Property | null
  selectedDate: Date | null
  existingPayment: Payment | null
  onSave: (payment: Omit<Payment, 'id' | 'created_at'>) => void
  onUpdate: (payment: Payment) => void
  loading: boolean
}

function PaymentModal({ isOpen, onClose, property, selectedDate, existingPayment, onSave, onUpdate, loading }: PaymentModalProps) {
  const [amount, setAmount] = useState('')
  const [paymentType, setPaymentType] = useState('Rent')
  const [notes, setNotes] = useState('')

  // Initialize form with existing payment data when modal opens
  useEffect(() => {
    if (existingPayment) {
      setAmount(existingPayment.amount.toString())
      setPaymentType(existingPayment.payment_type)
      setNotes(existingPayment.notes || '')
    } else {
      setAmount('')
      setPaymentType('Rent')
      setNotes('')
    }
  }, [existingPayment])

  if (!isOpen || !property || !selectedDate) return null

  const handleSave = () => {
    if (!amount || parseFloat(amount) <= 0) return

    if (existingPayment) {
      // Update existing payment
      const updatedPayment: Payment = {
        ...existingPayment,
        payment_date: selectedDate.toISOString().split('T')[0],
        amount: parseFloat(amount),
        payment_type: paymentType,
        notes: notes
      }
      onUpdate(updatedPayment)
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
      onSave(newPayment)
    }
    
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            {existingPayment ? 'Edit Payment' : 'Add Payment'}
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
              <div className="p-3 bg-gray-50 rounded-lg">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
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
          <button
            onClick={handleSave}
            disabled={!amount || parseFloat(amount) <= 0 || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {loading ? 'Saving...' : (existingPayment ? 'Update Payment' : 'Save Payment')}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function PaymentsPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState('Loading data...')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentWeekOffset, setCurrentWeekOffset] = useState(-3)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [existingPayment, setExistingPayment] = useState<Payment | null>(null)
  const [savingPayment, setSavingPayment] = useState(false)
  const [scrollPosition, setScrollPosition] = useState(0)
  const tableContainerRef = useRef<HTMLDivElement>(null)

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
    startDate.setDate(startDate.getDate() - 30) // Look back 30 days to catch previous payment periods
    const endDate = new Date(weeklyDates[weeklyDates.length - 1])
    endDate.setDate(endDate.getDate() + 30) // Look forward 30 days to catch future payment periods
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    }
  }

  // Cache for properties to avoid reloading on every week change
  const [propertiesCache, setPropertiesCache] = useState<Property[]>([])
  const [propertiesCacheTime, setPropertiesCacheTime] = useState(0)
  const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Scroll position preservation
  const saveScrollPosition = useCallback(() => {
    if (tableContainerRef.current) {
      const currentScrollTop = tableContainerRef.current.scrollTop
      if (currentScrollTop > 0) {
        setScrollPosition(currentScrollTop)
      }
    }
  }, [])

  const restoreScrollPosition = useCallback(() => {
    if (tableContainerRef.current) {
      setTimeout(() => {
        if (tableContainerRef.current) {
          tableContainerRef.current.scrollTop = scrollPosition
        }
      }, 100)
    }
  }, [scrollPosition])

  // Handle week navigation with scroll preservation
  const handleWeekNavigation = useCallback((direction: 'prev' | 'next') => {
    saveScrollPosition()
    setCurrentWeekOffset(prev => direction === 'prev' ? prev - 1 : prev + 1)
  }, [saveScrollPosition])

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
  const getRentCadence = (property: Property): string => {
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
  const getCadencePriority = (property: Property): number => {
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
    
    // First, filter out properties without tenants
    let filtered = properties.filter(property => {
      // Check if property has tenants and at least one tenant has an ID
      return property.tenants && 
             property.tenants.length > 0 && 
             property.tenants.some(tenant => tenant.id && tenant.id.trim() !== '')
    });
    
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(property =>
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

  const handleCellDoubleClick = useCallback((property: Property, date: Date) => {
    // Check if there's an existing payment for this property and date
    const existingPaymentForDate = getPaymentForWeek(property.id, date)
    
    setSelectedProperty(property)
    setSelectedDate(date)
    setExistingPayment(existingPaymentForDate)
    setModalOpen(true)
  }, [])

  const handleExpectedPaymentClick = useCallback(async (property: Property, date: Date) => {
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

  const handleUpdatePayment = useCallback(async (updatedPayment: Payment) => {
    try {
      setSavingPayment(true)
      
      const response = await PaymentsService.updatePayment(updatedPayment)
      
      if (response.success) {
        toast.success('Payment updated successfully')
        
        // Refresh payments data
        const dateRange = getDateRange()
        const paymentsResponse = await PaymentsService.getByDateRange(dateRange.start, dateRange.end)
        if (paymentsResponse.success) {
          setPayments(paymentsResponse.data || [])
        }
        
        setModalOpen(false)
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

    const tenantPayment = property.tenants[0].payment_history.find(p => {
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

    // For monthly payments, check the current month AND the previous month's end (last 7 days)
    // This handles cases where rent is paid at the end of one month for the next month
    const previousMonthEnd = new Date(monthStart)
    previousMonthEnd.setDate(previousMonthEnd.getDate() - 7)

    // Calculate total payments for this month and the previous month's end
    let totalPaid = 0

    // Check payments table for current month
    const monthPayments = payments.filter(p => {
      if (p.property_id !== propertyId) return false
      const paymentDate = new Date(p.payment_date)
      return paymentDate >= monthStart && paymentDate <= monthEnd
    })
    totalPaid += monthPayments.reduce((sum, p) => sum + p.amount, 0)

    // Check payments table for previous month's end (last 7 days)
    const previousMonthPayments = payments.filter(p => {
      if (p.property_id !== propertyId) return false
      const paymentDate = new Date(p.payment_date)
      return paymentDate >= previousMonthEnd && paymentDate < monthStart
    })
    totalPaid += previousMonthPayments.reduce((sum, p) => sum + p.amount, 0)

    // Check tenant payment history for current month
    if (property?.tenants?.[0]?.payment_history) {
      const tenantPayments = property.tenants[0].payment_history.filter(p => {
        const paymentDate = new Date(p.date)
        return paymentDate >= monthStart && paymentDate <= monthEnd && p.status === 'completed'
      })
      totalPaid += tenantPayments.reduce((sum, p) => sum + p.amount, 0)
    }

    // Check tenant payment history for previous month's end
    if (property?.tenants?.[0]?.payment_history) {
      const previousMonthTenantPayments = property.tenants[0].payment_history.filter(p => {
        const paymentDate = new Date(p.date)
        return paymentDate >= previousMonthEnd && paymentDate < monthStart && p.status === 'completed'
      })
      totalPaid += previousMonthTenantPayments.reduce((sum, p) => sum + p.amount, 0)
    }

    // For the current month, also check if there was a payment in the current month that covers this date
    // This handles cases where a payment is made mid-month but should cover the entire month
    if (totalPaid < monthlyRent) {
      // Check if there's any payment in the current month that could cover this date
      const currentMonthAnyPayment = payments.find(p => {
        if (p.property_id !== propertyId) return false
        const paymentDate = new Date(p.payment_date)
        return paymentDate >= monthStart && paymentDate <= monthEnd
      })
      
      if (currentMonthAnyPayment && currentMonthAnyPayment.amount >= monthlyRent) {
        totalPaid = currentMonthAnyPayment.amount
      }
    }

    // For monthly payments, if we have a payment that covers the full monthly rent,
    // it should cover the entire month regardless of when it was made
    if (totalPaid >= monthlyRent) {
      return true
    }

    // Also check if there's a payment in the current month that covers the full rent amount
    // This handles cases where a payment is made later in the month but should cover the entire month
    const currentMonthPayment = payments.find(p => {
      if (p.property_id !== propertyId) return false
      const paymentDate = new Date(p.payment_date)
      return paymentDate >= monthStart && paymentDate <= monthEnd
    })

    if (currentMonthPayment && currentMonthPayment.amount >= monthlyRent) {
      return true
    }

    return totalPaid >= monthlyRent
  }, [payments, properties])

  // Function to get rent cadence for display
  const getRentCadenceDisplay = useCallback((property: Property): string => {
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
  const extractPaymentCadence = useCallback((property: Property): 'monthly' | 'bi-weekly' | 'weekly' => {
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

  // Function to check if a payment is overdue for a specific date
  const isPaymentOverdue = useCallback((property: Property, date: Date): boolean => {
    const cadence = extractPaymentCadence(property)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkDate = new Date(date)
    checkDate.setHours(0, 0, 0, 0)
    
    // If the date is in the future, it's not overdue
    if (checkDate > today) return false
    
    // Check if there's a payment for this date
    const payment = getPaymentForWeek(property.id, date)
    if (payment) return false
    
    // For monthly payments, check if the month is fully paid
    if (cadence === 'monthly') {
      return !isMonthlyRentFullyPaid(property.id, date)
    }
    
    // For bi-weekly payments, check if the bi-weekly period is paid
    if (cadence === 'bi-weekly') {
      // For bi-weekly, we need to check if there's a payment that covers this bi-weekly period
      // A bi-weekly period starts every other week, so we need to find the start of the current bi-weekly period
      
      // Calculate the start of the current bi-weekly period
      const currentDate = new Date(date)
      const daysSinceMonday = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1 // Monday = 0
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday)
      
      // Find the start of the bi-weekly period (every other Monday)
      const weekNumber = Math.floor(startOfWeek.getTime() / (7 * 24 * 60 * 60 * 1000))
      const biWeeklyStart = new Date(0)
      biWeeklyStart.setTime((weekNumber - (weekNumber % 2)) * 7 * 24 * 60 * 60 * 1000)
      
      // Check if there's a payment within 14 days after the bi-weekly period start
      const biWeeklyEnd = new Date(biWeeklyStart)
      biWeeklyEnd.setDate(biWeeklyEnd.getDate() + 14)
      
      // Look for any payment in the bi-weekly period
      const biWeeklyPayment = payments.find(p => {
        if (p.property_id !== property.id) return false
        const paymentDate = new Date(p.payment_date)
        return paymentDate >= biWeeklyStart && paymentDate <= biWeeklyEnd
      })
      
      if (biWeeklyPayment) {
        return false // Found a payment for this bi-weekly period
      }
      
      // Also check tenant payment history
      if (property?.tenants?.[0]?.payment_history) {
        const tenantPayment = property.tenants[0].payment_history.find(p => {
          const paymentDate = new Date(p.date)
          return paymentDate >= biWeeklyStart && paymentDate <= biWeeklyEnd && p.status === 'completed'
        })
        
        if (tenantPayment) {
          return false // Found a tenant payment for this bi-weekly period
        }
      }
      
      return true // No payment found for this bi-weekly period
    }
    
    // For weekly payments, check if this week has a payment
    if (cadence === 'weekly') {
      return !payment
    }
    
    return false
  }, [extractPaymentCadence, getPaymentForWeek, isMonthlyRentFullyPaid, payments, properties])

  // Function to check if we should show a checkbox for this date
  const shouldShowCheckbox = useCallback((property: Property, date: Date): boolean => {
    const cadence = extractPaymentCadence(property)
    
    // Use the cadence from property notes
    if (cadence === 'monthly') {
      return isMonthlyRentFullyPaid(property.id, date)
    }
    
    // For bi-weekly payments, show checkbox for the current week if a bi-weekly payment was made
    if (cadence === 'bi-weekly') {
      // Calculate the start of the current bi-weekly period
      const currentDate = new Date(date)
      const daysSinceMonday = currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1 // Monday = 0
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(startOfWeek.getDate() - daysSinceMonday)
      
      // Find the start of the bi-weekly period (every other Monday)
      const weekNumber = Math.floor(startOfWeek.getTime() / (7 * 24 * 60 * 60 * 1000))
      const biWeeklyStart = new Date(0)
      biWeeklyStart.setTime((weekNumber - (weekNumber % 2)) * 7 * 24 * 60 * 60 * 1000)
      
      // Check if there's a payment within 14 days after the bi-weekly period start
      const biWeeklyEnd = new Date(biWeeklyStart)
      biWeeklyEnd.setDate(biWeeklyEnd.getDate() + 14)
      
      // Look for any payment in the bi-weekly period
      const biWeeklyPayment = payments.find(p => {
        if (p.property_id !== property.id) return false
        const paymentDate = new Date(p.payment_date)
        return paymentDate >= biWeeklyStart && paymentDate <= biWeeklyEnd
      })
      
      if (biWeeklyPayment && biWeeklyPayment.amount > 0) {
        return true // Found a payment for this bi-weekly period
      }
      
      // Also check tenant payment history
      if (property?.tenants?.[0]?.payment_history) {
        const tenantPayment = property.tenants[0].payment_history.find(p => {
          const paymentDate = new Date(p.date)
          return paymentDate >= biWeeklyStart && paymentDate <= biWeeklyEnd && p.status === 'completed'
        })
        
        if (tenantPayment && tenantPayment.amount > 0) {
          return true // Found a tenant payment for this bi-weekly period
        }
      }
      
      return false // No payment found for this bi-weekly period
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
  }, [currentWeekOffset, memoizedLoadData]) // Only depend on currentWeekOffset

  // Restore scroll position after data loads
  useEffect(() => {
    if (!loading && scrollPosition > 0 && tableContainerRef.current) {
      restoreScrollPosition()
    }
  }, [loading, scrollPosition, restoreScrollPosition])

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
                onClick={() => setModalOpen(true)}
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
        
        {/* Filters and Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search Properties/Tenants</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search properties or tenants..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleNavigateWeek('prev')}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Week Navigation</p>
                  <p className="text-xs text-gray-500">
                    {weeklyDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weeklyDates[weeklyDates.length - 1].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <button 
                  onClick={() => handleNavigateWeek('next')}
                  className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  Showing {filteredProperties.length} of {properties.length} properties
                </p>
              </div>
            </div>
          </div>
        </div>

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
            
            {/* Week Navigation - Sticky */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
              <div className="flex items-center justify-between p-4">
                <button
                  onClick={() => handleWeekNavigation('prev')}
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
                  <p className="text-xs text-gray-500 mt-1">
                    Sorted by payment cadence: Weekly (1) → Bi-weekly (2) → Monthly (3)
                  </p>
                </div>
                
                <button
                  onClick={() => handleWeekNavigation('next')}
                  className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                >
                  Next Week
                </button>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div 
                ref={tableContainerRef}
                className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto"
              >
                <table className="w-full relative">
                  <thead className="sticky top-0 z-20 bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50">
                        Property
                      </th>
                      {weeklyDates.map((date, index) => (
                        <th key={index} className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-r border-gray-200 bg-gray-50">
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
                  <tbody className="relative z-10">
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
                          const isOverdue = isPaymentOverdue(property, date)
                          const isToday = date.toDateString() === new Date().toDateString()
                          
                          return (
                            <td 
                              key={dateIndex} 
                              className={`px-4 py-3 text-center border-r border-gray-200 relative group cursor-pointer hover:bg-blue-50 ${
                                isToday ? 'bg-yellow-50' : ''
                              }`}
                              onDoubleClick={() => handleCellDoubleClick(property, date)}
                              title={`${date.toLocaleDateString()} - Double-click to add payment`}
                            >
                                <div className="flex flex-col items-center min-h-[60px] justify-center">
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
                                  <div className="flex flex-col items-center">
                                    <span className={`text-xs transition-colors ${
                                      isOverdue ? 'text-red-400' : 'text-gray-300 group-hover:text-gray-500'
                                    }`}>
                                      {isOverdue ? 'Overdue' : '-'}
                                    </span>
                                    {isToday && (
                                      <span className="text-xs text-blue-600 mt-1">Today</span>
                                    )}
                                  </div>
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
                              onClick={() => handleCellDoubleClick(property, new Date(payment?.payment_date || Date.now()))}
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
          onClose={() => {
            setModalOpen(false)
            setExistingPayment(null)
          }}
          property={selectedProperty}
          selectedDate={selectedDate}
          existingPayment={existingPayment}
          onSave={handleSavePayment}
          onUpdate={handleUpdatePayment}
          loading={savingPayment}
        />
    </div>
  )
} 




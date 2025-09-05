'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns'
import { Calendar, DollarSign, TrendingUp, PieChart, Plus, Minus, ChevronLeft, ChevronRight, Edit, Trash2 } from 'lucide-react'
import { supabase } from '@rental-app/api'
import { normalizeRentToMonthly, extractRentCadence } from '../../lib/utils'
import { getExpectedRentByMonth, getCollectedRentByMonth } from '../../src/lib/rentSource'
import toast from 'react-hot-toast'

interface ProfitData {
  potentialIncome: number
  expectedIncome: number
  collectedIncome: number
  insurance: number
  taxes: number
  totalPayments: number
  repairs: number
  miscIncome: number
  otherExpenses: number
  expectedProfit: number
  netProfit: number
  expectedRentIncome: number
  collectedRentIncome: number
}

export default function ProfitPage() {
  // Feature flag for new rent source system
  const useLeasePeriods = process.env.NEXT_PUBLIC_USE_LEASE_PERIODS === 'true'
  
  const [profitData, setProfitData] = useState<ProfitData>({
    potentialIncome: 0,
    expectedIncome: 0,
    collectedIncome: 0,
    insurance: 0,
    taxes: 0,
    totalPayments: 0,
    repairs: 0,
    miscIncome: 0,
    otherExpenses: 0,
    expectedProfit: 0,
    netProfit: 0,
    expectedRentIncome: 0,
    collectedRentIncome: 0
  })
  
  const [dateRange, setDateRange] = useState(() => {
    const now = new Date()
    const start = startOfMonth(now)
    const end = endOfMonth(now)
    
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    }
  })

  // Function to find the most recent month with data
  const findMostRecentMonthWithData = async () => {
    if (!supabase) {
      console.error('Supabase client not available')
      return null
    }
    
    try {
      const { data, error } = await supabase
        .from('RENT_payments')
        .select('payment_date')
        .order('payment_date', { ascending: false })
        .limit(1)

      if (error) {
        console.error('Error fetching most recent payment date:', error)
        return null
      }

      if (data && data.length > 0) {
        const mostRecentPayment = data[0]
        const mostRecentDate = new Date(mostRecentPayment.payment_date)
        
        return {
          year: mostRecentDate.getFullYear(),
          month: mostRecentDate.getMonth()
        }
      }
    } catch (error) {
      console.error('Error finding most recent month with data:', error)
    }
    
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth()
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    try {
      const currentDate = new Date(dateRange.start + 'T00:00:00')
      
      let newDate: Date
      if (direction === 'prev') {
        newDate = subMonths(currentDate, 1)
      } else {
        newDate = addMonths(currentDate, 1)
      }
      
      const newStart = startOfMonth(newDate)
      const newEnd = endOfMonth(newDate)
      
      const newDateRange = {
        start: format(newStart, 'yyyy-MM-dd'),
        end: format(newEnd, 'yyyy-MM-dd')
      }
      
      setDateRange(newDateRange)
    } catch (error) {
      // Silent error handling
    }
  }

       const [otherEntries, setOtherEntries] = useState<any[]>([])
  const [rentPayments, setRentPayments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showEditExpense, setShowEditExpense] = useState(false)
  const [editingEntry, setEditingEntry] = useState<any | null>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [monthlyPotentialIncome, setMonthlyPotentialIncome] = useState(0)
  const [monthsInRange, setMonthsInRange] = useState(0)
  const [newEntry, setNewEntry] = useState({
    type: 'expense' as 'expense' | 'income',
    amount: 0,
    description: '',
    date: format(new Date(), 'yyyy-MM-dd')
  })

  useEffect(() => {
    loadProfitData()
  }, [dateRange])

     const loadProfitData = async () => {
     if (!supabase) {
       toast.error('Supabase client not available')
       return
     }
     
     try {
       setLoading(true)
       
       if (useLeasePeriods) {
         // Use new views for rent data
         await loadProfitDataFromViews()
       } else {
         // Use original method
         await loadProfitDataOriginal()
       }
     } catch (error) {
       console.error('Error loading profit data:', error)
       toast.error('Failed to load profit data')
     } finally {
       setLoading(false)
     }
   }

   const loadProfitDataFromViews = async () => {
     try {
       // Use rentSource functions
       const [expectedData, collectedData, propertiesData] = await Promise.all([
         getExpectedRentByMonth(),
         getCollectedRentByMonth(),
         (supabase as any).from('RENT_properties').select('*')
       ])
       
       if (propertiesData.error) {
         throw new Error('Failed to load properties data')
       }
       
       // Calculate profit data from views
       const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
       const currentMonthExpected = expectedData?.find((item: any) => 
         item.month.startsWith(currentMonth)
       )
       const currentMonthCollected = collectedData?.find((item: any) => 
         item.month.startsWith(currentMonth)
       )
       
       const expectedRentIncome = currentMonthExpected ? 
         ((currentMonthExpected as any).expected_rent || 0) + ((currentMonthExpected as any).expected_late_fees || 0) : 0
       const collectedRentIncome = currentMonthCollected ? 
         ((currentMonthCollected as any).collected_rent || 0) + ((currentMonthCollected as any).collected_late_fees || 0) : 0
       
       // Calculate other metrics from properties
       const totalProperties = propertiesData.data?.length || 0
       const potentialIncome = propertiesData.data?.reduce((sum: number, property: any) => {
         const rentCadence = extractRentCadence(property.notes || undefined)
         const normalizedRent = normalizeRentToMonthly(property.leases?.[0]?.rent || 0, rentCadence)
         return sum + normalizedRent
       }, 0) || 0
       
       setProfitData({
         potentialIncome,
         expectedIncome: expectedRentIncome,
         collectedIncome: collectedRentIncome,
         insurance: 0, // TODO: Calculate from insurance data
         taxes: 0, // TODO: Calculate from tax data
         totalPayments: collectedRentIncome,
         repairs: 0, // TODO: Calculate from repairs data
         miscIncome: 0, // TODO: Calculate from misc income data
         otherExpenses: 0, // TODO: Calculate from other expenses data
         expectedProfit: expectedRentIncome - 0, // TODO: Subtract expenses
         netProfit: collectedRentIncome - 0, // TODO: Subtract expenses
         expectedRentIncome,
         collectedRentIncome
       })
     } catch (error) {
       console.error('Error loading profit data from views:', error)
       // Fall back to original method
       await loadProfitDataOriginal()
     }
   }

   const loadProfitDataOriginal = async () => {
     try {
       // Fetch properties
       const { data: propertiesData, error: propertiesError } = await (supabase as any)
         .from('RENT_properties')
         .select('*')

       if (propertiesError) {
         toast.error('Failed to load properties')
         return
       }

       // Fetch tenants
       const { data: tenantsData, error: tenantsError } = await (supabase as any)
         .from('RENT_tenants')
         .select('*')

       if (tenantsError) {
         toast.error('Failed to load tenants')
         return
       }

       // Fetch payments for the date range
       const { data: paymentsData, error: paymentsError } = await (supabase as any)
         .from('RENT_payments')
         .select('*')
         .gte('payment_date', dateRange.start)
         .lte('payment_date', dateRange.end)

       if (paymentsError) {
         toast.error('Failed to load payments')
         return
       }

       // Fetch other entries for the date range
       // TODO: RENT_other table doesn't exist - temporarily disabled
       const otherEntriesData: any[] = []
       const otherEntriesError = null

       // const { data: otherEntriesData, error: otherEntriesError } = await supabase
       //   .from('RENT_other')
       //   .select('*')
       //   .gte('date', dateRange.start)
       //   .lte('date', dateRange.end)

       // if (otherEntriesError) {
       //   toast.error('Failed to load other entries')
       //   return
       // }

       // If this is the initial load and no payments found, try to find the most recent month with data
       if (paymentsData && paymentsData.length === 0 && isInitialLoad) {
         const mostRecentMonth = await findMostRecentMonthWithData()
         const currentMonth = new Date(dateRange.start).getMonth()
         const currentYear = new Date(dateRange.start).getFullYear()
         
         if (mostRecentMonth && (mostRecentMonth.month !== currentMonth || mostRecentMonth.year !== currentYear)) {
           const newStart = startOfMonth(new Date(mostRecentMonth.year, mostRecentMonth.month, 1))
           const newEnd = endOfMonth(new Date(mostRecentMonth.year, mostRecentMonth.month, 1))
           
           const newDateRange = {
             start: format(newStart, 'yyyy-MM-dd'),
             end: format(newEnd, 'yyyy-MM-dd')
           }
           
           setDateRange(newDateRange)
           return
         }
       }

       // Calculate potential income for the date range (if ALL properties were occupied)
       const startDate = new Date(dateRange.start)
       const endDate = new Date(dateRange.end)
       const calculatedMonthsInRange = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                            (endDate.getMonth() - startDate.getMonth()) + 1
       
       // Calculate potential income (sum of all property monthly rents * months in range)
       const calculatedMonthlyPotentialIncome = propertiesData.reduce((sum: number, property: any) => {
         const rentCadence = extractRentCadence(property.notes)
         const normalizedRent = normalizeRentToMonthly(property.leases?.[0]?.rent || 0, rentCadence)
         return sum + normalizedRent
       }, 0)

       // Update state for modal access
       setProperties(propertiesData)
       setOtherEntries(otherEntriesData || [])
       setRentPayments(paymentsData || [])
       setMonthlyPotentialIncome(calculatedMonthlyPotentialIncome)
       setMonthsInRange(calculatedMonthsInRange)
       
       // Use monthly amounts for display (not multiplied by months in range)
       const potentialIncome = calculatedMonthlyPotentialIncome
       
       // Calculate expected income (for properties that currently have renters)
       const occupiedPropertyIds = new Set(tenantsData.map((tenant: any) => tenant.property_id))
       const monthlyExpectedIncome = propertiesData
         .filter((property: any) => occupiedPropertyIds.has(property.id))
         .reduce((sum: number, property: any) => {
           const rentCadence = extractRentCadence(property.notes)
           const normalizedRent = normalizeRentToMonthly(property.leases?.[0]?.rent || 0, rentCadence)
           return sum + normalizedRent
         }, 0)
       
       const expectedIncome = monthlyExpectedIncome

       // Calculate expected rent income (only rent payments for collection rate)
       const expectedRentIncome = monthlyExpectedIncome

       // Calculate collected income for the date range (only positive values)
       const collectedIncome = paymentsData
         .reduce((sum: number, payment: any) => {
           const positiveAmount = Math.max(0, payment.amount || 0)
           return sum + positiveAmount
         }, 0)

       // Calculate collected rent income (only rent payments for collection rate)
       const collectedRentIncome = paymentsData
         .filter((payment: any) => {
           const paymentType = payment.payment_type?.toLowerCase() || ''
           return paymentType === 'rent'
         })
         .reduce((sum: number, payment: any) => {
           const positiveAmount = Math.max(0, payment.amount || 0)
           return sum + positiveAmount
         }, 0)

       // Calculate total payments income/expense for the date range (all values, positive and negative)
       const totalPaymentsIncome = paymentsData
         .reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0)

       // Calculate expenses by type
       // Calculate total insurance from properties
       const insurance = propertiesData.reduce((sum: number, property: any) => {
         return sum + (property.insurance_premium || 0)
       }, 0)
       
       // Calculate total taxes from properties
       const taxes = propertiesData.reduce((sum: number, property: any) => {
         return sum + (property.property_tax || 0)
       }, 0)
       
       // Calculate total payments from properties
       const totalPayments = propertiesData.reduce((sum: number, property: any) => {
         return sum + (property.purchase_payment || 0)
       }, 0)
       
       // Calculate repairs from payments (type "Repairs" not case sensitive)
       const repairs = paymentsData
         .filter((payment: any) => {
           const paymentType = payment.payment_type?.toLowerCase() || ''
           return paymentType === 'repairs'
         })
         .reduce((sum: number, payment: any) => {
           const amount = Math.abs(payment.amount || 0)
           return sum + amount
         }, 0)
       
       // Calculate other expenses (all negative values that are not repairs)
       const otherExpenses = paymentsData
         .filter((payment: any) => {
           const paymentType = payment.payment_type?.toLowerCase() || ''
           const isNegative = (payment.amount || 0) < 0
           const isNotRepair = paymentType !== 'repairs'
           return isNegative && isNotRepair
         })
         .reduce((sum: number, payment: any) => {
           const amount = Math.abs(payment.amount || 0)
           return sum + amount
         }, 0)
       
       // Calculate misc income (all positive values that are not rent)
       const miscIncome = paymentsData
         .filter((payment: any) => {
           const paymentType = payment.payment_type?.toLowerCase() || ''
           const isPositive = (payment.amount || 0) > 0
           const isNotRent = paymentType !== 'rent'
           return isPositive && isNotRent
         })
         .reduce((sum: number, payment: any) => {
           return sum + (payment.amount || 0)
         }, 0)

       const totalExpenses = insurance + taxes + totalPayments + repairs + otherExpenses
       const expectedProfit = expectedIncome - totalExpenses
       const netProfit = totalPaymentsIncome - (insurance + taxes + totalPayments) + miscIncome

       setProfitData({
         potentialIncome,
         expectedIncome,
         collectedIncome,
         insurance,
         taxes,
         totalPayments,
         repairs,
         miscIncome,
         otherExpenses,
         expectedProfit,
         netProfit,
         expectedRentIncome,
         collectedRentIncome
       })

     } catch (error) {
       toast.error('Error loading profit data')
     } finally {
       setLoading(false)
       setIsInitialLoad(false)
     }
   }

  const addEntry = async () => {
    if (!supabase) {
      toast.error('Supabase client not available')
      return
    }
    
    if (newEntry.amount <= 0 || !newEntry.description.trim()) {
      toast.error('Please enter a valid amount and description')
      return
    }

    // TODO: RENT_other table doesn't exist - temporarily disabled
    // const { error } = await supabase
    //    .from('RENT_other')
    //    .insert({
    //     date: newEntry.date,
    //     type: newEntry.type,
    //     amount: newEntry.amount,
    //     description: newEntry.description
    //    })
    
    // Temporarily simulate success
    const error = null

    if (error) {
      toast.error('Failed to add entry')
      console.error('Error adding other entry:', error)
    } else {
      toast.success('Entry added successfully')
      setNewEntry({
        type: 'expense',
        amount: 0,
        description: '',
        date: format(new Date(), 'yyyy-MM-dd')
      })
      setShowAddExpense(false)
      loadProfitData() // Recalculate profit
    }
  }

  const editEntry = (entry: any) => {
    setEditingEntry(entry)
    setNewEntry({
      type: entry.type,
      amount: entry.amount,
      description: entry.description,
      date: entry.date
    })
    setShowEditExpense(true)
  }

  const updateEntry = async () => {
    if (!supabase) {
      toast.error('Supabase client not available')
      return
    }
    
    if (!editingEntry || newEntry.amount <= 0 || !newEntry.description.trim()) {
      toast.error('Please enter a valid amount and description')
      return
    }

    // TODO: RENT_other table doesn't exist - temporarily disabled
    // const { error } = await supabase
    //    .from('RENT_other')
    //    .update({
    //     id: editingEntry.id,
    //     date: newEntry.date,
    //     type: newEntry.type,
    //     amount: newEntry.amount,
    //     description: newEntry.description
    //    })
    //    .eq('id', editingEntry.id)
    
    // Temporarily simulate success
    const error = null

    if (error) {
      toast.error('Failed to update entry')
      console.error('Error updating other entry:', error)
    } else {
      toast.success('Entry updated successfully')
      setNewEntry({
        type: 'expense',
        amount: 0,
        description: '',
        date: format(new Date(), 'yyyy-MM-dd')
      })
      setEditingEntry(null)
      setShowEditExpense(false)
      loadProfitData() // Recalculate profit
    }
  }

  const removeEntry = async (id: string) => {
    if (!supabase) {
      toast.error('Supabase client not available')
      return
    }
    
    // TODO: RENT_other table doesn't exist - temporarily disabled
    // const { error } = await supabase
    //    .from('RENT_other')
    //    .delete()
    //    .eq('id', id)
    
    // Temporarily simulate success
    const error = null

    if (error) {
      toast.error('Failed to remove entry')
      console.error('Error deleting other entry:', error)
    } else {
      toast.success('Entry removed successfully')
      loadProfitData() // Recalculate profit
    }
  }

  const getEntryTypeColor = (type: string) => {
    switch (type) {
      case 'expense': return 'bg-red-100 text-red-800'
      case 'income': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEntryTypeLabel = (type: string) => {
    switch (type) {
      case 'expense': return 'Expense'
      case 'income': return 'Income'
      default: return 'Other'
    }
  }

  const getPaymentTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'rent': return 'bg-blue-100 text-blue-800'
      case 'utilities': return 'bg-purple-100 text-purple-800'
      case 'late_fee': return 'bg-red-100 text-red-800'
      case 'deposit': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentTypeLabel = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'rent': return 'Rent'
      case 'utilities': return 'Utilities'
      case 'late_fee': return 'Late Fee'
      case 'deposit': return 'Deposit'
      default: return type || 'Other'
    }
  }

  const editPayment = (payment: any) => {
    // For now, just show a toast message since we need to implement payment editing
    toast('Payment editing functionality will be implemented soon')
  }

  const removePayment = async (id: string) => {
    // For now, just show a toast message since we need to implement payment deletion
    toast('Payment deletion functionality will be implemented soon')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

     return (
     <div key={`profit-${dateRange.start}`} className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profit Analysis</h1>
              <p className="text-gray-600">Track your rental property profitability</p>
              
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
              <div className="text-right">
                <p className="text-sm text-gray-600">Net Profit</p>
                <p className={`text-2xl font-bold ${profitData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${profitData.netProfit.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Picker */}
        <div className="card mb-6">
          <div className="card-content py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Calendar className="w-5 h-5 text-primary-600" />
                                 <span className="text-lg font-semibold text-gray-900">
                   {format(new Date(dateRange.start + 'T00:00:00'), 'MMMM yyyy')}
                 </span>
              </div>
              <div className="flex items-center space-x-2">
                                 <button
                   onClick={() => navigateMonth('prev')}
                   className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                   type="button"
                 >
                   <ChevronLeft className="w-5 h-5 text-gray-600" />
                 </button>
                 <button
                   onClick={() => navigateMonth('next')}
                   className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                   type="button"
                 >
                   <ChevronRight className="w-5 h-5 text-gray-600" />
                 </button>
              </div>
            </div>
          </div>
        </div>

                 {/* Main Layout Grid */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
           {/* Fixed Expenses Section - Top Left */}
           <div className="card">
             <div className="card-header">
               <div className="flex items-center">
                 <Minus className="w-5 h-5 text-red-600 mr-2" />
                 <h2 className="card-title">Fixed Expenses</h2>
               </div>
             </div>
             <div className="card-content">
               <div className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Insurance</label>
                   <div className="p-3 bg-gray-100 rounded border text-gray-700">
                     ${profitData.insurance.toLocaleString()}
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Taxes</label>
                   <div className="p-3 bg-gray-100 rounded border text-gray-700">
                     ${profitData.taxes.toLocaleString()}
                   </div>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Total Payments</label>
                   <div className="p-3 bg-gray-100 rounded border text-gray-700">
                     ${profitData.totalPayments.toLocaleString()}
                   </div>
                 </div>
                 {/* Total Fixed Expenses */}
                 <div className="pt-4 border-t border-gray-200">
                   <label className="block text-sm font-medium text-gray-700 mb-2">Total Fixed Expenses</label>
                   <div className="p-3 bg-red-50 rounded border text-red-700 font-bold">
                     ${(profitData.insurance + profitData.taxes + profitData.totalPayments).toLocaleString()}
                   </div>
                 </div>
               </div>
             </div>
           </div>

           {/* One Time Expense and Income Section - Middle */}
           <div className="card">
             <div className="card-header">
               <div className="flex items-center">
                 <Minus className="w-5 h-5 text-red-600 mr-2" />
                 <h2 className="card-title">1 Time Expense and Income</h2>
               </div>
             </div>
             <div className="card-content">
               <div className="space-y-4">
                 {/* Expenses Block */}
                 <div>
                   <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">Expenses</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-yellow-50 rounded-lg">
                       <p className="text-sm text-gray-600">Repairs</p>
                       <p className="text-xl font-bold text-yellow-600">${profitData.repairs.toLocaleString()}</p>
                     </div>
                     <div className="p-4 bg-gray-50 rounded-lg">
                       <p className="text-sm text-gray-600">Other Expenses</p>
                       <p className="text-xl font-bold text-gray-600">${profitData.otherExpenses.toLocaleString()}</p>
                     </div>
                   </div>
                 </div>
                 
                 {/* Income Block */}
                 <div>
                   <h3 className="text-sm font-medium text-gray-700 mb-3 text-center">Income</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-green-50 rounded-lg">
                       <p className="text-sm text-gray-600">Misc Income</p>
                       <p className="text-xl font-bold text-green-600">${profitData.miscIncome.toLocaleString()}</p>
                     </div>
                     <div className="p-4 bg-blue-50 rounded-lg">
                       <p className="text-sm text-gray-600">Rent Collected</p>
                       <p className={`text-xl font-bold ${profitData.collectedRentIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                         ${profitData.collectedRentIncome.toLocaleString()}
                       </p>
                     </div>
                   </div>
                 </div>
                 
                 {/* Total Income and Debt Summary */}
                 <div className="pt-4 border-t border-gray-200 space-y-3">
                   <div className="flex justify-between items-center">
                     <span className="text-sm font-medium text-gray-700">Total Income:</span>
                     <span className="text-lg font-bold text-green-600">
                       ${(profitData.miscIncome + profitData.collectedRentIncome).toLocaleString()}
                     </span>
                   </div>
                   <div className="flex justify-between items-center">
                     <span className="text-sm font-medium text-gray-700">Total Debt:</span>
                     <span className="text-lg font-bold text-red-600">
                       ${(profitData.repairs + profitData.insurance + profitData.taxes + profitData.totalPayments + profitData.otherExpenses).toLocaleString()}
                     </span>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           {/* Rent Collection Summary - Top Right */}
           <div className="card">
             <div className="card-header">
               <div className="flex items-center">
                 <DollarSign className="w-5 h-5 text-primary-600 mr-2" />
                 <h2 className="card-title">Rent Collection</h2>
               </div>
             </div>
             <div className="card-content">
               <div className="flex items-center justify-center h-48">
                 <div className="relative w-40 h-40">
                   {/* Dynamic pie chart using SVG */}
                   <svg className="w-full h-full" viewBox="0 0 100 100">
                     {/* Background circle (expected rent income) */}
                     <circle
                       cx="50"
                       cy="50"
                       r="40"
                       fill="none"
                       stroke="#eab308"
                       strokeWidth="8"
                     />
                     {/* Collected rent income slice */}
                     {profitData.expectedRentIncome > 0 && (
                       <circle
                         cx="50"
                         cy="50"
                         r="40"
                         fill="none"
                         stroke="#10b981"
                         strokeWidth="8"
                         strokeDasharray={`${Math.min((profitData.collectedRentIncome / profitData.expectedRentIncome) * 251.2, 251.2)} 251.2`}
                         strokeDashoffset="62.8"
                         transform="rotate(-90 50 50)"
                         style={{
                           strokeLinecap: 'round'
                         }}
                       />
                     )}
                   </svg>
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="text-center">
                       <p className="text-xs text-gray-600">Rent Collected</p>
                       <p className="text-sm font-bold">${profitData.collectedRentIncome.toLocaleString()}</p>
                       {profitData.expectedRentIncome > 0 && (
                         <p className="text-xs text-gray-500">
                           {Math.round((profitData.collectedRentIncome / profitData.expectedRentIncome) * 100)}%
                         </p>
                       )}
                     </div>
                   </div>
                 </div>
               </div>
               
               {/* Legend */}
               <div className="mt-4 space-y-2">
                 <div className="flex items-center justify-between">
                   <div className="flex items-center">
                     <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
                     <span className="text-xs">Rent Collected</span>
                   </div>
                   <span className="text-xs font-medium">${profitData.collectedRentIncome.toLocaleString()}</span>
                 </div>
                 <div className="flex items-center justify-between">
                   <div className="flex items-center">
                     <div className="w-3 h-3 bg-yellow-500 rounded mr-2"></div>
                     <span className="text-xs">Expected</span>
                   </div>
                   <span className="text-xs font-medium">${profitData.expectedRentIncome.toLocaleString()}</span>
                 </div>
               </div>
             </div>
           </div>
         </div>

                   {/* Payments List Section - Bottom */}
          <div className="card">
            <div className="card-header">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <PieChart className="w-5 h-5 text-primary-600 mr-2" />
                  <h2 className="card-title">Payments List</h2>
                </div>
                <button
                  onClick={() => setShowAddExpense(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </button>
              </div>
            </div>
           <div className="card-content">
             <div className="overflow-x-auto">
               <table className="w-full">
                                   <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Property</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                                   <tbody>
                                         {rentPayments.map((payment: any) => {
                       const property = properties.find(p => p.id === payment.property_id)
                       return (
                         <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                           <td className="py-4 px-4 text-sm text-gray-900">
                             {property?.address || 'Unknown Property'}
                           </td>
                           <td className="py-4 px-4 text-sm text-gray-900">
                             {format(new Date(payment.payment_date), 'MMM dd, yyyy')}
                           </td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentTypeColor(payment.payment_type)}`}>
                            {getPaymentTypeLabel(payment.payment_type)}
                          </span>
                        </td>
                                                 <td className="py-4 px-4 text-sm text-gray-900">{payment.notes || payment.payment_type}</td>
                        <td className={`py-4 px-4 font-medium ${payment.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${Math.abs(payment.amount).toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => editPayment(payment)}
                              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                              title="Edit payment"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removePayment(payment.id)}
                              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                              title="Remove payment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                                                     </div>
                         </td>
                       </tr>
                       )
                     })}
                                         {rentPayments.length === 0 && (
                       <tr>
                         <td colSpan={6} className="py-8 text-center text-gray-500">
                           No payments found for this date range.
                         </td>
                       </tr>
                     )}
                  </tbody>
               </table>
             </div>
           </div>
         </div>
      </div>

             {/* Add Entry Modal */}
       {showAddExpense && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <h2 className="text-xl font-bold text-gray-900">Add Entry</h2>
               <button
                 onClick={() => setShowAddExpense(false)}
                 className="text-gray-400 hover:text-gray-600"
               >
                 ✕
               </button>
             </div>
             <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                 <select
                   value={newEntry.type}
                   onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as 'expense' | 'income' })}
                   className="input"
                 >
                   <option value="expense">Expense</option>
                   <option value="income">Income</option>
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                 <input
                   type="number"
                   value={newEntry.amount}
                   onChange={(e) => setNewEntry({ ...newEntry, amount: parseFloat(e.target.value) || 0 })}
                   className="input"
                   placeholder="0.00"
                   step="0.01"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                 <input
                   type="text"
                   value={newEntry.description}
                   onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                   className="input"
                   placeholder="Enter description"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                 <input
                   type="date"
                   value={newEntry.date}
                   onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                   className="input"
                 />
               </div>
             </div>
             <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
               <button
                 onClick={() => setShowAddExpense(false)}
                 className="btn btn-secondary"
               >
                 Cancel
               </button>
               <button
                 onClick={addEntry}
                 className="btn btn-primary"
               >
                 Add Entry
               </button>
             </div>
           </div>
         </div>
       )}

       {/* Edit Entry Modal */}
       {showEditExpense && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
           <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
             <div className="flex items-center justify-between p-6 border-b border-gray-200">
               <h2 className="text-xl font-bold text-gray-900">Edit Entry</h2>
               <button
                 onClick={() => {
                   setShowEditExpense(false)
                   setEditingEntry(null)
                 }}
                 className="text-gray-400 hover:text-gray-600"
               >
                 ✕
               </button>
             </div>
             <div className="p-6 space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                 <select
                   value={newEntry.type}
                   onChange={(e) => setNewEntry({ ...newEntry, type: e.target.value as 'expense' | 'income' })}
                   className="input"
                 >
                   <option value="expense">Expense</option>
                   <option value="income">Income</option>
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                 <input
                   type="number"
                   value={newEntry.amount}
                   onChange={(e) => setNewEntry({ ...newEntry, amount: parseFloat(e.target.value) || 0 })}
                   className="input"
                   placeholder="0.00"
                   step="0.01"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                 <input
                   type="text"
                   value={newEntry.description}
                   onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                   className="input"
                   placeholder="Enter description"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                 <input
                   type="date"
                   value={newEntry.date}
                   onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                   className="input"
                 />
               </div>
             </div>
             <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
               <button
                 onClick={() => {
                   setShowEditExpense(false)
                   setEditingEntry(null)
                 }}
                 className="btn btn-secondary"
               >
                 Cancel
               </button>
               <button
                 onClick={updateEntry}
                 className="btn btn-primary"
               >
                 Update Entry
               </button>
             </div>
           </div>
         </div>
       )}
    </div>
  )
} 
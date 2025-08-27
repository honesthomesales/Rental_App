import { createClient } from '@supabase/supabase-js'
import { getLateFeeAmount, isPeriodLate, addCadenceDays } from './cadence'

interface PaymentAllocationParams {
  tenantId: string
  paymentId: string
  amount: number
  paymentDate: string // yyyy-mm-dd
}

interface AllocationResult {
  periodId: string
  toLateFee: number
  toRent: number
  periodDueDate: string
  status: 'paid' | 'partial'
}

interface PaymentAllocationResponse {
  applied: AllocationResult[]
  remainder: number
}

interface RentPeriod {
  id: string
  tenant_id: string
  property_id: string
  lease_id: string
  period_due_date: string
  rent_amount: number
  rent_cadence: string
  status: string
  amount_paid: number
  late_fee_applied: number
  late_fee_waived: boolean
  due_date_override: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

interface PaymentAllocation {
  id: string
  payment_id: string
  rent_period_id: string
  amount_to_late_fee: number
  amount_to_rent: number
  applied_at: string
}

export async function allocatePayment(params: PaymentAllocationParams): Promise<PaymentAllocationResponse> {
  const { tenantId, paymentId, amount, paymentDate } = params
  
  // Get Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  
  try {
    // Step 1: Check if allocations already exist (idempotency)
    const { data: existingAllocations } = await supabase
      .from('RENT_payment_allocations')
      .select('*')
      .eq('payment_id', paymentId)
    
    if (existingAllocations && existingAllocations.length > 0) {
      // Return existing allocations
      const applied: AllocationResult[] = await Promise.all(
        existingAllocations.map(async (allocation) => {
          const { data: period } = await supabase
            .from('RENT_rent_periods')
            .select('period_due_date')
            .eq('id', allocation.rent_period_id)
            .single()
          
          return {
            periodId: allocation.rent_period_id,
            toLateFee: allocation.amount_to_late_fee,
            toRent: allocation.amount_to_rent,
            periodDueDate: period?.period_due_date || '',
            status: 'paid' as const
          }
        })
      )
      
      return { applied, remainder: 0 }
    }
    
    // Step 2: Update payment date_paid
    await supabase
      .from('RENT_payments')
      .update({ date_paid: paymentDate })
      .eq('id', paymentId)
    
    // Step 3: Load unpaid/partial rent periods ordered by due_date ASC
    const { data: periods, error: periodsError } = await supabase
      .from('RENT_rent_periods')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('status', ['unpaid', 'partial'])
      .order('period_due_date', { ascending: true })
    
    if (periodsError) {
      throw new Error(`Failed to load rent periods: ${periodsError.message}`)
    }
    
    if (!periods) {
      return { applied: [], remainder: amount }
    }
    
    let remainingAmount = amount
    const applied: AllocationResult[] = []
    const allocationsToInsert: Omit<PaymentAllocation, 'id' | 'applied_at'>[] = []
    
    // Step 4: Process each period FIFO
    for (const period of periods) {
      if (remainingAmount <= 0) break
      
      // Calculate if period is late and late fee amount
      const isLate = isPeriodLate(period.period_due_date) && !period.late_fee_waived
      const lateFeeAmount = isLate ? getLateFeeAmount(period.rent_cadence) : 0
      const totalOwed = period.rent_amount - period.amount_paid + (lateFeeAmount - period.late_fee_applied)
      
      if (totalOwed <= 0) continue
      
      // Calculate allocation amounts
      let toLateFee = 0
      let toRent = 0
      
      if (isLate && remainingAmount > 0) {
        const lateFeeOwed = lateFeeAmount - period.late_fee_applied
        toLateFee = Math.min(remainingAmount, lateFeeOwed)
        remainingAmount -= toLateFee
      }
      
      if (remainingAmount > 0) {
        const rentOwed = period.rent_amount - period.amount_paid
        toRent = Math.min(remainingAmount, rentOwed)
        remainingAmount -= toRent
      }
      
      // Update period
      const newAmountPaid = period.amount_paid + toRent
      const newLateFeeApplied = period.late_fee_applied + toLateFee
      const newStatus = newAmountPaid >= period.rent_amount ? 'paid' : 'partial'
      
      await supabase
        .from('RENT_rent_periods')
        .update({
          amount_paid: newAmountPaid,
          late_fee_applied: newLateFeeApplied,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', period.id)
      
      // Prepare allocation record
      allocationsToInsert.push({
        payment_id: paymentId,
        rent_period_id: period.id,
        amount_to_late_fee: toLateFee,
        amount_to_rent: toRent
      })
      
      // Add to results
      applied.push({
        periodId: period.id,
        toLateFee,
        toRent,
        periodDueDate: period.period_due_date,
        status: newStatus
      })
    }
    
    // Step 5: Create future periods if remainder > 0
    if (remainingAmount > 0) {
      const lastPeriod = periods[periods.length - 1]
      if (lastPeriod) {
        let currentDate = lastPeriod.period_due_date
        let futurePeriodsCreated = 0
        
        while (remainingAmount > 0 && futurePeriodsCreated < 12) { // Limit to 12 future periods
          currentDate = addCadenceDays(currentDate, lastPeriod.rent_cadence)
          
          // Create future period
          const { data: newPeriod, error: createError } = await supabase
            .from('RENT_rent_periods')
            .insert({
              tenant_id: tenantId,
              property_id: lastPeriod.property_id,
              lease_id: lastPeriod.lease_id,
              period_due_date: currentDate,
              rent_amount: lastPeriod.rent_amount,
              rent_cadence: lastPeriod.rent_cadence,
              status: 'unpaid',
              amount_paid: 0,
              late_fee_applied: 0,
              late_fee_waived: false
            })
            .select()
            .single()
          
          if (createError) {
            console.error('Failed to create future period:', createError)
            break
          }
          
          if (newPeriod) {
            // Allocate remaining amount to this future period
            const toRent = Math.min(remainingAmount, newPeriod.rent_amount)
            const newStatus = toRent >= newPeriod.rent_amount ? 'paid' : 'partial'
            
            await supabase
              .from('RENT_rent_periods')
              .update({
                amount_paid: toRent,
                status: newStatus,
                updated_at: new Date().toISOString()
              })
              .eq('id', newPeriod.id)
            
            // Add allocation record
            allocationsToInsert.push({
              payment_id: paymentId,
              rent_period_id: newPeriod.id,
              amount_to_late_fee: 0,
              amount_to_rent: toRent
            })
            
            // Add to results
            applied.push({
              periodId: newPeriod.id,
              toLateFee: 0,
              toRent,
              periodDueDate: newPeriod.period_due_date,
              status: newStatus
            })
            
            remainingAmount -= toRent
            futurePeriodsCreated++
          }
        }
      }
    }
    
    // Step 6: Insert all allocation records
    if (allocationsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('RENT_payment_allocations')
        .insert(allocationsToInsert)
      
      if (insertError) {
        throw new Error(`Failed to insert allocations: ${insertError.message}`)
      }
    }
    
    // Step 7: Update payment notes with summary
    const summary = {
      allocations: applied.length,
      totalApplied: amount - remainingAmount,
      remainder: remainingAmount,
      timestamp: new Date().toISOString()
    }
    
    await supabase
      .from('RENT_payments')
      .update({ 
        notes: JSON.stringify(summary),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId)
    
    return { applied, remainder: remainingAmount }
    
  } catch (error) {
    console.error('Payment allocation error:', error)
    throw error
  }
}

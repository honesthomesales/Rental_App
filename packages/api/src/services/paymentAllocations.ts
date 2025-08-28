import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
import type { Database } from '../database.types';

type PaymentAllocationRow = Database['public']['Tables']['RENT_payment_allocations']['Row'];
type PaymentAllocationInsert = Database['public']['Tables']['RENT_payment_allocations']['Insert'];
type PaymentAllocationUpdate = Database['public']['Tables']['RENT_payment_allocations']['Update'];
type PaymentRow = Database['public']['Tables']['RENT_payments']['Row'];
type RentPeriodRow = Database['public']['Tables']['RENT_rent_periods']['Row'];
type LeaseRow = Database['public']['Tables']['RENT_leases']['Row'];

interface PaymentAllocationResult {
  success: boolean;
  allocations: Array<{
    rent_period_id: string;
    amount_to_rent: number;
    amount_to_late_fee: number;
    late_fee_waived: boolean;
  }>;
  remaining_amount: number;
  total_late_fees: number;
  total_rent_paid: number;
  errors: string[];
}

interface RentPeriodWithBalance {
  id: string;
  period_due_date: string;
  rent_amount: number;
  rent_cadence: string;
  status: string;
  amount_paid: number;
  late_fee_applied: number;
  late_fee_waived: boolean;
  balance_due: number;
  days_late: number;
  is_in_range: boolean;
}

export class PaymentAllocationsService {
  /**
   * Get late fee amount based on rent cadence
   */
  static getLateFeeAmount(cadence: string): number {
    const normalizedCadence = cadence.toLowerCase().trim();
    
    switch (normalizedCadence) {
      case 'weekly':
        return 10;
      case 'bi-weekly':
      case 'biweekly':
      case 'bi_weekly':
        return 20;
      case 'monthly':
      default:
        return 45;
    }
  }

  /**
   * Calculate days late for a rent period
   */
  static calculateDaysLate(dueDate: string, paymentDate: string): number {
    const due = new Date(dueDate);
    const payment = new Date(paymentDate);
    const diffTime = payment.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Check if payment is within grace period (5 days or fewer)
   */
  static isPaymentInRange(daysLate: number): boolean {
    return daysLate <= 5;
  }

  /**
   * Get all unpaid rent periods for a tenant, ordered by due date (oldest first)
   */
  static async getUnpaidRentPeriods(tenantId: string): Promise<RentPeriodWithBalance[]> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: periods, error } = await supabase
        .from('RENT_rent_periods')
        .select(`
          *,
          RENT_leases!inner(
            rent_cadence
          )
        `)
        .eq('tenant_id', tenantId)
        .in('status', ['unpaid', 'partial'])
        .order('period_due_date', { ascending: true });

      if (error) {
        throw error;
      }

      if (!periods || periods.length === 0) {
        return [];
      }

      // Calculate balances and late fees for each period
      const today = new Date();
      return periods.map(period => {
        const dueDate = new Date(period.period_due_date);
        const daysLate = this.calculateDaysLate(period.period_due_date, today.toISOString().split('T')[0]);
        const isInRange = this.isPaymentInRange(daysLate);
        
        // Calculate late fee if not waived and payment is late
        let lateFee = 0;
        if (!period.late_fee_waived && daysLate > 5) {
          const lateFeePerPeriod = this.getLateFeeAmount(period.RENT_leases.rent_cadence);
          lateFee = lateFeePerPeriod;
        }

        const balanceDue = period.rent_amount + lateFee - period.amount_paid;

        return {
          id: period.id,
          period_due_date: period.period_due_date,
          rent_amount: period.rent_amount,
          rent_cadence: period.RENT_leases.rent_cadence,
          status: period.status,
          amount_paid: period.amount_paid,
          late_fee_applied: period.late_fee_applied,
          late_fee_waived: period.late_fee_waived,
          balance_due: balanceDue,
          days_late: daysLate,
          is_in_range: isInRange
        };
      });
    } catch (error) {
      console.error('Error getting unpaid rent periods:', error);
      throw error;
    }
  }

  /**
   * Allocate a payment across rent periods according to business rules
   */
  static async allocatePayment(
    paymentId: string,
    tenantId: string,
    paymentAmount: number,
    paymentDate: string
  ): Promise<PaymentAllocationResult> {
    try {
      const supabase = getSupabaseClient();
      
      // Get all unpaid rent periods for the tenant
      const unpaidPeriods = await this.getUnpaidRentPeriods(tenantId);
      
      if (unpaidPeriods.length === 0) {
        return {
          success: false,
          allocations: [],
          remaining_amount: paymentAmount,
          total_late_fees: 0,
          total_rent_paid: 0,
          errors: ['No unpaid rent periods found for tenant']
        };
      }

      let remainingAmount = paymentAmount;
      const allocations: PaymentAllocationResult['allocations'] = [];
      const errors: string[] = [];
      let totalLateFees = 0;
      let totalRentPaid = 0;

      // Process periods in order (oldest due first)
      for (const period of unpaidPeriods) {
        if (remainingAmount <= 0) break;

        const periodAllocation = {
          rent_period_id: period.id,
          amount_to_rent: 0,
          amount_to_late_fee: 0,
          late_fee_waived: false
        };

        // Calculate what's needed for this period
        const rentNeeded = period.rent_amount - period.amount_paid;
        const lateFeeNeeded = period.late_fee_applied - (period.late_fee_waived ? 0 : 0);
        
        // Determine if this period should get late fee waived (payment within 5 days)
        const daysLateAtPayment = this.calculateDaysLate(period.period_due_date, paymentDate);
        const shouldWaiveLateFee = this.isPaymentInRange(daysLateAtPayment);

        if (shouldWaiveLateFee && period.late_fee_applied > 0) {
          // Waive late fee if payment is within grace period
          periodAllocation.late_fee_waived = true;
        }

        // Calculate late fee for this period if not waived
        let currentLateFee = 0;
        if (!shouldWaiveLateFee && daysLateAtPayment > 5) {
          currentLateFee = this.getLateFeeAmount(period.rent_cadence);
        }

        // Apply payment to this period
        if (rentNeeded > 0) {
          const rentToPay = Math.min(remainingAmount, rentNeeded);
          periodAllocation.amount_to_rent = rentToPay;
          remainingAmount -= rentToPay;
          totalRentPaid += rentToPay;
        }

        // Apply remaining amount to late fees if any
        if (remainingAmount > 0 && currentLateFee > 0) {
          const lateFeeToPay = Math.min(remainingAmount, currentLateFee);
          periodAllocation.amount_to_late_fee = lateFeeToPay;
          remainingAmount -= lateFeeToPay;
          totalLateFees += lateFeeToPay;
        }

        allocations.push(periodAllocation);
      }

      // If there's remaining amount, allocate to future periods (prepay)
      if (remainingAmount > 0) {
        // Get future periods that aren't due yet
        const futurePeriods = unpaidPeriods.filter(period => {
          const dueDate = new Date(period.period_due_date);
          const paymentDateObj = new Date(paymentDate);
          return dueDate > paymentDateObj;
        });

        for (const period of futurePeriods) {
          if (remainingAmount <= 0) break;

          const rentNeeded = period.rent_amount - period.amount_paid;
          if (rentNeeded > 0) {
            const rentToPay = Math.min(remainingAmount, rentNeeded);
            
            allocations.push({
              rent_period_id: period.id,
              amount_to_rent: rentToPay,
              amount_to_late_fee: 0,
              late_fee_waived: false
            });

            remainingAmount -= rentToPay;
            totalRentPaid += rentToPay;
          }
        }
      }

      // Create allocation records in database
      if (allocations.length > 0) {
        const allocationInserts: PaymentAllocationInsert[] = allocations.map(allocation => ({
          payment_id: paymentId,
          rent_period_id: allocation.rent_period_id,
          amount_to_rent: allocation.amount_to_rent,
          amount_to_late_fee: allocation.amount_to_late_fee,
          applied_at: new Date().toISOString()
        }));

        const { error: insertError } = await supabase
          .from('RENT_payment_allocations')
          .insert(allocationInserts);

        if (insertError) {
          errors.push(`Failed to create allocation records: ${insertError.message}`);
        }
      }

      // Update rent period statuses
      await this.updateRentPeriodStatuses(allocations, tenantId);

      return {
        success: true,
        allocations,
        remaining_amount: remainingAmount,
        total_late_fees: totalLateFees,
        total_rent_paid: totalRentPaid,
        errors
      };

    } catch (error) {
      console.error('Error allocating payment:', error);
      return {
        success: false,
        allocations: [],
        remaining_amount: paymentAmount,
        total_late_fees: 0,
        total_rent_paid: 0,
        errors: [handleSupabaseError(error)]
      };
    }
  }

  /**
   * Update rent period statuses based on allocations
   */
  private static async updateRentPeriodStatuses(
    allocations: PaymentAllocationResult['allocations'],
    tenantId: string
  ): Promise<void> {
    try {
      const supabase = getSupabaseClient();

      for (const allocation of allocations) {
        if (allocation.amount_to_rent > 0 || allocation.amount_to_late_fee > 0) {
          // Get current period data
          const { data: period, error: getError } = await supabase
            .from('RENT_rent_periods')
            .select('*')
            .eq('id', allocation.rent_period_id)
            .single();

          if (getError || !period) continue;

          // Calculate new amounts
          const newAmountPaid = period.amount_paid + allocation.amount_to_rent;
          const newLateFeeApplied = period.late_fee_applied + allocation.amount_to_late_fee;
          
          // Determine new status
          let newStatus = period.status;
          if (newAmountPaid >= period.rent_amount) {
            newStatus = 'paid';
          } else if (newAmountPaid > 0) {
            newStatus = 'partial';
          }

          // Update the period
          const { error: updateError } = await supabase
            .from('RENT_rent_periods')
            .update({
              amount_paid: newAmountPaid,
              late_fee_applied: newLateFeeApplied,
              late_fee_waived: allocation.late_fee_waived,
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', allocation.rent_period_id);

          if (updateError) {
            console.error('Error updating rent period:', updateError);
          }
        }
      }
    } catch (error) {
      console.error('Error updating rent period statuses:', error);
    }
  }

  /**
   * Get payment allocation details for a specific payment
   */
  static async getPaymentAllocations(paymentId: string): Promise<ApiResponse<PaymentAllocationRow[]>> {
    try {
      const supabase = getSupabaseClient();
      
      const { data: allocations, error } = await supabase
        .from('RENT_payment_allocations')
        .select('*')
        .eq('payment_id', paymentId)
        .order('applied_at', { ascending: true });

      if (error) {
        return createApiResponse(null, handleSupabaseError(error));
      }

      return createApiResponse(allocations || []);
    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Get allocation summary for a tenant
   */
  static async getTenantAllocationSummary(tenantId: string): Promise<ApiResponse<{
    total_owed: number;
    total_paid: number;
    total_late_fees: number;
    overdue_periods: number;
    upcoming_due: number;
    payment_history: Array<{
      payment_date: string;
      amount: number;
      allocations: Array<{
        period_due_date: string;
        amount_to_rent: number;
        amount_to_late_fee: number;
      }>;
    }>;
  }>> {
    try {
      const supabase = getSupabaseClient();
      
      // Get all rent periods for the tenant
      const { data: periods, error: periodsError } = await supabase
        .from('RENT_rent_periods')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('period_due_date', { ascending: true });

      if (periodsError) {
        return createApiResponse(null, handleSupabaseError(periodsError));
      }

      // Get all payments for the tenant
      const { data: payments, error: paymentsError } = await supabase
        .from('RENT_payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('payment_date', { ascending: false });

      if (paymentsError) {
        return createApiResponse(null, handleSupabaseError(paymentsError));
      }

      // Calculate summary
      const today = new Date();
      let totalOwed = 0;
      let totalPaid = 0;
      let totalLateFees = 0;
      let overduePeriods = 0;
      let upcomingDue = 0;

      for (const period of periods || []) {
        const dueDate = new Date(period.period_due_date);
        const daysLate = this.calculateDaysLate(period.period_due_date, today.toISOString().split('T')[0]);
        
        if (period.status === 'unpaid' || period.status === 'partial') {
          const balance = period.rent_amount - period.amount_paid;
          totalOwed += balance;
          
          if (daysLate > 5) {
            overduePeriods++;
            const lateFee = this.getLateFeeAmount(period.rent_cadence || 'monthly');
            totalLateFees += lateFee;
            totalOwed += lateFee;
          } else if (dueDate > today) {
            upcomingDue++;
          }
        }
        
        totalPaid += period.amount_paid;
      }

      // Get payment history with allocations
      const paymentHistory = await Promise.all((payments || []).map(async (payment) => {
        const allocations = await this.getPaymentAllocations(payment.id);
        return {
          payment_date: payment.payment_date,
          amount: payment.amount,
          allocations: allocations.success && allocations.data ? allocations.data.map(allocation => ({
            period_due_date: '', // Would need to join with rent_periods to get this
            amount_to_rent: allocation.amount_to_rent,
            amount_to_late_fee: allocation.amount_to_late_fee,
          })) : []
        };
      }));

      return createApiResponse({
        total_owed: totalOwed,
        total_paid: totalPaid,
        total_late_fees: totalLateFees,
        overdue_periods: overduePeriods,
        upcoming_due: upcomingDue,
        payment_history: paymentHistory
      });

    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }

  /**
   * Reverse a payment allocation (for refunds or corrections)
   */
  static async reversePaymentAllocation(
    paymentId: string,
    reason: string
  ): Promise<ApiResponse<boolean>> {
    try {
      const supabase = getSupabaseClient();
      
      // Get all allocations for this payment
      const { data: allocations, error: getError } = await supabase
        .from('RENT_payment_allocations')
        .select('*')
        .eq('payment_id', paymentId);

      if (getError) {
        return createApiResponse(null, handleSupabaseError(getError));
      }

      if (!allocations || allocations.length === 0) {
        return createApiResponse(false, 'No allocations found for this payment');
      }

      // Reverse each allocation
      for (const allocation of allocations) {
        // Get the rent period
        const { data: period, error: periodError } = await supabase
          .from('RENT_rent_periods')
          .select('*')
          .eq('id', allocation.rent_period_id)
          .single();

        if (periodError || !period) continue;

        // Calculate new amounts
        const newAmountPaid = Math.max(0, period.amount_paid - allocation.amount_to_rent);
        const newLateFeeApplied = Math.max(0, period.late_fee_applied - allocation.amount_to_late_fee);
        
        // Determine new status
        let newStatus = period.status;
        if (newAmountPaid === 0) {
          newStatus = 'unpaid';
        } else if (newAmountPaid < period.rent_amount) {
          newStatus = 'partial';
        }

        // Update the rent period
        const { error: updateError } = await supabase
          .from('RENT_rent_periods')
          .update({
            amount_paid: newAmountPaid,
            late_fee_applied: newLateFeeApplied,
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', allocation.rent_period_id);

        if (updateError) {
          console.error('Error updating rent period during reversal:', updateError);
        }
      }

      // Delete the allocation records
      const { error: deleteError } = await supabase
        .from('RENT_payment_allocations')
        .delete()
        .eq('payment_id', paymentId);

      if (deleteError) {
        return createApiResponse(null, handleSupabaseError(deleteError));
      }

      return createApiResponse(true);

    } catch (error) {
      return createApiResponse(null, handleSupabaseError(error));
    }
  }
}

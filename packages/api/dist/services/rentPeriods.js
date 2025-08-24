"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentPeriodsService = void 0;
const client_1 = require("../client");
class RentPeriodsService {
    /**
     * Create rent periods for a tenant based on their lease
     */
    static async createRentPeriods(tenant, lease) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            if (!lease.lease_start_date || !lease.rent || !lease.rent_cadence) {
                return (0, client_1.createApiResponse)(null, 'Missing lease information');
            }
            const periods = [];
            const startDate = new Date(lease.lease_start_date);
            const today = new Date();
            let currentDate = new Date(startDate);
            // Create periods from lease start to today
            while (currentDate <= today) {
                const dueDate = new Date(currentDate);
                const isLate = dueDate < today;
                const daysLate = isLate ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;
                const shouldApplyLateFee = daysLate > 5;
                let lateFee = 0;
                if (shouldApplyLateFee) {
                    switch (lease.rent_cadence.toLowerCase().trim()) {
                        case 'weekly':
                            lateFee = 10;
                            break;
                        case 'bi-weekly':
                        case 'biweekly':
                        case 'bi_weekly':
                            lateFee = 20;
                            break;
                        case 'monthly':
                        default:
                            lateFee = 50;
                            break;
                    }
                }
                periods.push({
                    tenant_id: tenant.id,
                    property_id: tenant.property_id || '',
                    lease_id: lease.id,
                    period_due_date: dueDate.toISOString().split('T')[0],
                    rent_amount: lease.rent,
                    rent_cadence: lease.rent_cadence,
                    status: 'unpaid',
                    amount_paid: 0,
                    late_fee_applied: lateFee,
                    late_fee_waived: false,
                    due_date_override: undefined,
                    notes: undefined
                });
                // Move to next period based on cadence
                switch (lease.rent_cadence.toLowerCase().trim()) {
                    case 'weekly':
                        currentDate.setDate(currentDate.getDate() + 7);
                        break;
                    case 'bi-weekly':
                    case 'biweekly':
                    case 'bi_weekly':
                        currentDate.setDate(currentDate.getDate() + 14);
                        break;
                    case 'monthly':
                    default:
                        currentDate.setMonth(currentDate.getMonth() + 1);
                        break;
                }
            }
            // Insert all periods
            const { data, error } = await supabase
                .from('RENT_rent_periods')
                .insert(periods)
                .select('*');
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(data);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get all rent periods for a tenant
     */
    static async getTenantRentPeriods(tenantId) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_rent_periods')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('period_due_date', { ascending: true });
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(data);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Update a rent period (for overrides)
     */
    static async updateRentPeriod(periodId, updates) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data, error } = await supabase
                .from('RENT_rent_periods')
                .update(updates)
                .eq('id', periodId)
                .select('*')
                .single();
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(data);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Calculate total owed for a tenant based on rent periods
     */
    static async calculateTenantOwedAmount(tenantId) {
        try {
            const periodsResponse = await this.getTenantRentPeriods(tenantId);
            if (!periodsResponse.success || !periodsResponse.data) {
                return (0, client_1.createApiResponse)(null, periodsResponse.error);
            }
            const periods = periodsResponse.data;
            let totalOwed = 0;
            let totalLateFees = 0;
            let missedPeriods = 0;
            for (const period of periods) {
                if (period.status !== 'paid') {
                    const periodOwed = period.rent_amount - period.amount_paid;
                    totalOwed += periodOwed;
                    if (period.late_fee_applied > 0 && !period.late_fee_waived) {
                        totalLateFees += period.late_fee_applied;
                    }
                    if (periodOwed > 0) {
                        missedPeriods++;
                    }
                }
            }
            return (0, client_1.createApiResponse)({
                totalOwed,
                totalLateFees,
                missedPeriods,
                periods
            });
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Allocate a payment to specific rent periods
     */
    static async allocatePayment(paymentId, allocations) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            // Create payment allocations
            const allocationData = allocations.map(allocation => ({
                payment_id: paymentId,
                rent_period_id: allocation.rent_period_id,
                amount_allocated: allocation.amount
            }));
            const { error: allocationError } = await supabase
                .from('RENT_payment_allocations')
                .insert(allocationData);
            if (allocationError) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(allocationError));
            }
            // Update rent periods with amounts paid
            for (const allocation of allocations) {
                // First get the current period to calculate new values
                const { data: currentPeriod, error: getError } = await supabase
                    .from('RENT_rent_periods')
                    .select('amount_paid, rent_amount')
                    .eq('id', allocation.rent_period_id)
                    .single();
                if (getError) {
                    return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(getError));
                }
                const newAmountPaid = (currentPeriod.amount_paid || 0) + allocation.amount;
                const newStatus = newAmountPaid >= currentPeriod.rent_amount ? 'paid' : 'partial';
                const { error: updateError } = await supabase
                    .from('RENT_rent_periods')
                    .update({
                    amount_paid: newAmountPaid,
                    status: newStatus
                })
                    .eq('id', allocation.rent_period_id);
                if (updateError) {
                    return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(updateError));
                }
            }
            return (0, client_1.createApiResponse)(true);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
}
exports.RentPeriodsService = RentPeriodsService;

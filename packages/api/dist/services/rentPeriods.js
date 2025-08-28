"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RentPeriodsService = void 0;
const client_1 = require("../client");
class RentPeriodsService {
    /**
     * Generate rent periods for a lease from start date to end date
     */
    static async generateRentPeriods(leaseId, tenantId, propertyId, startDate, endDate, rentAmount, rentCadence, rentDueDay = 1) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            // Check if periods already exist for this lease
            const { data: existingPeriods, error: checkError } = await supabase
                .from('RENT_rent_periods')
                .select('id')
                .eq('lease_id', leaseId);
            if (checkError) {
                return {
                    success: false,
                    periods_created: 0,
                    periods_updated: 0,
                    errors: [(0, client_1.handleSupabaseError)(checkError)]
                };
            }
            // If periods exist, update them instead of creating new ones
            if (existingPeriods && existingPeriods.length > 0) {
                return await this.updateExistingRentPeriods(leaseId, tenantId, propertyId, startDate, endDate, rentAmount, rentCadence, rentDueDay);
            }
            // Generate new periods
            const periods = this.calculateRentPeriods(startDate, endDate, rentCadence, rentDueDay);
            const periodInserts = periods.map(period => ({
                tenant_id: tenantId,
                property_id: propertyId,
                lease_id: leaseId,
                period_due_date: period.dueDate,
                rent_amount: rentAmount,
                rent_cadence: rentCadence,
                status: 'unpaid',
                amount_paid: 0,
                late_fee_applied: 0,
                late_fee_waived: false
            }));
            const { error: insertError } = await supabase
                .from('RENT_rent_periods')
                .insert(periodInserts);
            if (insertError) {
                return {
                    success: false,
                    periods_created: 0,
                    periods_updated: 0,
                    errors: [(0, client_1.handleSupabaseError)(insertError)]
                };
            }
            return {
                success: true,
                periods_created: periods.length,
                periods_updated: 0,
                errors: []
            };
        }
        catch (error) {
            return {
                success: false,
                periods_created: 0,
                periods_updated: 0,
                errors: [(0, client_1.handleSupabaseError)(error)]
            };
        }
    }
    /**
     * Update existing rent periods for a lease
     */
    static async updateExistingRentPeriods(leaseId, tenantId, propertyId, startDate, endDate, rentAmount, rentCadence, rentDueDay) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            // Get existing periods
            const { data: existingPeriods, error: getError } = await supabase
                .from('RENT_rent_periods')
                .select('*')
                .eq('lease_id', leaseId)
                .order('period_due_date', { ascending: true });
            if (getError) {
                return {
                    success: false,
                    periods_created: 0,
                    periods_updated: 0,
                    errors: [(0, client_1.handleSupabaseError)(getError)]
                };
            }
            if (!existingPeriods || existingPeriods.length === 0) {
                return {
                    success: false,
                    periods_created: 0,
                    periods_updated: 0,
                    errors: ['No existing periods found to update']
                };
            }
            // Generate new period dates
            const newPeriods = this.calculateRentPeriods(startDate, endDate, rentCadence, rentDueDay);
            let periodsUpdated = 0;
            const errors = [];
            // Update existing periods and create new ones if needed
            for (let i = 0; i < Math.max(existingPeriods.length, newPeriods.length); i++) {
                if (i < existingPeriods.length && i < newPeriods.length) {
                    // Update existing period
                    const existingPeriod = existingPeriods[i];
                    const newPeriod = newPeriods[i];
                    const { error: updateError } = await supabase
                        .from('RENT_rent_periods')
                        .update({
                        period_due_date: newPeriod.dueDate,
                        rent_amount: rentAmount,
                        rent_cadence: rentCadence,
                        updated_at: new Date().toISOString()
                    })
                        .eq('id', existingPeriod.id);
                    if (updateError) {
                        errors.push(`Failed to update period ${existingPeriod.id}: ${updateError.message}`);
                    }
                    else {
                        periodsUpdated++;
                    }
                }
                else if (i >= existingPeriods.length) {
                    // Create new period
                    const newPeriod = newPeriods[i];
                    const { error: insertError } = await supabase
                        .from('RENT_rent_periods')
                        .insert({
                        tenant_id: tenantId,
                        property_id: propertyId,
                        lease_id: leaseId,
                        period_due_date: newPeriod.dueDate,
                        rent_amount: rentAmount,
                        rent_cadence: rentCadence,
                        status: 'unpaid',
                        amount_paid: 0,
                        late_fee_applied: 0,
                        late_fee_waived: false
                    });
                    if (insertError) {
                        errors.push(`Failed to create new period: ${insertError.message}`);
                    }
                    else {
                        periodsUpdated++;
                    }
                }
            }
            return {
                success: errors.length === 0,
                periods_created: 0,
                periods_updated: periodsUpdated,
                errors
            };
        }
        catch (error) {
            return {
                success: false,
                periods_created: 0,
                periods_updated: 0,
                errors: [(0, client_1.handleSupabaseError)(error)]
            };
        }
    }
    /**
     * Calculate rent period dates based on cadence and due day
     */
    static calculateRentPeriods(startDate, endDate, cadence, dueDay) {
        const periods = [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const normalizedCadence = cadence.toLowerCase().trim();
        let currentDate = new Date(start);
        currentDate.setDate(dueDay); // Set to the due day of the month
        // Adjust if the due day is before the start date
        if (currentDate < start) {
            currentDate.setMonth(currentDate.getMonth() + 1);
            currentDate.setDate(dueDay);
        }
        while (currentDate <= end) {
            periods.push({
                dueDate: currentDate.toISOString().split('T')[0]
            });
            // Move to next period based on cadence
            switch (normalizedCadence) {
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
        return periods;
    }
    /**
     * Get all rent periods for a tenant
     */
    static async getTenantRentPeriods(tenantId) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data: periods, error } = await supabase
                .from('RENT_rent_periods')
                .select('*')
                .eq('tenant_id', tenantId)
                .order('period_due_date', { ascending: true });
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(periods || []);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get rent periods for a specific property
     */
    static async getPropertyRentPeriods(propertyId) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data: periods, error } = await supabase
                .from('RENT_rent_periods')
                .select('*')
                .eq('property_id', propertyId)
                .order('period_due_date', { ascending: true });
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(periods || []);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get overdue rent periods for a tenant
     */
    static async getOverdueRentPeriods(tenantId) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const today = new Date().toISOString().split('T')[0];
            const { data: periods, error } = await supabase
                .from('RENT_rent_periods')
                .select('*')
                .eq('tenant_id', tenantId)
                .lt('period_due_date', today)
                .in('status', ['unpaid', 'partial'])
                .order('period_due_date', { ascending: true });
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(periods || []);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Update rent period status
     */
    static async updateRentPeriodStatus(periodId, status, amountPaid, lateFeeApplied, lateFeeWaived) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const updateData = {
                status,
                updated_at: new Date().toISOString()
            };
            if (amountPaid !== undefined) {
                updateData.amount_paid = amountPaid;
            }
            if (lateFeeApplied !== undefined) {
                updateData.late_fee_applied = lateFeeApplied;
            }
            if (lateFeeWaived !== undefined) {
                updateData.late_fee_waived = lateFeeWaived;
            }
            const { data: period, error } = await supabase
                .from('RENT_rent_periods')
                .update(updateData)
                .eq('id', periodId)
                .select()
                .single();
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(period);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Delete rent periods for a lease (when lease is terminated)
     */
    static async deleteLeaseRentPeriods(leaseId) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { error } = await supabase
                .from('RENT_rent_periods')
                .delete()
                .eq('lease_id', leaseId);
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            return (0, client_1.createApiResponse)(true);
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
    /**
     * Get rent period summary for a tenant
     */
    static async getTenantRentPeriodSummary(tenantId) {
        try {
            const supabase = (0, client_1.getSupabaseClient)();
            const { data: periods, error } = await supabase
                .from('RENT_rent_periods')
                .select('*')
                .eq('tenant_id', tenantId);
            if (error) {
                return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
            }
            if (!periods || periods.length === 0) {
                return (0, client_1.createApiResponse)({
                    total_periods: 0,
                    paid_periods: 0,
                    unpaid_periods: 0,
                    partial_periods: 0,
                    overdue_periods: 0,
                    total_owed: 0,
                    total_paid: 0,
                    total_late_fees: 0
                });
            }
            const today = new Date();
            let paidPeriods = 0;
            let unpaidPeriods = 0;
            let partialPeriods = 0;
            let overduePeriods = 0;
            let totalOwed = 0;
            let totalPaid = 0;
            let totalLateFees = 0;
            for (const period of periods) {
                if (period.status === 'paid') {
                    paidPeriods++;
                    totalPaid += period.amount_paid;
                }
                else if (period.status === 'partial') {
                    partialPeriods++;
                    totalPaid += period.amount_paid;
                    totalOwed += period.rent_amount - period.amount_paid;
                }
                else {
                    unpaidPeriods++;
                    totalOwed += period.rent_amount;
                }
                // Check if overdue
                const dueDate = new Date(period.period_due_date);
                if (dueDate < today && period.status !== 'paid') {
                    overduePeriods++;
                }
                totalLateFees += period.late_fee_applied;
            }
            return (0, client_1.createApiResponse)({
                total_periods: periods.length,
                paid_periods: paidPeriods,
                unpaid_periods: unpaidPeriods,
                partial_periods: partialPeriods,
                overdue_periods: overduePeriods,
                total_owed: totalOwed,
                total_paid: totalPaid,
                total_late_fees: totalLateFees
            });
        }
        catch (error) {
            return (0, client_1.createApiResponse)(null, (0, client_1.handleSupabaseError)(error));
        }
    }
}
exports.RentPeriodsService = RentPeriodsService;

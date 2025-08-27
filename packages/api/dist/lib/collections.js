"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollectedTotal = getCollectedTotal;
exports.getCollectionsSummary = getCollectionsSummary;
const supabase_js_1 = require("@supabase/supabase-js");
/**
 * Get total collections for a date range with optional tenant/property filters
 */
async function getCollectedTotal(params) {
    const { start, end, tenantId, propertyId } = params;
    // Get Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing Supabase environment variables');
    }
    const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey);
    try {
        // Build the base query
        let query = supabase
            .from('RENT_payments')
            .select(`
        id, 
        amount, 
        date_paid, 
        tenant_id, 
        property_id, 
        RENT_tenants!inner(first_name, last_name), 
        RENT_properties!inner(name)
      `)
            .gte('date_paid', start)
            .lte('date_paid', end)
            .eq('status', 'completed');
        // Apply filters
        if (tenantId) {
            query = query.eq('tenant_id', tenantId);
        }
        if (propertyId) {
            query = query.eq('property_id', propertyId);
        }
        // Execute query
        const { data: payments, error } = await query;
        if (error) {
            throw new Error(`Failed to fetch payments: ${error.message}`);
        }
        if (!payments) {
            return {
                totalCollected: 0,
                paymentCount: 0,
                dateRange: { start, end },
                breakdown: {}
            };
        }
        // Calculate totals
        const totalCollected = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
        const paymentCount = payments.length;
        // Build breakdown by tenant if no tenant filter
        let breakdownByTenant;
        if (!tenantId) {
            const tenantMap = new Map();
            payments.forEach(payment => {
                const tenantKey = payment.tenant_id || 'unknown';
                const tenantName = payment.RENT_tenants
                    ? `${payment.RENT_tenants.first_name} ${payment.RENT_tenants.last_name}`
                    : 'Unknown Tenant';
                if (tenantMap.has(tenantKey)) {
                    const existing = tenantMap.get(tenantKey);
                    existing.amount += payment.amount || 0;
                    existing.paymentCount += 1;
                }
                else {
                    tenantMap.set(tenantKey, {
                        amount: payment.amount || 0,
                        paymentCount: 1,
                        name: tenantName
                    });
                }
            });
            breakdownByTenant = Array.from(tenantMap.entries()).map(([tenantId, data]) => ({
                tenantId,
                tenantName: data.name,
                amount: data.amount,
                paymentCount: data.paymentCount
            }));
        }
        // Build breakdown by property if no property filter
        let breakdownByProperty;
        if (!propertyId) {
            const propertyMap = new Map();
            payments.forEach(payment => {
                const propertyKey = payment.property_id || 'unknown';
                const propertyName = payment.RENT_properties?.name || 'Unknown Property';
                if (propertyMap.has(propertyKey)) {
                    const existing = propertyMap.get(propertyKey);
                    existing.amount += payment.amount || 0;
                    existing.paymentCount += 1;
                }
                else {
                    propertyMap.set(propertyKey, {
                        amount: payment.amount || 0,
                        paymentCount: 1,
                        name: propertyName
                    });
                }
            });
            breakdownByProperty = Array.from(propertyMap.entries()).map(([propertyId, data]) => ({
                propertyId,
                propertyName: data.name,
                amount: data.amount,
                paymentCount: data.paymentCount
            }));
        }
        return {
            totalCollected,
            paymentCount,
            dateRange: { start, end },
            breakdown: {
                byTenant: breakdownByTenant,
                byProperty: breakdownByProperty
            }
        };
    }
    catch (error) {
        console.error('Collections reporting error:', error);
        throw error;
    }
}
/**
 * Get collections summary for dashboard
 */
async function getCollectionsSummary() {
    try {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        // This month
        const thisMonthStart = new Date(thisYear, thisMonth, 1).toISOString().split('T')[0];
        const thisMonthEnd = new Date(thisYear, thisMonth + 1, 0).toISOString().split('T')[0];
        const thisMonthResult = await getCollectedTotal({ start: thisMonthStart, end: thisMonthEnd });
        // Last month
        const lastMonthStart = new Date(thisYear, thisMonth - 1, 1).toISOString().split('T')[0];
        const lastMonthEnd = new Date(thisYear, thisMonth, 0).toISOString().split('T')[0];
        const lastMonthResult = await getCollectedTotal({ start: lastMonthStart, end: lastMonthEnd });
        // This year
        const thisYearStart = new Date(thisYear, 0, 1).toISOString().split('T')[0];
        const thisYearEnd = new Date(thisYear, 11, 31).toISOString().split('T')[0];
        const thisYearResult = await getCollectedTotal({ start: thisYearStart, end: thisYearEnd });
        // Last year
        const lastYearStart = new Date(thisYear - 1, 0, 1).toISOString().split('T')[0];
        const lastYearEnd = new Date(thisYear - 1, 11, 31).toISOString().split('T')[0];
        const lastYearResult = await getCollectedTotal({ start: lastYearStart, end: lastYearEnd });
        return {
            thisMonth: thisMonthResult.totalCollected,
            lastMonth: lastMonthResult.totalCollected,
            thisYear: thisYearResult.totalCollected,
            lastYear: lastYearResult.totalCollected
        };
    }
    catch (error) {
        console.error('Collections summary error:', error);
        throw error;
    }
}

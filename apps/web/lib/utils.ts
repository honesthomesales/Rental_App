/**
 * Normalize rent amount to monthly based on rent cadence
 * @param amount - The rent amount
 * @param cadence - The rent cadence (weekly, bi-weekly, monthly)
 * @returns Monthly equivalent rent amount
 */
export function normalizeRentToMonthly(amount: number, cadence?: string): number {
  if (!amount || !cadence) return amount || 0
  
  const normalizedCadence = cadence.toLowerCase().trim()
  
  switch (normalizedCadence) {
    case 'weekly':
      return amount * 4.33 // 52 weeks ÷ 12 months = 4.33 weeks per month
    case 'bi-weekly':
    case 'biweekly':
    case 'bi_weekly':
      return amount * 2.17 // 52 weeks ÷ 24 bi-weekly periods = 2.17 per month
    case 'monthly':
    default:
      return amount
  }
}

/**
 * Extract rent cadence from property notes
 * @param notes - Property notes that may contain rent cadence info
 * @returns The rent cadence or 'monthly' as default
 */
export function extractRentCadence(notes?: string): string {
  if (!notes) return 'monthly'
  
  const cadenceMatch = notes.match(/Rent cadence:\s*(\w+)/i)
  return cadenceMatch ? cadenceMatch[1] : 'monthly'
}

/**
 * Format rent amount with cadence for display
 * @param amount - The rent amount
 * @param cadence - The rent cadence
 * @returns Formatted string like "$800/weekly" or "$1,600/monthly"
 */
export function formatRentWithCadence(amount: number, cadence?: string): string {
  if (!amount) return '$0'
  
  const normalizedCadence = cadence?.toLowerCase().trim() || 'monthly'
  return `$${amount.toLocaleString()}/${normalizedCadence}`
}

/**
 * Get the late fee amount for a specific rent cadence
 * @param cadence - The rent cadence (weekly, bi-weekly, monthly)
 * @returns The late fee amount
 */
export function getLateFeeAmount(cadence: string | null | undefined): number {
  if (!cadence || typeof cadence !== 'string') {
    return 45 // Default to monthly late fee
  }
  
  const normalizedCadence = cadence.toLowerCase().trim()
  
  switch (normalizedCadence) {
    case 'weekly':
      return 10
    case 'bi-weekly':
    case 'biweekly':
    case 'bi_weekly':
      return 20
    case 'monthly':
    default:
      return 45
  }
}

/**
 * Calculate the number of days between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Number of days between dates
 */
export function daysBetween(date1: string | Date, date2: string | Date): number {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2.getTime() - d1.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Get the expected payment date for a specific pay period
 * @param leaseStartDate - The lease start date
 * @param payPeriodIndex - The pay period index (0 = first period)
 * @param cadence - The rent cadence
 * @returns The expected payment date for that period
 */
export function getExpectedPaymentDate(leaseStartDate: string, payPeriodIndex: number, cadence: string): Date {
  const startDate = new Date(leaseStartDate)
  const normalizedCadence = cadence.toLowerCase().trim()
  
  // console.log('getExpectedPaymentDate: leaseStartDate:', leaseStartDate, 'payPeriodIndex:', payPeriodIndex, 'cadence:', cadence, 'normalizedCadence:', normalizedCadence)
  
  let result: Date
  switch (normalizedCadence) {
    case 'weekly':
      result = new Date(startDate.getTime() + (payPeriodIndex * 7 * 24 * 60 * 60 * 1000))
      break
    case 'bi-weekly':
    case 'biweekly':
    case 'bi_weekly':
      result = new Date(startDate.getTime() + (payPeriodIndex * 14 * 24 * 60 * 60 * 1000))
      break
    case 'monthly':
    default:
      result = new Date(startDate)
      result.setMonth(result.getMonth() + payPeriodIndex)
      break
  }
  
  // console.log('getExpectedPaymentDate: Result date:', result.toISOString().split('T')[0])
  return result
}

/**
 * Get the last N expected payment dates for a tenant
 * @param leaseStartDate - The lease start date
 * @param cadence - The rent cadence
 * @param count - Number of periods to calculate (default 12)
 * @returns Array of expected payment dates
 */
export function getLastExpectedPaymentDates(leaseStartDate: string, cadence: string, count: number = 12): Date[] {
  const dates: Date[] = []
  const today = new Date()
  
  // console.log('getLastExpectedPaymentDates: Starting with lease start:', leaseStartDate, 'cadence:', cadence, 'count:', count)
  
  // Start from the most recent period and go backwards
  let periodIndex = 0
  let currentDate = getExpectedPaymentDate(leaseStartDate, periodIndex, cadence)
  
  // Find the most recent expected payment date that's in the past
  // Add safety check to prevent infinite loop
  let safetyCounter = 0
  const maxIterations = count * 3 // Safety limit
  
  while (currentDate <= today && periodIndex < count * 2 && safetyCounter < maxIterations) {
    periodIndex++
    currentDate = getExpectedPaymentDate(leaseStartDate, periodIndex, cadence)
    safetyCounter++
  }
  
  if (safetyCounter >= maxIterations) {
    console.error('getLastExpectedPaymentDates: Safety limit reached, possible infinite loop detected')
    return []
  }
  
  // Go back to the previous period (the last one that was <= today)
  periodIndex = Math.max(0, periodIndex - 1)
  
  // Get the last N periods starting from the most recent
  for (let i = Math.max(0, periodIndex - count + 1); i <= periodIndex; i++) {
    const date = getExpectedPaymentDate(leaseStartDate, i, cadence)
    if (date <= today) {
      dates.push(date)
    }
  }
  
  // console.log('Expected payment dates for', cadence, 'cadence (last 5):', dates.slice(-5).map(d => d.toISOString().split('T')[0]))
  return dates
}

/**
 * Calculate late fees for a specific pay period
 * @param expectedDate - The expected payment date
 * @param paymentHistory - Array of payment history items
 * @param cadence - The rent cadence
 * @param rentAmount - The rent amount for this period
 * @returns Object with late fees and payment status
 */
export function calculateLateFeesForPeriod(
  expectedDate: Date, 
  paymentHistory: Array<{date: string, amount: number, status: string}> | undefined, 
  cadence: string,
  rentAmount: number
): {
  isLate: boolean
  daysLate: number
  lateFees: number
  totalPaid: number
  outstanding: number
} {
  const lateFeeAmount = getLateFeeAmount(cadence)
  const expectedDateStr = expectedDate.toISOString().split('T')[0]
  
  // Handle undefined payment history
  if (!paymentHistory || !Array.isArray(paymentHistory)) {
    paymentHistory = []
  }
  
  // Find payments for this period (more flexible matching)
  const periodStart = new Date(expectedDate)
  periodStart.setDate(periodStart.getDate() - 2) // Allow 2 days early
  
  const periodEnd = new Date(expectedDate)
  periodEnd.setDate(periodEnd.getDate() + 5) // 5 days grace period
  
  // First try to find payments within the grace period
  let periodPayments = paymentHistory.filter(payment => {
    const paymentDate = new Date(payment.date)
    return paymentDate >= periodStart && paymentDate <= periodEnd && payment.status === 'completed'
  })
  
  // If no payments found in grace period, look for any payments made after the expected date
  // This handles cases where payments were made late but still should count
  if (periodPayments.length === 0) {
    periodPayments = paymentHistory.filter(payment => {
      const paymentDate = new Date(payment.date)
      return paymentDate >= expectedDate && payment.status === 'completed'
    })
  }
  
  const totalPaid = periodPayments.reduce((sum, payment) => sum + payment.amount, 0)
  const outstanding = Math.max(0, rentAmount - totalPaid)
  
  // Check if payment is late (no payment within grace period)
  const today = new Date()
  const isLate = periodPayments.length === 0 && today > periodEnd
  
  // Log payment matching details for debugging
  if (periodPayments.length > 0 || isLate) {
    console.log('PAYMENT PERIOD ANALYSIS:', {
      expectedDate: expectedDateStr,
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      today: today.toISOString().split('T')[0],
      paymentsFound: periodPayments.length,
      totalPaid,
      rentAmount,
      outstanding,
      isLate,
      lateFee: outstanding > 0 ? lateFeeAmount : 0,
      allPayments: paymentHistory.map(p => ({ date: p.date, amount: p.amount, status: p.status }))
    })
  }
  
  if (isLate) {
    // Payment is late - no payment was made within the grace period
    const daysLate = daysBetween(periodEnd, today)
    
    return {
      isLate: true,
      daysLate: Math.max(0, daysLate),
      lateFees: outstanding > 0 ? lateFeeAmount : 0,
      totalPaid,
      outstanding
    }
  }
  
  return {
    isLate: false,
    daysLate: 0,
    lateFees: 0,
    totalPaid,
    outstanding
  }
}

/**
 * Calculate total late payments for a tenant over the last 12 pay periods
 * @param tenant - The tenant object
 * @param property - The property object (for rent cadence)
 * @returns Object with total late fees and outstanding amounts
 */
export function calculateTotalLatePayments(tenant: any, property: any): {
  totalLateFees: number;
  totalOutstanding: number;
  totalDue: number;
  latePeriods: number;
  payPeriods: Array<{
    expectedDate: Date;
    isLate: boolean;
    daysLate: number;
    lateFees: number;
    totalPaid: number;
    outstanding: number;
  }>;
} {
  console.log('calculateTotalLatePayments: Starting calculation for', tenant.first_name, tenant.last_name);
  
  // Defensive checks for SSR
  if (!tenant || !property) {
    console.log('calculateTotalLatePayments: Missing required data - tenant:', !!tenant, 'property:', !!property);
    return {
      totalLateFees: 0,
      totalOutstanding: 0,
      totalDue: 0,
      latePeriods: 0,
      payPeriods: []
    };
  }
  
  try {
    // Get lease information from the leases array or RENT_leases
    let activeLease = null;
    if (tenant.leases && tenant.leases.length > 0) {
      activeLease = tenant.leases[0];
    } else if (tenant.RENT_leases && tenant.RENT_leases.length > 0) {
      activeLease = tenant.RENT_leases[0];
    }
    
    console.log('calculateTotalLatePayments: Active lease found:', !!activeLease);
    console.log('calculateTotalLatePayments: Lease data:', activeLease);
    
    if (!activeLease || !activeLease.lease_start_date) {
      console.log('calculateTotalLatePayments: No active lease found for tenant');
      return {
        totalLateFees: 0,
        totalOutstanding: 0,
        totalDue: 0,
        latePeriods: 0,
        payPeriods: []
      };
    }

    const cadence = activeLease.rent_cadence || 'monthly';
    const monthlyRent = activeLease.rent || 0;
    console.log('calculateTotalLatePayments: Cadence:', cadence, 'Monthly rent:', monthlyRent);
    // Convert monthly rent to the actual rent amount for the cadence
    let rentAmount = monthlyRent;
    if (cadence === 'weekly') {
      rentAmount = monthlyRent / 4.33; // Convert monthly to weekly
    } else if (cadence === 'bi-weekly' || cadence === 'biweekly' || cadence === 'bi_weekly') {
      rentAmount = monthlyRent / 2.17; // Convert monthly to bi-weekly
    }
    // For monthly, keep as is
    
    console.log('Tenant calculation - Cadence:', cadence, 'Monthly rent:', monthlyRent, 'Period rent:', rentAmount);
    const expectedDates = getLastExpectedPaymentDates(activeLease.lease_start_date, cadence, 12);
    
    // Use actual payment history from the tenant object (which comes from payment_history JSON field)
    const paymentHistory = tenant.payment_history || [];
    console.log('Payment history for', tenant.first_name, ':', paymentHistory);
    
    let totalLateFees = 0;
    let totalOutstanding = 0;
    let latePeriods = 0;
    
    const payPeriods = expectedDates.map(expectedDate => {
      const periodResult = calculateLateFeesForPeriod(
        expectedDate,
        paymentHistory,
        rentAmount,
        cadence
      );
      
      if (periodResult.isLate) {
        totalLateFees += periodResult.lateFees;
        totalOutstanding += periodResult.outstanding;
        latePeriods++;
      }
      
      return {
        expectedDate,
        ...periodResult
      };
    });
    
    const result = {
      totalLateFees,
      totalOutstanding,
      totalDue: totalLateFees + totalOutstanding,
      latePeriods,
      payPeriods
    };
    
    console.log('calculateTotalLatePayments: Final result for', tenant.first_name, tenant.last_name, ':', result);
    return result;
  } catch (error) {
    console.error('Error calculating late payments:', error);
    return {
      totalLateFees: 0,
      totalOutstanding: 0,
      totalDue: 0,
      latePeriods: 0,
      payPeriods: []
    };
  }
}

/**
 * Check if a tenant is currently late based on the new calculation system
 * @param tenant - The tenant object
 * @param property - The property object
 * @returns True if tenant is late
 */
export function isTenantLate(tenant: any, property: any): boolean {
  try {
    if (!tenant || !property) {
      console.log('isTenantLate: Missing tenant or property data');
      return false;
    }
    
    console.log('isTenantLate: Starting check for tenant', tenant.first_name, tenant.last_name);
    
    // Check both possible lease data structures
    let activeLease = null;
    if (tenant.leases && tenant.leases.length > 0) {
      activeLease = tenant.leases[0];
    } else if (tenant.RENT_leases && tenant.RENT_leases.length > 0) {
      activeLease = tenant.RENT_leases[0];
    }
    
    console.log('isTenantLate: Active lease found:', !!activeLease);
    console.log('isTenantLate: Tenant lease_start_date:', activeLease?.lease_start_date);
    console.log('isTenantLate: Property rent from lease:', activeLease?.rent);
    
    const latePaymentInfo = calculateTotalLatePayments(tenant, property);
    const isLate = latePaymentInfo.totalDue > 0;
    console.log('isTenantLate: Result - Total due:', latePaymentInfo.totalDue, 'Is late:', isLate);
    return isLate;
  } catch (error) {
    console.error('Error checking if tenant is late:', error);
    return false;
  }
} 

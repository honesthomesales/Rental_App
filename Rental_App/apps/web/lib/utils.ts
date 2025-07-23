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
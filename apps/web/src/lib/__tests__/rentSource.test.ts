/**
 * Tests for rentSource.ts
 * 
 * These tests verify the shapes and behavior of the centralized rent source functions.
 * Note: This is a stub test file - actual testing would require Jest setup.
 */

import { 
  getActiveLeaseByProperty,
  getLeaseFields,
  listPeriods,
  listOverdue,
  getLateFeeAmount,
  isWithinGracePeriod,
  calculatePeriodOutstanding,
  type LeaseData,
  type RentPeriod,
  type OverduePeriod
} from '../rentSource'

// Simple test runner for basic functionality
function runTests() {
  console.log('Running rentSource tests...')
  
  // Test getLateFeeAmount function
  console.log('Testing getLateFeeAmount...')
  console.log('Weekly:', getLateFeeAmount('weekly') === 10 ? 'PASS' : 'FAIL')
  console.log('Bi-weekly:', getLateFeeAmount('bi-weekly') === 20 ? 'PASS' : 'FAIL')
  console.log('Monthly:', getLateFeeAmount('monthly') === 45 ? 'PASS' : 'FAIL')
  console.log('Unknown:', getLateFeeAmount('unknown') === 45 ? 'PASS' : 'FAIL')
  
  // Test isWithinGracePeriod function
  console.log('Testing isWithinGracePeriod...')
  const dueDate = new Date('2024-01-01')
  const paymentDate = new Date('2024-01-03')
  console.log('Within grace:', isWithinGracePeriod(paymentDate, dueDate, 5) === true ? 'PASS' : 'FAIL')
  
  // Test calculatePeriodOutstanding function
  console.log('Testing calculatePeriodOutstanding...')
  const period: RentPeriod = {
    id: 'period-1',
    lease_id: 'lease-123',
    tenant_id: 'tenant-123',
    property_id: 'property-123',
    period_due_date: '2024-01-01',
    rent_amount: 1200,
    rent_cadence: 'monthly',
    status: 'unpaid',
    amount_paid: 600,
    // late_fee_applied: 45, // Not in current schema
    // late_fee_waived: false, // Not in current schema
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
  console.log('Outstanding calculation:', calculatePeriodOutstanding(period) === 600 ? 'PASS' : 'FAIL')
  
  console.log('Basic tests completed.')
}

// Export for potential use
export { runTests }

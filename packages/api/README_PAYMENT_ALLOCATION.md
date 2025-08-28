# Payment Allocation System

This system handles the complex logic of applying rent payments across multiple rent periods with proper late fee calculations and forward allocation.

## Key Features

### 1. Late Fee Structure
- **Weekly**: $10 per period
- **Bi-weekly**: $20 per period  
- **Monthly**: $45 per period

### 2. Payment Grace Period
- Payments are considered "in range" if they are 5 days or fewer late
- Late fees are waived for payments within the grace period

### 3. Payment Allocation Rules
- **Oldest Due First**: Payments are applied to the oldest unpaid rent periods first
- **Sequential Application**: After covering past dues, remaining amounts are applied forward
- **Prepayment Support**: Excess payments can prepay future rent periods

### 4. Database Integration
- Automatically creates rent periods when leases are created
- Tracks payment allocations in `RENT_payment_allocations` table
- Updates rent period statuses (unpaid → partial → paid)

## Usage Examples

### Example 1: Basic Payment Allocation

```typescript
import { PaymentAllocationsService } from '@rental-app/api';

// Record a $840 payment on 1/30/2025
const result = await PaymentAllocationsService.allocatePayment(
  'payment-uuid-123',
  'tenant-uuid-456',
  840,
  '2025-01-30'
);

console.log(result);
// {
//   success: true,
//   allocations: [
//     { rent_period_id: 'period-1', amount_to_rent: 200, amount_to_late_fee: 0 },
//     { rent_period_id: 'period-2', amount_to_rent: 200, amount_to_late_fee: 0 },
//     { rent_period_id: 'period-3', amount_to_rent: 200, amount_to_late_fee: 0 },
//     { rent_period_id: 'period-4', amount_to_rent: 200, amount_to_late_fee: 10 },
//     { rent_period_id: 'period-5', amount_to_rent: 40, amount_to_late_fee: 0 }
//   ],
//   remaining_amount: 0,
//   total_late_fees: 10,
//   total_rent_paid: 840
// }
```

### Example 2: Creating Rent Periods

```typescript
import { RentPeriodsService } from '@rental-app/api';

// Generate rent periods for a weekly lease
const result = await RentPeriodsService.generateRentPeriods(
  'lease-uuid-123',
  'tenant-uuid-456',
  'property-uuid-789',
  '2025-01-01',
  '2025-12-31',
  200, // $200 per week
  'weekly',
  1 // Due on 1st of each week
);

console.log(result);
// {
//   success: true,
//   periods_created: 52, // 52 weeks
//   periods_updated: 0,
//   errors: []
// }
```

### Example 3: Recording a Tenant Payment

```typescript
import { TenantsService } from '@rental-app/api';

// Record a rent payment
const result = await TenantsService.recordPayment(
  'tenant-uuid-456',
  {
    payment_date: '2025-01-30',
    amount: 840
  }
);

// This automatically:
// 1. Creates a payment record in RENT_payments
// 2. Generates rent periods if they don't exist
// 3. Allocates the payment across periods
// 4. Updates tenant's last payment date
```

## Database Tables

### RENT_rent_periods
- Stores individual rent periods for each lease
- Tracks due dates, amounts, and payment status
- Links to tenants, properties, and leases

### RENT_payment_allocations  
- Records how each payment is distributed
- Tracks amounts applied to rent vs. late fees
- Links payments to specific rent periods

### RENT_payments
- Stores the actual payment records
- Links to tenants, properties, and leases
- Tracks payment dates and amounts

## Business Logic Flow

1. **Payment Received**: Tenant makes a payment
2. **Period Generation**: System ensures rent periods exist for the lease
3. **Allocation Calculation**: Payment is distributed across unpaid periods
4. **Late Fee Assessment**: Late fees calculated based on cadence and days late
5. **Status Updates**: Rent period statuses updated (unpaid → partial → paid)
6. **Forward Allocation**: Excess amounts prepay future periods

## Late Fee Calculation

```typescript
// Example: Weekly rent due 1/1, paid 1/8 (7 days late)
const daysLate = 7;
const isInRange = daysLate <= 5; // false
const lateFee = isInRange ? 0 : 10; // $10 late fee
```

## Error Handling

The system includes comprehensive error handling:
- Database connection issues
- Missing tenant/lease data
- Invalid payment amounts
- Allocation failures

All errors are logged and returned in the response for debugging.

## Testing

To test the system:

1. Create a tenant with an active lease
2. Generate rent periods for the lease
3. Record a payment
4. Check the allocation results
5. Verify rent period statuses are updated

## Future Enhancements

- Bulk payment processing
- Payment plan support
- Advanced late fee calculations
- Integration with accounting systems
- Reporting and analytics

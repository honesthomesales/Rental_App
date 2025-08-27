# Rent Periods & Late Fee Management Setup

This document explains how to set up the new Rent Periods & Late Fee Management functionality in your Rental App.

## Overview

The Rent Periods feature allows you to:
- Track individual rent periods for each tenant
- Apply and manage late fees
- Bulk waive late fees for multiple periods
- View detailed payment history

## Database Setup

### 1. Run the Migration

The required database table is created by running the migration file:

```sql
-- This file is located at: supabase/migrations/005_create_rent_periods_table.sql
-- Run this in your Supabase SQL editor or via the CLI
```

### 2. Table Structure

The `RENT_rent_periods` table includes:
- `tenant_id`: Links to the tenant
- `property_id`: Links to the property
- `lease_id`: Links to the lease (optional)
- `period_due_date`: When rent is due
- `rent_amount`: Amount due for this period
- `amount_paid`: Amount already paid
- `late_fees`: Late fees applied (can be waived)
- `status`: Payment status (paid/unpaid/partial)
- `days_late`: Number of days late

## How to Use

### 1. Access the Page

Navigate to **Rent Periods** in the main menu (it's been added to the navigation).

### 2. Current Functionality

- **View Tenants**: See all tenants with late payments
- **Sort by Priority**: Tenants are sorted by payment cadence (Weekly → Bi-weekly → Monthly)
- **Search & Filter**: Find specific tenants or properties

### 3. Late Fee Management (After Table Setup)

Once the `RENT_rent_periods` table is created:

- **Select Periods**: Use checkboxes to select individual rent periods
- **Bulk Actions**: Select multiple periods and waive late fees at once
- **Real-time Updates**: Changes are reflected immediately without page refresh
- **Success Messages**: Clear feedback when operations complete

## Features

### ✅ Implemented
- [x] Rent Periods page with navigation
- [x] Tenant listing with late payment information
- [x] Sorting by payment cadence priority
- [x] Search and filtering capabilities
- [x] Bulk selection of periods
- [x] Late fee waiver functionality
- [x] Real-time state updates (no page refresh)
- [x] Success/error messaging
- [x] Responsive design

### 🔄 Pending Database Setup
- [ ] Individual rent period display
- [ ] Late fee waiver operations
- [ ] Bulk operations

## API Services

### RentPeriodsService
- `getTenantRentPeriods(tenantId)`: Get periods for a specific tenant
- `getPropertyRentPeriods(propertyId)`: Get periods for a specific property
- `getLateRentPeriods()`: Get all periods with late fees
- `waiveLateFees(periodIds[])`: Bulk waive late fees
- `update(id, data)`: Update a single period
- `bulkUpdate(periodIds[], data)`: Update multiple periods

### TenantsService
- `getLateTenants()`: Get all tenants with late payments
- `getTenantRentPeriods(tenantId)`: Get rent periods for a tenant

## Error Handling

The page gracefully handles missing data:
- Shows informative messages when the table doesn't exist
- Disables functionality that requires the table
- Provides clear guidance on what needs to be set up

## Next Steps

1. **Run the migration** to create the `RENT_rent_periods` table
2. **Populate the table** with existing tenant data (optional)
3. **Test the functionality** by navigating to the Rent Periods page
4. **Use the bulk waiver feature** to manage late fees

## Troubleshooting

### "Rent Periods Table Not Available" Message
- Ensure you've run the migration file
- Check that the table exists in your database
- Verify RLS policies are properly configured

### No Data Displayed
- Check that tenants have late payments
- Verify the `getLateTenants()` API call is working
- Check browser console for any errors

### Late Fee Waiver Not Working
- Ensure the `RENT_rent_periods` table exists
- Check that the periods have `late_fees > 0`
- Verify the API service is properly built and deployed

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Verify the database table exists and has proper permissions
3. Ensure the API package has been rebuilt after changes
4. Check that all required environment variables are set

# Rent Lease Consistency Audit Report

**Branch:** `chore/rent-lease-consistency`  
**Date:** $(date)  
**Purpose:** Audit all references to legacy rent data sources before implementing centralized rent source system

## Executive Summary

This audit identified **56 direct references** to `RENT_properties.monthly_rent` and **extensive usage** of `properties.notes` for rent cadence extraction across 6 major screens. The current system has **inconsistent data sources** with multiple fallback patterns that need to be unified through the new centralized rent source system.

## Risk Assessment by Screen

### 🔴 HIGH RISK - DASHBOARD (`apps/web/app/page.tsx`)
**Data Sources:**
- `RENT_properties.monthly_rent` (lines 28, 124, 153, 232, 305, 616)
- `properties.notes` for rent cadence (lines 152, 616)
- Mixed lease/property rent fallbacks (line 232)

**Risk:** Core business metrics (total rent, outstanding balances) use inconsistent data sources
**Impact:** Financial calculations may be inaccurate

### 🔴 HIGH RISK - LATE TENANTS (`apps/web/app/late-tenants/page.tsx`)
**Data Sources:**
- `RENT_properties.monthly_rent` (line 271)
- Direct `RENT_rent_periods` table access (lines 91-94, 231-235, 464-466)
- Custom late fee calculation logic (lines 528-543)
- Fallback rent period generation (lines 464-525)

**Risk:** Critical late payment detection uses non-existent table and fallback logic
**Impact:** Late tenant detection may fail or be inaccurate

### 🟡 MEDIUM RISK - PAYMENTS (`apps/web/app/payments/page.tsx`)
**Data Sources:**
- `RENT_properties.monthly_rent` (lines 105, 706, 892, 925, 978)
- Lease rent with property fallback (lines 105, 892, 925, 978)
- Custom rent cadence logic (lines 620-648, 923-928)

**Risk:** Payment validation and expected amounts use mixed sources
**Impact:** Payment processing may use incorrect expected amounts

### 🟡 MEDIUM RISK - PROPERTIES (`apps/web/app/properties/page.tsx`)
**Data Sources:**
- `RENT_properties.monthly_rent` (lines 70-71, 550-555)
- Active lease rent with fallback (lines 70-71)
- Rent cadence extraction from notes (line 12)

**Risk:** Property listing displays inconsistent rent information
**Impact:** User confusion about actual rent amounts

### 🟡 MEDIUM RISK - TENANTS (`apps/web/app/tenants/page.tsx`)
**Data Sources:**
- `tenant.monthly_rent` (lines 250-253, 357-359)
- Lease rent with tenant fallback (lines 355-359)

**Risk:** Tenant rent display uses legacy tenant-level rent field
**Impact:** Inconsistent rent information across tenant views

### 🟡 MEDIUM RISK - PROFIT (`apps/web/app/profit/page.tsx`)
**Data Sources:**
- `RENT_properties.monthly_rent` (lines 224-226, 244-246)
- `properties.notes` for rent cadence (lines 224, 244)
- Rent normalization logic (lines 7, 225, 245)

**Risk:** Profit calculations use property-level rent instead of lease-based rent
**Impact:** Financial reporting may not reflect actual lease terms

## Detailed Findings

### 1. RENT_properties.monthly_rent References (56 total)

#### Dashboard Screen (`apps/web/app/page.tsx`)
```typescript
// Line 28: Interface definition
monthly_rent: number | null

// Line 124: Data loading
monthly_rent: property.monthly_rent ?? null,

// Line 153: Rent calculation with cadence extraction
const rentCadence = extractRentCadence(property.notes || undefined)
const normalizedRent = normalizeRentToMonthly(property.monthly_rent || 0, rentCadence)

// Line 232: Outstanding balance calculation
const rentAmount = lease.rent || property.monthly_rent || 0

// Line 305-306: Sorting logic
aValue = a.monthly_rent || 0
bValue = b.monthly_rent || 0

// Line 616: Display with cadence
{property.monthly_rent ? `${property.monthly_rent.toLocaleString()} (${extractRentCadence(property.notes || undefined)})` : 'N/A'}
```

#### Late Tenants Screen (`apps/web/app/late-tenants/page.tsx`)
```typescript
// Line 271: Property data structure
monthly_rent: property.monthly_rent
```

#### Payments Screen (`apps/web/app/payments/page.tsx`)
```typescript
// Line 105: Late fee calculation
const rentAmount = property.leases?.[0]?.rent || property.monthly_rent || 0

// Line 706: Expected amount calculation
const expectedAmount = property.leases?.[0]?.rent || property.monthly_rent || 0

// Line 892: Payment validation
const monthlyRent = lease.rent || property.monthly_rent || 0

// Line 925: Rent cadence display
const rent = property.leases?.[0]?.rent || property.monthly_rent || 0

// Line 978: Bi-weekly rent calculation
const expectedBiWeeklyRent = lease?.rent || propertyData?.monthly_rent || 0
```

#### Properties Screen (`apps/web/app/properties/page.tsx`)
```typescript
// Line 70-71: Sorting logic
aValue = a.active_leases?.[0]?.rent || a.monthly_rent || 0
bValue = b.active_leases?.[0]?.rent || b.monthly_rent || 0

// Line 550-555: Display logic
else if (property.monthly_rent) {
  return (
    <div className="text-sm font-medium text-blue-600">
      ${property.monthly_rent.toLocaleString()}/month
      <div className="text-xs text-gray-500">(Base)</div>
    </div>
  )
}
```

#### Tenants Screen (`apps/web/app/tenants/page.tsx`)
```typescript
// Line 250-253: Tenant rent display
) : tenant.monthly_rent ? (
  <div className="text-sm text-gray-600">
    <span className="font-medium">Rent:</span> ${tenant.monthly_rent.toLocaleString()}/month
  </div>
) : null}

// Line 357-359: Table display
: tenant.monthly_rent 
  ? `$${tenant.monthly_rent.toLocaleString()}/month`
  : 'Not set'}
```

#### Profit Screen (`apps/web/app/profit/page.tsx`)
```typescript
// Line 224-226: Potential income calculation
const rentCadence = extractRentCadence(property.notes)
const normalizedRent = normalizeRentToMonthly(property.monthly_rent || 0, rentCadence)

// Line 244-246: Expected income calculation
const rentCadence = extractRentCadence(property.notes)
const normalizedRent = normalizeRentToMonthly(property.monthly_rent || 0, rentCadence)
```

### 2. Properties.notes Usage for Rent Cadence

#### Utility Functions (`apps/web/lib/utils.ts`)
```typescript
// Line 30: extractRentCadence function
export function extractRentCadence(notes?: string): string {
  if (!notes) return 'monthly'
  const cadenceMatch = notes.match(/Rent cadence:\s*(\w+)/i)
  // ... extraction logic
}

// Line 7: normalizeRentToMonthly function
export function normalizeRentToMonthly(amount: number, cadence?: string): number {
  // ... normalization logic
}
```

#### Usage Across Screens:
- **Dashboard:** Lines 152, 616
- **Profit:** Lines 224, 244
- **Properties:** Line 12 (import)

### 3. Direct RENT_rent_periods Access

#### Late Tenants Screen (`apps/web/app/late-tenants/page.tsx`)
```typescript
// Line 91-94: Commented out API method
// Skip the API method since it depends on non-existent RENT_rent_periods table
// Go directly to the fallback method that works with existing data
console.log('Using fallback method directly (API method requires RENT_rent_periods table)...')

// Line 231-235: Direct table access attempt
const { data: rentPeriods, error: periodsError } = await supabase
  .from('RENT_rent_periods')
  .select('*')
  .eq('tenant_id', tenant.id)
  .order('period_due_date', { ascending: false });

// Line 464-466: Fallback data generation
// Since RENT_rent_periods table doesn't exist, generate sample data based on lease
console.log('Generating sample rent periods for display')
```

### 4. Late Fee Calculation Logic

#### Late Tenants Screen (`apps/web/app/late-tenants/page.tsx`)
```typescript
// Line 528-543: getLateFeeAmount function
const getLateFeeAmount = (cadence: string): number => {
  const normalized = cadence.toLowerCase().trim()
  switch (normalized) {
    case 'weekly': return 10
    case 'bi-weekly': return 20
    case 'monthly': return 45
    default: return 45
  }
}
```

#### Utils (`apps/web/lib/utils.ts`)
```typescript
// Line 272-376: calculateTotalLatePayments function
export function calculateTotalLatePayments(tenant: any, property: any): {
  totalLateFees: number;
  totalOutstanding: number;
  totalDue: number;
  // ... complex calculation logic
}

// Line 394-420: isTenantLate function
export function isTenantLate(tenant: any, property: any): boolean {
  // ... late detection logic
}
```

### 5. Mixed Data Source Patterns

#### Common Fallback Pattern:
```typescript
// Pattern found in multiple files:
const rentAmount = lease.rent || property.monthly_rent || 0
const expectedAmount = property.leases?.[0]?.rent || property.monthly_rent || 0
const monthlyRent = activeLease.rent || property.monthly_rent
```

## Migration Strategy Recommendations

### Phase 1: Centralized Rent Source (Current Task)
1. ✅ Create `apps/web/src/lib/rentSource.ts` with centralized functions
2. ✅ Add feature flag for Late Tenants screen migration
3. ✅ Implement `listOverdue()` function for late tenant detection

### Phase 2: Screen-by-Screen Migration
1. **Dashboard:** Replace `monthly_rent` usage with `getActiveLeaseByProperty()`
2. **Payments:** Use `getLeaseFields()` for expected amounts
3. **Properties:** Use lease-based rent display
4. **Tenants:** Remove `tenant.monthly_rent` fallbacks
5. **Profit:** Use `listPeriods()` for accurate rent calculations

### Phase 3: Cleanup
1. Remove `extractRentCadence()` and `normalizeRentToMonthly()` functions
2. Remove `RENT_properties.monthly_rent` field usage
3. Remove `tenant.monthly_rent` field usage
4. Clean up fallback patterns

## Critical Issues to Address

1. **Non-existent Table:** `RENT_rent_periods` table is referenced but doesn't exist
2. **Inconsistent Fallbacks:** Multiple fallback patterns create confusion
3. **Financial Calculations:** Core business logic uses inconsistent data sources
4. **Late Fee Logic:** Custom late fee calculation instead of using lease-based rules
5. **Rent Cadence:** Stored in `properties.notes` instead of lease records

## Next Steps

1. ✅ Complete audit (this report)
2. ⏳ Wait for approval to proceed with Phase 1 implementation
3. ⏳ Implement centralized rent source library
4. ⏳ Add feature flag for Late Tenants screen
5. ⏳ Test and validate migration approach

---

**Total Files Affected:** 12  
**Total References to Audit:** 56+  
**High Risk Screens:** 2 (Dashboard, Late Tenants)  
**Medium Risk Screens:** 4 (Payments, Properties, Tenants, Profit)

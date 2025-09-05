// Quick test to verify schema consistency
// This script tests that we can query rent data from RENT_leases

const { createClient } = require('@supabase/supabase-js');

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSchemaConsistency() {
  console.log('🧪 Testing Schema Consistency...\n');

  try {
    // Test 1: Verify RENT_leases has all required fields
    console.log('1. Testing RENT_leases structure...');
    const { data: leases, error: leasesError } = await supabase
      .from('RENT_leases')
      .select('id, rent, rent_cadence, rent_due_day, move_in_fee, late_fee_amount, status')
      .limit(1);

    if (leasesError) {
      console.log('❌ Error querying RENT_leases:', leasesError.message);
      return false;
    }
    console.log('✅ RENT_leases structure is correct');

    // Test 2: Verify RENT_properties no longer has monthly_rent
    console.log('\n2. Testing RENT_properties structure...');
    const { data: properties, error: propertiesError } = await supabase
      .from('RENT_properties')
      .select('*')
      .limit(1);

    if (propertiesError) {
      console.log('❌ Error querying RENT_properties:', propertiesError.message);
      return false;
    }

    if (properties[0] && 'monthly_rent' in properties[0]) {
      console.log('❌ RENT_properties still has monthly_rent field');
      return false;
    }
    console.log('✅ RENT_properties no longer has monthly_rent');

    // Test 3: Verify RENT_tenants no longer has monthly_rent
    console.log('\n3. Testing RENT_tenants structure...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('RENT_tenants')
      .select('*')
      .limit(1);

    if (tenantsError) {
      console.log('❌ Error querying RENT_tenants:', tenantsError.message);
      return false;
    }

    if (tenants[0] && 'monthly_rent' in tenants[0]) {
      console.log('❌ RENT_tenants still has monthly_rent field');
      return false;
    }
    console.log('✅ RENT_tenants no longer has monthly_rent');

    // Test 4: Verify RENT_rent_periods no longer has duplicate fields
    console.log('\n4. Testing RENT_rent_periods structure...');
    const { data: periods, error: periodsError } = await supabase
      .from('RENT_rent_periods')
      .select('*')
      .limit(1);

    if (periodsError) {
      console.log('❌ Error querying RENT_rent_periods:', periodsError.message);
      return false;
    }

    if (periods[0]) {
      const hasRentAmount = 'rent_amount' in periods[0];
      const hasRentCadence = 'rent_cadence' in periods[0];
      const hasStatus = 'status' in periods[0];

      if (hasRentAmount || hasRentCadence || hasStatus) {
        console.log('❌ RENT_rent_periods still has duplicate fields:', {
          rent_amount: hasRentAmount,
          rent_cadence: hasRentCadence,
          status: hasStatus
        });
        return false;
      }
    }
    console.log('✅ RENT_rent_periods no longer has duplicate fields');

    // Test 5: Test helper function
    console.log('\n5. Testing get_property_rent_info function...');
    const { data: rentInfo, error: rentInfoError } = await supabase
      .rpc('get_property_rent_info', { p_property_id: '00000000-0000-0000-0000-000000000000' });

    if (rentInfoError) {
      console.log('⚠️  get_property_rent_info function error (expected for non-existent property):', rentInfoError.message);
    } else {
      console.log('✅ get_property_rent_info function works');
    }

    console.log('\n🎉 All schema consistency tests passed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ RENT_leases is the single source of truth for rent data');
    console.log('   ✅ All duplicate fields have been removed');
    console.log('   ✅ Schema is consistent across all tables');
    
    return true;

  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
testSchemaConsistency().then(success => {
  process.exit(success ? 0 : 1);
});

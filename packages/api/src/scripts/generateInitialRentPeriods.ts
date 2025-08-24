import { getSupabaseClient, handleSupabaseError, createApiResponse } from '../client';
import { RentPeriodsService } from '../services/rentPeriods';
import type { Tenant, Lease } from '../types';

/**
 * Script to generate initial rent periods for all existing tenants
 * This should be run once to populate the RENT_rent_periods table
 */
export async function generateInitialRentPeriods(): Promise<void> {
  try {
    console.log('🚀 Starting initial rent periods generation...');
    
    const supabase = getSupabaseClient();
    
    // Get all tenants with their leases
    const { data: tenants, error: tenantsError } = await supabase
      .from('RENT_tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (tenantsError) {
      console.error('❌ Error fetching tenants:', tenantsError);
      return;
    }

    console.log(`📋 Found ${tenants.length} tenants to process`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (const tenant of tenants) {
      try {
        console.log(`\n👤 Processing tenant: ${tenant.first_name} ${tenant.last_name}`);
        
        // Get tenant's leases
        const { data: leases, error: leasesError } = await supabase
          .from('RENT_leases')
          .select('*')
          .eq('tenant_id', tenant.id)
          .order('lease_start_date', { ascending: false });

        if (leasesError) {
          console.error(`  ❌ Error fetching leases for ${tenant.first_name} ${tenant.last_name}:`, leasesError);
          errorCount++;
          continue;
        }

        if (!leases || leases.length === 0) {
          console.log(`  ⏭️  No leases found for ${tenant.first_name} ${tenant.last_name}, skipping`);
          skippedCount++;
          continue;
        }

        // Check if rent periods already exist for this tenant
        const { data: existingPeriods, error: periodsError } = await supabase
          .from('RENT_rent_periods')
          .select('id')
          .eq('tenant_id', tenant.id)
          .limit(1);

        if (periodsError) {
          console.error(`  ❌ Error checking existing periods for ${tenant.first_name} ${tenant.last_name}:`, periodsError);
          errorCount++;
          continue;
        }

        if (existingPeriods && existingPeriods.length > 0) {
          console.log(`  ⏭️  Rent periods already exist for ${tenant.first_name} ${tenant.last_name}, skipping`);
          skippedCount++;
          continue;
        }

        // Use the most recent active lease
        const activeLease = leases.find(lease => lease.status === 'active') || leases[0];
        
        if (!activeLease.lease_start_date || !activeLease.rent || !activeLease.rent_cadence) {
          console.log(`  ⚠️  Missing lease information for ${tenant.first_name} ${tenant.last_name}, skipping`);
          skippedCount++;
          continue;
        }

        console.log(`  📅 Lease: ${activeLease.lease_start_date} to ${activeLease.lease_end_date || 'ongoing'}`);
        console.log(`  💰 Rent: $${activeLease.rent} ${activeLease.rent_cadence}`);

        // Generate rent periods
        const periodsResponse = await RentPeriodsService.createRentPeriods(tenant, activeLease);
        
        if (periodsResponse.success && periodsResponse.data) {
          console.log(`  ✅ Generated ${periodsResponse.data.length} rent periods`);
          successCount++;
        } else {
          console.error(`  ❌ Failed to generate periods for ${tenant.first_name} ${tenant.last_name}:`, periodsResponse.error);
          errorCount++;
        }

      } catch (error) {
        console.error(`  ❌ Unexpected error processing ${tenant.first_name} ${tenant.last_name}:`, error);
        errorCount++;
      }
    }

    console.log('\n🎉 Initial rent periods generation completed!');
    console.log(`✅ Successfully processed: ${successCount} tenants`);
    console.log(`⏭️  Skipped (already exists): ${skippedCount} tenants`);
    console.log(`❌ Errors: ${errorCount} tenants`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some tenants had errors. Check the logs above for details.');
    }

  } catch (error) {
    console.error('💥 Fatal error in generateInitialRentPeriods:', error);
  }
}

/**
 * Run the script if called directly
 */
if (require.main === module) {
  generateInitialRentPeriods()
    .then(() => {
      console.log('Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

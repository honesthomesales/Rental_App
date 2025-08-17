const { TenantsService } = require('../dist/services/tenants');

console.log('🧪 Testing late tenants calculation...');

TenantsService.getLateTenants()
  .then((response) => {
    if (response.success) {
      console.log(`✅ Found ${response.data.length} late tenants`);
      
      if (response.data.length > 0) {
        console.log('\n📋 Late Tenants:');
        response.data.forEach((tenant, index) => {
          console.log(`${index + 1}. ${tenant.first_name} ${tenant.last_name}`);
          console.log(`   Property: ${tenant.properties?.name || 'Unknown'}`);
          console.log(`   Days Late: ${tenant.days_late || 0}`);
          console.log(`   Total Due: $${tenant.total_due?.toLocaleString() || 0}`);
          console.log(`   Late Periods: ${tenant.late_periods || 0}`);
          console.log(`   Late Fees: $${tenant.total_late_fees?.toLocaleString() || 0}`);
          console.log('');
        });
      } else {
        console.log('ℹ️  No late tenants found');
      }
    } else {
      console.error('❌ Failed to get late tenants:', response.error);
    }
  })
  .catch((error) => {
    console.error('💥 Error testing late tenants:', error);
  })
  .finally(() => {
    process.exit(0);
  });

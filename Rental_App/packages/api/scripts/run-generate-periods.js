const { generateInitialRentPeriods } = require('../dist/scripts/generateInitialRentPeriods');

console.log('🚀 Starting initial rent periods generation...');

generateInitialRentPeriods()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

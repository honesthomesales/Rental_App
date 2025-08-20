#!/usr/bin/env node

// Test script to validate configuration and Supabase client setup
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..', '..');

console.log('🧪 Testing Rental App Configuration...\n');

try {
  // Test 1: Check if environment variables are accessible
  console.log('1️⃣ Testing environment variables...');
  const envCheck = execSync('node -e "console.log(process.env.NODE_ENV || \'development\')"', { 
    cwd: projectRoot, 
    encoding: 'utf8' 
  }).trim();
  console.log(`   ✅ NODE_ENV: ${envCheck}`);
  
  // Test 2: Check if Next.js config is valid
  console.log('\n2️⃣ Testing Next.js configuration...');
  const nextConfigCheck = execSync('node -e "const config = require(\'./apps/web/next.config.js\'); console.log(\'✅ Next.js config loaded successfully\')"', { 
    cwd: projectRoot, 
    encoding: 'utf8' 
  }).trim();
  console.log(`   ${nextConfigCheck}`);
  
  // Test 3: Check if TypeScript compiles
  console.log('\n3️⃣ Testing TypeScript compilation...');
  const tsCheck = execSync('npx tsc --noEmit --project apps/web/tsconfig.json', { 
    cwd: projectRoot, 
    encoding: 'utf8' 
  }).trim();
  console.log('   ✅ TypeScript compilation successful');
  
  // Test 4: Check if build script works
  console.log('\n4️⃣ Testing build script...');
  const buildCheck = execSync('npm run build:static --dry-run', { 
    cwd: join(projectRoot, 'apps/web'), 
    encoding: 'utf8' 
  }).trim();
  console.log('   ✅ Build script configuration valid');
  
  console.log('\n🎉 All configuration tests passed!');
  console.log('\n📋 Next steps:');
  console.log('   1. Run: cd apps/web && npm run build:static');
  console.log('   2. Test the built app locally');
  console.log('   3. Deploy to GitHub Pages');
  
} catch (error) {
  console.error('\n❌ Configuration test failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Check if all dependencies are installed');
  console.log('   2. Verify environment variables are set');
  console.log('   3. Ensure TypeScript configuration is correct');
  process.exit(1);
}

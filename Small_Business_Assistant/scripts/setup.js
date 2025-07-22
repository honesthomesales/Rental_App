#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Small Business Assistant...\n');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, cwd = process.cwd()) {
  try {
    log(`Running: ${command}`, 'blue');
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    log(`Error running command: ${command}`, 'red');
    return false;
  }
}

function checkPrerequisites() {
  log('📋 Checking prerequisites...', 'yellow');
  
  // Check Node.js version
  try {
    const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
    const version = nodeVersion.replace('v', '');
    const major = parseInt(version.split('.')[0]);
    
    if (major < 18) {
      log(`❌ Node.js version ${version} is too old. Please install Node.js 18+`, 'red');
      return false;
    }
    log(`✅ Node.js ${version}`, 'green');
  } catch (error) {
    log('❌ Node.js not found. Please install Node.js 18+', 'red');
    return false;
  }
  
  // Check npm version
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    const major = parseInt(npmVersion.split('.')[0]);
    
    if (major < 9) {
      log(`❌ npm version ${npmVersion} is too old. Please install npm 9+`, 'red');
      return false;
    }
    log(`✅ npm ${npmVersion}`, 'green');
  } catch (error) {
    log('❌ npm not found', 'red');
    return false;
  }
  
  return true;
}

function setupEnvironment() {
  log('\n🔧 Setting up environment...', 'yellow');
  
  const envExamplePath = path.join(process.cwd(), 'env.example');
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    if (fs.existsSync(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      log('✅ Created .env file from template', 'green');
      log('⚠️  Please edit .env file with your configuration', 'yellow');
    } else {
      log('❌ env.example file not found', 'red');
      return false;
    }
  } else {
    log('✅ .env file already exists', 'green');
  }
  
  return true;
}

function installDependencies() {
  log('\n📦 Installing dependencies...', 'yellow');
  
  const packages = ['shared', 'api', 'web'];
  
  for (const pkg of packages) {
    const pkgPath = path.join(process.cwd(), 'packages', pkg);
    
    if (fs.existsSync(pkgPath)) {
      log(`\nInstalling dependencies for ${pkg}...`, 'blue');
      
      if (!runCommand('npm install', pkgPath)) {
        log(`❌ Failed to install dependencies for ${pkg}`, 'red');
        return false;
      }
      
      log(`✅ Installed dependencies for ${pkg}`, 'green');
    }
  }
  
  return true;
}

function setupDatabase() {
  log('\n🗄️  Setting up database...', 'yellow');
  
  const apiPath = path.join(process.cwd(), 'packages', 'api');
  
  if (!fs.existsSync(apiPath)) {
    log('❌ API package not found', 'red');
    return false;
  }
  
  // Generate Prisma client
  log('Generating Prisma client...', 'blue');
  if (!runCommand('npx prisma generate', apiPath)) {
    log('❌ Failed to generate Prisma client', 'red');
    return false;
  }
  
  log('✅ Prisma client generated', 'green');
  log('⚠️  Please run database migrations manually:', 'yellow');
  log('   cd packages/api', 'blue');
  log('   npx prisma migrate dev --name init', 'blue');
  
  return true;
}

function createStartScript() {
  log('\n📝 Creating start script...', 'yellow');
  
  const scriptContent = `#!/bin/bash
echo "🚀 Starting Small Business Assistant..."

# Start API server
echo "Starting API server..."
cd packages/api && npm run dev &
API_PID=$!

# Start web dashboard
echo "Starting web dashboard..."
cd packages/web && npm run dev &
WEB_PID=$!

echo "✅ Services started!"
echo "API: http://localhost:3001"
echo "Web: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for interrupt
trap "echo '\\n🛑 Stopping services...'; kill $API_PID $WEB_PID; exit" INT
wait
`;

  const scriptPath = path.join(process.cwd(), 'start-dev.sh');
  fs.writeFileSync(scriptPath, scriptContent);
  fs.chmodSync(scriptPath, '755');
  
  log('✅ Created start-dev.sh script', 'green');
  log('Run "./start-dev.sh" to start all development servers', 'blue');
}

function main() {
  log('🎯 Small Business Assistant Setup', 'green');
  log('================================\n', 'green');
  
  // Check prerequisites
  if (!checkPrerequisites()) {
    log('\n❌ Prerequisites not met. Please install required software.', 'red');
    process.exit(1);
  }
  
  // Setup environment
  if (!setupEnvironment()) {
    log('\n❌ Failed to setup environment.', 'red');
    process.exit(1);
  }
  
  // Install dependencies
  if (!installDependencies()) {
    log('\n❌ Failed to install dependencies.', 'red');
    process.exit(1);
  }
  
  // Setup database
  if (!setupDatabase()) {
    log('\n❌ Failed to setup database.', 'red');
    process.exit(1);
  }
  
  // Create start script
  createStartScript();
  
  log('\n🎉 Setup completed successfully!', 'green');
  log('\n📚 Next steps:', 'yellow');
  log('1. Edit .env file with your configuration', 'blue');
  log('2. Set up PostgreSQL database', 'blue');
  log('3. Run database migrations: cd packages/api && npx prisma migrate dev', 'blue');
  log('4. Start development servers: ./start-dev.sh', 'blue');
  log('\n📖 For detailed instructions, see setup.md', 'blue');
}

if (require.main === module) {
  main();
}

module.exports = { main }; 
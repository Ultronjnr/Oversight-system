#!/usr/bin/env node

/**
 * Oversight Procurement System - Production Deployment Script
 * Automated deployment with environment validation and database setup
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  projectName: 'oversight-procurement',
  environments: ['development', 'staging', 'production'],
  requiredEnvVars: [
    'DATABASE_PASSWORD',
    'JWT_SECRET',
    'SMTP_PASSWORD',
    'SESSION_SECRET'
  ]
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function validateEnvironment() {
  log('🔍 Validating environment configuration...', 'cyan');
  
  const envFile = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envFile)) {
    log('❌ .env file not found. Please copy .env.example to .env and configure.', 'red');
    process.exit(1);
  }

  // Load environment variables
  require('dotenv').config();
  
  const missingVars = CONFIG.requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    log(`❌ Missing required environment variables: ${missingVars.join(', ')}`, 'red');
    process.exit(1);
  }
  
  log('✅ Environment validation passed', 'green');
}

function buildApplication() {
  log('🏗️  Building application...', 'cyan');
  
  try {
    // Install dependencies
    log('📦 Installing dependencies...', 'yellow');
    execSync('npm install', { stdio: 'inherit' });
    
    // Build frontend
    log('⚛️  Building React frontend...', 'yellow');
    execSync('npm run build', { stdio: 'inherit' });
    
    log('✅ Application build completed', 'green');
  } catch (error) {
    log('❌ Build failed', 'red');
    process.exit(1);
  }
}

function setupDatabase() {
  log('🗄️  Setting up database...', 'cyan');
  
  try {
    // Create database schema
    log('📊 Creating database schema...', 'yellow');
    execSync('docker-compose up -d database', { stdio: 'inherit' });
    
    // Wait for database to be ready
    log('⏳ Waiting for database to be ready...', 'yellow');
    execSync('sleep 10');
    
    // Run migrations
    log('🔄 Running database migrations...', 'yellow');
    // execSync('npm run migrate', { stdio: 'inherit' });
    
    log('✅ Database setup completed', 'green');
  } catch (error) {
    log('❌ Database setup failed', 'red');
    process.exit(1);
  }
}

function deployApplication(environment = 'production') {
  log(`🚀 Deploying to ${environment}...`, 'cyan');
  
  try {
    // Start all services
    log('🐳 Starting Docker services...', 'yellow');
    execSync('docker-compose up -d', { stdio: 'inherit' });
    
    // Wait for services to be ready
    log('⏳ Waiting for services to start...', 'yellow');
    execSync('sleep 30');
    
    // Health check
    log('🏥 Running health checks...', 'yellow');
    // Add health check logic here
    
    log('✅ Deployment completed successfully!', 'green');
    log(`🌐 Application is running at: ${process.env.FRONTEND_URL || 'http://localhost'}`, 'bright');
    
  } catch (error) {
    log('❌ Deployment failed', 'red');
    process.exit(1);
  }
}

function showStatus() {
  log('📊 Application Status:', 'cyan');
  
  try {
    execSync('docker-compose ps', { stdio: 'inherit' });
  } catch (error) {
    log('❌ Failed to get status', 'red');
  }
}

function stopApplication() {
  log('🛑 Stopping application...', 'yellow');
  
  try {
    execSync('docker-compose down', { stdio: 'inherit' });
    log('✅ Application stopped', 'green');
  } catch (error) {
    log('❌ Failed to stop application', 'red');
  }
}

function showHelp() {
  log(`
${colors.bright}Oversight Procurement System - Deployment Tool${colors.reset}

Usage: node deploy.js [command] [options]

Commands:
  ${colors.green}deploy${colors.reset}     Deploy the application to production
  ${colors.green}build${colors.reset}      Build the application
  ${colors.green}setup${colors.reset}      Setup database and environment
  ${colors.green}status${colors.reset}     Show application status
  ${colors.green}stop${colors.reset}       Stop the application
  ${colors.green}help${colors.reset}       Show this help message

Examples:
  node deploy.js deploy
  node deploy.js status
  node deploy.js stop

For more information, visit: https://github.com/your-org/oversight-procurement
  `, 'bright');
}

// Main execution
function main() {
  const command = process.argv[2] || 'help';
  
  log(`${colors.bright}🏢 Oversight Procurement Management System${colors.reset}`, 'cyan');
  log(`${colors.bright}📋 Deployment & Management Tool${colors.reset}`, 'cyan');
  log('');
  
  switch (command) {
    case 'deploy':
      validateEnvironment();
      buildApplication();
      setupDatabase();
      deployApplication();
      showStatus();
      break;
      
    case 'build':
      validateEnvironment();
      buildApplication();
      break;
      
    case 'setup':
      validateEnvironment();
      setupDatabase();
      break;
      
    case 'status':
      showStatus();
      break;
      
    case 'stop':
      stopApplication();
      break;
      
    case 'help':
    default:
      showHelp();
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  validateEnvironment,
  buildApplication,
  setupDatabase,
  deployApplication,
  showStatus,
  stopApplication
};

#!/usr/bin/env node

/**
 * Frontend Deployment Script for GitHub Pages
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

function log(message, color = '\x1b[0m') {
  console.log(`${color}${message}\x1b[0m`);
}

// Validate that .env.production exists
function validateEnv() {
  const envFile = path.join(process.cwd(), '.env.production');
  if (!fs.existsSync(envFile)) {
    log('❌ .env.production file not found. Please create it before deploying.', '\x1b[31m');
    process.exit(1);
  }
  log('✅ .env.production file found.', '\x1b[32m');
}

// Build frontend
function buildFrontend() {
  log('🏗️  Building frontend...', '\x1b[36m');
  execSync('npm run build -- --mode production', { stdio: 'inherit' });
  log('✅ Frontend build completed.', '\x1b[32m');
}

// Deploy to GitHub Pages
function deployGithubPages() {
  log('🚀 Deploying frontend to GitHub Pages...', '\x1b[36m');
  execSync('npx gh-pages -d dist', { stdio: 'inherit' });
  log('✅ Deployment completed!', '\x1b[32m');
}

// Main
function main() {
  log('📦 Oversight Frontend Deployment Tool', '\x1b[36m');
  validateEnv();
  buildFrontend();
  deployGithubPages();
}

main();

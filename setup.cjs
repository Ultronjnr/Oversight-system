#!/usr/bin/env node

/**
 * Quick Setup Script for Oversight Procurement Management System
 * This script helps set up the application for deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🏢 Oversight Procurement Management System - Quick Setup');
console.log('=======================================================\n');

// Check if .env exists
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    const examplePath = path.join(process.cwd(), 'env.example');
    if (fs.existsSync(examplePath)) {
        const envExample = fs.readFileSync(examplePath, 'utf8');
        fs.writeFileSync(envPath, envExample);
        console.log('✅ .env file created');
    } else {
        console.log('⚠️ env.example not found. Skipping .env creation.');
    }
} else {
    console.log('✅ .env file already exists');
}

// Generate JWT secret
console.log('\n🔐 Generating JWT secret...');
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('✅ JWT secret generated');

// Update .env with JWT secret
try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace('your-super-secret-jwt-key-change-in-production', jwtSecret);
    fs.writeFileSync(envPath, envContent);
    console.log('✅ JWT secret added to .env file');
} catch (e) {
    console.log('ℹ️ Could not update .env (file may be missing).');
}

// Check if node_modules exists
if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    console.log('\n📦 Installing dependencies...');
    const { execSync } = require('child_process');
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('✅ Dependencies installed');
    } catch (error) {
        console.log('❌ Failed to install dependencies');
        console.log('Please run: npm install');
    }
} else {
    console.log('✅ Dependencies already installed');
}

// Build app
console.log('\n🏗️  Building application...');
const { execSync } = require('child_process');
try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Application built successfully');
} catch (error) {
    console.log('❌ Build failed');
    console.log('Please run: npm run build');
}

console.log('\n🎉 Setup completed!');
console.log('\nNext steps:');
console.log('1. Set up your Supabase project at https://supabase.com');
console.log('2. Update .env with your Supabase credentials');
console.log('3. Run the SQL schema from database/schema.sql in Supabase');
console.log('4. Deploy to Netlify or run locally with: npm run dev');
console.log('\nFor detailed instructions, see DEPLOYMENT_GUIDE.md');











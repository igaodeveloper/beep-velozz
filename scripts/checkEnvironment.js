#!/usr/bin/env node

/**
 * scripts/checkEnvironment.js
 * Validates production environment configuration before deployment
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const REQUIRED_VARS = [
  'EXPO_PUBLIC_API_BASE_URL',
  'EXPO_PUBLIC_API_TOKEN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
];

const OPTIONAL_VARS = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
];

console.log('🔍 Checking environment configuration...\n');

const missing = [];
const optional = [];

// Check required variables
REQUIRED_VARS.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    missing.push(varName);
    console.log(`❌ ${varName}: MISSING`);
  } else {
    const masked = value.length > 20 ? `${value.slice(0, 10)}...${value.slice(-5)}` : '***';
    console.log(`✅ ${varName}: ${masked}`);
  }
});

console.log();

// Check optional variables
OPTIONAL_VARS.forEach((varName) => {
  const value = process.env[varName];
  if (!value) {
    optional.push(varName);
    console.log(`⚠️  ${varName}: MISSING (optional)`);
  } else {
    const masked = value.length > 20 ? `${value.slice(0, 10)}...${value.slice(-5)}` : '***';
    console.log(`✅ ${varName}: ${masked}`);
  }
});

console.log('\n' + '='.repeat(60));

if (missing.length > 0) {
  console.error(`\n❌ FAILED: Missing ${missing.length} required environment variable(s):`);
  missing.forEach((v) => console.error(`   - ${v}`));
  console.error('\nSet these in your .env file before deploying.\n');
  process.exit(1);
}

if (optional.length > 0) {
  console.warn(`\n⚠️  WARNING: ${optional.length} optional variable(s) not set.`);
  console.warn('The app may not work fully without these:\n');
  optional.forEach((v) => console.warn(`   - ${v}`));
}

console.log('\n✅ Environment check PASSED!\n');
console.log('Ready for deployment.\n');

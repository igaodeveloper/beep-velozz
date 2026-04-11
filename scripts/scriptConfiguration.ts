// package.json scripts - UPDATES TO ADD

// Add these scripts to your package.json:
/*
"start": "expo start",
"start:clean": "if exist metro.config.cjs move metro.config.cjs metro.config.cjs.backup && expo start --clear || expo start --clear",
"start:production": "copy metro.config.production.cjs metro.config.cjs && expo start",
"start:development": "copy metro.config.default.cjs metro.config.cjs && expo start",
"build:ios-production": "copy metro.config.production.cjs metro.config.cjs && eas build --platform ios --auto-submit",
"build:android-production": "copy metro.config.production.cjs metro.config.cjs && eas build --platform android --auto-submit",
"build:web-production": "copy metro.config.production.cjs metro.config.cjs && expo export -p web",
"environment:check": "node scripts/checkEnvironment.js",
"environment:setup": "node scripts/setupEnvironment.js",
"lint": "expo lint --fix",
"type-check": "tsc --noEmit"
*/

// This configuration schema for scripts:
const scripts = {
  // Development
  start: "expo start",
  "start:clean":
    "if exist metro.config.cjs move metro.config.cjs metro.config.cjs.backup && expo start --clear || expo start --clear",
  "start:development":
    "copy metro.config.default.cjs metro.config.cjs && expo start",

  // Production builds
  "start:production":
    "copy metro.config.production.cjs metro.config.cjs && expo start",
  "build:ios-production":
    "copy metro.config.production.cjs metro.config.cjs && eas build --platform ios --auto-submit",
  "build:android-production":
    "copy metro.config.production.cjs metro.config.cjs && eas build --platform android --auto-submit",
  "build:web-production":
    "copy metro.config.production.cjs metro.config.cjs && expo export -p web",

  // Environment
  "environment:check": "node scripts/checkEnvironment.js",
  "environment:setup": "node scripts/setupEnvironment.js",

  // Testing & Validation
  lint: "expo lint --fix",
  "type-check": "tsc --noEmit",
};

export default scripts;

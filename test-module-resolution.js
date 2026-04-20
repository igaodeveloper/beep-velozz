// Simple test to verify module resolution
try {
  const service = require('./services/whatsappShareService.ts');
  console.log('Module resolved successfully:', typeof service);
} catch (error) {
  console.error('Module resolution failed:', error.message);
}

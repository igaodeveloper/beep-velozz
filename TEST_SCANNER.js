// Teste simples para verificar identificação de códigos 20000
const { normalizeCode, validateCode, identifyPackage } = require('./utils/scannerIdentification.ts');

console.log('\n=== TESTE DE SCANNER ===\n');

const testCodes = [
  '20000987654321',
  '20000123456789',
  '20000555777888',
  '20000',
  '200001',
  'BR123456789',
  'LM123456',
];

testCodes.forEach(code => {
  console.log(`\n📥 Testando código: "${code}"`);
  
  const normalized = normalizeCode(code);
  console.log(`   ✓ Normalizado: "${normalized}"`);
  
  const valid = validateCode(normalized);
  console.log(`   ✓ Válido: ${valid}`);
  
  if (normalized) {
    const identified = identifyPackage(normalized);
    console.log(`   ✓ Identificado: ${identified.type} (confidence: ${identified.confidence})`);
  }
});

console.log('\n=== FIM DO TESTE ===\n');

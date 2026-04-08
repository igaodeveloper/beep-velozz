/**
 * Teste dos Padrões Reais de Mercado Livre
 * Com base na etiqueta enviada pelo usuário
 */

import { normalizeCode, identifyPackage } from '@/utils/scannerIdentification';

// Exemplos reais da etiqueta Mercado Livre
const testCases = [
  // Pack ID da etiqueta
  { raw: '2200D 1241459785', expectedType: 'mercado_livre', description: 'Pack ID com espaço' },
  { raw: '2200D1241459785', expectedType: 'mercado_livre', description: 'Pack ID sem espaço' },
  
  // Código de envio alternativo  
  { raw: '4482D 247404', expectedType: 'mercado_livre', description: 'Código envio 4482D com espaço' },
  { raw: '4482D247404', expectedType: 'mercado_livre', description: 'Código envio 4482D sem espaço' },
  
  // CEP (pode aparecer no QR code)
  { raw: '02464000', expectedType: 'mercado_livre', description: 'CEP (20000xxx)' },
  
  // Padrões tradicionais que já funcionavam
  { raw: '20000987654321', expectedType: 'mercado_livre', description: 'Padrão 20000 tradicional' },
  { raw: '46612345678', expectedType: 'mercado_livre', description: 'Padrão 466 tradicional' },
  
  // Com prefixo ID (alguns scanners adicionam)
  { raw: 'ID2200D1241459785', expectedType: 'mercado_livre', description: 'Pack ID com prefixo ID' },
  { raw: 'ID4482D247404', expectedType: 'mercado_livre', description: 'Código envio com prefixo ID' },
];

console.log('\n🧪 TESTANDO PADRÕES DE MERCADO LIVRE\n');
console.log('=' .repeat(70));

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const normalized = normalizeCode(testCase.raw);
  const identification = identifyPackage(normalized);
  
  const isMatch = identification.type === testCase.expectedType;
  const status = isMatch ? '✅ PASS' : '❌ FAIL';
  
  if (isMatch) passed++;
  else failed++;
  
  console.log(`\n${status}`);
  console.log(`Description: ${testCase.description}`);
  console.log(`Raw Input:   "${testCase.raw}"`);
  console.log(`Normalized:  "${normalized}"`);
  console.log(`Expected:    ${testCase.expectedType}`);
  console.log(`Got:         ${identification.type}`);
  if (identification.description) {
    console.log(`Details:     ${identification.description}`);
  }
}

console.log('\n' + '='.repeat(70));
console.log(`\n📊 RESULTADO: ${passed} passou, ${failed} falhou de ${testCases.length}\n`);

if (failed === 0) {
  console.log('🎉 TODOS OS TESTES PASSARAM! Scanner pronto para Mercado Livre.\n');
} else {
  console.log(`⚠️  ${failed} padrão(ões) ainda não reconhecido(s).\n`);
}

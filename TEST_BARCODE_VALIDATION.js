/**
 * TESTE DE VALIDAÇÃO DE BARCODE
 * Verificar se códigos Mercado Livre estão sendo rejeitados
 */

import { validateBarcode } from '@/src/utils/validators';
import { identifyPackage } from '@/utils/scannerIdentification';

console.log('🧪 TESTANDO VALIDAÇÃO DE BARCODE PARA MERCADO LIVRE');
console.log('='.repeat(60));

// Testes de validação
const testCodes = [
  '2200D1241459785',  // Pack ID Mercado Livre
  '4482D247404',      // Envio ID Mercado Livre
  '20000123456',      // Mercado Livre tradicional
  'BR123456789',      // Shopee
  'LM123456',         // Avulso
];

console.log('\n📋 TESTE DE VALIDAÇÃO:');
testCodes.forEach(code => {
  const validation = validateBarcode(code);
  console.log(`"${code}" → ${validation.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}`);
  if (!validation.isValid) {
    console.log(`   Erros: ${validation.errors?.join(', ')}`);
  }
});

console.log('\n🎯 TESTE DE IDENTIFICAÇÃO:');
testCodes.forEach(code => {
  const validation = validateBarcode(code);
  if (validation.isValid) {
    const pkgInfo = identifyPackage(validation.data!);
    console.log(`"${code}" → ${pkgInfo.type} (${pkgInfo.matched ? '✅' : '❌'})`);
  } else {
    console.log(`"${code}" → ❌ VALIDAÇÃO FALHOU`);
  }
});

console.log('\n🔊 TESTE DE MAPEAMENTO DE ÁUDIO:');
testCodes.forEach(code => {
  const validation = validateBarcode(code);
  if (validation.isValid) {
    const pkgInfo = identifyPackage(validation.data!);
    let audioType = 'BEEP_ERROR';
    switch (pkgInfo.type) {
      case 'shopee': audioType = 'BEEP_A'; break;
      case 'mercado_livre': audioType = 'BEEP_B'; break;
      case 'avulso': audioType = 'BEEP_C'; break;
    }
    console.log(`"${code}" → ${pkgInfo.type} → ${audioType}`);
  }
});

console.log('\n🎉 TESTE CONCLUÍDO!');
console.log('Se Mercado Livre aparece como ❌, há um problema na validação.');

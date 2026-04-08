/**
 * Teste de Fluxo Completo - Scanner Mercado Livre
 * Execute este teste no console do app para validar cada etapa
 */

// ============================================
// TESTE 1: Normalização
// ============================================
console.log('\n' + '='.repeat(70));
console.log('TEST 1: NORMALIZAÇÃO DE CÓDIGOS');
console.log('='.repeat(70));

import { normalizeCode } from '@/utils/scannerIdentification';

const testInputs = [
  '2200D 1241459785',  // Com espaço
  '2200D1241459785',   // Sem espaço
  '4482D 247404',      // Com espaço
  '4482D247404',       // Sem espaço
  'ID2200D1241459785', // Com prefixo ID
];

for (const input of testInputs) {
  const normalized = normalizeCode(input);
  console.log(`Input: "${input}" → ${normalized ? `✅ "${normalized}"` : '❌ VAZIO'}`);
}

// ============================================
// TESTE 2: Identificação
// ============================================
console.log('\n' + '='.repeat(70));
console.log('TEST 2: IDENTIFICAÇÃO DE TIPOS');
console.log('='.repeat(70));

import { identifyPackage } from '@/utils/scannerIdentification';

const codes = [
  '2200D1241459785',
  '4482D247404',
  '20000123456',
  'BR123456789',
  'LM123456',
];

for (const code of codes) {
  const result = identifyPackage(code);
  console.log(`Code: "${code}"`);
  console.log(`  → Type: ${result.type}`);
  console.log(`  → Matched: ${result.matched}`);
  console.log(`  → Confidence: ${result.confidence}`);
  console.log('');
}

// ============================================
// TESTE 3: Mapeamento de Áudio
// ============================================
console.log('\n' + '='.repeat(70));
console.log('TEST 3: MAPEAMENTO DE ÁUDIO');
console.log('='.repeat(70));

import { ScannerAudioType } from '@/utils/scannerAudio';

const audioMapping = {
  'mercado_livre': ScannerAudioType.BEEP_B,
  'shopee': ScannerAudioType.BEEP_A,
  'avulso': ScannerAudioType.BEEP_C,
  'unknown': ScannerAudioType.BEEP_ERROR,
};

for (const code of codes) {
  const pkgInfo = identifyPackage(code);
  const audioType = audioMapping[pkgInfo.type] || ScannerAudioType.BEEP_ERROR;
  console.log(`Code: "${code}"`);
  console.log(`  → Type: ${pkgInfo.type}`);
  console.log(`  → Audio: ${audioType}`);
  console.log('');
}

// ============================================
// TESTE 4: Reprodução de Áudio
// ============================================
console.log('\n' + '='.repeat(70));
console.log('TEST 4: REPRODUÇÃO DE ÁUDIO');
console.log('='.repeat(70));

import { ScannerAudioService } from '@/utils/scannerAudio';

const audioService = new ScannerAudioService();

async function testAudio() {
  console.log('🎵 Testando áudio...');
  
  // Teste BEEP_A (Shopee)
  console.log('▶️ Tocando BEEP_A (Shopee)...');
  await audioService.playAudio(ScannerAudioType.BEEP_A);
  await new Promise(r => setTimeout(r, 300));
  
  // Teste BEEP_B (Mercado Livre)
  console.log('▶️ Tocando BEEP_B (Mercado Livre)...');
  await audioService.playAudio(ScannerAudioType.BEEP_B);
  await new Promise(r => setTimeout(r, 300));
  
  // Teste BEEP_C (Avulso)
  console.log('▶️ Tocando BEEP_C (Avulso)...');
  await audioService.playAudio(ScannerAudioType.BEEP_C);
  await new Promise(r => setTimeout(r, 300));
  
  console.log('✅ Testes de áudio completos');
}

await testAudio();

// ============================================
// RESUMO FINAL
// ============================================
console.log('\n' + '='.repeat(70));
console.log('✅ TODOS OS TESTES COMPLETADOS');
console.log('='.repeat(70));
console.log('');
console.log('Se viu:');
console.log('  ✅ Códigos normalizados corretamente');
console.log('  ✅ Tipos identificados como mercado_livre');
console.log('  ✅ Áudio mapeado para BEEP_B');
console.log('  ✅ Sons reproduzidos sem erros');
console.log('');
console.log('Então o scanner DEVE estar bipando quando você escaneia! 🎵');
console.log('');

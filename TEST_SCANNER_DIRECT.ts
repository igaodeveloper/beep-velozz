/**
 * TESTE DIRETO DO SCANNER - Mercado Livre
 * Execute este arquivo para testar o scanner sem a interface
 */

import { normalizeCode, identifyPackage } from './utils/scannerIdentification';
import { ScannerAudioService, ScannerAudioType } from './utils/scannerAudio';
import { preloadSounds, playBeepB } from './utils/sound';

// ============================================
// TESTE 1: NORMALIZAÇÃO
// ============================================
console.log('\n🧪 TESTE 1: NORMALIZAÇÃO');
console.log('='.repeat(50));

const testCodes = [
  '2200D 1241459785',  // Com espaço
  '2200D1241459785',   // Sem espaço
  '4482D 247404',      // Com espaço
  '4482D247404',       // Sem espaço
  'ID2200D1241459785', // Com prefixo ID
];

testCodes.forEach(code => {
  const normalized = normalizeCode(code);
  console.log(`"${code}" → "${normalized}"`);
});

// ============================================
// TESTE 2: IDENTIFICAÇÃO
// ============================================
console.log('\n🧪 TESTE 2: IDENTIFICAÇÃO');
console.log('='.repeat(50));

const normalizedCodes = [
  '2200D1241459785',
  '4482D247404',
  '20000123456',
  'BR123456789',
  'LM123456',
];

normalizedCodes.forEach(code => {
  const result = identifyPackage(code);
  console.log(`"${code}" → ${result.type} (${result.matched ? '✅' : '❌'})`);
});

// ============================================
// TESTE 3: ÁUDIO
// ============================================
console.log('\n🧪 TESTE 3: ÁUDIO');
console.log('='.repeat(50));

async function testAudio() {
  try {
    console.log('🎵 Carregando sons...');
    await preloadSounds();
    console.log('✅ Sons carregados');

    console.log('🔊 Testando BEEP_B (Mercado Livre)...');
    await playBeepB();
    console.log('✅ BEEP_B tocado');

    console.log('🎵 Testando ScannerAudioService...');
    const audioService = new ScannerAudioService();
    await audioService.playAudio(ScannerAudioType.BEEP_B);
    console.log('✅ ScannerAudioService funcionou');

  } catch (error) {
    console.error('❌ Erro no áudio:', error);
  }
}

// ============================================
// EXECUÇÃO DOS TESTES
// ============================================
console.log('\n🚀 INICIANDO TESTES DO SCANNER');
console.log('='.repeat(50));

// Executar testes síncronos primeiro
console.log('✅ Testes de normalização e identificação concluídos');

// Executar teste de áudio
testAudio().then(() => {
  console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS!');
  console.log('='.repeat(50));
  console.log('');
  console.log('Se você viu:');
  console.log('  ✅ Normalização funcionando');
  console.log('  ✅ Identificação como mercado_livre');
  console.log('  ✅ Áudio tocando');
  console.log('');
  console.log('Então o scanner DEVE funcionar! 🎵');
  console.log('');
  console.log('Próximo passo: Teste na app real');
}).catch(err => {
  console.error('\n❌ FALHA NOS TESTES:', err);
});

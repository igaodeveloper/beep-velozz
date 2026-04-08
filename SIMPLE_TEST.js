/**
 * TESTE SIMPLES DO SCANNER
 * Execute este código no console do Expo Go
 */

console.log('🚀 TESTANDO SCANNER MERCADO LIVRE');
console.log('='.repeat(50));

// Teste 1: Verificar se os módulos carregam
try {
  console.log('📦 Carregando módulos...');
  const scannerId = require('@/utils/scannerIdentification');
  const scannerAudio = require('@/utils/scannerAudio');
  const sound = require('@/utils/sound');
  console.log('✅ Módulos carregados');
} catch (error) {
  console.error('❌ Erro ao carregar módulos:', error);
  return;
}

// Teste 2: Normalização
console.log('\n🔄 TESTANDO NORMALIZAÇÃO');
try {
  const { normalizeCode } = scannerId;
  const result = normalizeCode('2200D 1241459785');
  console.log(`"2200D 1241459785" → "${result}"`);
  console.log(result === '2200D1241459785' ? '✅ OK' : '❌ ERRO');
} catch (error) {
  console.error('❌ Erro na normalização:', error);
}

// Teste 3: Identificação
console.log('\n🎯 TESTANDO IDENTIFICAÇÃO');
try {
  const { identifyPackage } = scannerId;
  const result = identifyPackage('2200D1241459785');
  console.log(`"2200D1241459785" → ${result.type}`);
  console.log(result.type === 'mercado_livre' ? '✅ OK' : '❌ ERRO');
} catch (error) {
  console.error('❌ Erro na identificação:', error);
}

// Teste 4: Áudio
console.log('\n🔊 TESTANDO ÁUDIO');
async function testAudio() {
  try {
    console.log('🎵 Carregando sons...');
    await sound.preloadSounds();
    console.log('✅ Sons carregados');

    console.log('🔔 Tocando BEEP_B...');
    await sound.playBeepB();
    console.log('✅ BEEP_B tocado');

    console.log('🎵 Testando ScannerAudioService...');
    const audioService = new scannerAudio.ScannerAudioService();
    await audioService.playAudio(scannerAudio.ScannerAudioType.BEEP_B);
    console.log('✅ ScannerAudioService OK');

  } catch (error) {
    console.error('❌ Erro no áudio:', error);
  }
}

testAudio().then(() => {
  console.log('\n🎉 TESTE CONCLUÍDO!');
  console.log('='.repeat(50));
  console.log('');
  console.log('Se tudo deu ✅, o scanner deve funcionar.');
  console.log('Teste escaneando: 2200D1241459785');
}).catch(err => {
  console.error('\n❌ FALHA GERAL:', err);
});

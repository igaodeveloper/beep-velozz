/**
 * Teste do Reset do Scanner Industrial
 * Verifica se o reset funciona corretamente
 */

import { IndustrialScannerController } from '../utils/scannerController';
import { ScannerState } from '../types/scanner';

console.log('🧪 Testando Reset do Scanner Industrial...\n');

// Cria controlador com limites baixos para teste
const controller = new IndustrialScannerController({
  maxAllowedScans: { shopee: 2, mercado_livre: 2, avulso: 2 },
  debounceMs: 100,
  onStateChange: (state) => console.log(`📊 Estado mudou para: ${state}`),
  onStatsUpdate: (stats) => console.log(`📈 Stats: ${JSON.stringify(stats, null, 2)}`),
});

async function testReset() {
  console.log('1️⃣ Estado inicial:');
  console.log('   Estado:', controller.getState());
  console.log('   Contagens:', controller.getCounts());
  console.log('   Limites:', controller.getLimits());

  // Simula alguns scans de Mercado Livre
  console.log('\n2️⃣ Fazendo scans de Mercado Livre...');
  const result1 = await controller.processScan('200001234567890');
  console.log('   Scan 1:', result1.success ? '✅ Sucesso' : '❌ Falhou:', result1.reason);

  const result2 = await controller.processScan('200001234567891');
  console.log('   Scan 2:', result2.success ? '✅ Sucesso' : '❌ Falhou:', result2.reason);

  const result3 = await controller.processScan('200001234567892');
  console.log('   Scan 3 (deve falhar):', result3.success ? '✅ Sucesso' : '❌ Falhou:', result3.reason);

  console.log('\n3️⃣ Estado após scans:');
  console.log('   Estado:', controller.getState());
  console.log('   Contagens:', controller.getCounts());
  console.log('   Limite atingido?', controller.isLimitReached());

  // Testa o reset
  console.log('\n4️⃣ Executando RESET...');
  controller.reset();

  console.log('\n5️⃣ Estado após reset:');
  console.log('   Estado:', controller.getState());
  console.log('   Contagens:', controller.getCounts());
  console.log('   Limite atingido?', controller.isLimitReached());

  // Testa se pode scanear novamente
  console.log('\n6️⃣ Testando scan após reset...');
  const result4 = await controller.processScan('200001234567893');
  console.log('   Scan após reset:', result4.success ? '✅ Sucesso' : '❌ Falhou:', result4.reason);

  console.log('\n7️⃣ Estado final:');
  console.log('   Estado:', controller.getState());
  console.log('   Contagens:', controller.getCounts());

  console.log('\n🎉 Teste concluído!');
}

// Executa o teste
testReset().catch(console.error);
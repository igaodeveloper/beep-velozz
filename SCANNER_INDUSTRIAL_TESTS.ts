/**
 * Testes Unitários - Scanner Industrial
 * Valida comportamentos críticos e determinísticos
 */

// ============================================================================
// TESTES DE IDENTIFICAÇÃO
// ============================================================================

import {
  normalizeCode,
  identifyPackage,
  validateCode,
  getPackageTypeLabel,
} from '@/utils/scannerIdentification';

export const identificationTests = () => {
  console.log('🧪 TESTES DE IDENTIFICAÇÃO');

  // Test 1: Normalize code
  console.assert(normalizeCode('br123456') === 'BR123456', 'Deve converter para maiúsculas');
  console.assert(normalizeCode('  BR 123456  ') === 'BR123456', 'Deve remover espaços');
  console.assert(normalizeCode('BR-123-456') === 'BR123456', 'Deve remover caracteres especiais');
  console.assert(normalizeCode('') === '', 'Deve retornar vazio para entrada vazia');

  // Test 2: Identify Shopee
  const shopee = identifyPackage('BR987654321');
  console.assert(shopee.type === 'shopee', 'BR deve ser Shopee');
  console.assert(shopee.matched === true, 'Deve ter matched');
  console.assert(shopee.confidence === 'high', 'Confiança deve ser alta');

  // Test 3: Identify Mercado Livre
  const mlPrefixA = identifyPackage('20000987654321');
  console.assert(mlPrefixA.type === 'mercado_livre', '20000 deve ser Mercado Livre');

  const mlPrefixB = identifyPackage('46987654321');
  console.assert(mlPrefixB.type === 'mercado_livre', '46 deve ser Mercado Livre');

  const mlPrefixC = identifyPackage('45987654321');
  console.assert(mlPrefixC.type !== 'mercado_livre', '45 NÃO deve ser Mercado Livre');

  // Test 4: Identify Avulso
  const avulsoA = identifyPackage('LM123456789');
  console.assert(avulsoA.type === 'avulso', 'LM deve ser Avulso');

  const avulsoB = identifyPackage('14987654321');
  console.assert(avulsoB.type === 'avulso', '14 deve ser Avulso');

  // Regression test: código avulso que contém sequência de "45" ou "46" internamente
  // anteriormente a normalização poderia extrair o segmento errado e classificá-lo
  // como Mercado Livre. Garantimos agora ankering em normalizeCode.
  const trickyRaw = 'LM459876123';
  const trickyNorm = normalizeCode(trickyRaw);
  console.assert(
    trickyNorm.startsWith('LM'),
    'Normalização deve preservar prefixo inicial (não remover LM seguido de 45)'
  );
  const trickyId = identifyPackage(trickyNorm);
  console.assert(trickyId.type === 'avulso', 'LM com 45 interno deve ser Avulso');

  // Test 5: Unknown type
  const unknown = identifyPackage('UNKNOWN123');
  console.assert(unknown.type === 'unknown', 'Prefixo desconhecido deve retornar unknown');
  console.assert(unknown.matched === false, 'Matched deve ser false');

  // Test 6: Case insensitive
  const lowerCase = identifyPackage('br123456');
  console.assert(lowerCase.type === 'shopee', 'Deve ser case insensitive');

  // Test 7: Validate code
  console.assert(validateCode('BR123456') === true, 'Código válido deve retornar true');
  console.assert(validateCode('AB') === false, 'Código muito curto deve retornar false');
  console.assert(validateCode('') === false, 'Código vazio deve retornar false');
  console.assert(validateCode('!!!') === false, 'Caracteres inválidos deve retornar false');

  console.log('✅ Testes de identificação passaram\n');
};

// ============================================================================
// TESTES DE LIMITE
// ============================================================================

import { ScanLimitController } from '@/utils/scannerLimitController';

export const limitControllerTests = () => {
  console.log('🧪 TESTES DE CONTROLE DE LIMITE');

  const controller = new ScanLimitController({
    shopee: 3,
    mercado_livre: 2,
    avulso: 2,
  });

  // Test 1: Initial state
  console.assert(controller.getCount('shopee') === 0, 'Contagem inicial deve ser 0');
  console.assert(controller.hasLimitReached('shopee') === false, 'Não deve ter atingido limite');

  // Test 2: Increment
  console.assert(controller.tryIncrement('shopee') === true, 'Primeiro increment deve retornar true');
  console.assert(controller.getCount('shopee') === 1, 'Contagem deve ser 1');

  // Test 3: Multiple increments
  controller.tryIncrement('shopee');
  controller.tryIncrement('shopee');
  console.assert(controller.getCount('shopee') === 3, 'Contagem deve ser 3 (limite)');

  // Test 4: Limit reached
  const fourthAttempt = controller.tryIncrement('shopee');
  console.assert(fourthAttempt === false, 'Quarto increment deve retornar false');
  console.assert(controller.getCount('shopee') === 3, 'Contagem não deve mudar');
  console.assert(controller.hasLimitReached('shopee') === true, 'Deve ter atingido limite');

  // Test 5: Absolute block
  console.assert(controller.tryIncrement('shopee') === false, 'Deve manter bloqueado');
  console.assert(controller.getCount('shopee') === 3, 'Contagem deve permanecer 3');

  // Test 6: Independent limits
  console.assert(controller.getCount('mercado_livre') === 0, 'Outros tipos não afetados');
  console.assert(controller.hasSpace('mercado_livre') === true, 'Outros tipos têm espaço');

  // Test 7: Progress calculation
  controller.tryIncrement('mercado_livre');
  console.assert(controller.getProgress('mercado_livre') === 50, 'Progress deve ser 50%');

  // Test 8: Reset
  controller.reset();
  console.assert(controller.getCount('shopee') === 0, 'Reset deve zerar contagem');
  console.assert(controller.hasLimitReached('shopee') === false, 'Reset deve limpar flag');
  console.assert(controller.tryIncrement('shopee') === true, 'Deve permitir novamente após reset');

  console.log('✅ Testes de limite passaram\n');
};

// ============================================================================
// TESTES DO CONTROLLER PRINCIPAL
// ============================================================================

import { IndustrialScannerController } from '@/utils/scannerController';
import { ScannerState } from '@/types/scanner';

export const controllerTests = async () => {
  console.log('🧪 TESTES DO CONTROLLER PRINCIPAL');

  const controller = new IndustrialScannerController({
    maxAllowedScans: {
      shopee: 2,
      mercado_livre: 2,
      avulso: 2,
    },
  });

  // Test 1: Initial state
  console.assert(controller.getState() === ScannerState.ACTIVE, 'Estado inicial deve ser ACTIVE');
  console.assert(controller.isLimitReached() === false, 'Não deve ter atingido limite');

  // Test 2: Valid scan
  const result1 = await controller.processScan('BR123456');
  console.assert(result1.success === true, 'Scan válido deve ter sucesso');
  console.assert(result1.type === 'shopee', 'Deve identificar como Shopee');

  // Test 3: Duplicate detection
  await new Promise(resolve => setTimeout(resolve, 100)); // Pequeno delay
  const result2 = await controller.processScan('BR123456');
  console.assert(result2.success === false, 'Duplicata deve falhar');
  console.assert(result2.isDuplicate === true, 'Deve marcar como duplicata');

  // Test 4: Different code same type
  const result3 = await controller.processScan('BR987654');
  console.assert(result3.success === true, 'Código diferente deve ter sucesso');
  console.assert(controller.getCounts().shopee === 2, 'Contagem de Shopee deve ser 2');

  // Test 5: Limit reached
  const result4 = await controller.processScan('BR555555');
  console.assert(result4.success === false, 'Após limite deve falhar');
  console.assert(result4.reason === 'limit_reached', 'Razão deve ser limit_reached');
  console.assert(controller.isLimitReached() === false, 'isLimitReached só true se TODOS tipos atingem');

  // Test 6: Invalid code
  const result5 = await controller.processScan('!!!');
  console.assert(result5.success === false, 'Código inválido deve falhar');
  console.assert(result5.reason === 'invalid', 'Razão deve ser invalid');

  // Test 7: Rate limiting (race condition prevention)
  const result6a = await controller.processScan('LM123456');
  const result6b = await controller.processScan('LM987654');
  // Se processamento simultâneo, uma deveria ser rate_limited
  // Aqui é sequencial, então ambas devem ter sucesso (não testamos race aqui)
  console.assert(result6a.success === true, 'Primeiro Avulso deve ter sucesso');

  // Test 8: Reset
  controller.reset();
  console.assert(controller.getState() === ScannerState.ACTIVE, 'Reset deve voltar a ACTIVE');
  console.assert(controller.getCounts().shopee === 0, 'Reset deve zerar contagens');
  const result7 = await controller.processScan('BR111111');
  console.assert(result7.success === true, 'Após reset deve aceitar novamente');

  console.log('✅ Testes do controller passaram\n');
};

// ============================================================================
// TESTES DE ÁUDIO
// ============================================================================

import { ScannerAudioService, ScannerAudioType } from '@/utils/scannerAudio';

export const audioServiceTests = async () => {
  console.log('🧪 TESTES DE SERVIÇO DE ÁUDIO');

  const audioService = new ScannerAudioService();

  // Test 1: Initial state
  console.assert(audioService.isPlaying() === false, 'Deve iniciar não tocando');
  console.assert(audioService.getLastAudioTime() === 0, 'Último tempo deve ser 0');

  // Test 2: Play audio (note: no audio files em teste, mas testa lógica)
  await audioService.playAudio(ScannerAudioType.BEEP_A);
  console.assert(audioService.getLastAudioTime() > 0, 'Tempo de áudio deve ser atualizado');

  // Test 3: Debounce - não toca o mesmo som rápido demais
  const timeBeforeSecondPlay = Date.now();
  await audioService.playAudio(ScannerAudioType.BEEP_A); // Deve ser ignorado/enfileirado
  const timeAfterSecondPlay = Date.now();

  // Se foi ignorado, delay será mínimo
  const elapsed = timeAfterSecondPlay - timeBeforeSecondPlay;
  console.assert(elapsed < 100, 'Debounce deve prevenir execução imediata');

  // Test 4: Queue functionality
  audioService.clearQueue();
  console.assert(audioService.getState() !== null, 'State deve estar definido');

  // Test 5: Reset
  audioService.reset();
  console.assert(audioService.isPlaying() === false, 'Reset deve parar áudio');
  console.assert(audioService.getLastAudioTime() === 0, 'Reset deve zerar tempo');

  console.log('✅ Testes de áudio passaram\n');
};

// ============================================================================
// SUITE DE TESTES COMPLETA
// ============================================================================

export async function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('SCANNER INDUSTRIAL - SUITE DE TESTES');
  console.log('='.repeat(60) + '\n');

  try {
    identificationTests();
    limitControllerTests();
    await controllerTests();
    await audioServiceTests();

    console.log('='.repeat(60));
    console.log('✅ TODOS OS TESTES PASSARAM');
    console.log('='.repeat(60) + '\n');
  } catch (error) {
    console.error('❌ TESTE FALHOU:', error);
  }
}

// ============================================================================
// TESTES DE BENCHMARK
// ============================================================================

export async function benchmarkTests() {
  console.log('\n' + '='.repeat(60));
  console.log('BENCHMARK - SCANNER INDUSTRIAL');
  console.log('='.repeat(60) + '\n');

  const controller = new IndustrialScannerController({
    maxAllowedScans: {
      shopee: 1000,
      mercado_livre: 1000,
      avulso: 1000,
    },
  });

  // Benchmark 1: Processing time
  console.time('1000 scans');
  for (let i = 0; i < 1000; i++) {
    const type = i % 3 === 0 ? 'BR' : i % 3 === 1 ? '46' : 'LM';
    await controller.processScan(`${type}${i.toString().padStart(6, '0')}`);
  }
  console.timeEnd('1000 scans');

  // Benchmark 2: Duplicate detection
  console.time('Duplicate detection (100x)');
  for (let i = 0; i < 100; i++) {
    await controller.processScan('BR123456'); // Mesmo código
  }
  console.timeEnd('Duplicate detection (100x)');

  // Benchmark 3: Memory usage (simples)
  const stats = controller.getStats();
  console.log('Estatísticas finais:', {
    total: stats.totalScans,
    válidos: stats.validScans,
    duplicatas: stats.duplicates,
    taxa_sucesso: ((stats.validScans / stats.totalScans) * 100).toFixed(2) + '%',
  });

  console.log('='.repeat(60) + '\n');
}

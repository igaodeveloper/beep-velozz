/**
 * Exemplos de Uso do Scanner Industrial
 * Demonstra padrões comuns e casos de uso
 */

// ============================================================================
// EXEMPLO 1: Uso Básico com Hook
// ============================================================================

import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useIndustrialScanner } from '@/utils/useIndustrialScanner';
import { IndustrialScannerController } from '@/utils/scannerController';
import {
  normalizeCode,
  identifyPackage,
  validateCode,
  extractPrefix,
  getPackageTypeLabel,
} from '@/utils/scannerIdentification';
import { ScannerState, ScanResult } from '@/types/scanner';

function BasicScannerExample() {
  const scanner = useIndustrialScanner({
    maxAllowedScans: {
      shopee: 50,
      mercado_livre: 30,
      avulso: 20,
    },
    debounceMs: 400,
  });

  const handleScanCode = async (code: string) => {
    const result = await scanner.processScan(code);

    if (result.success) {
      Alert.alert('Sucesso', `✅ ${result.code} - Tipo: ${result.type}`);
    } else {
      Alert.alert('Erro', `❌ ${result.reason}`);
    }
  };

  return (
    <View>
      <Text>Shopee: {scanner.counts.shopee}/{scanner.limits.shopee}</Text>
      <Text>Mercado Livre: {scanner.counts.mercado_livre}/{scanner.limits.mercado_livre}</Text>
      <Text>Avulso: {scanner.counts.avulso}/{scanner.limits.avulso}</Text>

      {scanner.isLimitReached && (
        <Text style={{ color: 'red' }}>⚠️ LIMITE ATINGIDO</Text>
      )}

      <TouchableOpacity onPress={() => scanner.reset()}>
        <Text>🔄 Reset</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// EXEMPLO 2: Controller Direto com Callbacks
// ============================================================================
function ControllerExample() {
  const scanner = new IndustrialScannerController({
    maxAllowedScans: {
      shopee: 50,
      mercado_livre: 30,
      avulso: 20,
    },
    onStateChange: (state) => {
      console.log('Scanner state changed:', state);
      if (state === ScannerState.LIMIT_REACHED) {
        console.log('⚠️ Limite atingido!');
      }
    },
    onStatsUpdate: (stats) => {
      console.log('Stats updated:', stats);
    },
  });

  // Processar múltiplos códigos
  const processMultipleCodes = async () => {
    const codes = ['BR123456', '46987654', 'LM99887766'];

    for (const code of codes) {
      const result = await scanner.processScan(code);
      console.log(`${code}: ${result.success ? 'OK' : 'FALHOU'}`);

      if (!result.success) {
        console.log(`Razão: ${result.reason}`);
      }
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={processMultipleCodes}>
        <Text>Processar Lote</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// EXEMPLO 3: Identificação de Pacotes
// ============================================================================
function IdentificationExample() {
  const testCodes = [
    'BR123456789',       // Shopee
    '20000987654321',    // Mercado Livre
    '46555777888',       // Mercado Livre
    'LM-ABC-123',        // Avulso
    '14555777888',       // Avulso
    'UNKNOWN12345',      // Desconhecido
  ];

  testCodes.forEach(rawCode => {
    const normalized = normalizeCode(rawCode);
    const valid = validateCode(normalized);
    const identification = identifyPackage(normalized);
    const prefix = extractPrefix(normalized);

    console.log({
      input: rawCode,
      normalized,
      valid,
      type: identification.type,
      prefix,
      label: getPackageTypeLabel(identification.type),
    });
  });

  return <Text>Ver console para identificação</Text>;
}

// ============================================================================
// EXEMPLO 4: Auditoria e Logs
// ============================================================================
function AuditingExample() {
  const scanner = new IndustrialScannerController({
    maxAllowedScans: {
      shopee: 50,
      mercado_livre: 30,
      avulso: 20,
    },
  });

  const scanHistory: ScanResult[] = [];

  const processWithAudit = async (code: string) => {
    const result = await scanner.processScan(code);
    scanHistory.push(result);

    // Gerar relatório
    const stats = scanner.getStats();
    console.log({
      timestamp: new Date().toISOString(),
      code: result.code,
      type: result.type,
      success: result.success,
      reason: result.reason,
      currentCounts: stats.counts,
      totalProcessed: scanHistory.length,
    });
  };

  const generateReport = () => {
    const successful = scanHistory.filter(r => r.success).length;
    const duplicates = scanHistory.filter(r => r.isDuplicate).length;
    const errors = scanHistory.length - successful;

    return {
      total: scanHistory.length,
      successful,
      errors,
      duplicates,
      successRate: ((successful / scanHistory.length) * 100).toFixed(2) + '%',
      lastScan: scanHistory[scanHistory.length - 1],
    };
  };

  return (
    <View>
      <TouchableOpacity onPress={() => console.log(generateReport())}>
        <Text>📊 Gerar Relatório</Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================================================
// EXEMPLO 5: Validação e Tratamento de Erros
// ============================================================================

async function ErrorHandlingExample() {
  const scanner = new IndustrialScannerController({
    maxAllowedScans: {
      shopee: 3,           // Limite baixo para teste
      mercado_livre: 2,
      avulso: 2,
    },
  });

  // Teste todos os cenários de erro
  const testScenarios = [
    { code: '', expectedReason: 'invalid' },
    { code: 'BR123456', expectedReason: null }, // Valid
    { code: 'BR123456', expectedReason: 'duplicate' }, // Duplicate
    { code: 'UNKNOWN', expectedReason: null }, // Valid but unknown
  ];

  for (const scenario of testScenarios) {
    const result = await scanner.processScan(scenario.code);

    console.assert(
      !scenario.expectedReason || result.reason === scenario.expectedReason,
      `Esperado ${scenario.expectedReason}, obtido ${result.reason}`
    );
  }

  // Teste limite
  for (let i = 0; i < 5; i++) {
    const result = await scanner.processScan(`BR${i}23456`);
    if (i < 3) {
      console.assert(result.success, 'Deveria ter sucesso antes do limite');
    } else {
      console.assert(result.reason === 'limit_reached', 'Deveria atingir limite');
    }
  }
}

// ============================================================================
// EXEMPLO 6: Monitoramento em Tempo Real
// ============================================================================

function MonitoringExample() {
  const scanner = new IndustrialScannerController({
    maxAllowedScans: {
      shopee: 50,
      mercado_livre: 30,
      avulso: 20,
    },
    onStateChange: (state) => {
      console.log(`[STATE] ${state}`);
    },
    onStatsUpdate: (stats) => {
      console.log(`[STATS] Total: ${stats.validScans}, Duplicatas: ${stats.duplicates}`);
    },
  });

  const monitorScan = async (code: string) => {
    console.log(`[SCAN] Processando: ${code}`);
    console.time('scan-duration');

    const result = await scanner.processScan(code);

    console.timeEnd('scan-duration');
    console.log(`[RESULT] Success: ${result.success}, Razão: ${result.reason}`);

    // Estado atual
    const stats = scanner.getStats();
    console.log('[PROGRESS]', {
      shopee: `${stats.counts.shopee}/${stats.limits.shopee}`,
      mercado_livre: `${stats.counts.mercado_livre}/${stats.limits.mercado_livre}`,
      avulso: `${stats.counts.avulso}/${stats.limits.avulso}`,
    });
  };

  return <Text>Ver console para monitoramento</Text>;
}

// ============================================================================
// EXEMPLO 7: Migração do ScannerView Antigo
// ============================================================================

// ANTES (Antigo)
/*
const checkLimit = (type: 'shopee' | 'mercado_livre' | 'avulso') => {
  let currentCount = metrics[type];
  let limit = declaredCounts[type];
  if (currentCount >= limit) {
    setLimitVisible(true);
    return false;
  }
  return true;
};

const forceTypeByPrefix = (code: string) => {
  if (code.startsWith('BR')) return 'shopee';
  if (code.startsWith('20000') || code.startsWith('46')) return 'mercado_livre';
  if (code.startsWith('LM')) return 'avulso';
  return null;
};
*/

// DEPOIS (Novo)

function MigrationExample() {
  const scanner = useIndustrialScanner({
    maxAllowedScans: {
      shopee: 50,
      mercado_livre: 30,
      avulso: 20,
    },
  });

  const handleBarcodeScan = async (rawCode: string) => {
    const result = await scanner.processScan(rawCode);

    if (result.success) {
      // Código foi aceito
      console.log(`Tipo detectado: ${result.type}`);
      console.log(`Limite atingido: ${scanner.isLimitReached}`);
    } else if (result.isDuplicate) {
      // Era duplicata
      console.log('Código já escaneado');
    } else if (result.reason === 'limit_reached') {
      // Limite atingido
      console.log('Limite de ' + result.type + ' foi atingido');
    } else {
      // Outro erro
      console.log('Erro: ' + result.reason);
    }
  };

  return (
    <View>
      <Text>Migrado para novo sistema</Text>
    </View>
  );
}

// ============================================================================
// EXPORT DE EXEMPLOS
// ============================================================================

export {
  BasicScannerExample,
  ControllerExample,
  IdentificationExample,
  AuditingExample,
  ErrorHandlingExample,
  MonitoringExample,
  MigrationExample,
};

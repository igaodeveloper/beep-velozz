#!/usr/bin/env node

/**
 * Teste de Scanner - Simular leitura de código 2000015371632024
 */

const PREFIX_PATTERNS = [
  { prefix: '20000', minLength: 5, type: 'mercado_livre', audioKey: 'beep_b' },
  { prefix: 'LM', minLength: 4, type: 'avulso', audioKey: 'beep_c' },
  { prefix: 'BR', minLength: 8, type: 'shopee', audioKey: 'beep_a' },
];

function normalizeCode(rawCode) {
  const trimmed = rawCode.trim().toUpperCase();
  return trimmed.replace(/[^0-9A-Z]/g, '');
}

function validateCode(code) {
  return code && code.length >= 4 && /^[A-Z0-9]+$/.test(code);
}

function identifyPackage(code) {
  for (const p of PREFIX_PATTERNS) {
    if (code.startsWith(p.prefix) && code.length >= p.minLength) {
      return {
        type: p.type,
        matched: true,
        confidence: 'high',
        audioKey: p.audioKey,
      };
    }
  }
  if (/^20000/.test(code)) {
    return { type: 'mercado_livre', matched: true, confidence: 'high', audioKey: 'beep_b' };
  }
  return { type: 'unknown', matched: false, confidence: 'low' };
}

// TESTE
console.log('\n=== TESTE SCANNER MERCADO LIVRE ===\n');

const testCode = '2000015371632024';
console.log('Codigo Escaneado: ' + testCode);

const normalized = normalizeCode(testCode);
console.log('Normalizado:      ' + normalized);

const valid = validateCode(normalized);
console.log('Valido:           ' + (valid ? 'SIM' : 'NAO'));

const result = identifyPackage(normalized);
console.log('Tipo:             ' + result.type);
console.log('Confianca:        ' + result.confidence);
console.log('Audio:            ' + (result.audioKey || 'N/A'));

if (result.type === 'mercado_livre') {
  console.log('\n🔔 BEEP! (som de sucesso Mercado Livre)');
  console.log('✅ CODIGO ACEITO!');
} else {
  console.log('\n❌ Tipo nao identificado como Mercado Livre');
}

console.log('');

#!/usr/bin/env node

/**
 * Teste de Scanner - Simular leitura completa de código 20000
 * Código: 2000015371632024
 */

// Simular funções do scanner normatizado
const PREFIX_PATTERNS = [
  { prefix: '20000', minLength: 5, type: 'mercado_livre', audioKey: 'beep_b' },
  { prefix: 'LM', minLength: 4, type: 'avulso', audioKey: 'beep_c' },
  { prefix: '14', minLength: 4, type: 'avulso', audioKey: 'beep_c' },
  { prefix: 'BR', minLength: 8, type: 'shopee', audioKey: 'beep_a' },
];

function normalizeCode(rawCode) {
  if (!rawCode || typeof rawCode !== 'string') {
    console.log(`[❌] INPUT INVÁLIDO`);
    return '';
  }

  let input = rawCode;
  const trimmed = input.trim().toUpperCase();

  if (!trimmed) {
    console.log(`[❌] CÓDIGO VAZIO`);
    return '';
  }

  let normalized = trimmed.replace(/[^0-9A-Z]/g, '');
  console.log(`[✓] NORMALIZADO: "${normali​zed}"`);

  // ID strip
  if (/^ID[A-Z0-9]/.test(normalized)) {
    normalized = normalized.slice(2);
    console.log(`[✓] REMOVIDO PREFIX ID`);
  }

  // Extração de fragmento ML
  if (!/^20000/.test(normalized)) {
    const match = normalized.match(/(ID)?20000[0-9A-Z]+/);
    if (match) {
      normalized = match[0];
      console.log(`[✓] FRAGMENTO EXTRAÍDO: "${normalized}"`);
      if (/^ID./.test(normalized)) {
        normalized = normalized.slice(2);
      }
    }
  }

  return normalized;
}

function validateCode(normalizedCode) {
  if (!normalizedCode || normalizedCode.length < 4) {
    console.log(`[❌] COMPRIMENTO INSUFICIENTE: ${normalizedCode?.length} chars`);
    return false;
  }

  const valid = /^[A-Z0-9]+$/.test(normalizedCode);
  if (!valid) {
    console.log(`[❌] CONTÉM CARACTERES INVÁLIDOS`);
    return false;
  }

  console.log(`[✓] VALIDADO: "${normalizedCode}" (${normalizedCode.length} chars)`);
  return true;
}

function identifyPackage(normalizedCode) {
  if (!normalizedCode || normalizedCode.length < 4) {
    return { type: 'unknown', matched: false, confidence: 'low' };
  }

  // Tenta prefixos
  for (const pattern of PREFIX_PATTERNS) {
    if (
      normalizedCode.startsWith(pattern.prefix) &&
      normalizedCode.length >= pattern.minLength
    ) {
      console.log(`[✓] PREFIXO ENCONTRADO: "${pattern.prefix}" → TYPE: "${pattern.type}"`);
      return {
        type: pattern.type,
        matched: true,
        confidence: 'high',
        audioKey: pattern.audioKey,
      };
    }
  }

  // Fallback
  const startsWithLetter = /^[A-Z]/.test(normalizedCode);
  if (startsWithLetter) {
    return { type: 'avulso', matched: true, confidence: 'medium' };
  }

  if (/^20000/.test(normalizedCode)) {
    console.log(`[✓] FALLBACK: MERCADO LIVRE via regex`);
    return { type: 'mercado_livre', matched: true, confidence: 'high', audioKey: 'beep_b' };
  }

  return { type: 'unknown', matched: false, confidence: 'low' };
}

// ====================================
// TESTE PRINCIPAL
// ====================================
console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║     TESTE SCANNER - CÓDIGO 20000                    ║');
console.log('╚════════════════════════════════════════════════════╝\n');

const testCodeme = '2000015371632024';
console.log(`📥 CÓDIGO SCANEADO: "${testCodeme}"\n`);

console.log('🔄 PASSO 1: NORMALIZAÇÃO');
cons​t normalized = normalizeCode(testCodeme);
if (!normalized) {
  console.log('\n[❌] FALHA NA NORMALIZAÇÃO');
  process.exit(1);
}

console.log('\n🔄 PASSO 2: VALIDAÇÃO');
if (!validateCode(normalized)) {
  console.log('\n[❌] CÓDIGO NÃO VALIDADO');
  process.exit(1);
}

console.log('\n🔄 PASSO 3: IDENTIFICAÇÃO');
const result = identifyPackage(normalized);

console.log('\n╔════════════════════════════════════════════════════╗');
console.log('║                  RESULTADO FINAL                     ║');
console.log('╚════════════════════════════════════════════════════╝\n');

console.log(`📝 Código Original:   ${testCodeme}`);
console.log(`✓ Código Normalizado: ${normalized}`);
console.log(`🎯 Tipo Identificado: ${result.type}`);
console.log(`📊 Confiança:         ${result.confidence}`);
console.log(`📢 Áudio:             ${result.audioKey || 'N/A'}`);
console.log(`✓ Coincidia:          ${result.matched ? '✅ SIM' : '❌ NÃO'}`);

if (result.type === 'mercado_livre') {
  console.log('\n🔔 ✅ BEEP! Som de Sucesso - Mercado Livre Identificado!');
  console.log('🎵 AUDIO: beep_b (Som Mercado Livre)');
} else {
  console.log(`\n❌ Tipo não é Mercado Livre: ${result.type}`);
}

console.log('\n');

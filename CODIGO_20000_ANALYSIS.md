# Análise Completa: Lógica de Filtro e Validação de Códigos 20000

**Data**: 2026-03-10  
**Objetivo**: Procurar por rejeição, filtro ou sobrescrita de códigos que começam com "20000"

---

## 1. SISTEMAS DE CLASSIFICAÇÃO ENCONTRADOS (Duplicação)

### 1.1 Sistema Principal: `scannerIdentification.ts::identifyPackage()`
**Localização**: [utils/scannerIdentification.ts](utils/scannerIdentification.ts#L1-L300)  
**Status**: ✅ PERMISSIVO com 20000

```typescript
const PREFIX_PATTERNS = [
  {
    prefix: '20000',
    minLength: 5,  // ← Apenas "20000" já é aceito!
    type: 'mercado_livre',
    ...
  },
  // ... outros padrões
];
```

**Comportamento**:
- Aceita qualquer código com comprimento ≥ 5 que comece com `20000`
- Exemplos aceitos: `"20000"`, `"200001"`, `"20000123"`, `"20000987654321"` ✅
- Nunca rejeita baseado em prefixo (se validar ok)

---

### 1.2 Sistema Alternativo: `session.ts::classifyPackage()` 
**Localização**: [utils/session.ts](utils/session.ts#L15-L47)  
**Status**: 🔴 NÃO UTILIZADO (Função Órfã)

```typescript
export function classifyPackage(code: string): PackageType {
  // ... normalização similar ...
  if (upper.startsWith('20000')) {
    return 'mercado_livre';  // ✅ Também permissivo
  }
  // ... também aceita ML, MELI, MERCADO como mercado_livre ...
}
```

**Problema**: 
- Definida mas **nunca chamada** em nenhum ponto do projeto
- Pode causar confusão para futuros desenvolvedores
- Aceita aliases extras (`ML`, `MELI`, `MERCADO`) que o sistema principal não aceita

---

## 2. VALIDAÇÕES E FILTROS POR TIPO

### 2.1 Validação Simples (Fluxo Principal)
**Localização**: [utils/scannerIdentification.ts#L153-L166](utils/scannerIdentification.ts#L153-L166)

```typescript
export function validateCode(normalizedCode: string): boolean {
  if (!normalizedCode || normalizedCode.length < 4) {
    return false;
  }
  // Apenas alfanuméricos
  const valid = /^[A-Z0-9]+$/.test(normalizedCode);
  return valid;
}
```

**Para 20000**:
- ✅ `"20000"` passa (5 chars, all digits)
- ✅ Sem validação de checksum

---

### 2.2 Validação Avançada com Checksum (Sistema Paralelo)
**Localização**: [utils/advancedScanner.ts#L100-L155](utils/advancedScanner.ts#L100-L155)

⚠️ **PONTO CRÍTICO**: REGEX RIGOROSO

```typescript
const ADVANCED_PATTERNS: CodePattern[] = [
  {
    name: 'Mercado Livre 20000',
    regex: /^20000[0-9]{6,}$/,  // ← Requer 6+ dígitos APÓS 20000!
    minLength: 11,               // ← Total de 11 caracteres mínimo
    maxLength: 20,
    marketplace: 'Mercado Livre',
    type: 'mercado_livre',
    priority: 85,
  },
  // ...
];
```

**Problema Identificado**:
- ❌ `"20000"` (5 chars) - REJEITADO
- ❌ `"200001"` (6 chars) - REJEITADO (precisa 6 dígitos APÓS 20000 = 11 total)
- ✅ `"20000123456"` (11 chars) - ACEITO
- ✅ `"20000987654321"` (14 chars) - ACEITO

---

## 3. FLUXO DE PROCESSAMENTO E EXECUÇÃO

### 3.1 Fluxo Principal - Via `ScannerView.tsx` ou `IndustrialScannerView.tsx`

```
┌─────────────────────────────────────────────────────────┐
│ Input (raw barcode code)                                │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ ScannerView.handleScannedCode(raw) ← [components/ScannerView.tsx#L269] │
│ ou                                                      │
│ IndustrialScannerView.processBarcode(scanned)          │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│ controller.processScan(rawCode)                         │
│ [utils/scannerController.ts#L113]                       │
└─────────────────────────────────────────────────────────┘
                          ↓
         ┌────────────────┴────────────────┐
         │                                 │
    ETAPA 1:                          ETAPA 2:
    Simple Path                       Advanced Path
         │                                 │
         ↓                                 ↓
┌──────────────────┐         ┌─────────────────────────┐
│ normalizeCode()  │         │ normalizeCode()         │
│ validateCode()   │         │ [no if type==ML]:       │
│ identifyPackage()│         │ analyzeMercadoLivreCode()
│                  │         │  → analyzeCodeAdvanced()│
│ → type           │         │  → REGEX CHECK          │
└──────────────────┘         └─────────────────────────┘
         │                                 │
    RESULTADO 1:                    RESULTADO 2:
    ✅ mercado_livre                ⚠️ confidence_score
       (permissivo)                 (pode ser 0 se regex fail)
         │                                 │
         └────────────────┬────────────────┘
                          ↓
           ┌──────────────────────────────┐
           │ Ambos usados para logging,   │
           │ mas tipo permanece the same  │
           │ (identificado em ETAPA 1)    │
           └──────────────────────────────┘
                          ↓
          ┌───────────────┴───────────────┐
          │                               │
         DUPLICATA?                   LIMITE?
         [Histórico]              [Limite Controller]
          │                               │
          └───────────────┬───────────────┘
                          ↓
                 ┌─────────────────┐
                 │ ACEITAR CÓDIGO  │
                 │ type='mercado_  │
                 │      livre'     │
                 └─────────────────┘
```

---

## 4. CHAMADAS AO ANALISADOR AVANÇADO (Potencial Problema)

### 4.1 `analyzeMercadoLivreCode()` - Onde É Usada?

**Localização**: [utils/scannerController.ts#L192-L196](utils/scannerController.ts#L192-L196)

```typescript
if (type === 'mercado_livre') {
  const adv = analyzeMercadoLivreCode(normalizedCode);  // ← CHAMADA AQUI
  const advScore = Math.min(Math.max(adv.confidence_score / 100, 0), 1);
  confidence = Math.max(confidence, advScore);  // ← Usa para logging/confiança
}
```

**Impacto**:
- ✅ Não rejeita o código
- ⚠️ Se confidence_score = 0, a confiança fica baixa
- 📊 Afeta logs de auditoria, não aceitação

---

## 5. PONTOS CRÍTICOS IDENTIFICADOS

### 5.1: Mismatch entre Simple e Advanced Regex

| Aspecto | Simple Pattern | Advanced Regex | Impacto |
|---------|---|---|---|
| Prefixo | `20000` | `/^20000[0-9]{6,}$/` | ⚠️ DIFERENTE |
| Min Length | 5 | 11 | ⚠️ CRÍTICO |
| Aceita `"20000"` | ✅ Sim | ❌ Não | 🔴 INCONSISTÊNCIA |
| Aceita `"200001"` | ✅ Sim | ❌ Não (precisa 11) | 🔴 INCONSISTÊNCIA |
| Aceita `"20000123456"` | ✅ Sim | ✅ Sim | ✅ OK |
| Checksum Validado | ❌ Não | ❌ Não (Mercado Livre) | ✅ OK |

---

### 5.2: Location das Rejeições Potenciais

#### NO FLUXO PRINCIPAL ❌ (NÃO REJEITA)
1. [normalizeCode()](utils/scannerIdentification.ts#L91-L152) - extrai e normaliza
2. [validateCode()](utils/scannerIdentification.ts#L158-L166) - mínimo 4 chars, alphanumerico
3. [identifyPackage()](utils/scannerIdentification.ts#L177-L268) - **aceita 20000 com minLength=5** ✅

#### EM ANÁLISE PARALELA ⚠️ (NÃO REJEITA MAS MARCA)
1. [analyzeMercadoLivreCode()](utils/advancedScanner.ts#L254-L275)
   - Normaliza com `normalizeMercadoLivreCode()`
   - Se `!/^20000/` → retorna `type: 'unknown'`, `confidence: 'rejected'` ❌
   - Chama `analyzeCodeAdvanced()`
   - Se não for `mercado_livre` → marca como `is_suspicious`, reduz score

2. [analyzeCodeAdvanced()](utils/advancedScanner.ts#L281-L390)
   - Testa regex `/^20000[0-9]{6,}$/`
   - **EM CÓDIGO "20000" (5 chars) → NÃO BATE** ❌
   - Retorna `type: 'unknown'` se não bater padrao

#### EM DETECÇÃO DE ANOMALIAS ⚠️
[detectAnomalies()](utils/advancedScanner.ts#L421-L441)
```typescript
if (context.expectedType && analysis.type !== context.expectedType && 
    analysis.type !== 'unknown') {
  // Reduz confiança se tipo não corresponde esperado
  analysis.confidence_score = Math.max(30, analysis.confidence_score - 30);
}
```

---

## 6. LISTA COMPLETA DE LOCAIS COM VALIDAÇÃO/FILTRO

### Arquivos Analisados

| Arquivo | Função | Linha | Tipo | Status |
|---------|--------|-------|------|--------|
| scannerIdentification.ts | normalizeCode() | 91-152 | Normalização | ✅ Permissivo |
| scannerIdentification.ts | validateCode() | 158-166 | Validação | ✅ Permissivo (4+ chars) |
| scannerIdentification.ts | identifyPackage() | 177-268 | Classificação | ✅ **Aceita 20000** |
| scannerIdentification.ts | isDefinitelyType() | 327 | Verificação | ℹ️ Apenas busca |
| scannerIdentification.ts | getConfidenceScore() | 335-346 | Score | 📊 Logging apenas |
| advancedScanner.ts | advancedNormalizeCode() | 173-228 | Normalização alt. | ⚠️ Extrai ML |
| advancedScanner.ts | normalizeMercadoLivreCode() | 235-248 | Validação ML | ❌ Rejeita se !/^20000/ |
| advancedScanner.ts | analyzeMercadoLivreCode() | 254-277 | Análise ML | ❌ Marca unknown se falha |
| advancedScanner.ts | analyzeCodeAdvanced() | 281-390 | Análise avançada | ❌ **Regex rigoroso** |
| advancedScanner.ts | detectAnomalies() | 421-441 | Detecção anomalia | ⚠️ Reduz confiança |
| scannerController.ts | processScan() | 113-310 | Orquestração | 🟡 Chama analisador |
| session.ts | classifyPackage() | 15-47 | Classificação alt. | 🔴 **NÃO USADO** |
| ScannerView.tsx | handleScannedCode() | 260-310 | Handler | ✅ Usa identifyPackage() |
| IndustrialScannerView.tsx | processScan() | ~170+ | Handler | ✅ Usa controller |

---

## 7. RESUMO DE FALHAS/PROBLEMAS

### Problema 1: Duplicação de Código de Classificação
- **Local**: `scannerIdentification.ts::identifyPackage()` vs `session.ts::classifyPackage()`
- **Impacto**: Confusão, manutenção
- **Severidade**: 🟡 Médio (function is orphaned)

### Problema 2: Mismatch Regex Simple ↔ Advanced
- **Local**: `PREFIX_PATTERNS` (line 32) vs `ADVANCED_PATTERNS` (line 137)
- **Impacto**: Diferentes comprimentos mínimos (5 vs 11)
- **Severidade**: 🔴 **CRÍTICO**
- **Exemplo**: `"20000"` é aceito por `identifyPackage()` mas rejeitado por `analyzeCodeAdvanced()`

### Problema 3: Sistema Paralelo com Análise Avançada
- **Local**: `scannerController.ts#L192-196` chama `analyzeMercadoLivreCode()`
- **Impacto**: Pode retornar `confidence_score = 0` para códigos curtos
- **Severidade**: 🟡 Médio (não rejeita, mas marca como 'suspicious')

### Problema 4: Orphaned Function
- **Local**: `session.ts::classifyPackage()` - **nunca chamada**
- **Impacto**: Dead code, possível source of future bugs
- **Severidade**: 🟡 Médio (confusão/manutenção)

---

## 8. CENÁRIOS DE TESTE

### Teste 1: Código "20000" (5 caracteres)
```
Input: "20000"
  → normalizeCode("20000") = "20000" ✅
  → validateCode("20000") = true ✅ (5 chars, alphanumeric)
  → identifyPackage("20000") = mercado_livre ✅ (minLength=5)
  → analyzeMercadoLivreCode("20000"):
     - normalizeMercadoLivreCode() = "20000" ✅
     - analyzeCodeAdvanced("20000"):
       - regex /^20000[0-9]{6,}$/ FALHA ❌ (não tem 6 dígitos after 20000)
       - → type: 'unknown', confidence_score: 0
Result: ✅ ACEITO como mercado_livre (identificação simples vence)
        ⚠️ Mas confidence_score = 0 no log de auditoria
```

### Teste 2: Código "20000123456" (11 caracteres)
```
Input: "20000123456"
  → normalizeCode() = "20000123456" ✅
  → validateCode() = true ✅
  → identifyPackage() = mercado_livre ✅ (minLength=5)
  → analyzeMercadoLivreCode("20000123456"):
     - normalizeMercadoLivreCode() = "20000123456" ✅
     - analyzeCodeAdvanced("20000123456"):
       - regex /^20000[0-9]{6,}$/ PASSA ✅
       - → type: 'mercado_livre', confidence_score: ~85
Result: ✅ ACEITO como mercado_livre
        ✅ Confidence score alto
```

---

## 9. CONCLUSÃO

### ✅ O QUE FUNCIONA
1. Codes com prefixo `20000` SÃO identificados como `mercado_livre`
2. NÃO há rejeição de códigos válidos no fluxo principal
3. Sistema de limite, duplicação e áudio funciona corretamente

### ⚠️ PROBLEMAS ENCONTRADOS
1. **CRÍTICO**: Regex rigorosa em `advancedScanner.ts` rejeita códigos curtos (5-10 chars)
   - Não causa aceitação/rejeição no fluxo main
   - MAS causa confidence_score = 0 para logging/auditoria
   
2. **MÉDIO**: Duplicação de funções de classificação
   - `classifyPackage()` em `session.ts` nunca é usada
   - Causa confusão e risco de bugs futuros

3. **MÉDIO**: Análise paralela complexa
   - Múltiplos paths que calculam tipos diferentes
   - Um retorna tipo correto, outro marca como suspicious

### 🔧 RECOMENDAÇÕES
1. Remover ou consolidar `classifyPackage()` em `session.ts`
2. Alinhar regex simples e avançada (ou remover a necessidade de regex rigorosa)
3. Simplificar fluxo de análise em `scannerController.ts`
4. Adicionar testes unitários para boundary cases (5-10 char codes)

---

## 10. MAPA DE REFERÊNCIAS RÁPIDO

- 🔴 **Rejeitador potencial**: [advancedScanner.ts#137](utils/advancedScanner.ts#L137) regex
- ✅ **Caminho aceito**: [scannerIdentification.ts#32](utils/scannerIdentification.ts#L32) PREFIX_PATTERNS
- 📍 **Duplicado**: [session.ts#15](utils/session.ts#L15) classifyPackage()
- 🔌 **Point de entrada**: [ScannerView.tsx#203](components/ScannerView.tsx#L203) ou [IndustrialScannerView.tsx#174](components/IndustrialScannerView.tsx#L174)
- 🎵 **Orquestrador**: [scannerController.ts#113](utils/scannerController.ts#L113) processScan()
- 📊 **Analisador avançado chamado em**: [scannerController.ts#193](utils/scannerController.ts#L193)

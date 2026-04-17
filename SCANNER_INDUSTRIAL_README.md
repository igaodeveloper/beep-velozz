# 🏭 Scanner Industrial - Sistema Robusto e Determinístico

> Um sistema completo de scanner industrial para React Native + Expo + TypeScript, implementando padrões profissionais de identificação, controle de limite, áudio inteligente e prevenção de erros.

## ✨ Características Principais

### ✅ Identificação Automática por Prefixo

- **Shopee**: Prefixo `BR`
- **Mercado Livre**: Prefixos `20000`, `46`, `45`
- **Avulso**: Prefixos `LM`, `14`
- **Escalável**: Adicione novos marketplaces sem alterar lógica

### ✅ Controle Absoluto de Limite

- Limite configurável por tipo
- Bloqueio total após limite atingido
- Nenhuma leitura processada além do limite
- Reset manual explícito (nunca automático)

### ✅ Sistema de Áudio Inteligente

- Som distinto para cada tipo (beep A, B, C, erro)
- Debounce de 400ms entre bipes
- Fila inteligente sem sobreposição
- Nunca repete som para duplicata

### ✅ Prevenção Robusta de Erros

- Detecção de duplicação temporal (2 segundos)
- Prevenção de race conditions (lock de processamento)
- Validação de código
- Tratamento de todos os cenários de erro

### ✅ Arquitetura Modular

- Separação clara de responsabilidades
- Componente UI apenas renderiza e chama controller
- Nenhuma regra de negócio na UI
- Fácil de testar e manter

---

## 📁 Estrutura de Arquivos

```
project/
├── types/
│   └── scanner.ts                           # Definições de tipos
│
├── utils/
│   ├── scannerIdentification.ts            # Classificação automática
│   ├── scannerAudio.ts                     # Gerenciamento de áudio
│   ├── scannerLimitController.ts           # Controle de limite
│   ├── scannerController.ts                # Orquestrador (CORE)
│   └── useIndustrialScanner.ts             # Hook React
│
├── components/
│   └── IndustrialScannerView.tsx           # Exemplo de integração
│
├── SCANNER_INDUSTRIAL_GUIDE.md              # Documentação completa
├── SCANNER_INDUSTRIAL_ARCHITECTURE.md       # Diagramas e fluxos
├── SCANNER_INDUSTRIAL_EXAMPLES.ts           # Exemplos de uso

```

---

## 🚀 Quick Start

### 1. Instalação (Já Integrado)

Todos os módulos estão na pasta `utils/` e `types/`.

### 2. Uso Básico com Hook

```typescript
import { useIndustrialScanner } from '@/utils/useIndustrialScanner';

function MyScanner() {
  const scanner = useIndustrialScanner({
    maxAllowedScans: {
      shopee: 50,
      mercado_livre: 30,
      avulso: 20,
    },
  });

  const handleScan = async (code: string) => {
    const result = await scanner.processScan(code);
    if (result.success) {
      console.log(`✅ ${result.code} - ${result.type}`);
    } else {
      console.log(`❌ ${result.reason}`);
    }
  };

  return (
    <View>
      <Text>Shopee: {scanner.counts.shopee}/{scanner.limits.shopee}</Text>
      <Text>Estado: {scanner.state}</Text>
      {scanner.isLimitReached && <Text>⚠️ Limite atingido</Text>}
      <Button onPress={() => scanner.reset()}>Reset</Button>
    </View>
  );
}
```

### 3. Componente Pronto

```typescript
import IndustrialScannerView from '@/components/IndustrialScannerView';

<IndustrialScannerView
  maxScans={{ shopee: 50, mercado_livre: 30, avulso: 20 }}
  onScanned={(code, type) => console.log(code, type)}
  onLimitReached={(types) => console.log('Limite em:', types)}
  onEndSession={() => navigation.goBack()}
/>
```

---

## 📊 Fluxo de Processamento

```
Código Escaneado
    ↓
Normalizar → Validar → Verificar Duplicação
    ↓
Identificar Tipo → Verificar Limite → Incrementar Contador
    ↓
Tocar Áudio → Haptics → Retornar Resultado
```

---

## 🎯 Exemplos de Resultado

### Sucesso

```typescript
{
  success: true,
  code: "BR123456789",
  type: "shopee",
  isDuplicate: false,
  timestamp: 1709564123456
}
```

### Duplicata

```typescript
{
  success: false,
  code: "BR123456789",
  isDuplicate: true,
  reason: "duplicate",
  timestamp: 1709564125456
}
```

### Limite Atingido

```typescript
{
  success: false,
  code: "46987654321",
  type: "mercado_livre",
  reason: "limit_reached",
  timestamp: 1709564129456
}
```

### Inválido

```typescript
{
  success: false,
  code: "!!!",
  reason: "invalid",
  timestamp: 1709564130456
}
```

---

## 🔄 Ciclo de Vida

```
Initialize
    ↓
[ACTIVE] ← processScan() → determina resultado
    ↓
    ├─ Sucesso: incrementa, toca áudio
    ├─ Duplicata: toca erro
    ├─ Limite atingido: vai para [LIMIT_REACHED]
    └─ Inválido: toca erro
    ↓
[LIMIT_REACHED] → apenas reset() volta para [ACTIVE]
    ↓
reset() → limpa tudo, volta a [ACTIVE]
```

---

## 🛡️ Mecanismos de Segurança

### Race Condition Prevention

```typescript
// Processamento sequencial com lock
if (this.processingLock) return { reason: 'rate_limited' };
this.processingLock = true;
// ... processar ...
setTimeout(() => processingLock = false, 400ms);
```

### Duplicate Detection

```typescript
// Verifica se mesmo código nos últimos 2 segundos
if (lastCode === currentCode && now - lastTime < 2000) {
  return DUPLICATED;
}
```

### Audio Debouncing

```typescript
// Fila inteligente com gap mínimo
if (now - lastAudioTime < 400ms) {
  audioQueue.push(audioType);
  return;
}
```

### Absolute Limit Blocking

```typescript
// Uma vez atingido, bloqueia permanentemente
if (hasLimitReached(type)) {
  return { reason: "limit_reached" };
}
```

---

## 📖 Documentação Detalhada

- **[SCANNER_INDUSTRIAL_GUIDE.md](SCANNER_INDUSTRIAL_GUIDE.md)** - Guia completo de uso
- **[SCANNER_INDUSTRIAL_ARCHITECTURE.md](SCANNER_INDUSTRIAL_ARCHITECTURE.md)** - Diagramas e arquitetura
- **[SCANNER_INDUSTRIAL_EXAMPLES.ts](SCANNER_INDUSTRIAL_EXAMPLES.ts)** - Exemplos de código

---

## 🧪 Testes

Execute os testes para validar o sistema:

```typescript
import { runAllTests, benchmarkTests } from "@/SCANNER_INDUSTRIAL_TESTS";

// Testes unitários
await runAllTests();

// Benchmark (1000 scans)
await benchmarkTests();
```

---

## 🎯 Casos de Uso

### Casos de Sucesso

✅ Código válido dentro do limite → Aceito + Áudio  
✅ Tipo identificado corretamente → Áudio específico  
✅ Código diferente após duplicata → Aceito novamente

### Casos de Erro

❌ Código duplicado (< 2s) → Rejeitado + Erro  
❌ Limite atingido → Rejeitado + Bloqueio total  
❌ Código inválido → Rejeitado + Erro  
❌ Processamento simultâneo → Rate limited

---

## 📈 Migração do Sistema Antigo

### Antes (ScannerView.tsx antigo)

```typescript
const checkLimit = (type) => {...};
const forceTypeByPrefix = (code) => {...};
const classifyPackage = (code) => {...};
// Lógica espalhada no componente
```

### Depois (Novo Sistema)

```typescript
const scanner = useIndustrialScanner({ maxAllowedScans: {...} });
const result = await scanner.processScan(code);
// Tudo gerenciado pelo controller
```

---

## 🔧 Configuração

```typescript
const scanner = useIndustrialScanner({
  // Limite por tipo (obrigatório)
  maxAllowedScans: {
    shopee: 50,
    mercado_livre: 30,
    avulso: 20,
  },

  // Debounce em ms (default: 400)
  debounceMs: 400,

  // Callbacks (opcionais)
  onStateChange: (state) => console.log(state),
  onStatsUpdate: (stats) => console.log(stats),
});
```

---

## 💡 API Reference

### IndustrialScannerController

```typescript
// Core methods
await processScan(code: string): ScanResult
reset(): void
pause(): void
resume(): void

// Queries
getState(): ScannerState
isLimitReached(): boolean
isProcessing(): boolean
getCounts(): Record<PackageType, number>
getLimits(): Record<string, number>
getStats(): CompleteStats
getLastValidScan(): LastScan | null
```

### useIndustrialScanner Hook

```typescript
const scanner = useIndustrialScanner(config);

// State
scanner.state: ScannerState
scanner.counts: Record<PackageType, number>
scanner.limits: Record<string, number>
scanner.isLimitReached: boolean
scanner.isProcessing: boolean
scanner.stats: Stats
scanner.lastScan: Scan | null

// Methods
await scanner.processScan(code: string)
scanner.reset(): void
scanner.pause(): void
scanner.resume(): void
```

---

## 🎓 Aprenda com Exemplos

Consulte [SCANNER_INDUSTRIAL_EXAMPLES.ts](SCANNER_INDUSTRIAL_EXAMPLES.ts) para:

- Uso básico com hook
- Controller direto
- Identificação de pacotes
- Auditoria e logs
- Tratamento de erros
- Monitoramento em tempo real
- Migração do sistema antigo

---

## 🚦 Status e Garantias

| Garantia                      | Status          | Detalhe                        |
| ----------------------------- | --------------- | ------------------------------ |
| ✅ Determinístico             | ✅ Implementado | Mesma entrada = mesmo output   |
| ✅ Seguro                     | ✅ Implementado | Race conditions prevenidas     |
| ✅ Escalável                  | ✅ Implementado | Adicione prefixos facilmente   |
| ✅ Modular                    | ✅ Implementado | Cada responsabilidade separada |
| ✅ Imune a duplicação         | ✅ Implementado | Detecção temporal              |
| ✅ Imune a ultrapassar limite | ✅ Implementado | Bloqueio absoluto              |
| ✅ Industrial                 | ✅ Implementado | Simula scanner profissional    |

---

## 🤝 Suporte

Para dúvidas ou problemas:

1. Consulte [SCANNER_INDUSTRIAL_GUIDE.md](SCANNER_INDUSTRIAL_GUIDE.md)
2. Verifique [SCANNER_INDUSTRIAL_EXAMPLES.ts](SCANNER_INDUSTRIAL_EXAMPLES.ts)
3. Execute [SCANNER_INDUSTRIAL_TESTS.ts](SCANNER_INDUSTRIAL_TESTS.ts)
4. Estude [SCANNER_INDUSTRIAL_ARCHITECTURE.md](SCANNER_INDUSTRIAL_ARCHITECTURE.md)

---

## 📝 Licença

Sistema desenvolvido como parte do projeto Beep Velozz.

---

**Versão**: 1.0.0  
**Status**: Production Ready  
**Última atualização**: Março 2026

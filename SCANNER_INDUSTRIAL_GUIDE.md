# Scanner Industrial Robusto - Documentação

## 📋 Visão Geral

Sistema de scanner industrial determinístico, modular e escalável para React Native + Expo + TypeScript. Implementa:

- ✅ Identificação automática por prefixo (Shopee, Mercado Livre, Avulso)
- ✅ Controle absoluto de limite com bloqueio total
- ✅ Sistema de áudio inteligente sem sobreposição
- ✅ Prevenção de leitura duplicada e race conditions
- ✅ Arquitetura modular e escalável
- ✅ Estado determinístico e seguro

---

## 🏗 Arquitetura

### Módulos Principais

```
utils/
├── scannerIdentification.ts    # Classificação automática por prefixo
├── scannerAudio.ts             # Gerenciamento de áudio inteligente
├── scannerLimitController.ts   # Controle de limite absoluto
├── scannerController.ts        # Orquestrador principal (core)
└── useIndustrialScanner.ts     # Hook React para integração

types/
└── scanner.ts                  # Definições de tipos

components/
└── IndustrialScannerView.tsx   # Exemplo de integração com UI
```

### Fluxo de Processamento

```
Código Escaneado
    ↓
[scannerController.processScan()]
    ↓
[normalizeCode] → Normaliza entrada
    ↓
[validateCode] → Valida formato
    ↓
[checkDuplicate] → Previne duplicação
    ↓
[identifyPackage] → Classifica por prefixo
    ↓
[limitController.tryIncrement] → Verifica limite
    ↓
[audioService.playAudio] → Toca som
    ↓
[Haptics.notification] → Vibração
    ↓
Retorna ScanResult
```

---

## 🎯 Identificação Automática de Pacotes

### Prefixos Suportados

```typescript
// Shopee
PREFIX: "BR" → type: 'shopee' → beep_a

// Mercado Livre
PREFIXES: "20000", "46", "45" → type: 'mercado_livre' → beep_b

// Avulso
PREFIXES: "LM", "14" → type: 'avulso' → beep_c

> **Nota:** a função `normalizeCode` agora utiliza regex ancorados no início da string. Isso evita que segmentos internos (por exemplo, "45" dentro de "LM459876") sejam extraídos e resultem em classificação errônea como Mercado Livre.

// Desconhecido
Qualquer outro código → type: 'unknown' → beep_error
```

### Adicionar Novos Marketplaces

Edite `utils/scannerIdentification.ts`:

```typescript
const PREFIX_MAPPINGS: PrefixMapping[] = [
  // ... existing mappings ...
  {
    prefixes: ['NOVO_PREFIXO'],
    type: 'novo_marketplace',
    audioKey: 'beep_d',
  },
];
```

Nenhuma outra alteração é necessária - o sistema é escalável.

---

## 🔊 Sistema de Áudio

### Características

- **Zero Sobreposição**: Nunca toca dois sons simultaneamente
- **Debounce Inteligente**: Mínimo 400ms entre bipes
- **Fila de Áudio**: Processa fila se múltiplos eventos ocorrem
- **Sem Repetição**: Mesmo som não se repete em gap mínimo

### Como Usar

```typescript
import { getScannerAudioService, ScannerAudioType } from '@/utils/scannerAudio';

const audioService = getScannerAudioService();

// Toca áudio
await audioService.playAudio(ScannerAudioType.BEEP_A);

// Força reprodução (para erros críticos)
await audioService.playAudio(ScannerAudioType.BEEP_ERROR, forcePlay: true);

// Limpa fila
audioService.clearQueue();

// Reset
audioService.reset();
```

---

## 📊 Controle de Limite

### Comportamento

O scanner recebe configuração de limite:

```typescript
const config = {
  maxAllowedScans: {
    shopee: 50,
    mercado_livre: 30,
    avulso: 20,
  },
};
```

**Quando limite é atingido:**

- ❌ Não bipa novamente
- ❌ Não processa novas leituras
- ❌ Não identifica novos códigos
- ❌ Não incrementa contador
- 🔒 Bloqueio absoluto até reset manual

### Verificar Estado

```typescript
const controller = new IndustrialScannerController(config);

// Verificar se limite foi atingido
controller.isLimitReached();

// Verificar estado
controller.getState(); // ScannerState.ACTIVE | LIMIT_REACHED | PAUSED

// Obter estatísticas
const stats = controller.getStats();
console.log(stats.counts);      // Contagem atual
console.log(stats.progress);    // Progresso por tipo
console.log(stats.limitReached); // Quais tipos atingiram limite
```

---

## 🛡️ Prevenção de Erros

### Race Conditions

✅ **Lock de Processamento**: Flag `processingLock` previne processamento simultâneo

```typescript
// Internamente gerenciado
private processingLock: boolean = false;

// Se já está processando, rejeita
if (this.processingLock) {
  return { success: false, reason: 'rate_limited' };
}
```

### Duplicação

✅ **Detecção Temporal**: Mesmo código em menos de 2 segundos = duplicata

```typescript
private _isDuplicate(normalizedCode: string): boolean {
  const lastScan = this.internalState.lastValidScan;
  if (!lastScan) return false;
  
  const timeSinceLastScan = Date.now() - lastScan.timestamp;
  return (
    lastScan.code === normalizedCode &&
    timeSinceLastScan < 2000
  );
}
```

### Múltiplos Bipes

✅ **Gap Mínimo**: Nunca mais de um beep a cada 400ms

```typescript
// Em ScannerAudioService
if (now - this.lastAudioTime < config.minGapMs) {
  this.audioQueue.push(audioType); // Enfileira
  return;
}
```

---

## 🚀 Como Usar

### 1. Com Hook (Recomendado)

```typescript
import { useIndustrialScanner } from '@/utils/useIndustrialScanner';
import { IndustrialScannerController } from '@/utils/scannerController';

function MyComponent() {
  const scanner = useIndustrialScanner({
    maxAllowedScans: {
      shopee: 50,
      mercado_livre: 30,
      avulso: 20,
    },
    onStateChange: (state) => {
      console.log('Scanner state:', state);
    },
    onStatsUpdate: (stats) => {
      console.log('Stats:', stats);
    },
  });

  const handleScan = async (code: string) => {
    const result = await scanner.processScan(code);
    
    if (result.success) {
      console.log(`Escaneado: ${result.code} (${result.type})`);
    } else {
      console.log(`Erro: ${result.reason}`);
    }
  };

  return (
    <View>
      <Text>Contagens: {JSON.stringify(scanner.counts)}</Text>
      <Text>Estado: {scanner.state}</Text>
      <Text>Limite atingido: {scanner.isLimitReached}</Text>
      
      <TouchableOpacity onPress={() => scanner.reset()}>
        <Text>Reset Scanner</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### 2. Com Controller Direto

```typescript
import { IndustrialScannerController } from '@/utils/scannerController';

const controller = new IndustrialScannerController({
  maxAllowedScans: {
    shopee: 50,
    mercado_livre: 30,
    avulso: 20,
  },
});

// Processar scan
const result = await controller.processScan('BR123456789');

if (result.success) {
  console.log('Tipo:', result.type);
  console.log('Código:', result.code);
}

// Reset
controller.reset();
```

### 3. Componente Pronto

```typescript
import IndustrialScannerView from '@/components/IndustrialScannerView';

<IndustrialScannerView
  maxScans={{ shopee: 50, mercado_livre: 30, avulso: 20 }}
  onScanned={(code, type) => console.log(`${code} - ${type}`)}
  onLimitReached={(types) => console.log(`Limite em: ${types}`)}
  onEndSession={() => navigation.goBack()}
/>
```

---

## 🔁 Reset

### Comportamento

```typescript
controller.reset();

// Zera:
// - Contador por tipo
// - Última leitura
// - Estado → ACTIVE
// - Áudio (limpa fila)

// Preserva:
// - Configuração de limite
// - Não reseta automaticamente
```

---

## 📈 ScanResult

```typescript
interface ScanResult {
  success: boolean;
  code: string;
  type?: PackageType;           // 'shopee' | 'mercado_livre' | 'avulso' | 'unknown'
  isDuplicate?: boolean;
  reason?: 'limit_reached' | 'duplicate' | 'invalid' | 'rate_limited';
  timestamp: number;
}
```

---

## 🧪 Exemplo Completo

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useIndustrialScanner } from '@/utils/useIndustrialScanner';

export function ScannerScreen() {
  const [scans, setScans] = useState<any[]>([]);
  
  const scanner = useIndustrialScanner({
    maxAllowedScans: {
      shopee: 10,
      mercado_livre: 5,
      avulso: 3,
    },
  });

  const handleScan = async (code: string) => {
    const result = await scanner.processScan(code);
    setScans(prev => [...prev, result]);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Camera/Input aqui */}
      
      {/* Status */}
      <Text>Estado: {scanner.state}</Text>
      <Text>Shopee: {scanner.counts.shopee}/10</Text>
      <Text>Mercado Livre: {scanner.counts.mercado_livre}/5</Text>
      <Text>Avulso: {scanner.counts.avulso}/3</Text>
      
      {scanner.isLimitReached && (
        <Text style={{ color: 'red' }}>LIMITE ATINGIDO!</Text>
      )}

      {/* Reset Button */}
      <TouchableOpacity 
        onPress={() => {
          scanner.reset();
          setScans([]);
        }}
      >
        <Text>🔄 Novo Lote</Text>
      </TouchableOpacity>

      {/* Histórico */}
      {scans.map((s, i) => (
        <Text key={i}>
          {s.code} - {s.type} {s.success ? '✓' : '✗'}
        </Text>
      ))}
    </View>
  );
}
```

---

## 🎯 Garantias

✅ **Determinístico**: Sempre retorna o mesmo resultado para o mesmo input
✅ **Seguro**: Previne race conditions e duplicação
✅ **Escalável**: Adicione novos prefixos sem alterar lógica
✅ **Modular**: Cada responsabilidade em seu próprio módulo
✅ **Industrial**: Imune a ultrapassar limite, simula scanner físico profissional

---

## 📝 Notas

- O sistema nunca reseta automaticamente
- Sempre use `scanner.reset()` explicitamente para novo lote
- O debounce é de 400ms por padrão (configurável)
- Sons são gerenciados automaticamente por tipo
- Haptics funcionam apenas em dispositivos reais (não web)
- Última leitura é preservada para display na UI

---

## 🔧 Troubleshooting

**Q: Som não está tocando**
A: Verifique se `preloadSounds()` foi chamado. Sons são carregados assincronamente.

**Q: Duplicação não é detectada**
A: A detecção usa um gap de 2 segundos. Ajuste em `_isDuplicate()` se necessário.

**Q: Limite não está sendo respeitado**
A: Certifique-se de que o resultado de `processScan()` foi verificado para `success: true`.

**Q: Race conditions ocorrendo**
A: Use sempre o hook `useIndustrialScanner` ou aguarde a Promise do `processScan()`.

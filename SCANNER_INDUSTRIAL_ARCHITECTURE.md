# Scanner Industrial - Arquitetura e Diagramas

## 🏗 Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                     React Component (UI)                        │
│         IndustrialScannerView / useIndustrialScanner           │
│  - Display câmera                                               │
│  - Entrada manual                                               │
│  - Progresso de limite                                          │
│  - Status do scanner                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           IndustrialScannerController (Core)                    │
│                                                                 │
│  - Orquestra todo o fluxo de processamento                      │
│  - Mantém estado determinístico                                 │
│  - Previne race conditions com lock                             │
│  - Gerencia duplicação temporal                                 │
│  - Coordena áudio, limite e identificação                       │
└────┬──────────────┬──────────────────┬─────────────────────────┘
     │              │                  │
     ▼              ▼                  ▼
┌───────────┐  ┌──────────────┐  ┌──────────────────┐
│Identificação
│  de Pacote │  │Controle de   │  │Serviço de Áudio  │
│            │  │Limite        │  │                  │
│ - normalize │  │              │  │ - Debounce       │
│ - validate │  │ - tryIncrement│  │ - Fila de áudio  │
│ - identify │  │ - hasLimited │  │ - Sem sobreposição
│ - prefix   │  │ - getProgress│  │ - resetável      │
└───────────┘  └──────────────┘  └──────────────────┘
     │              │                  │
     └──────────────┴──────────────────┘
              │
              ▼
    ┌─────────────────┐
    │  playBeep()     │
    │  playError()    │
    │ (sound.ts)      │
    └─────────────────┘
```

## 📊 Fluxo de Processamento Detalhado

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. ENTRADA: scannerController.processScan(rawCode)                 │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
                           ▼
          ┌───────────────────────────────────┐
          │ 2. ADQUIRIR LOCK DE PROCESSAMENTO │
          │    if (processingLock) return     │
          │    processingLock = true          │
          └───────────────┬───────────────────┘
                          │
                          ▼
         ┌───────────────────────────────────┐
         │ 3. NORMALIZAR CÓDIGO              │
         │    normalizeCode(rawCode)         │
         │    - Maiúsculas                   │
         │    - Remove espaços               │
         │    - Remove caracteres especiais  │
         └───────────┬───────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────┐
        │ 4. VALIDAR CÓDIGO                │
        │    validateCode(normalized)      │
        │    if (!valid)                   │
        │      playError()                 │
        │      return FAILED               │
        └──────────┬───────────────────────┘
                   │
                   ▼
      ┌─────────────────────────────────┐
      │ 5. INCREMENTAR CONTADOR TOTAL   │
      │    stats.totalScans++           │
      └────────┬────────────────────────┘
               │
               ▼
    ┌───────────────────────────────────┐
    │ 6. VERIFICAR DUPLICAÇÃO           │
    │    if (isDuplicate())             │
    │      stats.duplicates++           │
    │      playError()                  │
    │      return DUPLICATED            │
    └───────┬──────────────────────────┘
            │
            ▼
  ┌─────────────────────────────────────┐
  │ 7. IDENTIFICAR TIPO DE PACOTE       │
  │    identifyPackage(code)            │
  │    type = 'shopee|mercado|avulso'   │
  │    audioType = mapToAudio(type)     │
  └────────┬────────────────────────────┘
           │
           ▼
  ┌─────────────────────────────────────┐
  │ 8. VERIFICAR ESTADO DO SCANNER      │
  │    if (state == LIMIT_REACHED)      │
  │      playError()                    │
  │      return LIMIT_REACHED           │
  └────────┬────────────────────────────┘
           │
           ▼
  ┌─────────────────────────────────────┐
  │ 9. TENTAR INCREMENTAR LIMITE        │
  │    limitController.tryIncrement()   │
  │    if (!canIncrement)               │
  │      if (allLimitReached)           │
  │        state = LIMIT_REACHED        │
  │      playError()                    │
  │      return LIMIT_REACHED           │
  └────────┬────────────────────────────┘
           │
           ▼
  ┌──────────────────────────────────────┐
  │ 10. ATUALIZAR ESTADO (SUCESSO)       │
  │     stats.validScans++               │
  │     scanCounts[type]++               │
  │     lastValidScan = { code, type }   │
  └────────┬─────────────────────────────┘
           │
           ▼
  ┌──────────────────────────────────────┐
  │ 11. TOCAR ÁUDIO DO TIPO              │
  │     audioService.playAudio(audioType)│
  │     - Respeita debounce (400ms)      │
  │     - Previne sobreposição           │
  │     - Enfileira se necessário        │
  └────────┬─────────────────────────────┘
           │
           ▼
  ┌──────────────────────────────────────┐
  │ 12. HAPTICS (feedback tátil)         │
  │     Haptics.notificationAsync()      │
  └────────┬─────────────────────────────┘
           │
           ▼
  ┌──────────────────────────────────────┐
  │ 13. CALLBACK DE ESTATÍSTICAS         │
  │     onStatsUpdate(stats)             │
  └────────┬─────────────────────────────┘
           │
           ▼
  ┌──────────────────────────────────────┐
  │ 14. RETORNAR RESULTADO               │
  │     ScanResult {                     │
  │       success: true,                 │
  │       code: normalizedCode,          │
  │       type: packageType,             │
  │       isDuplicate: false,            │
  │       timestamp: Date.now()          │
  │     }                                │
  └────────┬─────────────────────────────┘
           │
           ▼
  ┌──────────────────────────────────────┐
  │ 15. LIBERAR LOCK (após debounce)     │
  │     setTimeout(() => {               │
  │       processingLock = false         │
  │     }, 400ms)                        │
  └──────────────────────────────────────┘
```

## 🔄 Ciclo de Vida do Scanner

```
┌──────────────────┐
│  INICIALIZAÇÃO   │
│  new Controller  │
│  state = ACTIVE  │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│  OPERAÇÃO NORMAL             │
│  while (state == ACTIVE) {   │
│    processScan(code)         │
│    if (result.success) {     │
│      update UI               │
│    }                         │
│  }                           │
└────────┬─────────────────────┘
         │
    ┌────┴────┐
    │          │
    ▼          ▼
┌────────┐  ┌─────────────────┐
│LIMITE  │  │PAUSA (OPCIONAL) │
│ATINGIDO│  │controller.pause │
│        │  │state = PAUSED   │
└────┬───┘  └────────┬────────┘
     │               │
     │         ┌─────┴─────┐
     │         │           │
     │         ▼           ▼
     │    ┌──────────┐  ┌──────────┐
     │    │RETOMAR  │  │NOVA SESSÃO
     │    │resume() │  │reset()    │
     │    └──────────┘  └──────────┘
     │         │           │
     └─────────┼───────────┘
               │
               ▼
        ┌────────────────┐
        │RESET / ENCERRAR│
        │state = ACTIVE  │
        │ou TERMINAR     │
        └────────────────┘
```

## 🎯 Estados Possíveis

```
ScannerState.ACTIVE
├─ Aceitando novas leituras
├─ Tocando áudio
├─ Incrementando contadores
└─ Detectando duplicação

ScannerState.LIMIT_REACHED
├─ Não aceita mais leituras
├─ Não toca áudio para novos códigos
├─ Não incrementa contadores
├─ Retorna erro para qualquer entrada
└─ Permanece até reset() explícito

ScannerState.PAUSED
├─ Suspende processamento
├─ Preserva estado atual
├─ Pode retomar com resume()
└─ Pode resetar se necessário
```

## 🔐 Mecanismo de Lock (Race Condition Prevention)

```
┌──────────────┐
│ processingLock
│ = false      │
└───────┬──────┘
        │
        ▼
    CODE A ──┐
    CODE B ──┤──→ [Checker]
    CODE C ──┘
        │      │
        │  Found: lock=false
        │
        ├─→ [Lock]
        │   processingLock = true
        │
        ├─→ [Process CODE A]
        │   ⏱️ 400ms
        │
        ├─→ [Unlock after 400ms]
        │   processingLock = false
        │
        └─→ CODE B pode processar agora

    Resultado: SEQUENCIAL, SEM RACE CONDITIONS
```

## 📈 Detecção de Duplicação

```
┌─────────────────────────────────┐
│ Lê código: "BR123456"           │
│ Timestamp T0                    │
└────────────┬────────────────────┘
             │
             ▼
    ┌──────────────────────┐
    │ Valida e processa    │
    │ lastValidScan = {    │
    │   code: "BR123456",  │
    │   timestamp: T0      │
    │ }                    │
    └────────┬─────────────┘
             │
        ┌────┴───────────────────────────────┐
        │                                    │
        ▼                                    ▼
   [Espera 500ms]                    [Espera 1500ms]
        │                                    │
        ▼                                    ▼
   Lê "BR123456"                      Lê "BR123456"
   T0 + 500ms                         T0 + 1500ms
        │                                    │
        ▼                                    ▼
   isDuplicate?                       isDuplicate?
   Δt = 500ms < 2000                  Δt = 1500ms < 2000
   ✓ É DUPLICATA                      ✓ É DUPLICATA
   REJEITADO                          REJEITADO

        [Espera 2100ms]
             │
             ▼
        Lê "BR123456"
        T0 + 2100ms
             │
             ▼
        isDuplicate?
        Δt = 2100ms ≥ 2000
        ✗ NÃO é duplicata
        ACEITO
```

## 🔊 Fila de Áudio e Debounce

```
┌────────────────┐
│ Event 1: Beep A│
│ T: 0ms         │
└────────┬───────┘
         │
         ▼
    ┌─────────────┐
    │ State: IDLE │
    │ PlayAudio A │
    │ Duration: 150ms
    │ Next gap: 400ms
    └────┬────────┘
         │
         │  ⏱️ 50ms
         │
    Event 2: Beep B
    T: 50ms
         │
         ▼
    ┌──────────────────┐
    │ State: PLAYING   │
    │ audioQueue += B  │
    └─────────┬────────┘
              │
              │  ⏱️ 100ms
              │
         Event 3: Beep A
         T: 150ms
              │
              ▼
         ┌────────────────┐
         │ State: IDLE    │
         │ lastTime = 150 │
         │ lastType = A   │
         └────┬───────────┘
              │
              │ Processa fila [B]
              │ Mas B = A (mesmo tipo)
              │ Gap = 0ms < 400ms
              │
              ▼
         Enfileira novamente
              │
              │  ⏱️ 300ms
              │  (total 450ms)
              │
              ▼
         ┌─────────────────┐
         │ Gap = 450ms     │
         │ ≥ 400ms         │
         │ PlayAudio B     │
         └─────────────────┘
```

## 📊 Gestão de Limite por Tipo

```
        SHOPEE                MERCADO LIVRE            AVULSO
        (Limite: 50)          (Limite: 30)             (Limite: 20)

        [████████░]           [██████░░░░░]           [█████░░░░░░░]
        40/50 (80%)           15/30 (50%)              8/20 (40%)

        ✓ Espaço disponível   ✓ Espaço disponível    ✓ Espaço disponível

        Novo scan: BR987654
              │
              ▼
        limiter.tryIncrement('shopee')
              │
        ┌─────┴──────┐
        │            │
    [ANTES]      [DEPOIS]
    count: 40    count: 41
    limit: 50    limit: 50
    return: true return: true

    [████████░]           [█████░░░░░░░]
    41/50 (82%)           41/50 (82%)
```

## 🎯 Máquina de Estados Completa

```
                        ┌──────────────────┐
                        │ INITIALIZATION   │
                        │ state = ACTIVE   │
                        └────────┬─────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
            ┌──────────────┐          ┌──────────────┐
            │ ACTIVE       │◄────────►│ PAUSED       │
            │              │ pause()  │              │
            │ processScan()│ resume() │ Preserva     │
            │ acceptAudio()│          │ estado       │
            │ countIncr()  │          │              │
            └──────┬───────┘          └──────────────┘
                   │                         │
     ┌─────────────┴──────────────────────────┘
     │
     │ [Todos tipos atingem limite]
     │
     ▼
   ┌──────────────────┐
   │ LIMIT_REACHED    │
   │                  │
   │ REJEITA ENTRADA  │
   │ SEM ÁUDIO        │
   │ SEM CONTADOR     │
   │ BLOQUEIO TOTAL   │
   │                  │
   │ APENAS reset()   │
   │ volta a ACTIVE   │
   └──────────────────┘
```

---

## 📌 Resumo de Garantias

| Garantia                    | Implementação                                     |
| --------------------------- | ------------------------------------------------- |
| Sem sobreposição de áudio   | `audioService.state` + fila                       |
| Sem duplicação              | `lastValidScan` + gap temporal 2s                 |
| Sem race condition          | `processingLock` flag                             |
| Sem múltiplos bipes rápidos | Debounce 400ms + fila                             |
| Bloqueio absoluto           | Flag `limitReachedTypes` + estado `LIMIT_REACHED` |
| Reset seguro                | Método explícito, nunca automático                |
| Escalável                   | Mapeamento centralizado de prefixos               |
| Determinístico              | Mesma entrada = mesmo output sempre               |

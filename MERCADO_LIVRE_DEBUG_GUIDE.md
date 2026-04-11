# 🞤 Guia de Diagnóstico - Mercado Livre Não Está Bipando

## 📋 Fluxo de Leitura Completo

```
Código do Scanner
    ↓
[normalizeCode] - Remove espaços, maiúsculas, ID prefixo
    ↓
[identifyPackage] - Bate contra PREFIX_PATTERNS
    ↓
Resultado: type = "mercado_livre"
    ↓
[getAudioTypeForPackage] - Converte para ScannerAudioType.BEEP_B
    ↓
[audioService.playAudio(BEEP_B)] - Toca áudio
    ↓
✅ SOM EMITIDO OU ❌ ERRO
```

---

## 🔍 Como Diagnosticar o Problema

### 1. **Abra o Console do App**

Pode ser em:

- Chrome DevTools (se usando web)
- Logcat (Android)
- Console do Xcode (iOS)
- Expo Go Console

### 2. **Escaneie um Código Mercado Livre**

Exemplos:

- `20000987654321`
- `46987654321`
- `ID20000987654321`
- `ID46987654321`

### 3. **Busque por Estes Logs (em ordem)**

#### PASSO 1: Normalização

```
[ScannerView] 📥 ENTRADA: "20000987654321"
[normalizeCode] STEP1: "20000987654321" → "20000987654321" → "20000987654321"
[normalizeCode] ✅ FINAL: "20000987654321"
```

**Se vir:**

- ✅ = Normalização funcionando
- ❌ = Código não chegou ou saiu vazio

#### PASSO 2: Identificação

```
[identifyPackage] ✅ MATCH ENCONTRADO: "20000987654321" matches prefix "20000" (minLength=5) => type="mercado_livre"
```

**Se vir:**

- ✅ = Identificação funcionando
- ❌ = Nenhum prefixo bateu (VER ABAIXO)

#### PASSO 3: Tipo Detectado

```
[ScannerView] 🎯 IDENTIFICADO: type="mercado_livre", matched=true, confidence=high
```

**Se vir:**

- `type="mercado_livre"` = ✅ CORRETO
- `type="avulso"` ou `type="unknown"` = ❌ PROBLEMA NA IDENTIFICAÇÃO

#### PASSO 4: Áudio

```
[ScannerView] ✅ ACEITO: type="mercado_livre" -> audioType="beep_b" -> tocando áudio
[ScannerAudioService] 🔊 playAudio requested: type="beep_b"
[ScannerAudioService] ▶️ PLAYING: "beep_b"
[ScannerAudio] ▶️ BEEP_B (Mercado Livre)
[Sound] ▶ 🔔 Beep B (Mercado Livre)
```

**Se vir:**

- ✅ = Som foi enviado para reprodução
- ❌ = Som não foi chamado

---

## ❌ Cenários de Falha e Soluções

### **Cenário 1: "NO PREFIX MATCH"**

```
[identifyPackage] ❌ NO PREFIX MATCH: "20000987654321" against all 8 patterns
```

**Problema:** O código não bate com nenhum padrão

**Soluções:**

1. Verifique se a normalização está OK
2. Verifique os prefixos em `PREFIX_PATTERNS` em `scannerIdentification.ts`
3. Certifique-se que `minLength` é suficiente

### **Cenário 2: "type=avulso" em vez de "mercado_livre"**

```
[ScannerView] 🎯 IDENTIFICADO: type="avulso", matched=true, confidence=medium
```

**Problema:** Caiu no fallback de avulso

**Causa:**

- Código passou em validação mas NÃO bateu com prefixo
- Código começa com letra → avulso
- Código começa com dígito → fallback para procurar `20000|46|45`

**Solução:** Verifique se o prefixo está correto em PREFIX_PATTERNS

### **Cenário 3: "❌ REJEITADO PELO onScan"**

```
[ScannerView] ❌ REJEITADO: type="mercado_livre" -> onScan retornou false
```

**Problema:** Identificação funcionou, mas onScan rejeitou

**Causas possíveis:**

1. Duplicação (código já foi escaneado)
2. Limite atingido para Mercado Livre
3. Pacote inválido

**Solução:** Verifique os logs anteriores a este

### **Cenário 4: "Intervalo mínimo não atingido"**

```
[Sound] Beep B: intervalo mínimo não atingido. Aguardando 80ms
```

**Problema:** Você está digitando/escaneando muito rápido

**Solução:** Aguarde ~100ms entre scans

---

## 🧪 Teste Rápido de Integração

Cole esta linha no console do app:

```javascript
console.log(
  JSON.stringify({
    normalizeTest: normalizeCode("20000987654321"),
    identifyTest: identifyPackage("20000987654321"),
  }),
);
```

Você deverá ver:

```json
{
  "normalizeTest": "20000987654321",
  "identifyTest": {
    "type": "mercado_livre",
    "matched": true,
    "confidence": "high"
  }
}
```

---

## 📊 Checklist de Diagnóstico

- [ ] Arquivo `scannerIdentification.ts` tem `{ prefix: '20000', ... }`?
- [ ] Arquivo `scannerIdentification.ts` tem `{ prefix: '46', ... }`?
- [ ] Arquivo `scannerIdentification.ts` tem `{ prefix: '45', ... }`?
- [ ] Arquivo `sound.ts` está carregando áudio?
- [ ] Console mostra logs de identificação?
- [ ] Console mostra logs de áudio?
- [ ] Som "beep.mp3" existe em `assets/sounds/`?
- [ ] Dispositivo está com som ligado?

---

## 💡 Dicas Profissionais

1. **Filtre logs por tag:**

   ```
   [ScannerView]
   [normalizeCode]
   [identifyPackage]
   [ScannerAudioService]
   [ScannerAudio]
   [Sound]
   ```

2. **Use breakpoints no console:**

   ```javascript
   // Adicione ao console.ts para debug
   window.__scannerDebug = { normalizeCode, identifyPackage };
   ```

3. **Teste manualmente:**
   ```javascript
   // No console
   identifyPackage("20000987654321");
   identifyPackage("46987654321");
   identifyPackage("45987654321");
   ```

---

## 📞 Próximas Ações

Se mesmo após este guia ainda não funcionar:

1. **Cole os logs completos** do console
2. **Especifique qual Mercado Livre:**
   - `20000...`?
   - `46...`?
   - `45...`?
   - `ID46...`?
3. **Mencione qual tipo está sendo identificado:**
   - avulso?
   - unknown?
   - mercado_livre mas sem som?

---

_Última atualização: 06/03/2026_
_Sistema: Mercado Livre Scanner v3.0 - Profissional_

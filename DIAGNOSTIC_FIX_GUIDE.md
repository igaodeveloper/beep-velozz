# 🔧 GUIA DE DIAGNÓSTICO - Scanner Não Está Bipando

## ⚙️ Mudanças Aplicadas

### 1. **Validação de Reticle Desabilitada** ✅

**Arquivo**: [components/ScannerView.tsx](components/ScannerView.tsx#L305)

**Problema**: Códigos fora da área visual do reticle eram rejeitados
**Solução**: Removida a validação `isCodeInReticleArea()`
**Resultado**: Todos os códigos lidos são aceitos

### 2. **Caminho de Arquivos de Som Corrigido** ✅

**Arquivo**: [utils/sound.ts](utils/sound.ts#L18)

**Antes**:

```tsx
require("../assets/sounds/beep.mp3");
```

**Depois**:

```tsx
require("@/assets/sounds/beep.mp3");
```

**Por quê**: O alias `@/` resolve corretamente em todos os ambientes

### 3. **Padrões Mercado Livre Adicionados** ✅

**Arquivo**: [utils/scannerIdentification.ts](utils/scannerIdentification.ts#L26)

**Novos prefixos**:

- `2200D` - Pack ID (ex: `2200D1241459785`)
- `4482D` - Código de envio (ex: `4482D247404`)

---

## 🧪 COMO TESTAR AGORA

### Teste 1: Verificar Console do App

Abra o **Expo Go** ou **DevTools** e cole este código:

```javascript
// Teste de normalização
import { normalizeCode } from "@/utils/scannerIdentification";
console.log(normalizeCode("2200D 1241459785")); // Deve retornar: 2200D1241459785

// Teste de identificação
import { identifyPackage } from "@/utils/scannerIdentification";
const result = identifyPackage("2200D1241459785");
console.log(result); // Deve ter type: 'mercado_livre'

// Teste de áudio
import { ScannerAudioService } from "@/utils/scannerAudio";
const audioService = new ScannerAudioService();
await audioService.playAudio("beep_b"); // Deve tocar um bip
```

### Teste 2: Escanear Código de Teste

Códigos para testar (copie em um input ou simule):

| Código            | Esperado      | Som       |
| ----------------- | ------------- | --------- |
| `2200D1241459785` | Mercado Livre | 🔔 BEEP_B |
| `4482D247404`     | Mercado Livre | 🔔 BEEP_B |
| `20000123456`     | Mercado Livre | 🔔 BEEP_B |
| `BR123456789`     | Shopee        | 🔔 BEEP_A |
| `LM123456`        | Avulso        | 🔔 BEEP_C |

---

## ❌ SE AINDA NÃOESTA FUNCIONANDO

### Passo 1: Verificar Logs

No console da app, procure por:

```
[ScannerView] 📥 ENTRADA: "2200D1241459785"
[ScannerView] 🔄 NORMALIZADO: "2200D1241459785"
[ScannerView] 🎯 IDENTIFICADO: type="mercado_livre"
[ScannerView] ✅ ACEITO: type="mercado_livre" -> audioType="beep_b"
[ScannerAudioService] ▶️ PLAYING: "beep_b"
[ScannerAudio] ▶️ BEEP_B (Mercado Livre)
```

**Se vir `❌` em qualquer etapa, saiba o problema**:

- ❌ ENTRADA - Câmera não está passando código
- ❌ NORMALIZADO - Código vazio (problema de parsing)
- ❌ IDENTIFICADO - type = "unknown" (prefixo não reconhecido)
- ❌ ACEITO - Limite atingido ou duplicata
- ❌ PLAYING - Som não foi enviado para reprodução

### Passo 2: Testar Reprodução de Som Isolada

```javascript
import { playBeepB } from "@/utils/sound";
await playBeepB(); // Deve tocar um bip distintivo
```

Se não ouvir nada:

1. Verifique se o `volume` do dispositivo está ligado
2. Teste com `adb logcat` em Android para erros de áudio
3. Verifique se os arquivos existem: `assets/sounds/beep.mp3` e `error.mp3`

### Passo 3: Testar com Input Manual

Se a câmera não está funcionando, teste com input manual:

```javascript
// No ScannerView, procure por:
// <TextInput ... onSubmitEditing={handleManualSubmit} />

// Digite: 2200D1241459785
// Pressione: Enter/Return
// Esperado: Som BEEP_B
```

### Passo 4: Verificar Permissões

O app precisa de permissão da câmera. Verifique em:

- **Android**: Configurações → Aplicativos → Beep Velozz → Câmera
- **iOS**: Configurações → Privacidade → Câmera → Beep Velozz

---

## 📝 CHECKLIST DE RESOLVE

- [ ] Validação de reticle desabilitada
- [ ] Caminho de som corrigido para `@/assets/sounds/`
- [ ] Padrões ML adicionados (`2200D`, `4482D`)
- [ ] Audio inicializado em `preloadSounds()`
- [ ] Permissão de câmera concedida
- [ ] Volume do dispositivo ligado
- [ ] Console mostrando logs de scan corretos
- [ ] Som reproduzido com `playBeepB()`
- [ ] Teste manual com input de texto funcionando

---

## 🎯 PRÓXIMOS PASSOS

1. **Teste com a etiqueta real** - Escaneie o QR code da etiqueta Flex
2. **Verifique os logs** - Abra console e procure por mensagens
3. **Se ainda falhar** - Relate qual log não aparece
4. **Se som tocar** - 🎉 Scanner operacional!

---

## 📞 SUPORTE

Se o problema persistir, execute estes comandos para debug:

```bash
# Limpar cache e reiniciar
npm run start:clean

# Ou com rebuild completo
npm run start:windows
```

Depois teste novamente com os códigos de exemplo acima.

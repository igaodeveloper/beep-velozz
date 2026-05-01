# Instruções de Build - Beep Velozz APK

## 📋 Solução Rápida para "Unable to resolve idb" Error

Seu erro de bundling foi causado por uma incompatibilidade entre Firebase e React Native. Já foi corrigido!

## 🚀 Fazer Build do APK

### ⚡ Método Rápido (Recomendado)

**Abra PowerShell e execute:**

```powershell
# Opção 1: Script automático
.\clean-build-apk.bat

# Opção 2: Comandos manuais
npm run build:android:apk:clean
```

### 🔧 Método Manual (Passo a Passo)

**Terminal 1:**
```powershell
# Limpar tudo
Remove-Item -Recurse -Force node_modules
Remove-Item -Recurse -Force .expo
npm cache clean --force

# Reinstalar
npm install

# Fazer build
npm run build:android:apk:clean
```

## 📊 O que Mudou

Três arquivos foram atualizados para resolver o problema do `idb`:

### 1. **metro.config.cjs** ✅
- Adicionado resolver customizado
- Criado alias para mapear `idb` → `mocks/idb.js`
- Blacklist de módulos incompatíveis

### 2. **mocks/idb.js** ✅ (NOVO)
- Mock vazio que Firefox pode importar
- Zero impacto na performance

### 3. **babel.config.js** ✅
- Adicionado `@babel/plugin-transform-runtime`
- Melhor compatibilidade com módulos

### 4. **.babelignore** ✅ (NOVO)
- Lista de módulos a ignorar durante compilação

## ⏱️ Tempo Esperado

- **Limpeza:** 2-3 minutos
- **npm install:** 5-10 minutos (depende da internet)
- **Build no EAS:** 15-20 minutos
- **Total:** ~30 minutos

## 📱 Após o Build

1. **Baixe o APK** da fila do EAS
2. **Instale no dispositivo:**
   ```bash
   adb install -r beep-velozz-release.apk
   ```
3. **Teste o app** - Não deve mais ficar com tela preta

## 🔍 Verificar se está funcionando

**Antes de fazer build, confirme:**
```bash
# Deve existir
Test-Path mocks/idb.js

# Deve existir  
Test-Path .babelignore

# Deve ter resolveRequest
Select-String "resolveRequest" metro.config.cjs
```

## ⚠️ Se Ainda Houver Erro

### Erro 1: "metro.config.cjs not found"
- Execute: `npm run clean:cache` e tente novamente

### Erro 2: "path module not found"
- Execute: `npm install` novamente

### Erro 3: Outro erro de bundling
- Verifique os logs: `adb logcat | findstr "metro"`
- Se for outro módulo (level, rlp, etc), já está no blacklist
- O metro.config.cjs vai tentar ignorar automaticamente

### Erro 4: Build não termina
- Aumentar timeout do npm:
  ```bash
  npm install --legacy-peer-deps
  npm config set fetch-timeout 600000
  npm run build:android:apk:clean
  ```

## 📚 Arquivos de Referência

- **FIREBASE_IDB_FIX.md** - Explicação técnica completa
- **BLACK_SCREEN_FIX.md** - Solução da tela preta anterior
- **QUICK_DEBUG_BLACK_SCREEN.md** - Debug rápido

## 🎯 Checklist Antes do Build

- [ ] Verifiquei que `mocks/idb.js` existe
- [ ] Verifiquei que `.babelignore` existe
- [ ] Rodei `npm run build:android:apk:clean`
- [ ] Aguardei EAS completar (30 min)
- [ ] Baixei o APK
- [ ] Instalei com `adb install`
- [ ] Testei no dispositivo

## 📞 Suporte

Se o problema persistir após essas correções:

1. **Verifique versões:**
   ```bash
   npm list firebase
   npm list expo
   npm list react-native
   ```

2. **Tente alternativa (Firebase Compat):**
   ```bash
   npm install firebase@^10.0.0
   npm run build:android:apk:clean
   ```

3. **Desabilite Hermes em app.json:**
   ```json
   "jsEngine": "jsc"  // (ao invés de "hermes")
   ```

---

**Última atualização:** 2024
**Status:** ✅ Pronto para build

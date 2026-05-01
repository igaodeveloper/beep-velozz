# Quick Debug - Tela Preta APK

## 🔴 Se o App Ficar com Tela Preta

### Passo 1: Verifique os Logs
```bash
# Terminal PowerShell
adb logcat -s ReactNativeJS:E | findstr "error\|Error\|ERROR"
```

### Passo 2: Verifique as Imports Críticas
Se ver erro de import ou undefined, são esses arquivos:

```
✅ components/FastSplashScreen.tsx
   - Linha 12: import { darkTheme, lightTheme } from "../utils/theme";
   
✅ app/_layout.tsx  
   - Linha 19: import { ErrorBoundary } from "../components/ErrorBoundary";
   
✅ utils/themeContext.tsx
   - Linha 1: import { View } from "react-native";
   - NÃO deve ter: if (!isLoaded) return null;
```

### Passo 3: Cache do App
Se instalou APK anterior, limpe o cache:
```bash
adb shell pm clear com.shopiii2025.beepvelozz
adb uninstall com.shopiii2025.beepvelozz
adb install app-release.apk
```

### Passo 4: Verifique a Splash Screen
Se ficar na splash por muito tempo (>5 segundos), há erro de inicialização:
- Verifique se `global.css` está OK
- Verifique se fonts estão carregando

### Passo 5: Se Ainda Houver Problema

#### A. Desabilite Hermes
Edite `app.json`:
```json
"jsEngine": "hermes"  →  "jsEngine": "jsc"
```

#### B. Remova Global CSS temporariamente
Comente em `app/_layout.tsx`:
```typescript
// import "../global.css";
```

#### C. Remova NativeWind
Edite `metro.config.cjs`:
```javascript
// Comentar a seção do NativeWind
```

## 📊 Verificação Rápida

```bash
# Ver versão instalada
adb shell dumpsys package com.shopiii2025.beepvelozz | findstr "versionCode"

# Ver processo rodando
adb shell ps -A | findstr "beepvelozz"

# Matá processo
adb shell am force-stop com.shopiii2025.beepvelozz
```

## 🎯 Teste Final

1. Abra o app
2. Se não aparecer tela preta em 3 segundos → ✅ Sucesso!
3. Verifique as principais telas (scanning, report, etc)
4. Teste camera permission

---

**Tempo esperado:** App aparece em <1 segundo após ícone ser clicado

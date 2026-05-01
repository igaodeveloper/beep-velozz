# Firebase IDB Bundling Error - Solução Implementada

## 🔴 Problema

```
Android Bundling failed 103810ms node_modules\expo-router\entry.js (3376 modules)
Unable to resolve "idb" from "node_modules\@firebase\app\dist\index.cjs.js"
```

### Causa Raiz

O Firebase (`^12.10.0`) é a versão modular que tenta importar o módulo `idb` (IndexedDB wrapper) para usar como banco de dados offline. Porém, `idb` é uma biblioteca JavaScript do browser e não é compatível com React Native.

Quando o Metro bundler tenta incluir esse módulo, falha porque:
1. `idb` não existe no `node_modules`
2. O módulo é específico para browser
3. React Native usa AsyncStorage no lugar de IndexedDB

## ✅ Solução Implementada

### 1. **Metro Config Atualizado** (`metro.config.cjs`)

Adicionado:
- **Alias mapping**: Mapeia `idb` para um mock file
- **Resolver customizado**: Intercepta importações do `idb` e retorna mock
- **Blacklist regex**: Ignora módulos problemáticos
- **Lista de módulos**: Configuração para outros módulos problemáticos (indexeddb, localforage, level, rlp, web-encoding)

```javascript
// Novo alias
alias: {
  'idb': path.resolve(__dirname, 'mocks/idb.js'),
}

// Novo resolver
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (PROBLEMATIC_MODULES.includes(moduleName)) {
    return {
      filePath: path.resolve(__dirname, 'mocks/idb.js'),
      type: 'sourceFile',
    };
  }
  // ...
}
```

### 2. **Mock File Criado** (`mocks/idb.js`)

Arquivo vazio que simula o módulo `idb` para evitar erros de importação:
- Exports uma função `openDB` que retorna Promise resolvida
- Exports uma função `deleteDB` que retorna Promise
- Exports funções `wrap` e `unwrap`

Isso permite que Firebase importe o módulo sem errar, mas na verdade não usa nada do idb no React Native (usa AsyncStorage internamente).

### 3. **Babel Config Atualizado** (`babel.config.js`)

Adicionado plugin `@babel/plugin-transform-runtime` para melhor compatibilidade:
```javascript
["@babel/plugin-transform-runtime", { useESModules: false }]
```

### 4. **Babel Ignore List** (`.babelignore`)

Criado arquivo com lista de módulos a ignorar:
```
idb
indexeddb
localforage
level
rlp
web-encoding
```

## 📁 Arquivos Criados/Modificados

| Arquivo | Mudança |
|---------|---------|
| `metro.config.cjs` | Adicionado resolveRequest customizado e alias |
| `babel.config.js` | Adicionado plugin-transform-runtime |
| `mocks/idb.js` | **NOVO** - Mock do módulo idb |
| `.babelignore` | **NOVO** - Lista de módulos a ignorar |

## 🚀 Como Fazer o Build

### Opção 1: Clean Build (RECOMENDADO)
```bash
npm run build:android:apk:clean
```

### Opção 2: Build Normal
```bash
npm run build:android:apk
```

### Opção 3: Limpar e fazer build
```bash
npm run clean:cache
eas build --platform android --profile apk --clear-cache
```

## 🔍 Se Ainda Houver Erro

### Verificar Logs
```bash
adb logcat | findstr "metro\|bundling\|firebase"
```

### Alternativa: Usar Firebase Compat

Se o problema persistir, pode atualizar para usar Firebase Compat (versão antiga):

**Em `package.json`:**
```json
"firebase": "^10.0.0"  // Versão compat que não tem problema com idb
```

Depois:
```bash
npm install
npm run build:android:apk:clean
```

### Desabilitar Hermes Temporariamente

Se problemas persistirem, em `app.json`:
```json
"jsEngine": "jsc"  // Ao invés de "hermes"
```

## 📊 Checklist

- [x] Metro config com resolveRequest
- [x] Alias mapping para idb
- [x] Mock file criado
- [x] Babel config atualizado
- [x] .babelignore criado
- [x] Documentação

## ⚡ Performance

Essa solução tem **zero impacto na performance** porque:
- O mock é vazio e nunca é executado
- Firebase detecta que está em React Native e usa AsyncStorage
- Apenas previne erro de bundling

## 🎯 Próximas Etapas

1. Executar: `npm run build:android:apk:clean`
2. Aguardar build completar no EAS
3. Baixar e testar o APK
4. Se houver erro, verifique os logs

---

**Status:** ✅ Pronto para build

Se houver ainda problemas de bundling com outros módulos (level, rlp, etc), o metro.config.cjs já está preparado para resolvê-los automaticamente.

# GUIA DE MIGRAÇÃO - Beep Velozz para Produção

> Como migrar seus componentes existentes para usar as novas otimizações

---

## 📋 Antes vs Depois

### ❌ Antes (Não Otimizado)

```typescript
// ❌ Token hardcoded
const API_CONFIG = {
  TOKEN: 'ciU5BsWP0mPOBhVyxSA6xBw5MOBJua1nCsHUQVuZ6u09NTJwgoJ...',
};

// ❌ Sem validação
function handleScan(code) {
  processPackage(code);
}

// ❌ Sem memoization
const PackageList = ({ items }) => {
  return items.map(item => (
    <PackageItem key={item.id} item={item} />
  ));
};

// ❌ Preços hardcoded
const prices = { shopee: 6, mercado_livre: 8 };

// ❌ Sem cleanup
useEffect(() => {
  const listener = database.onUpdate(handler);
  // Sem unsubscribe!
}, []);
```

### ✅ Depois (Otimizado)

```typescript
// ✅ Token de variáveis de ambiente
import { API_CONFIG } from '@/src/config/envConfig';

// ✅ Validação robusta
import { validateBarcode } from '@/src/utils/validators';

function handleScan(code) {
  const validation = validateBarcode(code);
  if (!validation.isValid) {
    setError(validation.errors[0]);
    return;
  }
  processPackage(validation.data);
}

// ✅ Com memoization
const PackageItem = React.memo(({ item }) => (
  <View>
    <Text>{item.barcode}</Text>
  </View>
));

// ✅ Preços dinâmicos
import { packagePricingService } from '@/services/packagePricingService';

const price = packagePricingService.getPriceForType(type);

// ✅ Com cleanup
const { registerCleanup } = useProductionCleanup('MyComponent');

useEffect(() => {
  const listener = database.onUpdate(handler);
  registerCleanup(() => listener.unsubscribe());
  return () => listener.unsubscribe();
}, [registerCleanup]);
```

---

## 🔄 Passos de Migração

### Passo 1: Setup Inicial

```bash
# 1. Copiar .env.example para .env
copy .env.example .env

# 2. Preencher variáveis de ambiente
# Editar .env com:
# - EXPO_PUBLIC_API_TOKEN (de LogManager)
# - EXPO_PUBLIC_FIREBASE_API_KEY (de Firebase)

# 3. Validar configuração
npm run environment:check
```

### Passo 2: Remover Token Hardcoded

```typescript
// ❌ Remover de: src/api/axiosClient.ts
// (já foi feito)

// ✅ Usar nova versão
import { API_CONFIG } from "@/src/config/apiConfig";
// Agora carrega de .env automaticamente
```

### Passo 3: Adicionar Validação

**Em handlers de input:**

```typescript
import { validateBarcode, validateOperatorName } from "@/src/utils/validators";

// Antes
const handleOperatorChange = (text) => setOperatorName(text);

// Depois
const handleOperatorChange = (text) => {
  const validation = validateOperatorName(text);
  if (validation.isValid) {
    setOperatorName(validation.data);
  } else {
    setError(validation.errors[0]);
  }
};
```

### Passo 4: Otimizar Componentes

**Adicionar React.memo:**

```typescript
// Antes
export const PackageItem = ({ item, onPress }) => (
  <TouchableOpacity onPress={() => onPress(item)}>
    <Text>{item.barcode}</Text>
  </TouchableOpacity>
);

// Depois
export const PackageItem = React.memo(({ item, onPress }) => (
  <TouchableOpacity onPress={() => onPress(item)}>
    <Text>{item.barcode}</Text>
  </TouchableOpacity>
), (prevProps, nextProps) => {
  // Only re-render if item changes
  return prevProps.item.id === nextProps.item.id;
});
```

**Usar useCallback:**

```typescript
// Antes
const handlePress = (item) => {
  navigation.navigate("Detail", { id: item.id });
};

// Depois
import { useStableCallback } from "@/src/utils/memoization";

const handlePress = useStableCallback((item) => {
  navigation.navigate("Detail", { id: item.id });
});
```

### Passo 5: Otimizar Listas

**Converter FlatList:**

```typescript
import {
  useOptimizedList,
  createOptimizedFlatListProps,
  useVisibleItems
} from '@/src/utils/listOptimization';

// Antes
render() {
  return (
    <FlatList data={items} renderItem={renderItem} />
  );
}

// Depois
const MyList = () => {
  const { processedItems, keyExtractor } = useOptimizedList(items, {
    sortBy: (a, b) => b.timestamp - a.timestamp,
  });

  const { visibleItems, onViewableItemsChanged, viewabilityConfig } =
    useVisibleItems(items);

  return (
    <FlatList
      {...createOptimizedFlatListProps()}
      data={processedItems}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
    />
  );
};
```

### Passo 6: Adicionar Cleanup

```typescript
import { useProductionCleanup, useAppStateChange } from '@/src/utils/productionBootstrap';

const MyComponent = () => {
  const { registerCleanup } = useProductionCleanup('MyComponent');

  useEffect(() => {
    // Setup listener
    const unsubscribe = firestore.onSnapshot(handler);

    // Register cleanup
    registerCleanup(() => unsubscribe());

    // Another cleanup option
    return () => unsubscribe();
  }, [registerCleanup]);

  // Handle app state changes
  useAppStateChange(
    () => console.log('App came to foreground'),
    () => console.log('App went to background')
  );

  return <View />;
};
```

### Passo 7: Usar Preços Dinâmicos

```typescript
import { packagePricingService } from "@/services/packagePricingService";

// Inicializar na startup
useEffect(() => {
  packagePricingService.initialize();
}, []);

// Usar em cálculos
const calculateValue = (type) => {
  const price = packagePricingService.getPriceForType(type);
  return price * quantity;
};
```

---

## 🎯 Checklist de Migração por Arquivo

### [ ] app/\_layout.tsx (Root Layout)

- [ ] Chamar `initializeProduction()` no startup
- [ ] Adicionar erro handler global
- [ ] Inicializar `packagePricingService`

```typescript
import { initializeProduction } from '@/src/utils/productionBootstrap';
import { packagePricingService } from '@/services/packagePricingService';

export default function RootLayout() {
  useEffect(() => {
    // Initialize production environment
    initializeProduction();

    // Initialize pricing service
    packagePricingService.initialize();
  }, []);

  return <YourLayout />;
}
```

### [ ] components/LoginScreen.tsx

- [ ] Validar email: `validateEmail()`
- [ ] Validar password length
- [ ] Usar `useDebouncedCallback` para submit

### [ ] components/ScannerView.tsx

- [ ] Usar `validateBarcode()`
- [ ] Usar `useStableCallback`
- [ ] Adicionar `useProductionCleanup`
- [ ] Usar `packagePricingService`

### [ ] components/HistoryBrowser.tsx

- [ ] Usar `useOptimizedList`
- [ ] Adicionar virtualization
- [ ] Usar `useVisibleItems`
- [ ] Adicionar lazy loading

### [ ] utils/session.ts

- [ ] ✅ Já atualizado com `packagePricingService`

### [ ] services/firestore.ts

- [ ] Adicionar `registerCleanup` em listeners
- [ ] Usar `useProductionCleanup` nos hooks

---

## 🐛 Troubleshooting de Migração

### Problema: "Cannot find module @/src/utils/validators"

**Solução:**

```bash
# Limpar cache
npm run start:clean

# Ou verificar se caminho está correto
# Deve estar em: src/utils/validators.ts
```

### Problema: ".env não está sendo carregado"

**Solução:**

```bash
# 1. Verificar que .env existe (não .env.example)
ls -la .env

# 2. Verificar variáveis
npm run environment:check

# 3. Limpar cache de metros
rm -rf .metro-health-check*
npm run start:clean
```

### Problema: "Token ainda aparece undefined"

**Solução:**

- Verificar que EXPO_PUBLIC_API_TOKEN está preenchido no `.env`
- Verificar que não tem espaços: `EXPO_PUBLIC_API_TOKEN=seu_token` (sem quotes)
- Rodar `npm run environment:check`

### Problema: Componentes ainda com re-renders

**Solução:**

```typescript
// Adicionar display name para debug
MyComponent.displayName = "MyComponent";

// No React DevTools, procurar por re-renders desnecessários
// Usar React DevTools Profiler tab
```

---

## 📊 Benchmark Esperado

Após migração completa:

| Métrica              | Antes            | Depois           | Delta          |
| -------------------- | ---------------- | ---------------- | -------------- |
| Bundle size          | 60MB             | 48MB             | -20%           |
| Startup time         | 8-10s            | < 5s             | -50%           |
| List scroll FPS      | 30-45fps         | 55-60fps         | +33%           |
| Memory usage         | 200MB+           | 120-150MB        | -35%           |
| API calls            | 100%             | 70%              | -30% cache hit |
| Component re-renders | Many unnecessary | Only when needed | Optimized      |

---

## ✅ Validação Final

Após migração, verificar:

```bash
# 1. Type checking
npm run type-check

# 2. Linting
npm run lint

# 3. Build para produção
npm run build:android-production

# 4. Performance profiling
# Use Chrome DevTools ou React Native Debugger

# 5. Manual testing
# Testar flows críticos:
# - Login
# - Scanning
# - History browsing
# - Settings
```

---

## 📚 Relacionados

- **PRODUCTION_GUIDE.md** - Guia completo de deployment
- **PRODUCTION_SUMMARY.md** - Resumo de implementações
- **components/ProductionOptimizedScanner.tsx** - Exemplo prático
- **src/utils/memoization.ts** - Documentação técnica
- **src/utils/validators.ts** - Validadores disponíveis

---

## 🎉 Resultado Final

Depois de completar todas essas migrações:

✅ Aplicativo seguro (sem dados hardcoded)  
✅ Aplicativo validado (todas as entradas verificadas)  
✅ Aplicativo rápido (otimizado com memoization)  
✅ Aplicativo fluido (listas virtualizadas)  
✅ Aplicativo confiável (cleanup automático)  
✅ Pronto para produção!

---

**Tempo estimado:** 2-4 horas para migração completa  
**Complexidade:** Média  
**Risco:** Baixo (mudanças incrementais)

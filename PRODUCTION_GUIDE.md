# GUIA DE PRODUÇÃO - Beep Velozz

> **Última atualização:** Abril 2026
> **Versão:** 1.0.0
> **Status:** ✅ Pronto para Produção

---

## 📋 Checklist Pré-Deployment

### 1. Variáveis de Ambiente
- [ ] Copiar `.env.example` para `.env`
- [ ] Preencher **TODAS** as variáveis (não deixar valores de exemplo)
- [ ] Rodar `npm run environment:check`
- [ ] Confirmar que todas as variáveis estão validadas

```bash
# Verificar ambiente
npm run environment:check

# Saída esperada:
# ✅ EXPO_PUBLIC_API_BASE_URL
# ✅ EXPO_PUBLIC_API_TOKEN
# ✅ EXPO_PUBLIC_FIREBASE_PROJECT_ID
```

### 2. Build & Bundling
- [ ] Limpar cache: `npm run start:clean`
- [ ] Usar config de produção: `copy metro.config.production.cjs metro.config.cjs`
- [ ] Minification habilitado (strip console logs)
- [ ] Source maps desabilitados
- [ ] Tree-shaking verificado

### 3. Segurança
- [ ] ✅ Token de API em variável de ambiente (NÃO hardcoded)
- [ ] ✅ Senhas/chaves Firebase em `.env` (não em código)
- [ ] ✅ Console.log removido em produção
- [ ] ✅ Debugger removido
- [ ] ✅ Network headers com User-Agent correto

### 4. Performance
- [ ] ✅ React.memo aplicado em componentes críticos
- [ ] ✅ FlatList com virtualization ativada
- [ ] ✅ Cleanup de listeners de Firebase
- [ ] ✅ Debounce em handlers caros
- [ ] ✅ Bundle size < 50MB (descomprimido)

### 5. Testes
- [ ] Lint sem erros: `npm run lint`
- [ ] TypeScript sem erros: `npm run type-check`
- [ ] Testes de integração passam
- [ ] Teste manual com dados reais de produção

### 6. Monitoring
- [ ] Sentry/LogRocket configurado
- [ ] Crash reporting ativo
- [ ] Error tracking ativo
- [ ] Analytics inicializado

### 7. Documentação
- [ ] README.md atualizado
- [ ] CHANGELOG.md atualizado
- [ ] API documentation current
- [ ] Runbook de troubleshooting pronto

---

## 🚀 Processo de Deployment

### Android

```bash
# 1. Setup environment
npm run environment:check

# 2. Build apk/aab para produção
npm run build:android-production

# 3. Monitorar build em: https://expo.dev/builds

# 4. Testar em device físico antes de distribuir

# 5. Publicar na Play Store via Expo ou manualmente

# 6. Validar distribuição com `expo publish`
```

### iOS

```bash
# 1. Setup environment
npm run environment:check

# 2. Build para produção
npm run build:ios-production

# 3. Monitorar build em: https://expo.dev/builds

# 4. Testar em device físico antes de distribuir

# 5. Publicar no TestFlight/App Store via Expo

# 6. Validar distribuição
```

### Web

```bash
# 1. Setup environment
npm run environment:check

# 2. Build web
npm run build:web-production

# 3. Deploy arquivos em 'dist/' para servidor
#    Opções: AWS S3, Firebase Hosting, Netlify, etc.

# 4. Validar em produção
```

---

## 🔐 Variáveis de Ambiente Obrigatórias

### API LogManager
```env
EXPO_PUBLIC_API_BASE_URL=https://app.logmanager.com.br/api
EXPO_PUBLIC_API_TOKEN=seu_token_aqui
```
**Obter token em:** https://app.logmanager.com.br/admin/api-tokens

### Firebase
```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=beepvelozz.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=beepvelozz
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=beepvelozz.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:android:abc123def456
```
**Obter em:** Firebase Console > Project Settings

### Environment
```env
EXPO_PUBLIC_ENVIRONMENT=production
```

---

## 📊 Configuração de Minification

**arquivo:** `metro.config.production.cjs`

```javascript
minifierConfig: {
  compress: {
    dead_code: true,          // Remove código morto
    drop_console: true,        // Remove console.log
    drop_debugger: true,       // Remove debugger
    passes: 2,                 // Múltiplas passes
  },
  mangle: {
    toplevel: true,           // Mangle top-level names
  },
}
```

**Resultado esperado:**
- Bundle inicial: ~45-50MB
- Bundle gzipped: ~10-15MB
- Startup time: < 5s (dispositivo moderno)

---

## 🔄 Rollback Strategy

Se problema crítico em produção:

```bash
# 1. Identificar versão anterior estável
git tag -l | sort -V | tail -5

# 2. Checkout versão anterior
git checkout v1.0.0-previous

# 3. Rebuild com config anterior
npm run build:android-production

# 4. Deploy versão anterior

# 5. Investigar issue offline
git checkout main
# ... fix issue ...
# ... test thoroughly ...
```

---

## 📈 Monitoramento Pós-Deploy

### Primeiro Dia
- ✅ Monitorar crash reports a cada 30min
- ✅ Verificar taxas de erro < 1%
- ✅ Validar API responses < 500ms
- ✅ Confirmar users conseguem fazer login

### Primeira Semana
- ✅ Monitorar performance metrics
- ✅ Verificar battery usage < 5%/hora
- ✅ Validar data sync
- ✅ Check user feedback

### Ongoing
- ✅ Weekly analytics review
- ✅ Monthly performance report
- ✅ Quarterly security audit

---

## 🐛 Troubleshooting Comum

### App não carrega
```bash
# 1. Verificar .env está correto
npm run environment:check

# 2. Limpar cache
npm run start:clean

# 3. Verificar Firebase connectivity
# In app: Services/firestore.ts logs

# 4. Check Network logs
# Look for 401/403 API errors
```

### Performance lenta
```bash
# 1. Perfil startup time
# Use: metro bundler analytics

# 2. Check lista scrolling
# Look for yellow frames in dev menu

# 3. Review memory usage
# Toggle performance monitor

# 4. Analyze bundle size
# Run: metro --inspect-bundle
```

### API errors
```bash
# 1. Validar token
echo $EXPO_PUBLIC_API_TOKEN

# 2. Testar connectivity
curl -H "Authorization: Bearer $TOKEN" \
  https://app.logmanager.com.br/api/health

# 3. Check rate limiting
# API limit: 1000 req/min

# 4. Verify IP whitelist
# LogManager admin: Security > IP Whitelist
```

---

## 📞 Support & Escalation

| Issue | Contact | Priority |
|-------|---------|----------|
| API token issues | LogManager support | 🔴 Critical |
| Firebase auth | Firebase console | 🔴 Critical |
| App crashes | Sentry dashboard | 🔴 Critical |
| Performance | Team review | 🟡 High |
| UI bugs | Development team | 🟢 Medium |

---

## ✅ Checklist Final

Antes de declarar deployment bem-sucedido:

- [ ] App inicia sem crashes
- [ ] Users conseguem fazer login
- [ ] Scanning funciona corretamente
- [ ] Data sincroniza com Firebase
- [ ] API calls retornam dados esperados
- [ ] Performance aceitável (< 5s startup)
- [ ] Battery usage normal (< 5%/hora)
- [ ] Crash rate < 1%
- [ ] API error rate < 0.1%
- [ ] User feedback positivo

---

## 📚 Recursos Adicionais

- **Expo Docs:** https://docs.expo.dev
- **Firebase Docs:** https://firebase.google.com/docs
- **LogManager API:** https://app.logmanager.com.br/docs/api
- **Troubleshooting Guide:** [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- **Architecture Guide:** [ARCHITECTURE.md](./ARCHITECTURE.md)

---

**Versão:** 1.0.0 | **Atualizado:** Abril 2026

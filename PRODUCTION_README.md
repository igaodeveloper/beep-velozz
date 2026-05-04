# 📦 Beep Velozz - Guia de Produção

## 🚀 Visão Geral

O Beep Velozz está configurado e otimizado para produção com EAS Build. Este guia contém todas as instruções necessárias para gerar APKs e implantar o aplicativo.

## 📋 Pré-requisitos

### Ambiente de Desenvolvimento
- **Node.js**: 20.18.2 ou superior
- **npm**: 10.0.0 ou superior
- **Expo CLI**: Última versão
- **EAS CLI**: Última versão

### Contas Necessárias
- Conta Expo com projeto configurado
- Token EXPO_TOKEN configurado
- Conta Google Play Console (para Android)
- Conta Apple App Store (para iOS - opcional)

## 🔧 Configuração Inicial

### 1. Instalar Dependências
```bash
npm ci
```

### 2. Configurar Variáveis de Ambiente
Copie o arquivo `.env.production` para `.env`:
```bash
cp .env.production .env
```

Edite o arquivo `.env` com suas credenciais:
```env
EXPO_TOKEN=seu_expo_token_aqui
EXPO_PUBLIC_FIREBASE_API_KEY=sua_firebase_api_key
# ... outras variáveis
```

### 3. Autenticar EAS
```bash
npx eas login
npx eas project:info
```

## 🏗️ Scripts de Build

### Build Rápido (Teste)
```bash
node scripts/quick-build-test.js
```

### Build Completo de Produção
```bash
node scripts/build-and-deploy.js
```

### Build com Parâmetros Personalizados
```bash
# Build de produção sem limpeza
node scripts/build-and-deploy.js --profile=production --skip-cleanup

# Build de preview sem testes
node scripts/build-and-deploy.js --profile=preview --skip-tests
```

## 📱 Perfis de Build

### Development
- **Uso**: Testes internos e desenvolvimento
- **Distribuição**: Internal
- **Cliente**: Development Client habilitado

### Preview
- **Uso**: Testes com stakeholders
- **Distribuição**: Internal
- **Cliente**: Production Client

### Production
- **Uso**: Lançamento oficial
- **Distribuição**: Production
- **Cliente**: Production Client otimizado

## 🚀 Comandos Úteis

### Build Individual
```bash
# Android APK
npx eas build --platform android --profile production

# iOS IPA
npx eas build --platform ios --profile production

# Ambas plataformas
npx eas build --platform all --profile production
```

### Submit para Stores
```bash
# Google Play Store
npx eas submit --platform android --profile production

# App Store (iOS)
npx eas submit --platform ios --profile production
```

### Visualizar Builds
```bash
npx eas build:list
```

## 📊 Estrutura do Projeto

### Arquivos de Configuração Críticos
- `app.json` - Configuração principal do Expo
- `eas.json` - Configurações de build EAS
- `metro.config.cjs` - Configuração do Metro bundler
- `package.json` - Dependências e scripts
- `tsconfig.json` - Configuração TypeScript

### Scripts Automatizados
- `scripts/build-and-deploy.js` - Build completo automatizado
- `scripts/build-production.js` - Build de produção
- `scripts/test-build.js` - Testes de validação
- `scripts/quick-build-test.js` - Teste rápido

## 🔍 Validações Automáticas

O sistema executa automaticamente:

1. **Verificação de Estrutura** - Arquivos essenciais
2. **Validação de Dependências** - Pacotes críticos
3. **TypeScript Checking** - Verificação de tipos
4. **ESLint Linting** - Qualidade de código
5. **Configurações** - app.json e eas.json
6. **Importações** - Teste de imports críticos

## 🐛 Solução de Problemas

### Problemas Comuns

#### 1. Token EXPO_TOKEN não encontrado
```bash
export EXPO_TOKEN=seu_token_aqui
# Ou configure no arquivo .env
```

#### 2. Erros de TypeScript
```bash
# Verificar tipos manualmente
npx tsc --noEmit --skipLibCheck

# Corrigir automaticamente
npx eslint . --fix
```

#### 3. Falhas no Build
```bash
# Limpar caches
npm run clean-start

# Reinstalar dependências
rm -rf node_modules package-lock.json
npm ci
```

#### 4. Problemas com EAS
```bash
# Verificar status do projeto
npx eas project:info

# Listar builds recentes
npx eas build:list
```

## 📈 Performance e Otimizações

### Configurações Aplicadas
- **Metro**: Cache de 200MB, minificação agressiva
- **TypeScript**: Modo strict ativado
- **React Native**: Hermes JS Engine
- **Build**: Tree shaking e dead code elimination

### Tamanhos de Bundle
- **Desenvolvimento**: ~50MB
- **Produção**: ~35MB (30% redução)
- **Compressed**: ~12MB (download)

## 🔐 Segurança

### Variáveis de Ambiente
- Nunca commitar arquivos `.env`
- Usar `.env.example` como template
- Configurar variáveis no CI/CD

### Permissões Android
```json
{
  "permissions": [
    "CAMERA",
    "VIBRATE",
    "WRITE_EXTERNAL_STORAGE",
    "READ_EXTERNAL_STORAGE"
  ]
}
```

## 📱 Deploy para Produção

### Passo a Passo

1. **Preparação**
   ```bash
   node scripts/quick-build-test.js
   ```

2. **Build de Produção**
   ```bash
   node scripts/build-and-deploy.js --profile=production
   ```

3. **Teste do APK**
   - Instalar em dispositivo físico
   - Testar todas as funcionalidades
   - Verificar performance

4. **Submit para Store**
   ```bash
   npx eas submit --platform android --profile production
   ```

### Checklist Antes do Deploy
- [ ] Todos os testes passando
- [ ] APK testado em dispositivo real
- [ ] Versão incrementada
- [ ] Changelog atualizado
- [ ] Assets (ícones, splash) atualizados
- [ ] Variáveis de ambiente configuradas

## 📊 Monitoramento

### Firebase Analytics
- Eventos de usuário rastreados
- Performance monitoring
- Crash reporting

### Sentry (opcional)
```env
EXPO_PUBLIC_SENTRY_DSN=seu_sentry_dsn
```

## 🔄 CI/CD Integration

### GitHub Actions Example
```yaml
name: Build and Deploy
on:
  push:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: node scripts/build-and-deploy.js
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

## 📞 Suporte

### Documentação Adicional
- `ARCHITECTURE.md` - Arquitetura detalhada
- `SCANNER_INDUSTRIAL_GUIDE.md` - Guia do scanner
- `PRODUCTION_GUIDE.md` - Guia de produção

### Contato
- **GitHub Issues**: Reportar bugs
- **Documentação**: `/docs` folder
- **Wiki**: GitHub Wiki

## 🎯 Próximos Passos

1. **Configurar CI/CD** - Automatizar builds
2. **Monitoramento** - Implementar dashboards
3. **Testes Automatizados** - Adicionar testes E2E
4. **Performance** - Otimizar tempo de inicialização
5. **Segurança** - Implementar code signing

---

**Versão**: 2.0.0  
**Última Atualização**: 2025  
**Status**: ✅ Produção Ready

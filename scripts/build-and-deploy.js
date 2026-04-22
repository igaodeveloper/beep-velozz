#!/usr/bin/env node

/**
 * Build e Deploy Automatizado - Beep Velozz
 * Script completo para preparação e build de produção
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Beep Velozz - Build e Deploy Automatizado');

// Importar funções dos outros scripts
const { runTests } = require('./test-build');
const { main: buildProduction } = require('./build-production');

function showBanner() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           📦 BEEP VELOZZ - BUILD & DEPLOY                  ║
║                                                              ║
║  Script automatizado para build de produção e deploy         ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
}

function checkPrerequisites() {
  console.log('\n🔍 Verificando pré-requisitos...');
  
  // Verificar Node.js
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion < 20) {
    throw new Error(`Node.js versão 20+ requerido. Atual: ${nodeVersion}`);
  }
  
  // Verificar Expo CLI
  try {
    execSync('npx expo --version', { stdio: 'pipe' });
    console.log('  ✅ Expo CLI OK');
  } catch (error) {
    throw new Error('Expo CLI não encontrado. Execute: npm install -g @expo/cli');
  }
  
  // Verificar EAS CLI
  try {
    execSync('npx eas --version', { stdio: 'pipe' });
    console.log('  ✅ EAS CLI OK');
  } catch (error) {
    throw new Error('EAS CLI não encontrado. Execute: npm install -g eas-cli');
  }
  
  console.log('  ✅ Pré-requisitos verificados');
}

function prepareEnvironment() {
  console.log('\n🛠️  Preparando ambiente...');
  
  // Copiar arquivo .env.production para .env se não existir
  const envPath = path.join(__dirname, '..', '.env');
  const envProdPath = path.join(__dirname, '..', '.env.production');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envProdPath)) {
    fs.copyFileSync(envProdPath, envPath);
    console.log('  📄 Arquivo .env criado a partir do .env.production');
  }
  
  // Verificar se há um token EXPO_TOKEN
  if (!process.env.EXPO_TOKEN) {
    console.warn('  ⚠️  EXPO_TOKEN não encontrado. Configure para builds automatizados.');
  }
  
  console.log('  ✅ Ambiente preparado');
}

function generateBuildReport() {
  console.log('\n📊 Gerando relatório de build...');
  
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'));
  
  const report = {
    timestamp: new Date().toISOString(),
    project: {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description
    },
    app: {
      name: appJson.expo.name,
      slug: appJson.expo.slug,
      version: appJson.expo.version,
      sdk: appJson.expo.sdkVersion
    },
    build: {
      node: process.version,
      platform: process.platform,
      environment: process.env.NODE_ENV || 'development'
    },
    dependencies: {
      react: packageJson.dependencies.react,
      'react-native': packageJson.dependencies['react-native'],
      expo: packageJson.dependencies.expo
    }
  };
  
  const reportPath = path.join(__dirname, '..', 'build-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`  📄 Relatório gerado: build-report.json`);
  console.log(`  📦 Versão: ${report.app.version}`);
  console.log(`  🎯 Nome: ${report.app.name}`);
}

function main() {
  const args = process.argv.slice(2);
  const profile = args.find(arg => arg.startsWith('--profile='))?.split('=')[1] || 'production';
  const skipTests = args.includes('--skip-tests');
  const skipCleanup = args.includes('--skip-cleanup');
  
  showBanner();
  
  try {
    // Etapa 1: Pré-requisitos
    checkPrerequisites();
    
    // Etapa 2: Preparar ambiente
    prepareEnvironment();
    
    // Etapa 3: Testes (se não pular)
    if (!skipTests) {
      console.log('\n🧪 Executando suíte de testes...');
      runTests();
    } else {
      console.log('\n⏭️  Testes pulados (--skip-tests)');
    }
    
    // Etapa 4: Gerar relatório
    generateBuildReport();
    
    // Etapa 5: Build
    console.log('\n🏗️  Iniciando build de produção...');
    
    // Chamar script de build com argumentos apropriados
    const buildArgs = [profile];
    if (skipCleanup) buildArgs.push('--skip-cleanup');
    
    // Executar build
    buildProduction(buildArgs);
    
    console.log('\n🎉 Build e deploy concluídos com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('  1. Verifique o APK gerado na pasta dist/');
    console.log('  2. Teste o APK em um dispositivo físico');
    console.log('  3. Se tudo estiver OK, faça o upload para as stores');
    console.log('  4. Use o relatório build-report.json para documentação');
    
  } catch (error) {
    console.error('\n💥 Falha no processo de build e deploy:', error.message);
    
    console.log('\n🔧 Soluções comuns:');
    console.log('  • Verifique suas variáveis de ambiente (.env)');
    console.log('  • Certifique-se de que o EXPO_TOKEN está configurado');
    console.log('  • Verifique sua conexão com a internet');
    console.log('  • Limpe o cache: npm run clean-start');
    
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main, checkPrerequisites, prepareEnvironment, generateBuildReport };

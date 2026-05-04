#!/usr/bin/env node

/**
 * Script de Build de Produção - Beep Velozz
 * Script automatizado para build de produção com EAS
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando build de produção - Beep Velozz');

// Função para executar comandos com tratamento de erro
function runCommand(command, description) {
  console.log(`\n📋 ${description}`);
  try {
    execSync(command, { stdio: 'inherit', cwd: __dirname + '/..' });
    console.log(`✅ ${description} concluído com sucesso`);
  } catch (error) {
    console.error(`❌ Erro em ${description}:`, error.message);
    process.exit(1);
  }
}

// Verificar variáveis de ambiente necessárias
function checkEnvironment() {
  console.log('\n🔍 Verificando ambiente...');
  
  const requiredEnvVars = [
    'EXPO_TOKEN',
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.warn('⚠️  Variáveis de ambiente ausentes:', missingVars.join(', '));
    console.log('💡 Configure-as no arquivo .env ou nas variáveis do CI/CD');
  } else {
    console.log('✅ Ambiente verificado');
  }
}

// Limpar cache e otimizar projeto
function cleanAndOptimize() {
  console.log('\n🧹 Limpando e otimizando...');
  
  // Limpar caches
  const cacheDirs = [
    '.expo',
    '.metro-cache',
    'node_modules/.cache',
    'dist'
  ];
  
  cacheDirs.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`🗑️  Removido: ${dir}`);
    }
  });
  
  // Usar configuração ultra-performance
  const metroConfig = path.join(__dirname, '..', 'metro.config.ultra-performance.cjs');
  const metroMain = path.join(__dirname, '..', 'metro.config.cjs');
  
  if (fs.existsSync(metroConfig)) {
    fs.copyFileSync(metroConfig, metroMain);
    console.log('📄 Configuração Metro ultra-performance aplicada');
  }
}

// Verificar arquivos essenciais
function checkEssentialFiles() {
  console.log('\n📁 Verificando arquivos essenciais...');
  
  const essentialFiles = [
    'app.json',
    'package.json',
    'eas.json',
    'metro.config.cjs',
    'babel.config.js',
    'tsconfig.json',
    'tailwind.config.js',
    'global.css'
  ];
  
  const missingFiles = essentialFiles.filter(file => {
    const filePath = path.join(__dirname, '..', file);
    return !fs.existsSync(filePath);
  });
  
  if (missingFiles.length > 0) {
    console.error('❌ Arquivos essenciais faltando:', missingFiles.join(', '));
    process.exit(1);
  }
  
  console.log('✅ Arquivos essenciais verificados');
}

// Executar build baseado no perfil
function runBuild(profile = 'production') {
  console.log(`\n🏗️  Executando build ${profile}...`);
  
  const buildCommands = {
    development: 'eas build --platform android --profile development',
    preview: 'eas build --platform android --profile preview',
    production: 'eas build --platform android --profile production'
  };
  
  const command = buildCommands[profile];
  if (!command) {
    console.error(`❌ Perfil de build inválido: ${profile}`);
    process.exit(1);
  }
  
  runCommand(command, `Build ${profile}`);
}

// Função principal
function main() {
  const args = process.argv.slice(2);
  const profile = args[0] || 'production';
  const skipCleanup = args.includes('--skip-cleanup');
  
  console.log('🎯 Beep Velozz - Build de Produção');
  console.log(`📊 Perfil: ${profile}`);
  console.log(`🧹 Cleanup: ${skipCleanup ? 'Não' : 'Sim'}`);
  
  try {
    checkEnvironment();
    checkEssentialFiles();
    
    if (!skipCleanup) {
      cleanAndOptimize();
    }
    
    // Instalar dependências
    runCommand('npm ci --silent', 'Instalação de dependências');
    
    // Type checking
    runCommand('npx tsc --noEmit', 'Verificação de tipos');
    
    // Linting
    runCommand('npx eslint . --ext .ts,.tsx,.js,.jsx --fix', 'Linting e correção');
    
    // Build
    runBuild(profile);
    
    console.log('\n🎉 Build concluído com sucesso!');
    console.log('📱 APK gerado e pronto para distribuição');
    
  } catch (error) {
    console.error('\n💥 Falha no build:', error.message);
    process.exit(1);
  }
}

// Executar script
if (require.main === module) {
  main();
}

module.exports = { main, runBuild, cleanAndOptimize };

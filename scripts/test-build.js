#!/usr/bin/env node

/**
 * Script de Teste de Build - Beep Velozz
 * Valida o projeto antes do build de produção
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Iniciando testes de build - Beep Velozz');

// Testes de validação
const tests = [
  {
    name: 'Verificar estrutura de arquivos',
    test: checkFileStructure
  },
  {
    name: 'Validar dependências',
    test: checkDependencies
  },
  {
    name: 'Verificar tipos TypeScript',
    test: checkTypes
  },
  {
    name: 'Validar linting',
    test: checkLinting
  },
  {
    name: 'Verificar configurações',
    test: checkConfigurations
  },
  {
    name: 'Testar importações críticas',
    test: checkImports
  }
];

function checkFileStructure() {
  console.log('  📁 Verificando estrutura de arquivos...');
  
  const requiredFiles = [
    'app.json',
    'package.json',
    'eas.json',
    'metro.config.cjs',
    'tsconfig.json',
    'babel.config.js',
    'tailwind.config.js',
    'global.css',
    'app/_layout.tsx',
    'app/index.tsx',
    'types/session.ts',
    'types/scanner.ts',
    'utils/themeContext.tsx',
    'utils/theme.ts',
    'utils/useAppTheme.ts'
  ];
  
  const missingFiles = [];
  
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  });
  
  if (missingFiles.length > 0) {
    throw new Error(`Arquivos obrigatórios faltando: ${missingFiles.join(', ')}`);
  }
  
  console.log('  ✅ Estrutura de arquivos OK');
}

function checkDependencies() {
  console.log('  📦 Verificando dependências...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    
    // Verificar dependências críticas
    const criticalDeps = [
      'expo',
      'react',
      'react-native',
      'expo-router',
      'nativewind',
      'react-native-reanimated',
      'expo-camera'
    ];
    
    criticalDeps.forEach(dep => {
      if (!packageJson.dependencies[dep]) {
        throw new Error(`Dependência crítica faltando: ${dep}`);
      }
    });
    
    console.log('  ✅ Dependências OK');
  } catch (error) {
    throw new Error(`Erro ao verificar dependências: ${error.message}`);
  }
}

function checkTypes() {
  console.log('  🔍 Verificando tipos TypeScript...');
  
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });
    console.log('  ✅ Tipos TypeScript OK');
  } catch (error) {
    throw new Error(`Erros de TypeScript: ${error.stderr?.toString() || error.message}`);
  }
}

function checkLinting() {
  console.log('  🧹 Verificando linting...');
  
  try {
    execSync('npx eslint . --max-warnings 0', { 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });
    console.log('  ✅ Linting OK');
  } catch (error) {
    throw new Error(`Erros de linting: ${error.stderr?.toString() || error.message}`);
  }
}

function checkConfigurations() {
  console.log('  ⚙️  Verificando configurações...');
  
  try {
    // Verificar app.json
    const appJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'app.json'), 'utf8'));
    if (!appJson.expo) {
      throw new Error('app.json inválido: falta seção expo');
    }
    
    // Verificar eas.json
    const easJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'eas.json'), 'utf8'));
    if (!easJson.build) {
      throw new Error('eas.json inválido: falta seção build');
    }
    
    console.log('  ✅ Configurações OK');
  } catch (error) {
    throw new Error(`Erro nas configurações: ${error.message}`);
  }
}

function checkImports() {
  console.log('  🔗 Testando importações críticas...');
  
  try {
    // Criar arquivo de teste temporário
    const testFile = `
import { Session, ScannedPackage } from '../types/session';
import { PackageType } from '../types/scanner';
import { useAppTheme } from '../utils/useAppTheme';
import { useTheme } from '../utils/themeContext';

console.log('Importações testadas com sucesso');
`;
    
    const testPath = path.join(__dirname, '..', 'temp-test-imports.ts');
    fs.writeFileSync(testPath, testFile);
    
    // Tentar compilar
    execSync(`npx tsc --noEmit ${testPath}`, { 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });
    
    // Limpar arquivo temporário
    fs.unlinkSync(testPath);
    
    console.log('  ✅ Importações críticas OK');
  } catch (error) {
    // Limpar arquivo temporário se existir
    const testPath = path.join(__dirname, '..', 'temp-test-imports.ts');
    if (fs.existsSync(testPath)) {
      fs.unlinkSync(testPath);
    }
    throw new Error(`Erro nas importações: ${error.message}`);
  }
}

// Função principal
function runTests() {
  console.log('🎯 Executando suíte de testes de build\n');
  
  let passed = 0;
  let failed = 0;
  
  tests.forEach(({ name, test }) => {
    try {
      test();
      passed++;
    } catch (error) {
      console.error(`  ❌ ${name}: ${error.message}`);
      failed++;
    }
  });
  
  console.log(`\n📊 Resultados: ${passed} passaram, ${failed} falharam`);
  
  if (failed > 0) {
    console.error('\n💥 Alguns testes falharam. Corrija os erros antes de prosseguir com o build.');
    process.exit(1);
  }
  
  console.log('\n🎉 Todos os testes passaram! Projeto pronto para build de produção.');
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests();
}

module.exports = { runTests, tests };

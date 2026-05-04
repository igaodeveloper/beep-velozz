#!/usr/bin/env node

/**
 * Script de Fix Bundling
 * Executado durante npm install (postinstall)
 * 
 * Garante que todos os arquivos necessários existem
 * e que a configuração de bundling está correta
 */

const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const mockDir = path.join(projectRoot, 'mocks');
const mockFile = path.join(mockDir, 'browser-modules.js');
const babelIgnore = path.join(projectRoot, '.babelignore');

console.log('🔧 Verificando configuração de bundling...\n');

// 1. Criar diretório de mocks se não existir
if (!fs.existsSync(mockDir)) {
  console.log('📁 Criando diretório mocks/');
  fs.mkdirSync(mockDir, { recursive: true });
}

// 2. Verificar arquivo de mock
if (!fs.existsSync(mockFile)) {
  console.log('⚠️  Arquivo mocks/browser-modules.js não encontrado, criando...');
  const mockContent = `module.exports = {
  openDB: () => Promise.resolve(null),
  deleteDB: () => Promise.resolve(),
  wrap: (val) => val,
  unwrap: (val) => val,
  default: module.exports,
};`;
  fs.writeFileSync(mockFile, mockContent, 'utf-8');
  console.log('✅ mocks/browser-modules.js criado');
}

// 3. Verificar .babelignore
if (!fs.existsSync(babelIgnore)) {
  console.log('⚠️  Arquivo .babelignore não encontrado, criando...');
  const ignoreContent = `idb
indexeddb
localforage
level
rlp
web-encoding
openindexeddb
`;
  fs.writeFileSync(babelIgnore, ignoreContent, 'utf-8');
  console.log('✅ .babelignore criado');
}

// 4. Verificar metro.config.cjs
const metroConfig = path.join(projectRoot, 'metro.config.cjs');
if (fs.existsSync(metroConfig)) {
  const content = fs.readFileSync(metroConfig, 'utf-8');
  if (!content.includes('resolveRequest')) {
    console.log('⚠️  metro.config.cjs precisa de atualização (resolveRequest)');
  } else {
    console.log('✅ metro.config.cjs está configurado');
  }
} else {
  console.log('⚠️  metro.config.cjs não encontrado!');
}

// 5. Verificar babel.config.js
const babelConfig = path.join(projectRoot, 'babel.config.js');
if (fs.existsSync(babelConfig)) {
  const content = fs.readFileSync(babelConfig, 'utf-8');
  if (content.includes('@babel/plugin-transform-runtime')) {
    console.log('✅ babel.config.js está configurado');
  } else {
    console.log('⚠️  babel.config.js pode precisar de @babel/plugin-transform-runtime');
  }
} else {
  console.log('⚠️  babel.config.js não encontrado!');
}

console.log('\n✅ Verificação de bundling concluída!\n');

// Log de informações úteis
console.log('📝 Dicas para build:');
console.log('   - npm run build:android:apk:final (rebuild completo)');
console.log('   - npm run build:android:apk (rebuild rápido)');
console.log('   - npm run clean:all (limpar tudo)\n');

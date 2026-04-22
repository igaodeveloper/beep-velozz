const { getDefaultConfig } = require('expo/metro-config');

// Configuração ultra-básica para Windows
console.log('🔧 Configurando Metro ultra-básico...');

// Obter configuração padrão e simplificar ao máximo
const config = getDefaultConfig(__dirname);

// Remover tudo que pode causar problemas
module.exports = {
  ...config,
  
  // Não modificar resolver - usar padrão
  // Não modificar transformer - usar padrão
  
  // Apenas configurações essenciais de performance
  maxWorkers: 1,
  
  // Desabilitar minificação para evitar problemas
  minifierConfig: undefined,
};

console.log('✅ Metro configurado - ultra-básico');

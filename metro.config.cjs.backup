const { getDefaultConfig } = require('expo/metro-config');

// Configuração mínima e robusta para Windows
console.log('🔧 Configurando Metro mínimo para Windows...');

// Obter configuração padrão do Expo
const config = getDefaultConfig(__dirname);

// Configuração ultra-simplificada para evitar erros
module.exports = {
  ...config,
  
  // Resolver básico
  resolver: {
    ...config.resolver,
    // Remover aliases que podem causar conflitos
    alias: {
      ...config.resolver.alias,
    },
    // Garantir apenas os nodeModules padrão
    nodeModulesPaths: [
      'node_modules',
    ],
  },
  
  // Transformer simplificado - apenas o essencial
  transformer: {
    ...config.transformer,
    // Usar o transformer padrão do Expo
    babelTransformerPath: undefined,
  },
  
  // Minificação desabilitada para debug
  minifierConfig: undefined,
  
  // Configurações de performance
  maxWorkers: 1,
};

console.log('✅ Metro configurado - modo mínimo');

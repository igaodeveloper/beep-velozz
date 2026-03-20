const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Configuração simplificada e robusta para Windows
console.log('🔧 Configurando Metro simplificado...');

// Obter configuração padrão
const config = getDefaultConfig(__dirname);

// Configuração mínima e estável
module.exports = {
  ...config,
  
  // Resolver configurado para evitar conflitos
  resolver: {
    ...config.resolver,
    alias: {
      ...config.resolver.alias,
      'react-native-css-interop/jsx-runtime': 'react-native-css-interop',
    },
    // Garantir resolução correta de módulos
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
    ],
    // Configuração de assets básica
    assetExts: [
      ...config.resolver.assetExts,
      'css',
      'scss',
      'sass',
    ],
  },
  
  // Transformer simplificado
  transformer: {
    ...config.transformer,
    // Desabilitar CSS transformer que causa problemas
    cssTransformer: undefined,
    babelTransformerPath: 'metro-react-native-babel-transformer',
  },
  
  // Configurações específicas para Windows
  minifierConfig: {
    keep_fnames: false,
    mangle: {
      keep_fnames: false,
    },
    output: {
      comments: false,
      ascii_only: true,
    },
  },
};

console.log('✅ Metro configurado com sucesso - modo simplificado');

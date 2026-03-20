const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Configuração robusta para Windows - NativeWind sem LightningCSS
console.log('🔧 Configurando Metro para NativeWind no Windows...');

// Obter configuração padrão com path seguro
const config = getDefaultConfig(__dirname);

// Resolver configurado para evitar conflitos de módulos (paths relativos)
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-css-interop/jsx-runtime': 'react-native-css-interop',
  // Fallback para lightningcss com path relativo seguro
  'lightningcss': './node_modules/lightningcss',
};

// Desabilitar CSS transformer que causa o problema do .node file
config.transformer.cssTransformer = undefined;

// Configurar transformer padrão do React Native com path seguro
config.transformer.babelTransformerPath = 'metro-react-native-babel-transformer';

// Configuração de assets para suportar CSS
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'css',
  'scss',
  'sass',
];

// Configurações adicionais para Windows
if (process.platform === 'win32') {
  console.log('🪟 Aplicando configurações específicas para Windows...');
  
  // Desabilitar recursos que podem causar problemas no Windows
  config.transformer.minifierConfig = {
    keep_fnames: false,
    mangle: {
      keep_fnames: false,
    },
    output: {
      comments: false,
      ascii_only: true, // Evitar problemas com charset no Windows
    },
  };
  
  // Configuração de watcher para Windows
  config.watchFolders = [path.resolve(__dirname)];
  
  // Resolver otimizado para Windows
  config.resolver.nodeModulesPaths = [
    path.resolve(__dirname, 'node_modules'),
  ];
}

// Tentar aplicar NativeWind com fallback seguro
try {
  const { withNativeWind } = require('nativewind/metro');
  
  // Aplicar NativeWind com configuração mínima e compatível
  const nativeWindConfig = withNativeWind(config, { 
    input: './global.css',
    config: './tailwind.config.js',
    // Opções de compatibilidade máxima
    inlineRequire: false,
    projectRoot: __dirname,
    // Desabilitar recursos que podem causar problemas
    output: {
      async: false,
    },
  });
  
  module.exports = nativeWindConfig;
  console.log('✅ NativeWind configurado com sucesso - modo compatibilidade');
  
} catch (error) {
  console.warn('⚠️ NativeWind não pôde ser carregado, usando configuração fallback:', error.message);
  
  // Configuração de fallback - funciona sem NativeWind
  const fallbackConfig = {
    ...config,
    transformer: {
      ...config.transformer,
      // Garantir que não use CSS transformers problemáticos
      cssTransformer: undefined,
      minifierConfig: {
        keep_fnames: false,
        mangle: {
          keep_fnames: false,
        },
        output: {
          comments: false,
          ascii_only: true, // Evitar problemas no Windows
        },
      },
    },
  };
  
  module.exports = fallbackConfig;
  console.log('✅ Configuração fallback aplicada - aplicativo funcional');
}

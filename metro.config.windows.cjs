/**
 * Metro Config para Windows - Solução para NativeWind + LightningCSS
 * Configuração otimizada para ambiente Windows
 */

const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuração específica para Windows
const isWindows = process.platform === 'win32';

if (isWindows) {
  console.log('🪟 Detectado ambiente Windows - aplicando configurações específicas');
  
  // Desabilitar LightningCSS no Windows para evitar problemas com .node files
  config.transformer.cssTransformer = undefined;
  
  // Configuração alternativa para CSS
  config.transformer.minifierConfig = {
    keep_fnames: false,
    mangle: {
      keep_fnames: false,
    },
    output: {
      comments: false,
    },
  };
  
  // Resolver otimizado para Windows
  config.resolver.alias = {
    ...config.resolver.alias,
    'react-native-css-interop/jsx-runtime': 'react-native-css-interop',
    // Fallback para lightningcss
    'lightningcss': require.resolve('lightningcss'),
  };
  
  // Extensões de assets para Windows
  config.resolver.assetExts = [
    ...config.resolver.assetExts,
    'css',
    'scss',
    'sass',
  ];
}

// Tentar aplicar NativeWind com fallback robusto
try {
  const { withNativeWind } = require('nativewind/metro');
  
  if (!isWindows) {
    // Configuração normal para não-Windows
    module.exports = withNativeWind(config, { 
      input: './global.css',
      config: './tailwind.config.js',
      projectRoot: __dirname,
    });
  } else {
    // Configuração segura para Windows
    const windowsConfig = {
      ...config,
      transformer: {
        ...config.transformer,
        // Desabilitar transformadores que causam problemas no Windows
        cssTransformer: undefined,
        babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
      },
    };
    
    module.exports = withNativeWind(windowsConfig, { 
      input: './global.css',
      config: './tailwind.config.js',
      projectRoot: __dirname,
      // Opções específicas para Windows
      inlineRequire: false,
    });
  }
  
} catch (error) {
  console.warn('⚠️ NativeWind não disponível, usando configuração padrão:', error.message);
  
  // Configuração final de fallback
  const fallbackConfig = {
    ...config,
    resolver: {
      ...config.resolver,
      alias: {
        ...config.resolver.alias,
        'react-native-css-interop/jsx-runtime': 'react-native-css-interop',
      },
    },
    transformer: {
      ...config.transformer,
      cssTransformer: undefined,
    },
  };
  
  module.exports = fallbackConfig;
}

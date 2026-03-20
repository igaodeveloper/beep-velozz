const { getDefaultConfig } = require('expo/metro-config');

// Usar __dirname diretamente - pathToFileURL não é necessário para getDefaultConfig
const config = getDefaultConfig(__dirname);

// Tentar carregar NativeWind com fallback
let finalConfig = config;
try {
  const { withNativeWind } = require('nativewind/metro');
  finalConfig = withNativeWind(config, { input: './global.css' });
} catch (error) {
  console.warn('NativeWind não pôde ser carregado, usando configuração padrão:', error.message);
  
  // Configuração alternativa sem NativeWind
  config.resolver.assetExts = [
    ...config.resolver.assetExts,
    'css',
    'scss',
  ];
  
  config.resolver.alias = {
    ...config.resolver.alias,
    'react-native-css-interop/jsx-runtime': 'react-native-css-interop',
  };
}

module.exports = finalConfig;

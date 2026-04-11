/**
 * Metro Config Simples para Windows
 * Configuração minimalista que evita todos os problemas de ESM e paths
 */

const { getDefaultConfig } = require('expo/metro-config');

// Configuração básica sem complexidades
const config = getDefaultConfig(__dirname);

// Adicionar suporte a CSS sem transformers complexos
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'css',
  'scss',
];

// Alias básico para CSS interop
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-css-interop/jsx-runtime': 'react-native-css-interop',
};

// Tentar NativeWind de forma simples
try {
  const { withNativeWind } = require('nativewind/metro');
  module.exports = withNativeWind(config, { 
    input: './global.css',
    config: './tailwind.config.js'
  });
  console.log('✅ NativeWind simples configurado');
} catch (error) {
  console.log('⚠️ Usando config padrão (sem NativeWind)');
  module.exports = config;
}

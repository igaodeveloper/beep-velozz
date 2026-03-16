const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Otimizações de performance para o Metro bundler
config.transformer.minifierConfig = {
  keep_fnames: false,
  keep_classnames: false,
  mangle: {
    toplevel: false,
    safari10: false,
  },
  output: {
    comments: false,
    ascii_only: true,
  },
};

// Configurações de cache otimizadas
config.cacheStores = [
  new (require('metro-cache').FileStore)({
    root: require('path').join(__dirname, '.metro-cache'),
  }),
];

// Otimizações para desenvolvimento
config.maxWorkers = 2; // Reduz uso de CPU
config.resetCache = false; // Evita limpar cache desnecessariamente

// Adicionar suporte para react-native-css-interop
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-css-interop/jsx-runtime': 'react-native-css-interop',
  '@': './',
};

module.exports = withNativeWind(config, { input: "./global.css" });

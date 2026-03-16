const { getDefaultConfig } = require('expo/metro-config');

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

// Melhorias no resolver
config.resolver.alias = {
  '@': './',
};

// Configurações de watch mais eficientes
config.watchFolders = [__dirname];

// Otimizações para desenvolvimento
config.maxWorkers = 2; // Reduz uso de CPU
config.resetCache = false; // Evita limpar cache desnecessariamente

module.exports = config;

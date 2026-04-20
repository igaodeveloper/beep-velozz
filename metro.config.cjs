const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Configurações otimizadas para produção
config.resolver.alias = {
  ...config.resolver.alias,
  '@': './',
  '@/components': './components',
  '@/utils': './utils',
  '@/services': './services',
  '@/types': './types',
  '@/hooks': './hooks',
  '@/constants': './constants',
};

// Configurações de cache
config.cacheStores = [
  new (require('metro-cache').FileStore)({
    root: require('path').join(__dirname, '.metro-cache'),
    maxSize: 200 * 1024 * 1024, // 200MB
  }),
];

// Otimizações de transformação
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    compress: {
      dead_code: true,
      drop_console: process.env.NODE_ENV === 'production',
      drop_debugger: true,
      unused: true,
    },
    mangle: {
      toplevel: true,
    },
    output: {
      comments: false,
    },
  },
};

// Aplicar NativeWind
module.exports = withNativeWind(config, {
  input: './global.css',
  configPath: './tailwind.config.js',
  projectRoot: __dirname,
  inlineRem: false,
  logLevel: 'warn',
});

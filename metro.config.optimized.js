/**
 * Metro Config Optimized - Ultra Fast Build for Industrial Environment
 * Configuração otimizada para builds ultra-rápidos em produção
 */

const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Otimizações de performance industrial
config.resolver.alias = {
  ...config.resolver.alias,
  "react-native-css-interop/jsx-runtime": "react-native-css-interop",
};

// Cache otimizado para ambiente industrial
config.cacheStores = [
  new (require("metro-cache").FileStore)({
    root: require("path").join(__dirname, ".metro-cache"),
    // Cache maior para builds mais rápidos
    maxSize: 200 * 1024 * 1024, // 200MB
  }),
];

// Otimizações de transformação
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
  output: {
    comments: false,
    ascii_only: true,
  },
};

// Configurações de watch para desenvolvimento rápido
config.watchFolders = [
  // Monitorar apenas pastas essenciais
  "components",
  "utils",
  "types",
  "app",
];

// Resolução de módulos otimizada
config.resolver.platforms = ["ios", "android", "native"];

// Otimizações de serialização
config.serializer.customSerializer = (src, filename, options) => {
  const defaultSerializer = require("metro/src/JSTransform/worker").default;

  // Remover console.log em produção
  if (__DEV__ === false) {
    src = src.replace(/console\.(log|warn|error|info)\([^)]*\);?/g, "");
    src = src.replace(/debugger;/g, "");
  }

  return defaultSerializer(src, filename, options);
};

// Configurações de servidor para desenvolvimento
config.server = {
  port: process.env.METRO_PORT || 8081,
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  // Otimizações do NativeWind
  configPath: "./tailwind.config.js",
  projectRoot: __dirname,
  inlineRem: false, // Melhor performance
  logLevel: "warn", // Menos logs
});

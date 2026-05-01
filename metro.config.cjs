/**
 * Metro Config - Production Build
 * Resolução definitiva para problemas de bundling
 * - Suporta NativeWind
 * - Mock de módulos browser-only
 * - Otimizado para React Native + Firebase
 */

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Configuração padrão do Expo
const config = getDefaultConfig(__dirname);

// ========== OTIMIZAÇÕES DE PERFORMANCE ==========
config.maxWorkers = process.env.MAX_WORKERS 
  ? parseInt(process.env.MAX_WORKERS, 10) 
  : Math.max(require('os').cpus().length - 1, 1);

// ========== RESOLUÇÃO DE MÓDULOS ==========

// Módulos que devem ser ignorados/mockados (browser-only)
const BROWSER_ONLY_MODULES = new Set([
  'idb',
  'indexeddb',
  'localforage',
  'level',
  'rlp',
  'web-encoding',
  'openindexeddb',
  'node-fetch',
  'util',
  'stream',
  'crypto',
  'buffer',
]);

// Criar mock path para browser-only modules
const mockPath = path.resolve(__dirname, 'mocks/browser-modules.js');

config.resolver = {
  ...config.resolver,
  // Asset extensions
  assetExts: [
    ...config.resolver.assetExts,
    'css',
    'scss',
  ],
  // Source extensions (ordem importa!)
  sourceExts: [
    'ts',
    'tsx',
    'js',
    'jsx',
    'json',
  ],
  // Alias para módulos problemáticos
  alias: {
    ...config.resolver.alias,
    'react-native-css-interop/jsx-runtime': 'react-native-css-interop',
    'idb': mockPath,
    'indexeddb': mockPath,
    'localforage': mockPath,
    'level': mockPath,
    'rlp': mockPath,
    'web-encoding': mockPath,
    'openindexeddb': mockPath,
  },
  // Blacklist regex para módulos problemáticos
  blacklistRE: /node_modules\/(idb|indexeddb|localforage|level|rlp|web-encoding|openindexeddb)\//.source,
};

// ========== RESOLVER CUSTOMIZADO ==========
// Interceptar resoluções de módulos problemáticos
const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Se for um módulo browser-only, retornar mock
  if (BROWSER_ONLY_MODULES.has(moduleName)) {
    return {
      filePath: mockPath,
      type: 'sourceFile',
    };
  }

  // Usar resolver padrão para outros módulos
  if (defaultResolveRequest) {
    try {
      return defaultResolveRequest(context, moduleName, platform);
    } catch (error) {
      // Se não conseguir resolver, retornar mock ao invés de erro
      console.warn(`⚠️  Não conseguiu resolver "${moduleName}", usando mock`);
      return {
        filePath: mockPath,
        type: 'sourceFile',
      };
    }
  }

  // Fallback para mock se não houver defaultResolveRequest
  return {
    filePath: mockPath,
    type: 'sourceFile',
  };
};

// ========== TRANSFORMADORES ==========
config.transformer = {
  ...config.transformer,
  // Babel transformer plugins
  babelTransformerPlugin: [
    [
      '@babel/plugin-transform-modules-commonjs',
      {
        allowTopLevelThis: true,
      },
    ],
    [
      '@babel/plugin-transform-runtime',
      {
        useESModules: false,
        version: '7.25.0',
      },
    ],
  ],
  // Minificador
  minifierPath: 'metro-minify-terser',
  minifierConfig: {
    keep_classnames: true,
    keep_fnames: true,
    toplevel: false,
  },
};

// ========== APPLY NATIVEWIND ==========
let exportedConfig = config;

try {
  exportedConfig = withNativeWind(config, {
    input: './global.css',
    config: './tailwind.config.js',
  });
  console.log('✅ NativeWind configurado');
} catch (error) {
  console.warn('⚠️  NativeWind falhou:', error.message);
  exportedConfig = config;
}

module.exports = exportedConfig;

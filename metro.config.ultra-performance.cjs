// metro.config.ultra-performance.cjs
/**
 * Ultra Performance Metro Configuration
 * Configuração industrial para builds ultra-rápidos e zero travamentos
 */

const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Configurações de cache ultra otimizadas
config.cacheStores = [
  new (require('metro-cache').FileStore)({
    root: require('path').join(__dirname, '.metro-cache-ultra'),
    maxSize: 500 * 1024 * 1024, // 500MB cache
    // Cache mais agressivo para builds repetidos
  }),
];

// Otimizações de transformação agressivas
config.transformer = {
  ...config.transformer,
  // Minificação ultra agressiva
  minifierConfig: {
    compress: {
      dead_code: true,
      drop_console: true,
      drop_debugger: true,
      drop_safari_10: true,
      ecma: 2022,
      evaluate: true,
      hoist_funs: true,
      hoist_props: true,
      inline: 2,
      loops: true,
      negate_iife: true,
      passes: 3, // Múltiplos passes
      properties: true,
      reduce_funcs: true,
      reduce_vars: true,
      side_effects: true,
      switches: true,
      toplevel: true,
      unsafe: true,
      unsafe_comps: true,
      unsafe_Function: true,
      unsafe_math: true,
      unsafe_proto: true,
      unsafe_regexp: true,
      unused: true,
    },
    mangle: {
      eval: true,
      keep_classnames: false,
      keep_fnames: false,
      module: true,
      reserved: [],
      toplevel: true,
      safari10: true,
    },
    output: {
      ascii_only: true,
      beautify: false,
      comments: false,
      indent_level: 0,
      indent_start: 0,
      inline_script: true,
      max_line_len: false,
      preamble: '',
      quote_keys: false,
      quote_style: 3,
      semicolons: true,
      shebang: true,
      webkit: false,
    },
    format: {
      comments: false,
    },
  },
  
  // Optimizações de babel
  babelTransformerPath: require.resolve('metro-react-native-babel-transformer'),
  
  // Configurações de resolução otimizadas
  assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  
  // Optimizações de importação
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
      nonGlobal: true,
    },
  }),
};

// Resolução de módulos ultra otimizada
config.resolver = {
  ...config.resolver,
  // Priorizar exports otimizados
  mainFields: ['react-native', 'browser', 'main', 'module'],
  
  // Platform resolution otimizada
  platforms: ['ios', 'android', 'native'],
  
  // Alias para imports mais rápidos
  alias: {
    ...config.resolver.alias,
    'react-native-css-interop/jsx-runtime': 'react-native-css-interop',
    '@': './src',
    '@/components': './src/components',
    '@/utils': './src/utils',
    '@/services': './src/services',
    '@/types': './src/types',
    '@/hooks': './src/hooks',
  },
  
  // Node modules resolution otimizada
  nodeModulesDirs: [
    'node_modules',
  ],
  
  // Blocklist para arquivos desnecessários
  blockList: [
    /.*\.test\.(js|jsx|ts|tsx)$/,
    /.*\.spec\.(js|jsx|ts|tsx)$/,
    /.*\.stories\.(js|jsx|ts|tsx)$/,
    /.*\.e2e\.(js|jsx|ts|tsx)$/,
    /.*\/__tests__\/.*/,
    /.*\/__mocks__\/.*/,
  ],
  
  // Source extensions otimizadas
  sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json'],
};

// Serializer otimizado
config.serializer = {
  ...config.serializer,
  // Custom serializer para otimização adicional
  customSerializer: (src, filename, options) => {
    let optimizedCode = src;
    
    // Remover código de desenvolvimento em produção
    if (process.env.NODE_ENV === 'production') {
      // Remover console logs
      optimizedCode = optimizedCode.replace(/console\.(log|warn|error|info|debug)\([^)]*\);?/g, '');
      
      // Remover debugger statements
      optimizedCode = optimizedCode.replace(/debugger;/g, '');
      
      // Remover comentários
      optimizedCode = optimizedCode.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');
      
      // Remover __DEV__ blocks
      optimizedCode = optimizedCode.replace(/if\s*\(__DEV__\)\s*\{[\s\S]*?\}/g, '');
    }
    
    // Usar serializer default
    return require('metro/src/JSTransform/worker').default(optimizedCode, filename, options);
  },
  
  // Optimizações de serialização
  getRunModuleStatement: (moduleId) => `__r(${moduleId});`,
  
  // Polyfills otimizados
  polyfillModuleNames: [],
};

// Configurações de servidor para desenvolvimento rápido
config.server = {
  ...config.server,
  port: process.env.METRO_PORT || 8081,
  
  // Watch settings otimizados
  watch: {
    enabled: true,
    poll: false,
    aggregateTimeout: 200,
  },
  
  // HTTP settings
  https: false,
  
  // Error overlay
  enhanceMiddleware: (middleware) => (req, res, next) => {
    // Headers para cache otimizado
    if (req.url.includes('.js') || req.url.includes('.json')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
    return middleware(req, res, next);
  },
};

// Configurações de monitoramento
config.reporter = {
  update: (event) => {
    if (event.type === 'build_done') {
      console.log(`Build completed in ${event.buildTime}ms`);
    }
  },
};

// Configurações específicas para ambiente
if (__DEV__) {
  // Desenvolvimento: cache mais rápido
  config.resetCache = false;
  config.maxWorkers = require('os').cpus().length;
} else {
  // Produção: otimizações máximas
  config.resetCache = true;
  config.maxWorkers = 1; // Single thread para consistência
}

// Configurações de Hermes (para React Native)
if (process.env.NODE_ENV === 'production') {
  config.transformer.minifierConfig.compress.hermes = true;
  config.transformer.minifierConfig.output.hermes = true;
}

// Configurações de Turbo Modules
config.resolver.unstable_enableSymlinks = true;
config.resolver.unstable_enablePackageExports = true;

// Aplicar NativeWind com otimizações
const finalConfig = withNativeWind(config, {
  input: './global.css',
  configPath: './tailwind.config.js',
  projectRoot: __dirname,
  inlineRem: false, // Melhor performance
  logLevel: 'warn', // Menos logs
  output: './nativewind-output',
  // Otimizações do NativeWind
  experimental: {
    useWebMD: true,
  },
});

// Exportar configuração final
module.exports = finalConfig;

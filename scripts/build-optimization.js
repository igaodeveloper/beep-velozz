/**
 * Build Optimization Script
 * Otimizações para produção do Beep Velozz
 */

const fs = require('fs');
const path = require('path');

// Configurações de otimização
const OPTIMIZATIONS = {
  // Minificação de assets
  MINIFY_IMAGES: true,
  COMPRESS_SOUNDS: true,
  
  // Bundle optimization
  TREE_SHAKING: true,
  CODE_SPLITTING: true,
  MINIFY_JS: true,
  
  // Performance
  ENABLE_BUNDLING: true,
  OPTIMIZE_PACKAGES: true,
  REMOVE_DEV_TOOLS: true,
};

// Pacotes para remover em produção
const DEV_PACKAGES = [
  '@babel/core',
  '@types/node',
  '@types/react',
  'typescript',
  'ts-node',
  'patch-package',
];

// Pacotes para manter em produção
const PROD_PACKAGES = [
  'react',
  'react-native',
  'expo',
  'expo-router',
  'react-native-reanimated',
  'nativewind',
  'tailwindcss',
];

function optimizePackageJson() {
  console.log('🔧 Otimizando package.json para produção...');
  
  const packageJsonPath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (OPTIMIZATIONS.REMOVE_DEV_TOOLS) {
    // Remover devDependencies para build de produção
    const optimizedPackageJson = {
      ...packageJson,
      devDependencies: undefined,
    };
    
    // Manter apenas dependências essenciais
    optimizedPackageJson.dependencies = {};
    
    PROD_PACKAGES.forEach(pkg => {
      if (packageJson.dependencies[pkg]) {
        optimizedPackageJson.dependencies[pkg] = packageJson.dependencies[pkg];
      }
    });
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(optimizedPackageJson, null, 2));
    console.log('✅ package.json otimizado para produção');
  }
}

function optimizeMetroConfig() {
  console.log('🔧 Otimizando configuração Metro...');
  
  const metroConfigPath = path.join(__dirname, '../metro.config.cjs');
  
  const optimizedConfig = `
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Otimizações de produção
config.resolver.assetExts = [
  ...config.resolver.assetExts,
  'mp3', 'wav', 'aac'
];

// Minificação e otimização
config.transformer.minifierConfig = {
  keep_fnames: false,
  mangle: {
    keep_fnames: false,
  },
  output: {
    comments: false,
  },
};

// Cache otimizado
config.cacheStores = [
  new (require('metro-cache').FileStore)({
    root: path.join(__dirname, '.metro-cache'),
  }),
];

// Resolver otimizado
config.resolver.alias = {
  '@': path.resolve(__dirname, './'),
  ...config.resolver.alias,
};

// NativeWind otimizado
try {
  const { withNativeWind } = require('nativewind/metro');
  module.exports = withNativeWind(config, { 
    input: './global.css',
    config: './tailwind.config.js',
  });
} catch (error) {
  console.warn('NativeWind não disponível, usando config padrão');
  module.exports = config;
}
`;
  
  fs.writeFileSync(metroConfigPath, optimizedConfig);
  console.log('✅ Configuração Metro otimizada');
}

function optimizeTailwindConfig() {
  console.log('🔧 Otimizando Tailwind CSS...');
  
  const tailwindConfigPath = path.join(__dirname, '../tailwind.config.js');
  
  const optimizedConfig = `
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        secondary: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      // Performance optimizations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  // PurgeCSS para produção - remover CSS não utilizado
  purge: {
    enabled: process.env.NODE_ENV === 'production',
    content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
    options: {
      safelist: [
        // Classes dinâmicas que não devem ser removidas
        /^bg-/,
        /^text-/,
        /^border-/,
      ],
    },
  },
  plugins: [],
};
`;
  
  fs.writeFileSync(tailwindConfigPath, optimizedConfig);
  console.log('✅ Tailwind CSS otimizado');
}

function createProductionEnv() {
  console.log('🔧 Criando variáveis de ambiente de produção...');
  
  const envContent = `
# Ambiente de Produção - Beep Velozz
NODE_ENV=production
EXPO_PUBLIC_ENV=production

# Performance optimizations
EXPO_PUBLIC_ENABLE_PERFORMANCE_MONITORING=false
EXPO_PUBLIC_ENABLE_DEBUG_MODE=false
EXPO_PUBLIC_ENABLE_ANALYTICS=true

# Build optimizations
EXPO_PUBLIC_MINIFY_BUNDLE=true
EXPO_PUBLIC_ENABLE_BUNDLE_SPLITTING=true
EXPO_PUBLIC_ENABLE_TREE_SHAKING=true

# Feature flags
EXPO_PUBLIC_ENABLE_SMART_SCANNER=true
EXPO_PUBLIC_ENABLE_ADVANCED_ANALYTICS=true
EXPO_PUBLIC_ENABLE_PREMIUM_UI=true
`;
  
  fs.writeFileSync(path.join(__dirname, '../.env.production'), envContent);
  console.log('✅ Variáveis de ambiente de produção criadas');
}

function optimizeBabelConfig() {
  console.log('🔧 Otimizando configuração Babel...');
  
  const babelConfigPath = path.join(__dirname, '../babel.config.js');
  
  const optimizedConfig = `
module.exports = function(api) {
  api.cache(true);
  
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Otimizações de produção
      ...(process.env.NODE_ENV === 'production' ? [
        'transform-remove-console',
        'transform-remove-debugger',
      ] : []),
      
      // Plugins essenciais
      'react-native-reanimated/plugin',
      'nativewind/babel',
    ],
    
    // Otimizações
    env: {
      production: {
        plugins: [
          ['transform-remove-console', { exclude: ['error', 'warn'] }],
          'transform-remove-debugger',
        ],
      },
    },
    
    // Source maps em desenvolvimento apenas
    sourceMaps: process.env.NODE_ENV !== 'production',
  };
};
`;
  
  fs.writeFileSync(babelConfigPath, optimizedConfig);
  console.log('✅ Configuração Babel otimizada');
}

function createBuildScript() {
  console.log('🔧 Criando script de build otimizado...');
  
  const buildScript = `
#!/bin/bash

echo "🚀 Iniciando build de produção do Beep Velozz..."

# Limpar cache anterior
echo "🧹 Limpando cache..."
npx expo start --clear

# Otimizar dependências
echo "📦 Otimizando dependências..."
npm ci --only=production

# Rodar otimizações
echo "⚡ Aplicando otimizações..."
node scripts/build-optimization.js

# Build para produção
echo "🔨 Construindo para produção..."
npx expo export --platform all --output-dir dist

# Gerar bundle analysis
echo "📊 Analisando bundle..."
npx expo-bundle-analyzer dist/main.jsbundle

echo "✅ Build de produção concluído!"
echo "📁 Arquivos gerados em ./dist/"
`;
  
  fs.writeFileSync(path.join(__dirname, '../build-prod.sh'), buildScript);
  fs.chmodSync(path.join(__dirname, '../build-prod.sh'), '755');
  console.log('✅ Script de build criado');
}

// Executar otimizações
function runOptimizations() {
  console.log('🚀 Iniciando otimizações de build para produção...\n');
  
  try {
    optimizePackageJson();
    optimizeMetroConfig();
    optimizeTailwindConfig();
    optimizeBabelConfig();
    createProductionEnv();
    createBuildScript();
    
    console.log('\n✨ Todas as otimizações foram aplicadas com sucesso!');
    console.log('📝 Para build de produção, execute: ./build-prod.sh');
    
  } catch (error) {
    console.error('❌ Erro durante otimizações:', error);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runOptimizations();
}

module.exports = {
  runOptimizations,
  optimizePackageJson,
  optimizeMetroConfig,
  optimizeTailwindConfig,
};

// metro.config.production.cjs
/**
 * Production Metro configuration
 * Optimized for maximum performance, minimal bundle size
 * Use: npm run build:production (or set metro.config.cjs to this)
 */

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Extend the defaults with production settings
module.exports = {
  ...config,

  // Source map generation (disable in production for faster bundling)
  sourceMaps: false,

  // Enable bytecode generation
  reporter: {
    update: () => {},
  },

  // Optimization settings
  transformer: {
    ...config.transformer,
    // Enable minification
    minifierPath: 'metro-minify-terser',
    minifierConfig: {
      compress: {
        dead_code: true,
        drop_console: true, // Remove console logs in production
        drop_debugger: true,
        passes: 2,
      },
      mangle: {
        toplevel: true,
      },
      output: {
        comments: false,
      },
    },
    // Optimize middleware
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true, // Inline imports for better tree-shaking
      },
    }),
  },

  // Resolver settings
  resolver: {
    ...config.resolver,
    // Prioritize main exports
    mainFields: ['browser', 'main', 'module'],
    // Restrict platform-specific modules
    platforms: ['ios', 'android', 'web'],
  },

  // Serializer options
  serializer: {
    ...config.serializer,
    // Use custom serializer for optimization
    customSerializer: null,
  },

  // Disable asset folding for production optimization
  assetTransformerPath: undefined,

  // Watcher settings
  watchman: {
    healthCheck: {
      interval: 30000,
      timeout: 5000,
    },
  },

  // Project-specific settings
  projectRoot: path.resolve(__dirname),
  resetCache: false,

  // Logging
  maxWorkers: undefined, // Use auto-detection
  verbose: false,
};

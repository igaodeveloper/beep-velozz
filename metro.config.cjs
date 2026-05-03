// Metro config padrão do Expo - sem modificações
// Deixe o Expo gerenciar tudo automaticamente

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Problematic modules that don't work in React Native/Hermes
const PROBLEMATIC_MODULES = [
  'idb',
  'indexeddb',
  'localforage',
  'level',
  'rlp',
  'web-encoding',
  'openindexeddb',
];

// Custom resolver to handle Firebase's idb dependency
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Redirect problematic browser modules to mock
  if (PROBLEMATIC_MODULES.includes(moduleName)) {
    return {
      filePath: path.resolve(__dirname, 'mocks/idb.js'),
      type: 'sourceFile',
    };
  }
  // Use default resolution for all other modules
  return context.resolveRequest(context, moduleName, platform);
};

// Add alias mapping as fallback
if (!config.resolver.extraNodeModules) {
  config.resolver.extraNodeModules = {};
}

config.resolver.extraNodeModules['idb'] = path.resolve(
  __dirname,
  'mocks/idb.js'
);

module.exports = config;

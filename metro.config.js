const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Add CSS support for NativeWind
config.resolver.sourceExts = [...config.resolver.sourceExts, 'css'];

// Add alias support for @/ imports
config.resolver.alias = {
  '@': './',
};

module.exports = config;

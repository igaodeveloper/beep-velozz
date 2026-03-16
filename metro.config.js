const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Adicionar suporte para react-native-css-interop
config.resolver.alias = {
  ...config.resolver.alias,
  'react-native-css-interop/jsx-runtime': 'react-native-css-interop',
};

module.exports = withNativeWind(config, { input: "./global.css" });

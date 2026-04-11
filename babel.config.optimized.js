/**
 * Babel Config Optimized - Ultra Fast Transpilation
 * Configuração otimizada para transpilação ultra-rápida
 */

module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          // Otimizações de desenvolvimento
          development: __DEV__,
          // Remover prop-types em produção
          removePropTypeExports: !__DEV__,
          // Otimizar imports
          optimizePackageImports: ["react-native-reanimated", "expo-camera"],
        },
      ],
      "nativewind/babel",
    ],
    plugins: [
      "react-native-reanimated/plugin",
      // Plugin para remover console.log em produção
      __DEV__ ? null : "transform-remove-console",
      // Plugin para dead code elimination
      __DEV__ ? null : "babel-plugin-transform-remove-debugger",
      // Plugin para otimizar imports
      [
        "babel-plugin-optimize-exports",
        {
          exports: {
            "react-native": ["View", "Text", "TouchableOpacity", "ScrollView"],
            "expo-camera": ["CameraView", "useCameraPermissions"],
          },
        },
      ],
    ].filter(Boolean),
    // Otimizações de performance
    env: {
      production: {
        plugins: [
          // Minificação em tempo de build
          [
            "babel-plugin-minify-dead-code-elimination",
            {
              keepFnName: false,
              keepFnArgs: false,
              keepClassName: false,
            },
          ],
          // Otimizar literais
          ["babel-plugin-transform-react-constant-elements"],
          // Inline elementos
          ["babel-plugin-transform-react-inline-elements"],
        ],
      },
    },
    // Cache otimizado
    cacheDirectory: true,
    // Source maps apenas em desenvolvimento
    sourceMaps: __DEV__ ? "both" : false,
    // Compactar saída em produção
    compact: !__DEV__,
    // Comentários apenas em desenvolvimento
    comments: __DEV__,
  };
};

module.exports = function (api) {
  api.cache(true);

  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      [
        "react-native-reanimated/plugin",
        {
          relativeSourceLocation: true,
        },
      ],
      // Transformer para ignorar módulos problemáticos do browser
      [
        "@babel/plugin-transform-runtime",
        {
          useESModules: false,
        },
      ],
    ],
  };
};

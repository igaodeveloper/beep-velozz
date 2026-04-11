/** @type {import('nativewind').NativeWindConfig} */
module.exports = {
  input: "./global.css",
  config: "./tailwind.config.js",
  projectRoot: __dirname,
  // Desabilitar recursos avançados para compatibilidade
  output: {
    async: false,
  },
  inlineRequire: false,
};

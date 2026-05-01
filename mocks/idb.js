/**
 * Mock para o módulo "idb"
 * Esse módulo é usado pelo Firebase mas não é compatível com React Native
 * Este mock previne erros de bundling
 */

// Export empty implementations para evitar erros de importação
module.exports = {
  openDB: () => Promise.resolve(null),
  deleteDB: () => Promise.resolve(),
  wrap: (val) => val,
  unwrap: (val) => val,
};

// ES6 exports
module.exports.default = module.exports;

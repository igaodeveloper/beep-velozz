/**
 * Mock para módulos browser-only
 * Usado por: idb, indexeddb, localforage, level, rlp, web-encoding, etc
 * 
 * Este arquivo previne erros de bundling ao providenciar
 * implementações vazias para módulos não compatíveis com React Native
 */

// Mock implementações para módulos comuns
const emptyFunction = () => Promise.resolve(null);
const emptyAsyncFunction = async () => null;

module.exports = {
  // IDB APIs
  openDB: emptyFunction,
  deleteDB: emptyFunction,
  wrap: (val) => val,
  unwrap: (val) => val,

  // IndexedDB fallbacks
  indexedDB: {
    open: emptyFunction,
    deleteDatabase: emptyFunction,
  },
  IDBDatabase: {},
  IDBObjectStore: {},
  IDBIndex: {},
  IDBCursor: {},
  IDBKeyRange: {},
  IDBTransaction: {},
  IDBVersionChangeEvent: {},

  // LocalForage APIs
  setItem: emptyFunction,
  getItem: emptyFunction,
  removeItem: emptyFunction,
  clear: emptyFunction,
  length: 0,
  key: emptyFunction,

  // Level DB APIs
  Level: class {
    constructor() {}
    open() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
    get() { return Promise.resolve(null); }
    put() { return Promise.resolve(); }
    del() { return Promise.resolve(); }
    batch() { return Promise.resolve(); }
  },

  // Encoding APIs
  encode: (str) => Buffer.from(str, 'utf-8'),
  decode: (buf) => buf.toString('utf-8'),
  TextEncoder: class {
    encode(str) { return new Uint8Array(); }
  },
  TextDecoder: class {
    decode(arr) { return ''; }
  },

  // RLP encoding
  encode: (data) => Buffer.from(''),
  decode: (data) => null,

  // Generic exports
  default: module.exports,
  __esModule: true,
};

// Também exportar como default para importações ES6
module.exports.default = module.exports;

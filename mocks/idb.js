/**
 * Mock for Firebase's idb dependency
 * Firebase uses this for offline storage in browsers
 * In React Native, Firebase automatically uses AsyncStorage instead
 * This mock simply prevents bundling errors
 */

module.exports = {
  openDB: () => Promise.resolve(null),
  deleteDB: () => Promise.resolve(),
  wrap: (val) => val,
  unwrap: (val) => val,
  default: module.exports,
};

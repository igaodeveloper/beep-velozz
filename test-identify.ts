import { normalizeCode, identifyPackage } from './utils/scannerIdentification';

const samples = ['200001234567', '46123456789', 'LMABCDEFG', '14XYZ', 'BR123456', 'MLB1234', 'ML1234'];
for (const s of samples) {
  const code = normalizeCode(s);
  console.log(s, '=>', identifyPackage(code));
}

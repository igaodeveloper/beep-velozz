const {
  normalizeCode,
  identifyPackage,
} = require("./utils/scannerIdentification");

const codes = [
  "LM123456",
  "14abcdef",
  "BR987654",
  "2000012345",
  "46123456",
  "45123456",
];

codes.forEach((c) => {
  const norm = normalizeCode(c);
  const id = identifyPackage(norm);
  console.log(c, "=>", norm, id);
});

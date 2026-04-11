/**
 * TESTE DE CONSOLE PARA SCANNER
 * Cole este código no console do Expo Go para testar
 */

// ============================================
// TESTE 1: NORMALIZAÇÃO
// ============================================
console.log("\n🧪 TESTE 1: NORMALIZAÇÃO");
console.log("=".repeat(50));

try {
  const { normalizeCode } = require("@/utils/scannerIdentification");
  console.log("✅ Módulo carregado");

  const testCodes = [
    "2200D 1241459785",
    "2200D1241459785",
    "4482D 247404",
    "4482D247404",
    "ID2200D1241459785",
  ];

  testCodes.forEach((code) => {
    const normalized = normalizeCode(code);
    console.log(`"${code}" → "${normalized}"`);
  });
} catch (error) {
  console.error("❌ Erro na normalização:", error);
}

// ============================================
// TESTE 2: IDENTIFICAÇÃO
// ============================================
console.log("\n🧪 TESTE 2: IDENTIFICAÇÃO");
console.log("=".repeat(50));

try {
  const { identifyPackage } = require("@/utils/scannerIdentification");

  const codes = [
    "2200D1241459785",
    "4482D247404",
    "20000123456",
    "BR123456789",
    "LM123456",
  ];

  codes.forEach((code) => {
    const result = identifyPackage(code);
    console.log(`"${code}" → ${result.type} (${result.matched ? "✅" : "❌"})`);
  });
} catch (error) {
  console.error("❌ Erro na identificação:", error);
}

// ============================================
// TESTE 3: ÁUDIO
// ============================================
console.log("\n🧪 TESTE 3: ÁUDIO");
console.log("=".repeat(50));

async function testAudio() {
  try {
    const { playBeepB } = require("@/utils/sound");
    console.log("🎵 Testando BEEP_B...");
    await playBeepB();
    console.log("✅ BEEP_B tocado com sucesso!");
  } catch (error) {
    console.error("❌ Erro no áudio:", error);
  }

  try {
    const {
      ScannerAudioService,
      ScannerAudioType,
    } = require("@/utils/scannerAudio");
    console.log("🎵 Testando ScannerAudioService...");
    const audioService = new ScannerAudioService();
    await audioService.playAudio(ScannerAudioType.BEEP_B);
    console.log("✅ ScannerAudioService funcionou!");
  } catch (error) {
    console.error("❌ Erro no ScannerAudioService:", error);
  }
}

testAudio()
  .then(() => {
    console.log("\n🎉 TESTES CONCLUÍDOS!");
    console.log("=".repeat(50));
    console.log("");
    console.log("Se você viu todos ✅, o scanner deve funcionar!");
    console.log("Agora teste escaneando: 2200D1241459785");
  })
  .catch((err) => {
    console.error("\n❌ FALHA GERAL:", err);
  });

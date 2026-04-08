/**
 * Simulador de Etiqueta Mercado Livre
 * Baseado na etiqueta fornecida pelo usuário
 * 
 * Use este arquivo para testar o scanner com os dados reais
 */

// Dados da etiqueta fornecida
export const MERCADO_LIVRE_ETIQUETA = {
  // Identidade do pacote
  destinatario: {
    nome: 'Luana Ribeiro Magalhães',
    codigo: 'LURIBEIROMAGA',
    endereco: 'Avenida Imirim 702',
    bairro: 'Imirim (NORTE 1)',
    complemento: 'Apartamento 15',
    cep: '02464000',
    cidade: 'São Paulo',
    estado: 'SP',
  },

  // Informações de Envio
  envio: {
    tipo: 'FLEX',
    data: '08 ABR',
    ambiente: 'RESIDENCIAL',
  },

  // CÓDIGOS IMPORTANTES DO QR CODE
  // Estes são os valores que o scanner vai ler
  codigos: {
    packId: '2200D1241459785', // Principal (com espaço: "2200D 1241459785")
    envioId: '4482D247404',     // Alternativo (com espaço: "4482D24 7404")
    remetente: 'Marcelo Vilas Boas Marcel #63338428',
    remetente_endereco: 'Avenida Alvaro Namos 2498 - Quarta Parada, São Paulo',
  },

  // Mapeamento para teste
  testCases: [
    {
      name: 'Pack ID (principal)',
      code: '2200D1241459785',
      expectedType: 'mercado_livre',
      expectedAudio: 'BEEP_B',
      shouldBip: true,
    },
    {
      name: 'Pack ID com espaço',
      code: '2200D 1241459785',
      expectedType: 'mercado_livre',
      expectedAudio: 'BEEP_B',
      shouldBip: true,
    },
    {
      name: 'Envio ID',
      code: '4482D247404',
      expectedType: 'mercado_livre',
      expectedAudio: 'BEEP_B',
      shouldBip: true,
    },
    {
      name: 'Envio ID com espaço',
      code: '4482D24 7404',
      expectedType: 'mercado_livre',
      expectedAudio: 'BEEP_B',
      shouldBip: true,
    },
  ],
};

/**
 * Simula varredura de QR code
 * Use para testar no ScannerView
 */
export function simulateQRCodeScan(): string {
  // Retorna o Pack ID (código mais comum no QR)
  return MERCADO_LIVRE_ETIQUETA.codigos.packId;
}

/**
 * Simula múltiplas varreduras (para teste de batch)
 */
export function simulateMultipleScan(count: number): string[] {
  const codes = [];
  for (let i = 0; i < count; i++) {
    // Alterna entre Pack ID e Envio ID
    if (i % 2 === 0) {
      codes.push(MERCADO_LIVRE_ETIQUETA.codigos.packId);
    } else {
      codes.push(MERCADO_LIVRE_ETIQUETA.codigos.envioId);
    }
  }
  return codes;
}

/**
 * Exibe informações da etiqueta
 */
export function displayEtiquetaInfo(): void {
  console.log('\n' + '='.repeat(70));
  console.log('📦 INFORMAÇÕES DA ETIQUETA MERCADO LIVRE');
  console.log('='.repeat(70) + '\n');

  console.log('👤 DESTINATÁRIO:');
  console.log(`   Nome: ${MERCADO_LIVRE_ETIQUETA.destinatario.nome}`);
  console.log(`   Endereço: ${MERCADO_LIVRE_ETIQUETA.destinatario.endereco}`);
  console.log(`   Bairro: ${MERCADO_LIVRE_ETIQUETA.destinatario.bairro}`);
  console.log(`   CEP: ${MERCADO_LIVRE_ETIQUETA.destinatario.cep}\n`);

  console.log('📬 ENVIO:');
  console.log(`   Tipo: ${MERCADO_LIVRE_ETIQUETA.envio.tipo}`);
  console.log(`   Data: ${MERCADO_LIVRE_ETIQUETA.envio.data}`);
  console.log(`   Ambiente: ${MERCADO_LIVRE_ETIQUETA.envio.ambiente}\n`);

  console.log('📱 CÓDIGOS QR:');
  console.log(`   Principal (Pack): ${MERCADO_LIVRE_ETIQUETA.codigos.packId}`);
  console.log(`   Alternativo (Envio): ${MERCADO_LIVRE_ETIQUETA.codigos.envioId}\n`);

  console.log('✅ COMPORTAMENTO ESPERADO:');
  console.log(`   Tipo Identificado: mercado_livre`);
  console.log(`   Áudio Esperado: BEEP_B`);
  console.log(`   Status: DEVE BIPAR ✓\n`);

  console.log('='.repeat(70) + '\n');
}

// Exibe info ao importar
if (typeof window === 'undefined') {
  // Server-side (Node.js): exibe automaticamente
  // displayEtiquetaInfo();
}

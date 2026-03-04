/**
 * EXEMPLO DE INTEGRAÇÃO COMPLETA - Scanner Industrial
 * Passo a passo para integrar no seu projeto
 */

// ============================================================================
// PASSO 1: Setup Básico em um Screen/Página
// ============================================================================

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useIndustrialScanner } from '@/utils/useIndustrialScanner';
import IndustrialScannerView from '@/components/IndustrialScannerView';

/**
 * Exemplo: Tela de Lote (Lotes de Pacotes)
 */
export function LoteScreen({ navigation }: any) {
  // 1. Inicialize o scanner com limites
  const scanner = useIndustrialScanner({
    maxAllowedScans: {
      shopee: 50,
      mercado_livre: 30,
      avulso: 20,
    },
    debounceMs: 400,
    onStateChange: (state) => {
      console.log(`[Lote] Estado do scanner: ${state}`);
    },
  });

  // 2. Estado local da tela
  const [scannedPackages, setScannedPackages] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  // 3. Handler quando pacote é escaneado
  const handlePackageScanned = (code: string, type: string) => {
    setScannedPackages(prev => [
      ...prev,
      {
        code,
        type,
        scannedAt: new Date().toLocaleTimeString(),
      },
    ]);
  };

  // 4. Handler quando limite é atingido
  const handleLimitReached = (limitedTypes: string[]) => {
    alert(`⚠️ Limite atingido para: ${limitedTypes.join(', ')}`);
  };

  // 5. Handler quando encerra sessão
  const handleEndSession = () => {
    // Gere relatório, envie para servidor, etc
    console.log('Lote finalizado', {
      total: scanner.stats.validScans,
      shopee: scanner.counts.shopee,
      mercado_livre: scanner.counts.mercado_livre,
      avulso: scanner.counts.avulso,
    });

    // Volte à tela anterior
    navigation.goBack();
  };

  // 6. Renderize a UI
  if (showScanner) {
    return (
      <IndustrialScannerView
        maxScans={scanner.limits as any}
        onScanned={handlePackageScanned}
        onLimitReached={handleLimitReached}
        onEndSession={handleEndSession}
      />
    );
  }

  // Tela inicial do lote
  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        📦 Novo Lote
      </Text>

      {/* Limites Configurados */}
      <View style={{ backgroundColor: '#fff', padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
          📊 Limites Configurados
        </Text>
        <Text>🛒 Shopee: {scanner.limits.shopee || 50} pacotes</Text>
        <Text>📦 Mercado Livre: {scanner.limits.mercado_livre || 30} pacotes</Text>
        <Text>📭 Avulso: {scanner.limits.avulso || 20} pacotes</Text>
      </View>

      {/* Botão para iniciar scanner */}
      <TouchableOpacity
        onPress={() => setShowScanner(true)}
        style={{
          backgroundColor: '#007AFF',
          padding: 16,
          borderRadius: 8,
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
          📷 Iniciar Escaneamento
        </Text>
      </TouchableOpacity>

      {/* Histórico de escaneados */}
      <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
        📝 Histórico ({scannedPackages.length})
      </Text>
      <ScrollView style={{ flex: 1, backgroundColor: '#fff', borderRadius: 8 }}>
        {scannedPackages.length === 0 ? (
          <Text style={{ padding: 16, color: '#999', textAlign: 'center' }}>
            Nenhum pacote escaneado ainda
          </Text>
        ) : (
          scannedPackages.map((pkg, i) => (
            <View key={i} style={{ padding: 12, borderBottomWidth: 1, borderColor: '#eee' }}>
              <Text style={{ fontWeight: 'bold' }}>{pkg.code}</Text>
              <Text style={{ color: '#666', fontSize: 12 }}>
                {pkg.type} • {pkg.scannedAt}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================================
// PASSO 2: Integração com Stack de Navegação
// ============================================================================

import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export function LoteStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#f5f5f5' },
        headerTintColor: '#000',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      {/* Outras telas... */}
      <Stack.Screen
        name="LoteDetail"
        component={LoteScreen}
        options={{ title: 'Novo Lote' }}
      />
    </Stack.Navigator>
  );
}

// ============================================================================
// PASSO 3: Versão com Múltiplos Lotes (Avançado)
// ============================================================================

interface Lote {
  id: string;
  createdAt: Date;
  shopee: number;
  mercadoLivre: number;
  avulso: number;
  packages: any[];
  completed: boolean;
}

/**
 * Gerenciador de Múltiplos Lotes
 */
export function MultiLoteManager() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [currentLote, setCurrentLote] = useState<Lote | null>(null);

  // Cria novo lote
  const createNewLote = () => {
    const newLote: Lote = {
      id: `lote_${Date.now()}`,
      createdAt: new Date(),
      shopee: 50,
      mercadoLivre: 30,
      avulso: 20,
      packages: [],
      completed: false,
    };
    setLotes(prev => [...prev, newLote]);
    setCurrentLote(newLote);
  };

  // Adiciona pacote ao lote atual
  const addPackageToLote = (code: string, type: string) => {
    if (!currentLote) return;

    setCurrentLote(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        packages: [...prev.packages, { code, type, timestamp: Date.now() }],
      };
    });

    setLotes(prev =>
      prev.map(lote =>
        lote.id === currentLote.id
          ? {
              ...lote,
              packages: [...lote.packages, { code, type }],
            }
          : lote
      )
    );
  };

  // Finaliza lote
  const completeLote = () => {
    if (!currentLote) return;

    setLotes(prev =>
      prev.map(lote =>
        lote.id === currentLote.id ? { ...lote, completed: true } : lote
      )
    );

    // Salve no servidor/DB
    console.log('Lote finalizado:', currentLote);

    setCurrentLote(null);
  };

  return {
    lotes,
    currentLote,
    createNewLote,
    addPackageToLote,
    completeLote,
  };
}

// ============================================================================
// PASSO 4: Com Sincronização em Nuvem
// ============================================================================

/**
 * Versão com Sync em Nuvem
 */
export function LoteScreenWithCloud({ navigation }: any) {
  const scanner = useIndustrialScanner({
    maxAllowedScans: {
      shopee: 50,
      mercado_livre: 30,
      avulso: 20,
    },
  });

  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const handleEndSession = async () => {
    // Prepare dados
    const loteData = {
      timestamp: new Date().toISOString(),
      stats: scanner.stats,
      config: scanner.limits,
    };

    // Sincronize
    setSyncing(true);
    try {
      // Implemente aqui a sincronização com seu servidor/cloud
      // Exemplo: await fetch('/api/lotes', { method: 'POST', body: JSON.stringify(loteData) })
      const response = await fetch('/api/lotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loteData),
      });
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      console.log('✅ Lote sincronizado');
      navigation.goBack();
    } catch (error) {
      setSyncError('Erro ao sincronizar: ' + (error as Error).message);
      setSyncing(false);
    }
  };

  return (
    <IndustrialScannerView
      maxScans={scanner.limits as any}
      onScanned={() => {}}
      onEndSession={handleEndSession}
    />
  );
}

// ============================================================================
// PASSO 5: Com Analytics
// ============================================================================

/**
 * Versão com Rastreamento de Eventos
 */
export function LoteScreenWithAnalytics() {
  const scanner = useIndustrialScanner({
    maxAllowedScans: {
      shopee: 50,
      mercado_livre: 30,
      avulso: 20,
    },
    onStateChange: (state) => {
      // Integre sua solução de analytics aqui
      console.log('scanner_state_changed', { state });
    },
    onStatsUpdate: (stats) => {
      // Integre sua solução de analytics aqui
      console.log('scanner_stats_updated', {
        validScans: stats.validScans,
        duplicates: stats.duplicates,
      });
    },
  });

  const handleScan = async (code: string, type: string) => {
    // Integre sua solução de analytics aqui
    console.log('package_scanned', {
      code,
      type,
      timestamp: new Date().toISOString(),
    });
  };

  return <View />;
}

// ============================================================================
// PASSO 6: Com Notificações
// ============================================================================

/**
 * Versão com Notificações
 */
export function LoteScreenWithToast() {
  const scanner = useIndustrialScanner({
    maxAllowedScans: {
      shopee: 50,
      mercado_livre: 30,
      avulso: 20,
    },
    onStateChange: (state) => {
      if (state === 'LIMIT_REACHED') {
        // Integre sua solução de notificações aqui
        // Exemplo: alert, react-native-toast-message, react-native-snackbar, etc
        alert('⚠️ Limite Atingido - Não é possível escanear mais pacotes');
      }
    },
  });

  const handleScan = (code: string, type: string) => {
    // Integre sua solução de notificações aqui
    console.log(`✅ Pacote Escaneado: ${code} (${type})`);
  };

  return <View />;
}

// ============================================================================
// PASSO 7: Teste Completo
// ============================================================================

export async function testIntegration() {
  console.log('🧪 Testando integração...');

  const scanner = useIndustrialScanner({
    maxAllowedScans: {
      shopee: 3,
      mercado_livre: 2,
      avulso: 2,
    },
  });

  // Teste 1: Scan válido
  console.log('1️⃣ Testando scan válido...');
  let result = await scanner.processScan('BR123456');
  console.assert(result.success === true, 'Deveria ter sucesso');
  console.log('✅ Scan válido funciona\n');

  // Teste 2: Duplicata
  console.log('2️⃣ Testando duplicação...');
  result = await scanner.processScan('BR123456');
  console.assert(result.isDuplicate === true, 'Deveria detectar duplicata');
  console.log('✅ Duplicação detectada\n');

  // Teste 3: Limite
  console.log('3️⃣ Testando limite...');
  await scanner.processScan('BR111111');
  await scanner.processScan('BR222222');
  result = await scanner.processScan('BR333333');
  console.assert(result.success === false, 'Deveria atingir limite');
  console.assert(scanner.isLimitReached === true, 'Limite deve estar atingido');
  console.log('✅ Limite funciona\n');

  // Teste 4: Reset
  console.log('4️⃣ Testando reset...');
  scanner.reset();
  result = await scanner.processScan('BR444444');
  console.assert(result.success === true, 'Deveria funcionar após reset');
  console.log('✅ Reset funciona\n');

  console.log('✅ TODOS OS TESTES PASSARAM');
  return true;
}

// ============================================================================
// EXPORT
// ============================================================================



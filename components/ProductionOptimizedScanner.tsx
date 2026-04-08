// components/ProductionOptimizedScanner.tsx
/**
 * Scanner Component Fully Optimized for Production
 * Demonstrates best practices for performance, security, and reliability
 */

import React, { useCallback, useMemo, useRef, useEffect } from 'react';
import { View, FlatList, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { CameraView } from 'expo-camera';

// Imports from new production utilities
import { validateBarcode } from '@/src/utils/validators';
import { packagePricingService } from '@/services/packagePricingService';
import { useStableCallback, useDebouncedCallback } from '@/src/utils/memoization';
import { useOptimizedList, createOptimizedFlatListProps } from '@/src/utils/listOptimization';
import { useProductionCleanup, useAppStateChange } from '@/src/utils/productionBootstrap';
import { envConfig } from '@/src/config/envConfig';
import { ScannerAudioService, ScannerAudioType } from '@/utils/scannerAudio';
import { preloadSounds, unloadSounds } from '@/utils/sound';
import { identifyPackage } from '@/utils/scannerIdentification';

export interface ScannedPackageItem {
  id: string;
  barcode: string;
  type: string;
  price: number;
  timestamp: number;
}

interface ProductionOptimizedScannerProps {
  onPackageScan?: (pkg: ScannedPackageItem) => void;
  onError?: (error: Error) => void;
  maxPackages?: number;
}

/**
 * Production-optimized scanner component
 * - Uses memoization for performance
 * - Has proper error handling
 * - Validates all input
 * - Cleanup on unmount
 */
export const ProductionOptimizedScanner = React.memo<ProductionOptimizedScannerProps>(
  ({
    onPackageScan,
    onError,
    maxPackages = 100,
  }) => {
    // State
    const [packages, setPackages] = React.useState<ScannedPackageItem[]>([]);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Refs
    const lastScanRef = useRef<{ code: string; time: number } | null>(null);
    const audioServiceRef = useRef(new ScannerAudioService());

    // Cleanup management
    const { registerCleanup } = useProductionCleanup('ProductionOptimizedScanner');

    // Optimize list rendering
    const { processedItems, keyExtractor } = useOptimizedList(packages, {
      sortBy: (a, b) => b.timestamp - a.timestamp, // Most recent first
    });

    /**
     * Process scanned barcode with validation and error handling
     */
    const processScan = useStableCallback(async (rawBarcode: string) => {
      try {
        setIsProcessing(true);
        setError(null);

        console.log(`[ProductionOptimizedScanner] 📥 ENTRADA: "${rawBarcode}"`);

        // Debounce rapid scans (prevent duplicates within 1s)
        if (lastScanRef.current) {
          const timeSinceLastScan = Date.now() - lastScanRef.current.time;
          if (
            timeSinceLastScan < 1000 &&
            lastScanRef.current.code === rawBarcode.trim()
          ) {
            console.warn('⚠️ Duplicate scan detected, ignoring');
            return;
          }
        }

        // Validate barcode format
        console.log(`[ProductionOptimizedScanner] 🔍 VALIDANDO: "${rawBarcode}"`);
        const validation = validateBarcode(rawBarcode);
        console.log(`[ProductionOptimizedScanner] ✅ VALIDAÇÃO: ${validation.isValid ? 'PASSOU' : 'FALHOU'}`);
        if (!validation.isValid) {
          const errorMsg = validation.errors?.[0] || 'Invalid barcode';
          console.error(`[ProductionOptimizedScanner] ❌ ERRO VALIDAÇÃO: ${errorMsg}`);
          setError(errorMsg);
          onError?.(new Error(errorMsg));
          return;
        }

        const barcode = validation.data!;
        console.log(`[ProductionOptimizedScanner] 📋 BARCODE NORMALIZADO: "${barcode}"`);

        // Identify package type using the correct identification function
        console.log(`[ProductionOptimizedScanner] 🎯 IDENTIFICANDO: "${barcode}"`);
        const pkgInfo = identifyPackage(barcode);
        console.log(`[ProductionOptimizedScanner] 📊 RESULTADO: type="${pkgInfo.type}", matched=${pkgInfo.matched}`);
        const type = pkgInfo.type;
        const price = packagePricingService.getPriceForType(type);
        console.log(`[ProductionOptimizedScanner] 💰 PREÇO: type="${type}" → price=${price}`);

        // Create new package
        const newPackage: ScannedPackageItem = {
          id: `${barcode}-${Date.now()}`,
          barcode,
          type,
          price,
          timestamp: Date.now(),
        };
        console.log(`[ProductionOptimizedScanner] 📦 PACOTE CRIADO:`, newPackage);

        // Check limit
        if (packages.length >= maxPackages) {
          setError(`Maximum packages reached (${maxPackages})`);
          return;
        }

        // Add to list
        setPackages((prev) => [newPackage, ...prev]);

        // Play audio feedback
        console.log(`[ProductionOptimizedScanner] 🔊 TOCANDO ÁUDIO para type="${type}"`);
        const audioType = getAudioTypeForPackage(type);
        console.log(`[ProductionOptimizedScanner] 🎵 AUDIO TYPE: ${audioType}`);
        audioServiceRef.current.playAudio(audioType).catch((err) => {
          console.error('[ProductionOptimizedScanner] ❌ ERRO ÁUDIO:', err);
        });

        // Callback
        onPackageScan?.(newPackage);

        // Track for duplicate detection
        lastScanRef.current = { code: barcode, time: Date.now() };

        console.log(`[ProductionOptimizedScanner] ✅ PACOTE PROCESSADO: ${JSON.stringify(newPackage)}`);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`[ProductionOptimizedScanner] 💥 ERRO GERAL:`, error);
        setError(error.message);
        onError?.(error);
      } finally {
        setIsProcessing(false);
      }
    });

    /**
     * Debounced scan handler
     * Prevents overwhelming the processor with rapid events
     */
    const debouncedScan: (barcode: string) => void = useDebouncedCallback<(barcode: string) => void>((barcode: string) => processScan(barcode), 150);

    /**
     * Handle barcode scan from camera
     */
    const handleBarcodeScanned = useCallback(({ data }: { data: string }) => {
      if (data && data.trim()) {
        console.log(`[ProductionOptimizedScanner] 📷 BARCODE DETECTED: "${data}"`);
        debouncedScan(data.trim());
      }
    }, [debouncedScan]);

    /**
     * Map package type to audio type
     */
    const getAudioTypeForPackage = useCallback((type: string): ScannerAudioType => {
      switch (type) {
        case 'shopee':
          return ScannerAudioType.BEEP_A;
        case 'mercado_livre':
          return ScannerAudioType.BEEP_B;
        case 'avulso':
          return ScannerAudioType.BEEP_C;
        default:
          return ScannerAudioType.BEEP_ERROR;
      }
    }, []);

    /**
     * Clear all scanned packages
     */
    const clearScans = useStableCallback(() => {
      setPackages([]);
      setError(null);
      lastScanRef.current = null;
    });

    /**
     * Handle app state changes
     * Save state when going to background
     */
    useAppStateChange(
      () => {
        console.log('📱 App came to foreground - refresh pricing');
        packagePricingService.startBackgroundPricingRefresh();
      },
      () => {
        console.log('📱 App went to background - save state');
        // Save packages to AsyncStorage here
      }
    );

    /**
     * Register cleanup on unmount
     */
    React.useEffect(() => {
      registerCleanup(() => {
        console.log('🧹 Cleaning up scanner component');
        setPackages([]);
        lastScanRef.current = null;
      });
    }, [registerCleanup]);

    /**
     * Preload sounds on mount, unload on unmount
     */
    React.useEffect(() => {
      console.log('🎵 Preloading scanner sounds');
      preloadSounds().catch((err) => {
        console.error('Failed to preload sounds:', err);
      });

      return () => {
        console.log('🎵 Unloading scanner sounds');
        unloadSounds().catch((err) => {
          console.error('Failed to unload sounds:', err);
        });
      };
    }, []);

    /**
     * Calculate metrics
     */
    const metrics = useMemo(() => {
      const totalValue = packages.reduce((sum, pkg) => sum + pkg.price, 0);
      const byType = packages.reduce(
        (acc, pkg) => ({
          ...acc,
          [pkg.type]: (acc[pkg.type] || 0) + 1,
        }),
        {} as Record<string, number>
      );

      return { totalValue, byType, count: packages.length };
    }, [packages]);

    // Render list item
    const renderItem = useCallback(({ item, index }: { item: ScannedPackageItem; index: number }) => (
      <View style={styles.packageItem}>
        <Text style={styles.packageType}>{item.type}</Text>
        <Text style={styles.packageBarcode}>{item.barcode}</Text>
        <Text style={styles.packagePrice}>R$ {item.price.toFixed(2)}</Text>
      </View>
    ), []);

    // Main render
    return (
      <View style={styles.container}>
        {/* Header with metrics */}
        <View style={styles.header}>
          <Text style={styles.title}>Production Scanner</Text>
          <Text style={styles.metrics}>
            {metrics.count} pacotes | R$ {metrics.totalValue.toFixed(2)}
          </Text>
        </View>

        {/* Error message */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>❌ {error}</Text>
          </View>
        )}

        {/* Loading indicator */}
        {isProcessing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Processando...</Text>
          </View>
        )}

        {/* Scanned packages list */}
        <FlatList
          {...createOptimizedFlatListProps()}
          data={processedItems}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum pacote escaneado</Text>
          }
          style={styles.list}
        />

        {/* Camera Scanner */}
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            barcodeScannerSettings={{
              barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e'],
            }}
            onBarcodeScanned={handleBarcodeScanned}
          />
          <View style={styles.cameraOverlay}>
            <Text style={styles.scannerText}>Aponte para o código de barras</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.button}
            onPress={clearScans}
            disabled={packages.length === 0}
          >
            <Text style={styles.buttonText}>🗑️ Limpar</Text>
          </TouchableOpacity>
        </View>

        {/* Debug info (dev only) */}
        {__DEV__ && (
          <View style={styles.debugBox}>
            <Text style={styles.debugText}>
              Env: {envConfig.environment} | Platform: {envConfig.performance.debounceMs}ms
            </Text>
          </View>
        )}
      </View>
    );
  }
);

ProductionOptimizedScanner.displayName = 'ProductionOptimizedScanner';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  metrics: {
    fontSize: 14,
    color: '#666',
  },
  errorBox: {
    backgroundColor: '#fee',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 4,
    borderLeftWidth: 4,
    borderLeftColor: '#f44',
  },
  errorText: {
    color: '#c33',
    fontSize: 14,
  },
  loadingBox: {
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  list: {
    flex: 1,
  },
  packageItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  packageType: {
    width: 100,
    fontWeight: '600',
    fontSize: 12,
  },
  packageBarcode: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  packagePrice: {
    fontWeight: '600',
    fontSize: 14,
    color: '#0a7',
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    padding: 24,
    color: '#999',
    fontSize: 14,
  },
  cameraContainer: {
    height: 200,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  scannerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  debugBox: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  debugText: {
    fontSize: 10,
    color: '#666',
  },
});

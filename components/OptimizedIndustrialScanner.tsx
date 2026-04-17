/**
 * Optimized Industrial Scanner - Ultra High Performance
 * Scanner industrial otimizado para milhares de pacotes sem travamentos
 */

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Vibration,
  Platform,
  Alert,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { useIndustrialScanner } from "@/utils/useIndustrialScanner";
import { useAppTheme } from "@/utils/useAppTheme";
import { useIndustrialCache } from "@/utils/industrialCache";
import { useIndustrialOptimizer } from "@/utils/industrialOptimizer";
import { ScannerState } from "@/types/scanner";
import { debounce, throttle } from "@/utils/performanceOptimizer";

interface OptimizedIndustrialScannerProps {
  maxScans: {
    shopee: number;
    mercadoLivre: number;
    avulso: number;
  };
  onScanned: (code: string, type: string) => void;
  onLimitReached?: (limitedTypes: string[]) => void;
  onEndSession?: () => void;
  onBack?: () => void;
}

export const OptimizedIndustrialScanner: React.FC<
  OptimizedIndustrialScannerProps
> = ({ maxScans, onScanned, onLimitReached, onEndSession, onBack }) => {
  const { colors } = useAppTheme();
  const cache = useIndustrialCache();
  const optimizer = useIndustrialOptimizer();

  // Estados otimizados com useCallback
  const [manualCode, setManualCode] = useState("");
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Refs para performance
  const lastScanTime = useRef(0);
  const scanCount = useRef(0);

  // Animações otimizadas
  const pulseAnim = useSharedValue(1);
  const successAnim = useSharedValue(0);

  // Scanner hook com otimizações
  const scanner = useIndustrialScanner({
    maxAllowedScans: maxScans,
    debounceMs: 150, // Ultra-rápido
    onStateChange: useCallback((state: ScannerState) => {
      // Feedback otimizado baseado em estado
      if (Platform.OS !== "web") {
        switch (state) {
          case ScannerState.LIMIT_REACHED:
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
          case ScannerState.ACTIVE:
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
        }
      }
    }, []),
  });

  // Cache de configurações para performance
  const scannerConfig = useMemo(
    () => ({
      maxScans,
      colors,
      platform: Platform.OS,
    }),
    [maxScans, colors],
  );

  // Otimização de cache para configurações
  useEffect(() => {
    cache.set("scanner-config", scannerConfig, 60000); // 1 minuto
  }, [scannerConfig, cache]);

  // Debounced scan handler para prevenir múltiplos scans
  const handleScan = useCallback(
    debounce(async ({ data }: { data: string }) => {
      const now = Date.now();

      // Prevenir scans duplicados muito rápidos
      if (now - lastScanTime.current < 100) return;

      lastScanTime.current = now;
      setIsProcessing(true);

      try {
        // Cache de resultados de scan
        const cacheKey = `scan-result-${data}`;
        let result = await cache.get(cacheKey);

        if (!result) {
          // Processar scan apenas se não estiver em cache
          const scanResult = await scanner.processScan(data);

          if (scanResult && scanResult.success) {
            result = {
              code: scanResult.code,
              type: scanResult.type,
              timestamp: now,
            };

            // Cache por 30 segundos para prevenir duplicatas
            await cache.set(cacheKey, result, 30000);

            // Animar sucesso
            successAnim.value = withTiming(1, { duration: 300 });

            // Feedback tátil otimizado
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }

            // Callback principal
            if (scanResult.code && scanResult.type) {
              onScanned(scanResult.code, scanResult.type);
            }

            // Incrementar contador
            scanCount.current++;
          }
        }
      } catch (error) {
        console.warn("Scan processing failed:", error);
      } finally {
        setIsProcessing(false);

        // Reset animação
        setTimeout(() => {
          successAnim.value = withTiming(0, { duration: 200 });
        }, 500);
      }
    }, 150),
    [scanner, onScanned, cache, successAnim],
  );

  // Throttled torch toggle para performance
  const handleToggleTorch = useCallback(
    throttle(() => {
      setTorchEnabled((prev) => !prev);
    }, 300),
    [],
  );

  // Memoized styles para performance
  const containerStyle = useMemo(
    () => ({
      flex: 1,
      backgroundColor: colors.bg,
    }),
    [colors.bg],
  );

  const cameraStyle = useMemo(
    () => ({
      flex: 1,
    }),
    [],
  );

  const animatedSuccessStyle = useAnimatedStyle(() => ({
    opacity: successAnim.value,
    transform: [{ scale: 1 + successAnim.value * 0.1 }],
  }));

  // Otimização de performance
  useEffect(() => {
    const unsubscribe = optimizer.onOptimization((metrics) => {
      // Ajustar configurações baseado na performance
      if (metrics.fps < 45) {
        // Reduzir qualidade de animações em dispositivos lentos
        console.warn("Reducing animation quality due to low FPS");
      }

      if (metrics.memoryUsage > 120) {
        // Limpar cache não essencial
        cache.invalidate("scan-result-");
      }
    });

    return unsubscribe;
  }, [optimizer, cache]);

  // Prevenção de memory leaks
  useEffect(() => {
    return () => {
      // Cleanup ao desmontar
      cache.invalidate("scan-result-");
    };
  }, [cache]);

  // Renderização otimizada
  if (!permission) {
    return (
      <View style={containerStyle}>
        <Text style={{ color: colors.text }}>
          Solicitando permissão da câmera...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={containerStyle}>
        <Text style={{ color: colors.text }}>Acesso à câmera negado</Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={{ color: colors.primary }}>Permitir Acesso</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      {/* Camera View Otimizada */}
      <CameraView
        style={cameraStyle}
        barcodeScannerSettings={{
          barcodeTypes: ["qr", "ean13", "code128", "code39", "upc_a"],
        }}
        onBarcodeScanned={isProcessing ? undefined : handleScan}
        enableTorch={torchEnabled}
      />

      {/* Overlay de Feedback Otimizado */}
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.primary,
            opacity: 0.1,
            pointerEvents: "none",
          },
          animatedSuccessStyle,
        ]}
      />

      {/* Controles Otimizados */}
      <View
        style={{
          position: "absolute",
          bottom: 50,
          left: 20,
          right: 20,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {/* Botão Voltar */}
        <TouchableOpacity
          onPress={onBack}
          style={{
            backgroundColor: colors.surface,
            padding: 15,
            borderRadius: 25,
            minWidth: 50,
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.text }}>Voltar</Text>
        </TouchableOpacity>

        {/* Contador Otimizado */}
        <View
          style={{
            backgroundColor: colors.surface,
            padding: 15,
            borderRadius: 25,
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.text, fontWeight: "bold" }}>
            {scanCount.current}
          </Text>
        </View>

        {/* Botão Flash */}
        <TouchableOpacity
          onPress={handleToggleTorch}
          style={{
            backgroundColor: torchEnabled ? colors.primary : colors.surface,
            padding: 15,
            borderRadius: 25,
            minWidth: 50,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: torchEnabled ? colors.surface : colors.text,
            }}
          >
            Flash
          </Text>
        </TouchableOpacity>
      </View>

      {/* Indicador de Processamento */}
      {isProcessing && (
        <View
          style={{
            position: "absolute",
            top: 50,
            left: 20,
            right: 20,
            backgroundColor: colors.surface,
            padding: 10,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: colors.text }}>Processando...</Text>
        </View>
      )}

      {/* Status de Performance (Debug) */}
      {__DEV__ && (
        <View
          style={{
            position: "absolute",
            top: 100,
            right: 20,
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: 8,
            borderRadius: 5,
          }}
        >
          <Text style={{ color: "white", fontSize: 10 }}>
            FPS: {Math.round(optimizer.metrics.fps)}
          </Text>
          <Text style={{ color: "white", fontSize: 10 }}>
            Mem: {Math.round(optimizer.metrics.memoryUsage)}MB
          </Text>
          <Text style={{ color: "white", fontSize: 10 }}>
            Cache: {Math.round(optimizer.metrics.cacheHitRate)}%
          </Text>
        </View>
      )}
    </View>
  );
};

export default OptimizedIndustrialScanner;

/**
 * Hook de Scanner Ultra-Rápido v1.0
 * Otimizado para bipagens extremamente rápidas com intervalos mínimos
 */

import { useState, useCallback, useRef, useMemo } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { ScannedPackage } from "@/types/session";
import { PackageType } from "@/types/scanner";
import { smartScannerService } from "@/services/smartScannerService";
import { generateId, getPackageValue } from "@/utils/session";

interface FastScannerOptions {
  maxAllowedScans: {
    shopee: number;
    mercado_livre: number;
    avulso: number;
  };
  debounceMs?: number; // padrão 50ms para ultra-rápido
  enableHaptics?: boolean;
  enableAnalytics?: boolean;
}

interface FastScannerResult {
  success: boolean;
  code: string;
  type: PackageType;
  reason?: "duplicate" | "limit_reached" | "invalid" | "rate_limited";
  processingTime: number;
  confidence: number;
}

interface FastScannerStats {
  totalScans: number;
  successfulScans: number;
  averageProcessingTime: number;
  scanRate: number; // scans por segundo
  lastScanTime: number;
}

export function useFastScanner(options: FastScannerOptions) {
  const {
    maxAllowedScans,
    debounceMs = 50,
    enableHaptics = true,
    enableAnalytics = true,
  } = options;

  // Estados otimizados
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);
  const [scanHistory, setScanHistory] = useState<number[]>([]);
  const [counts, setCounts] = useState({
    shopee: 0,
    mercado_livre: 0,
    avulso: 0,
  });

  // Refs para performance
  const processingRef = useRef(false);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);
  const debounceRef = useRef<any>(null);
  const statsRef = useRef<FastScannerStats>({
    totalScans: 0,
    successfulScans: 0,
    averageProcessingTime: 0,
    scanRate: 0,
    lastScanTime: 0,
  });

  // Cache para performance
  const packageCache = useMemo(() => new Set<string>(), []);
  const maxScanCache = useMemo(
    () => ({ ...maxAllowedScans }),
    [maxAllowedScans],
  );

  // Verificação ultra-rápida de duplicatas
  const isDuplicate = useCallback(
    (code: string): boolean => {
      return packageCache.has(code);
    },
    [packageCache],
  );

  // Verificação ultra-rápida de limites
  const checkLimits = useCallback(
    (type: PackageType): boolean => {
      if (type === "unknown") return true;

      const current = counts[type as keyof typeof counts];
      const max = maxScanCache[type as keyof typeof maxScanCache];
      return current < max;
    },
    [counts, maxScanCache],
  );

  // Feedback tátil otimizado
  const triggerHaptic = useCallback(
    (type: "success" | "error" | "warning") => {
      if (!enableHaptics || Platform.OS === "web") return;

      switch (type) {
        case "success":
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
            () => {},
          );
          break;
        case "error":
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Error,
          ).catch(() => {});
          break;
        case "warning":
          Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Warning,
          ).catch(() => {});
          break;
      }
    },
    [enableHaptics],
  );

  // Processamento ultra-rápido com debounce
  const processScan = useCallback(
    async (rawCode: string): Promise<FastScannerResult> => {
      const startTime = Date.now();

      // Evitar processamento concorrente
      if (processingRef.current) {
        return {
          success: false,
          code: rawCode,
          type: "unknown",
          reason: "rate_limited",
          processingTime: Date.now() - startTime,
          confidence: 0,
        };
      }

      processingRef.current = true;
      setIsProcessing(true);

      try {
        // Usar serviço otimizado
        const smartResult = await smartScannerService.smartScan(rawCode);
        const { code, type, confidence } = smartResult.prediction;

        // Verificações ultra-rápidas
        if (!code || code.length < 3) {
          return {
            success: false,
            code: rawCode,
            type: "unknown",
            reason: "invalid",
            processingTime: Date.now() - startTime,
            confidence: 0,
          };
        }

        // Verificar duplicata
        if (isDuplicate(code)) {
          triggerHaptic("error");
          return {
            success: false,
            code,
            type,
            reason: "duplicate",
            processingTime: Date.now() - startTime,
            confidence,
          };
        }

        // Verificar limites
        if (!checkLimits(type)) {
          triggerHaptic("warning");
          return {
            success: false,
            code,
            type,
            reason: "limit_reached",
            processingTime: Date.now() - startTime,
            confidence,
          };
        }

        // Sucesso!
        triggerHaptic("success");

        // Atualizar cache e estados
        packageCache.add(code);
        setCounts((prev) => ({
          ...prev,
          [type]: prev[type as keyof typeof prev] + 1,
        }));
        setScanHistory((prev) => [...prev.slice(-19), Date.now()]); // manter últimos 20 timestamps
        setLastScanTime(Date.now());

        // Atualizar estatísticas
        const processingTime = Date.now() - startTime;
        statsRef.current.totalScans++;
        statsRef.current.successfulScans++;
        statsRef.current.lastScanTime = Date.now();

        // Calcular média móvel de tempo de processamento
        const alpha = 0.1;
        statsRef.current.averageProcessingTime =
          statsRef.current.averageProcessingTime * (1 - alpha) +
          processingTime * alpha;

        // Calcular scan rate (scans por segundo nos últimos 5 segundos)
        const now = Date.now();
        const recentScans = scanHistory.filter(
          (timestamp) => now - timestamp < 5000,
        ).length;
        statsRef.current.scanRate = recentScans / 5;

        return {
          success: true,
          code,
          type,
          processingTime,
          confidence,
        };
      } catch (error) {
        console.error("[FastScanner] Erro no processamento:", error);
        return {
          success: false,
          code: rawCode,
          type: "unknown",
          reason: "invalid",
          processingTime: Date.now() - startTime,
          confidence: 0,
        };
      } finally {
        processingRef.current = false;
        setIsProcessing(false);
      }
    },
    [isDuplicate, checkLimits, triggerHaptic, scanHistory],
  );

  // Função principal com debounce otimizado
  const scanCode = useCallback(
    (rawCode: string): Promise<FastScannerResult> => {
      // Limpar debounce anterior
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Verificar intervalo mínimo entre scans do mesmo código
      const now = Date.now();
      const lastScan = lastScanRef.current;
      if (lastScan && lastScan.code === rawCode && now - lastScan.at < 100) {
        return Promise.resolve({
          success: false,
          code: rawCode,
          type: "unknown",
          reason: "rate_limited",
          processingTime: 0,
          confidence: 0,
        });
      }

      lastScanRef.current = { code: rawCode, at: now };

      // Aplicar debounce para evitar múltiplos scans rápidos
      return new Promise((resolve) => {
        debounceRef.current = setTimeout(async () => {
          const result = await processScan(rawCode);
          resolve(result);
        }, debounceMs);
      });
    },
    [processScan, debounceMs],
  );

  // Criar pacote a partir do resultado
  const createPackage = useCallback(
    (result: FastScannerResult): ScannedPackage | null => {
      if (!result.success) return null;

      return {
        id: generateId(),
        code: result.code,
        type: result.type,
        value: getPackageValue(result.type),
        scannedAt: new Date().toISOString(),
      };
    },
    [],
  );

  // Limpar cache e resetar
  const reset = useCallback(() => {
    packageCache.clear();
    setScanHistory([]);
    setCounts({ shopee: 0, mercado_livre: 0, avulso: 0 });
    lastScanRef.current = null;
    statsRef.current = {
      totalScans: 0,
      successfulScans: 0,
      averageProcessingTime: 0,
      scanRate: 0,
      lastScanTime: 0,
    };

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, []);

  // Obter estatísticas atuais
  const getStats = useCallback((): FastScannerStats => {
    return { ...statsRef.current };
  }, []);

  // Verificar se todos os limites foram atingidos
  const allLimitsReached = useMemo(() => {
    return Object.entries(maxAllowedScans).every(
      ([type, max]) => counts[type as keyof typeof counts] >= max,
    );
  }, [counts, maxAllowedScans]);

  // Verificar se há algum progresso
  const hasProgress = useMemo(() => {
    return Object.values(counts).some((count) => count > 0);
  }, [counts]);

  return {
    // Estados
    isProcessing,
    lastScanTime,
    counts,
    scanHistory,

    // Métodos principais
    scanCode,
    createPackage,
    reset,
    getStats,

    // Verificações
    isDuplicate,
    checkLimits,
    allLimitsReached,
    hasProgress,

    // Configurações
    maxAllowedScans,
    debounceMs,
  };
}

/**
 * Hook customizado para usar o Scanner Industrial em componentes React
 * Gerencia ciclo de vida, listeners e estado reativo
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { IndustrialScannerController } from "@/utils/scannerController";
import { ScannerState, ScanResult, ScannerConfig } from "@/types/scanner";
import { PackageType } from "@/types/scanner";

export interface UseScannerState {
  state: ScannerState;
  counts: Record<PackageType, number>;
  limits: Record<string, number>;
  progress: Record<string, number>;
  stats: any;
  lastScan: any;
  isLimitReached: boolean;
  isProcessing: boolean;
}

export interface UseScannerReturn extends UseScannerState {
  processScan: (code: string) => Promise<ScanResult>;
  reset: () => void;
  pause: () => void;
  resume: () => void;
}

/**
 * Hook para usar o scanner industrial em componentes
 * Gerencia ciclo de vida automático
 */
export function useIndustrialScanner(config: ScannerConfig): UseScannerReturn {
  const controllerRef = useRef<IndustrialScannerController | null>(null);
  const [state, setState] = useState<UseScannerState>({
    state: ScannerState.ACTIVE,
    counts: { shopee: 0, mercado_livre: 0, avulso: 0, unknown: 0 },
    limits: {},
    progress: {},
    stats: {},
    lastScan: null,
    isLimitReached: false,
    isProcessing: false,
  });

  // Inicializa controller
  useEffect(() => {
    const enhancedConfig: ScannerConfig = {
      ...config,
      onStateChange: (newState) => {
        setState((prev) => ({
          ...prev,
          state: newState,
          isLimitReached: newState === ScannerState.LIMIT_REACHED,
        }));
        config.onStateChange?.(newState);
      },
      onStatsUpdate: (stats) => {
        // Atualiza stats
        if (controllerRef.current) {
          const fullStats = controllerRef.current.getStats();
          setState((prev) => ({
            ...prev,
            stats: fullStats,
          }));
        }
        config.onStatsUpdate?.(stats);
      },
    };

    controllerRef.current = new IndustrialScannerController(enhancedConfig);

    // Estado inicial
    setState((prev) => {
      const controller = controllerRef.current!;
      return {
        ...prev,
        counts: controller.getCounts(),
        limits: controller.getLimits(),
        progress: controller.getProgress as any,
        stats: controller.getStats(),
        state: controller.getState(),
        isLimitReached: controller.isLimitReached(),
      };
    });

    // Cleanup: pode fazer reset ao desmontar (optional)
    return () => {
      // Não faz reset automático - deixa para o componente decidir
    };
  }, []);

  const processScan = useCallback(async (code: string): Promise<ScanResult> => {
    if (!controllerRef.current) {
      throw new Error("Scanner not initialized");
    }

    const result = await controllerRef.current.processScan(code);

    // Atualiza estado após processamento
    setState((prev) => {
      const controller = controllerRef.current!;
      const newState: UseScannerState = {
        ...prev,
        counts: controller.getCounts(),
        stats: controller.getStats(),
        lastScan: controller.getLastValidScan(),
        isProcessing: controller.isProcessing(),
      };

      // Atualiza progress se necessário
      if (result.success && result.type) {
        newState.progress = {
          ...newState.progress,
          [result.type]: controller.getProgress(result.type as PackageType),
        };
      }

      return newState;
    });

    return result;
  }, []);

  const reset = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.reset();
      setState((prev) => ({
        ...prev,
        counts: { shopee: 0, mercado_livre: 0, avulso: 0, unknown: 0 },
        stats: controllerRef.current!.getStats(),
        lastScan: null,
        state: ScannerState.ACTIVE,
        isLimitReached: false,
        isProcessing: false,
      }));
    }
  }, []);

  const pause = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.pause();
      setState((prev) => ({
        ...prev,
        state: ScannerState.PAUSED,
      }));
    }
  }, []);

  const resume = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.resume();
      setState((prev) => ({
        ...prev,
        state: ScannerState.ACTIVE,
      }));
    }
  }, []);

  return {
    ...state,
    processScan,
    reset,
    pause,
    resume,
  };
}

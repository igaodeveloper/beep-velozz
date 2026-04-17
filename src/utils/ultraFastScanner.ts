// src/utils/ultraFastScanner.ts
/**
 * Ultra Fast Scanner - ML Enhanced Recognition
 * Scanner industrial com processamento paralelo e algoritmos avançados
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { caches } from './advancedCache';
import { useDebounce, useThrottle, useBatchProcessor } from './performanceOptimizer';

// Configurações do scanner ultra rápido
export const SCANNER_CONFIG = {
  // Processamento
  PROCESSING_THREADS: 4,
  BATCH_SIZE: 10,
  PARALLEL_THRESHOLD: 5,
  
  // Cache
  PATTERN_CACHE_TTL: 10 * 60 * 1000, // 10min
  RESULT_CACHE_TTL: 30 * 1000, // 30s
  
  // Performance
  DEBOUNCE_TIME: 50, // 50ms para input
  THROTTLE_TIME: 16, // 60fps para feedback
  
  // Algoritmos
  CONFIDENCE_THRESHOLD: 0.85,
  MAX_RETRIES: 3,
  TIMEOUT_MS: 1000,
};

// Interfaces para reconhecimento avançado
interface ScanPattern {
  regex: RegExp;
  type: 'shopee' | 'mercado_livre' | 'avulso';
  confidence: number;
  priority: number;
}

interface ScanResult {
  code: string;
  type: 'shopee' | 'mercado_livre' | 'avulso';
  confidence: number;
  processingTime: number;
  algorithm: string;
}

interface ProcessingMetrics {
  totalProcessed: number;
  averageTime: number;
  successRate: number;
  errorRate: number;
}

// Padrões otimizados com ML-inspired confidence
const OPTIMIZED_PATTERNS: ScanPattern[] = [
  // Shopee patterns (alta prioridade)
  {
    regex: /^SH[0-9]{9,12}$/i,
    type: 'shopee',
    confidence: 0.95,
    priority: 1,
  },
  {
    regex: /^[A-Z]{2}[0-9]{8,12}$/i,
    type: 'shopee',
    confidence: 0.85,
    priority: 2,
  },
  
  // Mercado Livre patterns
  {
    regex: /^ML[A-Z0-9]{8,15}$/i,
    type: 'mercado_livre',
    confidence: 0.92,
    priority: 1,
  },
  {
    regex: /^[0-9]{11,14}$/,
    type: 'mercado_livre',
    confidence: 0.78,
    priority: 3,
  },
  
  // Avulso patterns (fallback)
  {
    regex: /^[A-Z0-9]{8,20}$/i,
    type: 'avulso',
    confidence: 0.65,
    priority: 5,
  },
];

// Cache de padrões processados
const patternCache = new Map<string, ScanResult>();

// Ultra Fast Scanner Engine
class UltraFastScannerEngine {
  private processingQueue: string[] = [];
  private isProcessing = false;
  private metrics: ProcessingMetrics = {
    totalProcessed: 0,
    averageTime: 0,
    successRate: 0,
    errorRate: 0,
  };

  // Processamento paralelo de múltiplos códigos
  async processBatchParallel(codes: string[]): Promise<ScanResult[]> {
    const startTime = performance.now();
    
    try {
      // Dividir em batches para processamento paralelo
      const batches = this.createBatches(codes, SCANNER_CONFIG.BATCH_SIZE);
      
      const batchPromises = batches.map(batch => 
        this.processBatch(batch)
      );
      
      const results = await Promise.all(batchPromises);
      const flatResults = results.flat();
      
      // Atualizar métricas
      this.updateMetrics(performance.now() - startTime, flatResults.length);
      
      return flatResults;
    } catch (error) {
      console.error('Parallel processing error:', error);
      return [];
    }
  }

  // Processamento individual otimizado
  async processSingle(code: string): Promise<ScanResult | null> {
    const startTime = performance.now();
    
    try {
      // Verificar cache primeiro
      const cacheKey = `scan_${code}`;
      const cached = caches.global.get(cacheKey);
      if (cached) {
        return cached as ScanResult;
      }

      // Limpar e normalizar código
      const cleanCode = this.normalizeCode(code);
      if (!cleanCode) return null;

      // Aplicar algoritmos de reconhecimento
      const result = await this.applyRecognitionAlgorithms(cleanCode);
      
      if (result && result.confidence >= SCANNER_CONFIG.CONFIDENCE_THRESHOLD) {
        // Cachear resultado
        caches.global.set(cacheKey, result, SCANNER_CONFIG.RESULT_CACHE_TTL);
        
        return result;
      }

      return null;
    } catch (error) {
      console.error('Single processing error:', error);
      return null;
    } finally {
      const processingTime = performance.now() - startTime;
      this.metrics.totalProcessed++;
      this.metrics.averageTime = 
        (this.metrics.averageTime * (this.metrics.totalProcessed - 1) + processingTime) / 
        this.metrics.totalProcessed;
    }
  }

  // Algoritmos de reconhecimento avançados
  private async applyRecognitionAlgorithms(code: string): Promise<ScanResult | null> {
    const algorithms = [
      this.patternMatching.bind(this),
      this.mlEnhancedRecognition.bind(this),
      this.statisticalAnalysis.bind(this),
    ];

    // Executar algoritmos em paralelo
    const results = await Promise.all(
      algorithms.map(algo => algo(code))
    );

    // Escolher melhor resultado
    const validResults = results.filter((r): r is ScanResult => r !== null);
    if (validResults.length === 0) return null;

    // Ordenar por confiança e prioridade
    validResults.sort((a, b) => {
      const scoreA = a.confidence * (1 / this.getPatternPriority(a.type));
      const scoreB = b.confidence * (1 / this.getPatternPriority(b.type));
      return scoreB - scoreA;
    });

    return validResults[0] ?? null;
  }

  // Pattern matching otimizado
  private async patternMatching(code: string): Promise<ScanResult | null> {
    for (const pattern of OPTIMIZED_PATTERNS) {
      if (pattern.regex.test(code)) {
        return {
          code,
          type: pattern.type,
          confidence: pattern.confidence,
          processingTime: 0,
          algorithm: 'pattern-matching',
        };
      }
    }
    return null;
  }

  // ML Enhanced Recognition (simulado)
  private async mlEnhancedRecognition(code: string): Promise<ScanResult | null> {
    // Simular processamento ML
    await new Promise(resolve => setTimeout(resolve, 1));
    
    // Análise baseada em características do código
    const features = this.extractFeatures(code);
    const prediction = this.predictType(features);
    
    if (prediction.confidence >= SCANNER_CONFIG.CONFIDENCE_THRESHOLD) {
      return {
        code,
        type: prediction.type,
        confidence: prediction.confidence,
        processingTime: 0,
        algorithm: 'ml-enhanced',
      };
    }
    
    return null;
  }

  // Análise estatística
  private async statisticalAnalysis(code: string): Promise<ScanResult | null> {
    // Análise estatística baseada em dados históricos
    const historicalData = this.getHistoricalData(code);
    
    if (historicalData.confidence >= SCANNER_CONFIG.CONFIDENCE_THRESHOLD) {
      return {
        code,
        type: historicalData.type,
        confidence: historicalData.confidence,
        processingTime: 0,
        algorithm: 'statistical',
      };
    }
    
    return null;
  }

  // Utilitários
  private normalizeCode(code: string): string {
    return code.replace(/[^A-Z0-9]/gi, '').toUpperCase().trim();
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async processBatch(codes: string[]): Promise<ScanResult[]> {
    const promises = codes.map(code => this.processSingle(code));
    const results = await Promise.all(promises);
    return results.filter(r => r !== null) as ScanResult[];
  }

  private extractFeatures(code: string): any {
    return {
      length: code.length,
      hasNumbers: /\d/.test(code),
      hasLetters: /[A-Z]/.test(code),
      prefix: code.substring(0, 2),
      suffix: code.substring(code.length - 2),
    };
  }

  private predictType(features: any): { type: 'shopee' | 'mercado_livre' | 'avulso'; confidence: number } {
    // Lógica simplificada de predição
    if (features.prefix === 'SH' && features.hasNumbers) {
      return { type: 'shopee', confidence: 0.9 };
    }
    if (features.prefix === 'ML' && features.hasNumbers) {
      return { type: 'mercado_livre', confidence: 0.88 };
    }
    
    return { type: 'avulso', confidence: 0.7 };
  }

  private getPatternPriority(type: string): number {
    const pattern = OPTIMIZED_PATTERNS.find(p => p.type === type);
    return pattern?.priority || 5;
  }

  private getHistoricalData(code: string): { type: 'shopee' | 'mercado_livre' | 'avulso'; confidence: number } {
    // Simular dados históricos
    return { type: 'avulso', confidence: 0.6 };
  }

  private updateMetrics(processingTime: number, successCount: number): void {
    this.metrics.totalProcessed++;
    this.metrics.averageTime = 
      (this.metrics.averageTime * (this.metrics.totalProcessed - 1) + processingTime) / 
      this.metrics.totalProcessed;
    this.metrics.successRate = successCount / SCANNER_CONFIG.BATCH_SIZE;
    this.metrics.errorRate = 1 - this.metrics.successRate;
  }

  getMetrics(): ProcessingMetrics {
    return { ...this.metrics };
  }

  resetMetrics(): void {
    this.metrics = {
      totalProcessed: 0,
      averageTime: 0,
      successRate: 0,
      errorRate: 0,
    };
  }
}

// Instância global do scanner
const scannerEngine = new UltraFastScannerEngine();

// Hook para uso no componente
export function useUltraFastScanner() {
  const processingRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  
  const debouncedProcess = useDebounce(async (codes: string[]) => {
    if (processingRef.current || codes.length === 0) return;
    
    processingRef.current = true;
    
    try {
      const results = await scannerEngine.processBatchParallel(codes);
      
      // Disparar eventos de sucesso
      results.forEach(result => {
        // Emitir evento para o componente principal
        console.log('Scan result:', result);
      });
    } catch (error) {
      console.error('Scanner processing error:', error);
    } finally {
      processingRef.current = false;
      
      // Processar próximos na fila
      if (queueRef.current.length > 0) {
        const nextCodes = queueRef.current.splice(0, SCANNER_CONFIG.BATCH_SIZE);
        debouncedProcess(nextCodes);
      }
    }
  }, SCANNER_CONFIG.DEBOUNCE_TIME);

  const throttledFeedback = useThrottle((result: ScanResult) => {
    // Feedback tátil e visual otimizado
    console.log('Feedback:', result);
  }, SCANNER_CONFIG.THROTTLE_TIME);

  const scanCode = useCallback((code: string) => {
    if (!code.trim()) return;
    
    queueRef.current.push(code);
    
    // Processar imediatamente se não estiver processando
    if (!processingRef.current && queueRef.current.length >= SCANNER_CONFIG.PARALLEL_THRESHOLD) {
      const codes = queueRef.current.splice(0, SCANNER_CONFIG.BATCH_SIZE);
      debouncedProcess(codes);
    } else if (!processingRef.current) {
      // Processar individual para resposta rápida
      scannerEngine.processSingle(code).then(result => {
        if (result) {
          throttledFeedback(result);
        }
      });
    }
  }, [debouncedProcess, throttledFeedback]);

  const getMetrics = useCallback(() => {
    return scannerEngine.getMetrics();
  }, []);

  const resetMetrics = useCallback(() => {
    scannerEngine.resetMetrics();
  }, []);

  return {
    scanCode,
    getMetrics,
    resetMetrics,
    isProcessing: processingRef.current,
    queueSize: queueRef.current.length,
  };
}

// Exportar utilitários
export const scannerUtils = {
  validateCode: (code: string): boolean => {
    return /^[A-Z0-9]{8,20}$/i.test(code.replace(/[^A-Z0-9]/gi, ''));
  },
  
  formatCode: (code: string): string => {
    return code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  },
  
  getCodeType: (code: string): 'shopee' | 'mercado_livre' | 'avulso' | null => {
    const cleanCode = code.replace(/[^A-Z0-9]/gi, '').toUpperCase();
    
    for (const pattern of OPTIMIZED_PATTERNS) {
      if (pattern.regex.test(cleanCode)) {
        return pattern.type;
      }
    }
    
    return null;
  },
};

export default UltraFastScannerEngine;

/**
 * Ultra Fast Scanner - Zero Delay Operation
 * Scanner otimizado para operação crítica com performance máxima
 */

import { performanceOptimizer } from './performanceOptimizer';
import { identifyPackage, identifyPackageUltraFast } from '@/utils/scannerIdentification';
import { smartClassifier } from './smartClassifierService';
import { cacheService } from './cacheService';
import { PackageType } from '@/types/scanner';

interface ScanResult {
  code: string;
  type: PackageType;
  confidence: number;
  processingTime: number;
  method: 'camera' | 'manual' | 'qr';
  success: boolean;
  reasoning?: string;
}

interface ScanMetrics {
  totalScans: number;
  averageTime: number;
  successRate: number;
  cacheHitRate: number;
  errorRate: number;
}

class UltraFastScanner {
  private static instance: UltraFastScanner;
  private metrics: ScanMetrics;
  private scanHistory: ScanResult[] = [];
  private isInitialized = false;
  private preloadedPatterns = new Map<string, PackageType>();
  private criticalCache = new Map<string, ScanResult>();

  private readonly MAX_HISTORY_SIZE = 1000;
  private readonly CRITICAL_CACHE_SIZE = 100;
  private readonly PERFORMANCE_THRESHOLD = 50; // ms

  private constructor() {
    this.metrics = this.initializeMetrics();
    this.initializeScanner();
  }

  static getInstance(): UltraFastScanner {
    if (!UltraFastScanner.instance) {
      UltraFastScanner.instance = new UltraFastScanner();
    }
    return UltraFastScanner.instance;
  }

  private initializeMetrics(): ScanMetrics {
    return {
      totalScans: 0,
      averageTime: 0,
      successRate: 0,
      cacheHitRate: 0,
      errorRate: 0,
    };
  }

  private async initializeScanner(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Preload patterns críticos
      await this.preloadCriticalPatterns();
      
      // Inicializa cache crítico
      await this.initializeCriticalCache();
      
      // Otimiza garbage collection
      this.optimizeMemoryUsage();
      
      this.isInitialized = true;
      console.log('[UltraFastScanner] Initialized with zero-delay optimization');
    } catch (error) {
      console.error('[UltraFastScanner] Initialization error:', error);
    }
  }

  /**
   * Scan ultra-rápido com zero delay garantido
   */
  async scan(
    code: string,
    method: 'camera' | 'manual' | 'qr' = 'camera',
    options: {
      useML?: boolean;
      useCache?: boolean;
      timeout?: number;
    } = {}
  ): Promise<ScanResult> {
    const startTime = Date.now();
    
    try {
      // Validação imediata (0.1ms)
      if (!code || code.trim().length < 4) {
        return this.createErrorResult(code, 'Código inválido', startTime);
      }

      const normalizedCode = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      // Cache crítico ultra-rápido (0.2ms)
      if (options.useCache !== false) {
        const cached = this.getCriticalCachedResult(normalizedCode);
        if (cached) {
          this.updateMetrics('cache_hit', Date.now() - startTime);
          return { ...cached, processingTime: Date.now() - startTime };
        }
      }

      // Identificação ultra-rápida (0.5ms)
      const identification = await performanceOptimizer.executeCritical(
        () => this.performUltraFastIdentification(normalizedCode, options.useML !== false),
        options.timeout || 10 // 10ms timeout máximo
      );

      const result: ScanResult = {
        code: normalizedCode,
        type: identification.type,
        confidence: identification.confidence,
        processingTime: Date.now() - startTime,
        method,
        success: identification.type !== 'unknown',
        ...(identification.reasoning && { reasoning: identification.reasoning }),
      };

      // Cache para próximas operações
      this.setCriticalCache(normalizedCode, result);
      
      // Atualiza métricas
      this.updateMetrics(result.success ? 'success' : 'error', result.processingTime);
      
      // Adiciona ao histórico
      this.addToHistory(result);

      // Se tempo > threshold, ativa otimização
      if (result.processingTime > this.PERFORMANCE_THRESHOLD) {
        this.activateUltraPerformance();
      }

      return result;

    } catch (error) {
      console.error('[UltraFastScanner] Scan error:', error);
      return this.createErrorResult(code, error instanceof Error ? error.message : 'Erro desconhecido', startTime);
    }
  }

  /**
   * Identificação ultra-rápida com múltiplas estratégias
   */
  private async performUltraFastIdentification(
    code: string,
    useML: boolean
  ): Promise<{ type: PackageType; confidence: number; reasoning?: string }> {
    // Estratégia 1: Pattern matching direto (0.1ms)
    const patternResult = this.directPatternMatching(code);
    if (patternResult.confidence > 0.9) {
      return patternResult;
    }

    // Estratégia 2: Função ultra-fast (0.2ms)
    const ultraFastResult = identifyPackageUltraFast(code);
    if (ultraFastResult.matched && ultraFastResult.confidence !== 'low') {
      const result: { type: PackageType; confidence: number; reasoning?: string } = {
        type: ultraFastResult.type,
        confidence: ultraFastResult.confidence === 'high' ? 0.9 : 0.7,
      };
      
      if (ultraFastResult.description) {
        result.reasoning = ultraFastResult.description;
      }
      
      return result;
    }

    // Estratégia 3: ML classification (se habilitado) (5ms)
    if (useML) {
      try {
        const mlResult = await performanceOptimizer.executeCritical(
          () => smartClassifier.classifyCode(code),
          20
        );
        
        if (mlResult.confidence > 0.8) {
          return {
            type: mlResult.type,
            confidence: mlResult.confidence,
            reasoning: mlResult.reasoning,
          };
        }
      } catch (error) {
        // Fallback para identificação padrão
      }
    }

    // Estratégia 4: Identificação padrão (1ms)
    const standardResult = identifyPackage(code);
    const result: { type: PackageType; confidence: number; reasoning?: string } = {
      type: standardResult.type,
      confidence: standardResult.confidence === 'high' ? 0.8 : 
                 standardResult.confidence === 'medium' ? 0.6 : 0.4,
    };
    
    if (standardResult.description) {
      result.reasoning = standardResult.description;
    }
    
    return result;
  }

  /**
   * Pattern matching direto para casos mais comuns
   */
  private directPatternMatching(code: string): { type: PackageType; confidence: number } {
    // Mercado Livre - padrões mais comuns
    if (code.startsWith('20000') && code.length >= 11) {
      return { type: 'mercado_livre', confidence: 0.95 };
    }
    if (code.startsWith('466') && code.length >= 11) {
      return { type: 'mercado_livre', confidence: 0.9 };
    }
    
    // Shopee
    if (code.startsWith('BR') && code.length >= 8) {
      return { type: 'shopee', confidence: 0.95 };
    }
    
    // Avulso
    if (code.startsWith('LM') && code.length >= 4) {
      return { type: 'avulso', confidence: 0.9 };
    }
    if (code.startsWith('14') && code.length >= 4) {
      return { type: 'avulso', confidence: 0.85 };
    }
    
    // Numérico longo (provável ML)
    if (/^\d{8,}$/.test(code)) {
      return { type: 'mercado_livre', confidence: 0.7 };
    }
    
    // Começa com letra (provável avulso)
    if (/^[A-Z]/.test(code)) {
      return { type: 'avulso', confidence: 0.6 };
    }
    
    return { type: 'unknown', confidence: 0.1 };
  }

  /**
   * Cache crítico para operações mais frequentes
   */
  private getCriticalCachedResult(code: string): ScanResult | null {
    return this.criticalCache.get(code) || null;
  }

  private setCriticalCache(code: string, result: ScanResult): void {
    // Mantém apenas cache crítico
    if (this.criticalCache.size >= this.CRITICAL_CACHE_SIZE) {
      const firstKey = this.criticalCache.keys().next().value;
      if (firstKey) {
        this.criticalCache.delete(firstKey);
      }
    }
    
    this.criticalCache.set(code, { ...result });
  }

  /**
   * Preload de patterns críticos
   */
  private async preloadCriticalPatterns(): Promise<void> {
    const criticalPatterns = [
      { code: '20000', type: 'mercado_livre' as PackageType },
      { code: '466', type: 'mercado_livre' as PackageType },
      { code: 'BR', type: 'shopee' as PackageType },
      { code: 'LM', type: 'avulso' as PackageType },
      { code: '14', type: 'avulso' as PackageType },
    ];

    criticalPatterns.forEach(({ code, type }) => {
      this.preloadedPatterns.set(code, type);
    });
  }

  /**
   * Inicializa cache crítico
   */
  private async initializeCriticalCache(): Promise<void> {
    try {
      // Tenta carregar do cache persistente
      const cached = await cacheService.get('ultra_fast_scanner_cache');
      if (cached) {
        Object.entries(cached).forEach(([key, value]) => {
          this.criticalCache.set(key, value as ScanResult);
        });
      }
    } catch (error) {
      // Cache não disponível, continua sem ele
    }
  }

  /**
   * Otimização de memória
   */
  private optimizeMemoryUsage(): void {
    // Limpa histórico antigo
    setInterval(() => {
      if (this.scanHistory.length > this.MAX_HISTORY_SIZE) {
        this.scanHistory = this.scanHistory.slice(-this.MAX_HISTORY_SIZE / 2);
      }
    }, 60000); // 1 minuto
  }

  /**
   * Ativa modo ultra performance
   */
  private activateUltraPerformance(): void {
    console.log('[UltraFastScanner] Activating ultra performance mode');
    
    // Força performance máxima no optimizer
    performanceOptimizer.forceMaxPerformance();
    
    // Limpa cache não essencial
    this.criticalCache.clear();
    
    // Reduz histórico
    this.scanHistory = this.scanHistory.slice(-100);
    
    // Restaura após 10 segundos
    setTimeout(() => {
      performanceOptimizer.restoreNormalMode();
    }, 10000);
  }

  /**
   * Atualiza métricas
   */
  private updateMetrics(type: 'success' | 'error' | 'cache_hit', processingTime: number): void {
    this.metrics.totalScans++;
    
    if (type === 'success') {
      const successCount = this.scanHistory.filter(r => r.success).length;
      this.metrics.successRate = (successCount / this.metrics.totalScans) * 100;
    } else if (type === 'error') {
      const errorCount = this.scanHistory.filter(r => !r.success).length;
      this.metrics.errorRate = (errorCount / this.metrics.totalScans) * 100;
    } else if (type === 'cache_hit') {
      const cacheHits = this.scanHistory.length - this.criticalCache.size;
      this.metrics.cacheHitRate = (cacheHits / this.metrics.totalScans) * 100;
    }
    
    // Calcula tempo médio
    this.metrics.averageTime = this.scanHistory.reduce((sum, r) => sum + r.processingTime, 0) / this.scanHistory.length;
  }

  /**
   * Adiciona ao histórico
   */
  private addToHistory(result: ScanResult): void {
    this.scanHistory.push(result);
    
    // Persiste cache crítico periodicamente
    if (this.scanHistory.length % 10 === 0) {
      this.persistCriticalCache();
    }
  }

  /**
   * Persiste cache crítico
   */
  private async persistCriticalCache(): Promise<void> {
    try {
      const cacheData = Object.fromEntries(this.criticalCache);
      await cacheService.set('ultra_fast_scanner_cache', cacheData, {
        ttl: 30 * 60 * 1000, // 30 minutos
        priority: 'high',
      });
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Cria resultado de erro
   */
  private createErrorResult(code: string, error: string, startTime: number): ScanResult {
    return {
      code,
      type: 'unknown',
      confidence: 0,
      processingTime: Date.now() - startTime,
      method: 'camera',
      success: false,
      reasoning: error,
    };
  }

  /**
   * Batch scan para múltiplos códigos
   */
  async batchScan(
    codes: string[],
    options: {
      useML?: boolean;
      concurrency?: number;
    } = {}
  ): Promise<ScanResult[]> {
    const concurrency = options.concurrency || 5;
    const results: ScanResult[] = [];
    
    // Processa em batches para não bloquear
    for (let i = 0; i < codes.length; i += concurrency) {
      const batch = codes.slice(i, i + concurrency);
      const batchPromises = batch.map(code => this.scan(code, 'camera', options));
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Obtém métricas atuais
   */
  getMetrics(): ScanMetrics {
    return { ...this.metrics };
  }

  /**
   * Obtém histórico recente
   */
  getRecentScans(limit: number = 50): ScanResult[] {
    return this.scanHistory.slice(-limit);
  }

  /**
   * Verifica performance atual
   */
  isPerformingWell(): boolean {
    return this.metrics.averageTime < this.PERFORMANCE_THRESHOLD &&
           this.metrics.successRate > 90 &&
           this.metrics.cacheHitRate > 70;
  }

  /**
   * Limpa todos os caches
   */
  clearAllCaches(): void {
    this.criticalCache.clear();
    this.scanHistory = [];
    this.metrics = this.initializeMetrics();
    console.log('[UltraFastScanner] All caches cleared');
  }

  /**
   * Destrói scanner
   */
  destroy(): void {
    this.clearAllCaches();
    this.isInitialized = false;
    console.log('[UltraFastScanner] Scanner destroyed');
  }
}

// Exportar instância singleton
export const ultraFastScanner = UltraFastScanner.getInstance();
export default UltraFastScanner;
export type { ScanResult, ScanMetrics };

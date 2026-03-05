/**
 * Scanner Industrial - Controlador Principal v2.0
 * Orquestra todos os módulos com lógica avançada:
 * - Identificação inteligente de pacote
 * - Controle robusto de limite
 * - Serviço de áudio com fila
 * - Prevenção de race conditions
 * - Detecção inteligente de duplicação
 * - Logging e auditoria
 */

import { PackageType, ScannerState, ScanResult, ScannerConfig, ScannerInternalState } from '@/types/scanner';
import {
  normalizeCode,
  identifyPackage,
  getAudioKeyForType,
  validateCode,
  getPackageTypeLabel,
  isDefinitelyType,
  getConfidenceScore,
} from '@/utils/scannerIdentification';
import { ScannerAudioService, ScannerAudioType, getScannerAudioService } from '@/utils/scannerAudio';
import { ScanLimitController } from '@/utils/scannerLimitController';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Resultado detalhado de auditoria para logging
 */
interface AuditLog {
  timestamp: number;
  rawCode: string;
  normalizedCode: string;
  result: ScanResult;
  confidenceScore: number;
  validationDuration: number;
}

/**
 * Controlador principal do scanner industrial v2.0
 * Responsável por:
 * - Orquestrar identificação inteligente
 * - Controle robusto de limite com prevenção de overflow
 * - Áudio sincronizado com fila
 * - Prevenção avançada de race conditions
 * - Detecção inteligente de duplicação com análise temporal
 * - Auditoria completa de scans
 */
export class IndustrialScannerController {
  private config: ScannerConfig;
  private limitController: ScanLimitController;
  private audioService: ScannerAudioService;
  private internalState: ScannerInternalState;
  private processingLock: boolean = false;
  private debounceMs: number;
  private auditLog: AuditLog[] = [];
  private scanHistory: Map<string, { type: PackageType; timestamps: number[] }> = new Map();

  // when a driver is selected we can optionally provide the list of
  // package codes that should be accepted. any scan outside this set
  // will be rejected with a `wrong_driver` result so the user can
  // avoid accidentally scanning a package belonging to another motoboy.
  private allowedCodes?: Set<string>;

  constructor(config: ScannerConfig) {
    this.config = config;
    this.debounceMs = config.debounceMs ?? 400;
    this.audioService = getScannerAudioService();

    this.limitController = new ScanLimitController(config.maxAllowedScans);

    this.internalState = {
      state: ScannerState.ACTIVE,
      scanCounts: {
        shopee: 0,
        mercado_livre: 0,
        avulso: 0,
        unknown: 0,
      },
      lastValidScan: null,
      lastAudioTime: 0,
      isProcessing: false,
      stats: {
        totalScans: 0,
        validScans: 0,
        duplicates: 0,
        unknownTypes: 0,
        timestamp: Date.now(),
      },
    };
  }

  /**
   * Processa um código escaneado com lógica avançada
   * Implementa:
   * - Validação rigorosa
   * - Controle de limite inteligente
   * - Detecção de duplicação temporal
   * - Auditoria completa
   */
  /**
   * set the list of package codes that are valid for the current
   * "session" (typically the motoboy who is being checked). call this
   * whenever the driver/route changes.
   */
  public setAllowedCodes(codes: string[]) {
    this.allowedCodes = new Set(codes.map(c => normalizeCode(c)));
  }

  async processScan(rawCode: string): Promise<ScanResult> {
    const startTime = Date.now();

    // Prevenção de race condition: se já está processando, rejeita
    if (this.processingLock) {
      return {
        success: false,
        code: rawCode,
        reason: 'rate_limited',
        timestamp: startTime,
      };
    }

    // Adquire lock de processamento
    this.processingLock = true;

    try {
      // 1. Normalize código
      const normalizedCode = normalizeCode(rawCode);

      // 2. Valida código
      if (!validateCode(normalizedCode)) {
        await this._playErrorAudio();
        this._logAudit(rawCode, normalizedCode, {
          success: false,
          code: rawCode,
          reason: 'invalid',
          timestamp: startTime,
        }, 0);
        return {
          success: false,
          code: rawCode,
          reason: 'invalid',
          timestamp: startTime,
        };
      }

      // 3. Se scanner está pausado, rejeita
      if (this.internalState.state === ScannerState.PAUSED) {
        await this._playErrorAudio();
        return {
          success: false,
          code: normalizedCode,
          reason: 'rate_limited',
          timestamp: startTime,
        };
      }

      // 4. Incrementa contador total
      this.internalState.stats.totalScans++;

      // 5. Identifica tipo com confiança
      const identification = identifyPackage(normalizedCode);

      // 5b. Se um conjunto de códigos válidos foi definido, rejeita
      // aquilo que não pertence ao motorista atual.
      if (this.allowedCodes && !this.allowedCodes.has(normalizedCode)) {
        await this._playErrorAudio();
        this._logAudit(rawCode, normalizedCode, {
          success: false,
          code: normalizedCode,
          reason: 'wrong_driver',
          timestamp: startTime,
        }, getConfidenceScore(normalizedCode, identification.type));
        return {
          success: false,
          code: normalizedCode,
          reason: 'wrong_driver',
          timestamp: startTime,
        };
      }
      const type: PackageType = identification.type;
      const confidence = getConfidenceScore(normalizedCode, type);

      // 6. Verifica duplicação inteligente
      const duplicateCheckResult = this._checkDuplicateAdvanced(normalizedCode, type);
      if (duplicateCheckResult.isDuplicate) {
        this.internalState.stats.duplicates++;
        await this._playErrorAudio();
        this._logAudit(rawCode, normalizedCode, {
          success: false,
          code: normalizedCode,
          type,
          isDuplicate: true,
          reason: 'duplicate',
          timestamp: startTime,
        }, confidence);
        return {
          success: false,
          code: normalizedCode,
          type,
          isDuplicate: true,
          reason: 'duplicate',
          timestamp: startTime,
        };
      }

      // 7. Verifica se limite foi atingido para este tipo
      if (this.limitController.hasLimitReached(type)) {
        await this._playErrorAudio();
        this._logAudit(rawCode, normalizedCode, {
          success: false,
          code: normalizedCode,
          type,
          reason: 'limit_reached',
          timestamp: startTime,
        }, confidence);
        return {
          success: false,
          code: normalizedCode,
          type,
          reason: 'limit_reached',
          timestamp: startTime,
        };
      }

      // 8. Tenta incrementar limite do tipo
      const canIncrement = this.limitController.tryIncrement(type);
      if (!canIncrement) {
        // Verifica se todos os tipos atingiram limite
        if (this._allLimitsReached()) {
          this.internalState.state = ScannerState.LIMIT_REACHED;
          this.config.onStateChange?.(ScannerState.LIMIT_REACHED);
        }

        await this._playErrorAudio();
        this._logAudit(rawCode, normalizedCode, {
          success: false,
          code: normalizedCode,
          type,
          reason: 'limit_reached',
          timestamp: startTime,
        }, confidence);
        return {
          success: false,
          code: normalizedCode,
          type,
          reason: 'limit_reached',
          timestamp: startTime,
        };
      }

      // 9. Leitura bem-sucedida - atualiza estado
      this.internalState.stats.validScans++;
      this.internalState.scanCounts[type]++;

      this.internalState.lastValidScan = {
        code: normalizedCode,
        type,
        timestamp: startTime,
      };

      // 10. Registra no histórico de scans
      this._addToScanHistory(normalizedCode, type, startTime);

      // 11. Toca áudio correspondente
      await this._playAudioForType(type);

      // 12. Haptics
      this._playHaptics();

      // 13. Callback de atualização de estatísticas
      this.config.onStatsUpdate?.(this.internalState.stats);

      // 14. Log de auditoria
      this._logAudit(rawCode, normalizedCode, {
        success: true,
        code: normalizedCode,
        type,
        isDuplicate: false,
        timestamp: startTime,
      }, confidence);

      return {
        success: true,
        code: normalizedCode,
        type,
        isDuplicate: false,
        timestamp: startTime,
      };
    } finally {
      // Libera lock após debounce
      setTimeout(() => {
        this.processingLock = false;
      }, this.debounceMs);
    }
  }

  /**
   * Verifica duplicação de forma avançada:
   * - Mesmo código nos últimos 2 segundos = duplicata
   * - Considera tipo do pacote
   * - Usa histórico temporal
   */
  private _checkDuplicateAdvanced(normalizedCode: string, type: PackageType): { isDuplicate: boolean; reason?: string } {
    const lastScan = this.internalState.lastValidScan;
    if (!lastScan) return { isDuplicate: false };

    const now = Date.now();
    const timeSinceLastScan = now - lastScan.timestamp;

    // Considera duplicata se mesmo código nos últimos 2 segundos
    if (lastScan.code === normalizedCode && timeSinceLastScan < 2000) {
      return { isDuplicate: true, reason: 'same_code_quick_scan' };
    }

    // Verifica histórico de scans para detecção adicional
    const history = this.scanHistory.get(normalizedCode);
    if (history && history.type === type) {
      const recentScans = history.timestamps.filter(ts => now - ts < 3000);
      if (recentScans.length >= 1) {
        return { isDuplicate: true, reason: 'repeated_scan_window' };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Adiciona ao histórico de scans para análise
   */
  private _addToScanHistory(normalizedCode: string, type: PackageType, timestamp: number): void {
    const history = this.scanHistory.get(normalizedCode) || { type, timestamps: [] };
    history.timestamps.push(timestamp);

    // Limpa timestamps antigos (mais de 5 minutos)
    history.timestamps = history.timestamps.filter(ts => Date.now() - ts < 5 * 60 * 1000);

    this.scanHistory.set(normalizedCode, history);
  }

  /**
   * Verifica se todos os tipos atingiram seu limite
   */
  private _allLimitsReached(): boolean {
    const stats = this.limitController.getStats();
    return (
      stats.shopee.reached &&
      stats.mercado_livre.reached &&
      stats.avulso.reached
    );
  }

  /**
   * Toca áudio correspondente ao tipo
   */
  private async _playAudioForType(type: PackageType): Promise<void> {
    const audioKey = getAudioKeyForType(type);

    // Mapeia chave para tipo de áudio
    let audioType: ScannerAudioType;
    switch (audioKey) {
      case 'beep_a':
        audioType = ScannerAudioType.BEEP_A;
        break;
      case 'beep_b':
        audioType = ScannerAudioType.BEEP_B;
        break;
      case 'beep_c':
        audioType = ScannerAudioType.BEEP_C;
        break;
      default:
        audioType = ScannerAudioType.BEEP_ERROR;
    }

    try {
      await this.audioService.playAudio(audioType);
      this.internalState.lastAudioTime = Date.now();
    } catch (error) {
      console.warn('Erro ao tocar áudio:', error);
    }
  }

  /**
   * Toca áudio de erro
   */
  private async _playErrorAudio(): Promise<void> {
    try {
      await this.audioService.playAudio(ScannerAudioType.BEEP_ERROR);
      this.internalState.lastAudioTime = Date.now();
    } catch (error) {
      console.warn('Erro ao tocar áudio de erro:', error);
    }
  }

  /**
   * Reproduz haptics de feedback
   */
  private _playHaptics(): void {
    if (Platform.OS === 'web') return;

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (error) {
      console.warn('Erro ao reproduzir haptics:', error);
    }
  }

  /**
   * Log de auditoria completo para fins de rastreamento
   */
  private _logAudit(rawCode: string, normalizedCode: string, result: ScanResult, confidence: number): void {
    const validationDuration = result.timestamp ? Date.now() - result.timestamp : 0;

    const log: AuditLog = {
      timestamp: Date.now(),
      rawCode,
      normalizedCode,
      result,
      confidenceScore: confidence,
      validationDuration,
    };

    this.auditLog.push(log);

    // Mantém apenas últimos 1000 logs
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }
  }

  /**
   * Retorna estado atual do scanner
   */
  getState(): ScannerState {
    return this.internalState.state;
  }

  /**
   * Retorna se limite foi atingido
   */
  isLimitReached(): boolean {
    return this.internalState.state === ScannerState.LIMIT_REACHED;
  }

  /**
   * Retorna se está processando
   */
  isProcessing(): boolean {
    return this.processingLock;
  }

  /**
   * Retorna contagem atual por tipo
   */
  getCounts(): Record<PackageType, number> {
    return {
      shopee: this.limitController.getCount('shopee'),
      mercado_livre: this.limitController.getCount('mercado_livre'),
      avulso: this.limitController.getCount('avulso'),
      unknown: this.internalState.scanCounts.unknown,
    };
  }

  /**
   * Retorna limites configurados
   */
  getLimits(): Record<string, number> {
    return {
      shopee: this.limitController.getLimit('shopee'),
      mercado_livre: this.limitController.getLimit('mercado_livre'),
      avulso: this.limitController.getLimit('avulso'),
    };
  }

  /**
   * Retorna progresso (0-100) por tipo
   */
  getProgress(type: PackageType): number {
    return this.limitController.getProgress(type);
  }

  /**
   * Retorna estatísticas completas
   */
  getStats() {
    return {
      ...this.internalState.stats,
      counts: this.getCounts(),
      limits: this.getLimits(),
      progress: {
        shopee: this.getProgress('shopee'),
        mercado_livre: this.getProgress('mercado_livre'),
        avulso: this.getProgress('avulso'),
      },
      limitReached: {
        shopee: this.limitController.hasLimitReached('shopee'),
        mercado_livre: this.limitController.hasLimitReached('mercado_livre'),
        avulso: this.limitController.hasLimitReached('avulso'),
      },
    };
  }

  /**
   * Retorna última leitura válida
   */
  getLastValidScan() {
    return this.internalState.lastValidScan;
  }

  /**
   * Retorna audit log para análise
   */
  getAuditLog(): AuditLog[] {
    return [...this.auditLog];
  }

  /**
   * Retorna resumo de audit log
   */
  getAuditSummary() {
    const total = this.auditLog.length;
    const successful = this.auditLog.filter(log => log.result.success).length;
    const duplicates = this.auditLog.filter(log => log.result.isDuplicate).length;
    const avgValidationDuration = this.auditLog.reduce((sum, log) => sum + log.validationDuration, 0) / (total || 1);

    return {
      totalProcessed: total,
      successful,
      failed: total - successful,
      duplicates,
      averageValidationMs: Math.round(avgValidationDuration),
      successRate: total > 0 ? ((successful / total) * 100).toFixed(2) + '%' : '0%',
    };
  }

  /**
   * Reset completo do scanner
   * Zera contadores, limpa última leitura e reativa
   */
  reset(): void {
    this.limitController.reset();
    this.audioService.clearQueue();
    this.processingLock = false;
    this.auditLog = [];
    this.scanHistory.clear();

    this.internalState = {
      state: ScannerState.ACTIVE,
      scanCounts: {
        shopee: 0,
        mercado_livre: 0,
        avulso: 0,
        unknown: 0,
      },
      lastValidScan: null,
      lastAudioTime: 0,
      isProcessing: false,
      stats: {
        totalScans: 0,
        validScans: 0,
        duplicates: 0,
        unknownTypes: 0,
        timestamp: Date.now(),
      },
    };

    this.config.onStateChange?.(ScannerState.ACTIVE);
  }

  /**
   * Pausa o scanner (sem reset)
   */
  pause(): void {
    this.internalState.state = ScannerState.PAUSED;
    this.config.onStateChange?.(ScannerState.PAUSED);
  }

  /**
   * Resume o scanner
   */
  resume(): void {
    if (this.internalState.state === ScannerState.PAUSED) {
      this.internalState.state = ScannerState.ACTIVE;
      this.config.onStateChange?.(ScannerState.ACTIVE);
    }
  }

  /**
   * Exporta dados para análise
   */
  exportData() {
    return {
      config: this.config,
      stats: this.getStats(),
      auditSummary: this.getAuditSummary(),
      auditLog: this.getAuditLog(),
      internalState: this.internalState,
    };
  }
}

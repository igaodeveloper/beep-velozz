/**
 * Scanner Industrial - Controlador Principal
 * Orquestra todos os módulos:
 * - Identificação de pacote
 * - Controle de limite
 * - Serviço de áudio
 * Implementa prevenção de race conditions e duplicação
 */

import { PackageType, ScannerState, ScanResult, ScannerConfig, ScannerInternalState } from '@/types/scanner';
import {
  normalizeCode,
  identifyPackage,
  getAudioKeyForType,
  validateCode,
  getPackageTypeLabel,
} from '@/utils/scannerIdentification';
import { ScannerAudioService, ScannerAudioType, getScannerAudioService } from '@/utils/scannerAudio';
import { ScanLimitController } from '@/utils/scannerLimitController';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Controlador principal do scanner industrial
 * Responsável por:
 * - Orquestrar identificação, limite e áudio
 * - Prevenir race conditions
 * - Prevenir duplicação de leitura
 * - Manter estado determinístico
 */
export class IndustrialScannerController {
  private config: ScannerConfig;
  private limitController: ScanLimitController;
  private audioService: ScannerAudioService;
  private internalState: ScannerInternalState;
  private processingLock: boolean = false;
  private debounceMs: number;

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
   * Processa um código escaneado
   * Implementa toda a lógica de validação, limite e áudio
   */
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
        return {
          success: false,
          code: rawCode,
          reason: 'invalid',
          timestamp: startTime,
        };
      }

      // 3. Incrementa contador total
      this.internalState.stats.totalScans++;

      // 4. Verifica duplicação (mesma leitura nos últimos N ms)
      if (this._isDuplicate(normalizedCode)) {
        this.internalState.stats.duplicates++;
        await this._playErrorAudio();
        return {
          success: false,
          code: normalizedCode,
          isDuplicate: true,
          reason: 'duplicate',
          timestamp: startTime,
        };
      }

      // 5. Identifica tipo
      const identification = identifyPackage(normalizedCode);
      const type: PackageType = identification.type;

      // 6. Verifica se limite foi atingido
      if (this.internalState.state === ScannerState.LIMIT_REACHED) {
        await this._playErrorAudio();
        return {
          success: false,
          code: normalizedCode,
          type,
          reason: 'limit_reached',
          timestamp: startTime,
        };
      }

      // 7. Tenta incrementar limite do tipo
      const canIncrement = this.limitController.tryIncrement(type);
      if (!canIncrement) {
        // Verifica se todos os tipos atingiram limite
        if (this._allLimitsReached()) {
          this.internalState.state = ScannerState.LIMIT_REACHED;
          this.config.onStateChange?.(ScannerState.LIMIT_REACHED);
        }

        await this._playErrorAudio();
        return {
          success: false,
          code: normalizedCode,
          type,
          reason: 'limit_reached',
          timestamp: startTime,
        };
      }

      // 8. Leitura bem-sucedida - atualiza estado
      this.internalState.stats.validScans++;
      this.internalState.scanCounts[type]++;

      this.internalState.lastValidScan = {
        code: normalizedCode,
        type,
        timestamp: startTime,
      };

      // 9. Toca áudio correspondente
      await this._playAudioForType(type);

      // 10. Haptics
      this._playHaptics();

      // 11. Callback de atualização de estatísticas
      this.config.onStatsUpdate?.(this.internalState.stats);

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
   * Verifica se é duplicação (mesmo código nos últimos ms)
   */
  private _isDuplicate(normalizedCode: string): boolean {
    const lastScan = this.internalState.lastValidScan;
    if (!lastScan) return false;

    const now = Date.now();
    const timeSinceLastScan = now - lastScan.timestamp;

    // Considera duplicata se mesmo código nos últimos 2 segundos
    return (
      lastScan.code === normalizedCode &&
      timeSinceLastScan < 2000
    );
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
   * Reset completo do scanner
   * Zera contadores, limpa última leitura e reativa
   */
  reset(): void {
    this.limitController.reset();
    this.audioService.clearQueue();
    this.processingLock = false;

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
}

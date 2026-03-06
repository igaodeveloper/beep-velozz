/**
 * Scanner Industrial - Serviço de Áudio Profissional
 * Gerencia reprodução de áudio com:
 * - Prevenção de sobreposição
 * - Controle de gap mínimo entre sons
 * - Fila de áudio para requisições rápidas
 * - Erro handling robusto
 */

import { playBeepA, playBeepB, playBeepC, playError } from '@/utils/sound';

/**
 * Estados do reprodutor de áudio
 */
enum AudioState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
}

/**
 * Tipos de som que o scanner pode emitir
 */
export enum ScannerAudioType {
  BEEP_A = 'beep_a', // Shopee
  BEEP_B = 'beep_b', // Mercado Livre
  BEEP_C = 'beep_c', // Avulso
  BEEP_ERROR = 'beep_error', // Erro / Desconhecido
}

/**
 * Configuração de áudio para cada tipo
 */
interface AudioConfig {
  type: ScannerAudioType;
  durationMs: number; // Duração esperada do som
  minGapMs: number; // Gap mínimo antes de tocar novamente
}

/**
 * Mapa de configurações de áudio
 */
const AUDIO_CONFIGS: Record<ScannerAudioType, AudioConfig> = {
  [ScannerAudioType.BEEP_A]: { type: ScannerAudioType.BEEP_A, durationMs: 150, minGapMs: 300 },
  [ScannerAudioType.BEEP_B]: { type: ScannerAudioType.BEEP_B, durationMs: 150, minGapMs: 300 },
  [ScannerAudioType.BEEP_C]: { type: ScannerAudioType.BEEP_C, durationMs: 150, minGapMs: 300 },
  [ScannerAudioType.BEEP_ERROR]: {
    type: ScannerAudioType.BEEP_ERROR,
    durationMs: 200,
    minGapMs: 300,
  },
};

/**
 * Serviço de áudio para scanner
 * Gerencia fila de áudio, debounce e prevenção de sobreposição
 */
export class ScannerAudioService {
  private state: AudioState = AudioState.IDLE;
  private lastAudioTime: number = 0;
  private audioQueue: ScannerAudioType[] = [];
  private lastPlayedType: ScannerAudioType | null = null;
  private processing = false;

  /**
   * Toca um som de forma segura
   * Garante que não haverá sobreposição ou múltiplos bipes rápidos
   */
  async playAudio(audioType: ScannerAudioType, forcePlay = false): Promise<void> {
    console.log(`[ScannerAudioService] 🔊 playAudio requested: type="${audioType}"`);
    const now = Date.now();
    const config = AUDIO_CONFIGS[audioType];

    // Prevenção dupla: ignorar se mesmo som tocado recentemente
    if (this.lastPlayedType === audioType && now - this.lastAudioTime < config.minGapMs) {
      console.log(`[ScannerAudioService] ⏭️ SKIPPED (duplicate too soon): "${audioType}"`);
      return;
    }

    // Se estamos tocando algo, enfileira
    if (this.state === AudioState.PLAYING && !forcePlay) {
      console.log(`[ScannerAudioService] 📋 QUEUED: "${audioType}" (currently playing)`);
      this.audioQueue.push(audioType);
      return;
    }

    // Se tempo insuficiente desde último áudio, enfileira
    if (now - this.lastAudioTime < config.minGapMs && !forcePlay) {
      console.log(`[ScannerAudioService] 📋 QUEUED: "${audioType}" (gap too short)`);
      this.audioQueue.push(audioType);
      return;
    }

    // Toca o áudio
    console.log(`[ScannerAudioService] ▶️ PLAYING: "${audioType}"`);
    await this._playAudioInternal(audioType);
  }

  /**
   * Reproduz áudio internamente
   */
  private async _playAudioInternal(audioType: ScannerAudioType): Promise<void> {
    const config = AUDIO_CONFIGS[audioType];

    this.state = AudioState.PLAYING;
    this.lastAudioTime = Date.now();
    this.lastPlayedType = audioType;

    try {
      console.log(`[ScannerAudioService] 🎵 Executando áudio: "${audioType}" (duração: ${config.durationMs}ms)`);
      // Mapeia tipo de áudio para função de reprodução
      switch (audioType) {
        case ScannerAudioType.BEEP_A:
          console.log(`[ScannerAudio] ▶️ BEEP_A (Shopee)`);
          await playBeepA();
          break;
        case ScannerAudioType.BEEP_B:
          console.log(`[ScannerAudio] ▶️ BEEP_B (Mercado Livre)`);
          await playBeepB();
          break;
        case ScannerAudioType.BEEP_C:
          console.log(`[ScannerAudio] ▶️ BEEP_C (Avulso)`);
          await playBeepC();
          break;
        case ScannerAudioType.BEEP_ERROR:
          console.log(`[ScannerAudio] ▶️ BEEP_ERROR`);
          await playError();
          break;
      }
    } catch (error) {
      console.error('[ScannerAudio] Erro ao tocar áudio:', error);
    }

    // Espera a duração do áudio
    await new Promise((resolve) => setTimeout(resolve, config.durationMs));

    this.state = AudioState.IDLE;

    // Processa próximo da fila
    if (this.audioQueue.length > 0) {
      const next = this.audioQueue.shift();
      if (next) {
        console.log(`[ScannerAudio] 📋 Processando próximo da fila: "${next}"`);
        await this.playAudio(next);
      }
    }
  }

  /**
   * Limpa a fila de áudio
   */
  clearQueue(): void {
    this.audioQueue = [];
  }

  /**
   * Retorna estado atual
   */
  getState(): AudioState {
    return this.state;
  }

  /**
   * Reset completo
   */
  reset(): void {
    this.clearQueue();
    this.state = AudioState.IDLE;
    this.lastAudioTime = 0;
    this.lastPlayedType = null;
    this.processing = false;
  }
}

/**
 * Factory para criar instância singleton
 */
let audioServiceInstance: ScannerAudioService | null = null;

export function getScannerAudioService(): ScannerAudioService {
  if (!audioServiceInstance) {
    audioServiceInstance = new ScannerAudioService();
  }
  return audioServiceInstance;
}

/**
 * Reset de singleton (útil para testes)
 */
export function resetAudioService(): void {
  if (audioServiceInstance) {
    audioServiceInstance.reset();
    audioServiceInstance = null;
  }
}

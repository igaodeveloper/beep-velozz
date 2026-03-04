/**
 * Scanner Industrial - Serviço de Áudio
 * Gerencia bipes com garantias de:
 * - Sem sobreposição de áudio
 * - Sem múltiplos bipes em menos de 400ms
 * - Sem repetição para leitura duplicada
 */

import { playBeep, playError } from '@/utils/sound';

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
  [ScannerAudioType.BEEP_A]: { type: ScannerAudioType.BEEP_A, durationMs: 150, minGapMs: 400 },
  [ScannerAudioType.BEEP_B]: { type: ScannerAudioType.BEEP_B, durationMs: 150, minGapMs: 400 },
  [ScannerAudioType.BEEP_C]: { type: ScannerAudioType.BEEP_C, durationMs: 150, minGapMs: 400 },
  [ScannerAudioType.BEEP_ERROR]: {
    type: ScannerAudioType.BEEP_ERROR,
    durationMs: 200,
    minGapMs: 400,
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

  /**
   * Toca um som de forma segura
   * Garante que não haverá sobreposição ou múltiplos bipes rápidos
   *
   * @param audioType - Tipo de áudio a tocar
   * @param forcePlay - Força reprodução mesmo se gap insuficiente (para erros críticos)
   * @returns Promise que resolve quando o áudio foi tocado ou fila processada
   */
  async playAudio(audioType: ScannerAudioType, forcePlay = false): Promise<void> {
    const now = Date.now();
    const config = AUDIO_CONFIGS[audioType];

    // Se o mesmo som foi tocado recentemente, ignora (prevenção de duplicação)
    if (this.lastPlayedType === audioType && now - this.lastAudioTime < config.minGapMs) {
      return; // Ignora silenciosamente
    }

    // Se estamos em gap, enfileira
    if (this.state === AudioState.PLAYING && !forcePlay) {
      this.audioQueue.push(audioType);
      return;
    }

    // Se tempo insuficiente desde último áudio, enfileira
    if (now - this.lastAudioTime < config.minGapMs && !forcePlay) {
      this.audioQueue.push(audioType);
      return;
    }

    // Toca o áudio
    await this._playAudioInternal(audioType);
  }

  /**
   * Reproduz áudio internamente
   * Marca tempo de início e gerencia estado
   */
  private async _playAudioInternal(audioType: ScannerAudioType): Promise<void> {
    const config = AUDIO_CONFIGS[audioType];

    this.state = AudioState.PLAYING;
    this.lastAudioTime = Date.now();
    this.lastPlayedType = audioType;

    try {
      // Mapeia tipo de áudio para função de reprodução
      switch (audioType) {
        case ScannerAudioType.BEEP_A:
        case ScannerAudioType.BEEP_B:
        case ScannerAudioType.BEEP_C:
          await playBeep(); // Toca o beep padrão (pode ser customizado após)
          break;
        case ScannerAudioType.BEEP_ERROR:
          await playError();
          break;
      }
    } catch (error) {
      console.warn('Erro ao tocar áudio:', error);
    }

    // Espera a duração do áudio
    await new Promise(resolve => setTimeout(resolve, config.durationMs));

    this.state = AudioState.IDLE;

    // Processa próximo da fila
    if (this.audioQueue.length > 0) {
      const next = this.audioQueue.shift();
      if (next) {
        await this.playAudio(next);
      }
    }
  }

  /**
   * Limpa a fila de áudio
   * Útil para reset ou parada de emergência
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
   * Retorna último tempo de áudio
   */
  getLastAudioTime(): number {
    return this.lastAudioTime;
  }

  /**
   * Retorna se está tocando
   */
  isPlaying(): boolean {
    return this.state === AudioState.PLAYING;
  }

  /**
   * Reset completo do serviço
   */
  reset(): void {
    this.clearQueue();
    this.state = AudioState.IDLE;
    this.lastAudioTime = 0;
    this.lastPlayedType = null;
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

import { Audio } from 'expo-av';
import { Platform } from 'react-native';

/**
 * Sistema de Som Profissional
 * Gerencia reprodução de áudio com retry logic e fallbacks
 */

interface SoundCache {
  sound: Audio.Sound | null;
  lastPlayTime: number;
}

let soundCache: Map<string, SoundCache> = new Map();
let isInitialized = false;
let initPromise: Promise<void> | null = null;

const SOUND_FILES = {
  beep: require('@/assets/sounds/beep.mp3'),
  error: require('@/assets/sounds/error.mp3'),
};

const MIN_PLAY_INTERVAL_MS = 20; // Intervalo mínimo entre reproduções (20ms - ultra-rápido)
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 10; // Reduzido de 50ms para 10ms

/**
 * Inicializa o sistema de áudio
 */
async function initializeAudio(): Promise<void> {
  if (isInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      if (Platform.OS === 'web') return;

      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      isInitialized = true;
      console.log('[Sound] Audio system initialized successfully');
    } catch (error) {
      console.error('[Sound] Failed to initialize audio:', error);
    } finally {
      initPromise = null;
    }
  })();

  return initPromise;
}

/**
 * Carrega ou recupera um som do cache
 */
async function getSound(soundKey: string, soundFile: any): Promise<Audio.Sound | null> {
  // Retorna do cache se disponível
  const cached = soundCache.get(soundKey);
  if (cached?.sound) {
    return cached.sound;
  }

  if (Platform.OS === 'web') return null;

  try {
    const { sound } = await Audio.Sound.createAsync(soundFile, {
      shouldPlay: false,
      volume: 1.0,
    });

    // Armazena em cache
    soundCache.set(soundKey, {
      sound,
      lastPlayTime: 0,
    });

    console.log(`[Sound] Som carregado: ${soundKey}`);
    return sound;
  } catch (error) {
    console.warn(`[Sound] Falha ao carregar ${soundKey}:`, error);
    soundCache.set(soundKey, { sound: null, lastPlayTime: 0 });
    return null;
  }
}

/**
 * Reproduz um som com retry logic e controle de intervalo
 */
async function playSoundInternal(
  soundKey: string,
  soundFile: any,
  soundLabel: string,
  retries = 0
): Promise<void> {
  try {
    await initializeAudio();

    const cache = soundCache.get(soundKey);
    const now = Date.now();

    // Verifica intervalo mínimo entre reproduções
    if (cache && now - cache.lastPlayTime < MIN_PLAY_INTERVAL_MS) {
      console.log(
        `[Sound] ${soundLabel}: intervalo mínimo não ating. Aguardando ${MIN_PLAY_INTERVAL_MS}ms`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, MIN_PLAY_INTERVAL_MS - (now - (cache?.lastPlayTime || 0)))
      );
    }

    const sound = await getSound(soundKey, soundFile);
    if (!sound) {
      console.warn(`[Sound] ${soundLabel}: som não disponível`);
      return;
    }

    // Toca o som
    console.log(`[Sound] ▶ ${soundLabel}`);
    await sound.replayAsync();

    // Atualiza tempo de reprodução
    const cacheEntry = soundCache.get(soundKey);
    if (cacheEntry) {
      cacheEntry.lastPlayTime = Date.now();
    }
  } catch (error) {
    console.warn(`[Sound] ${soundLabel} - Erro:`, error);

    // Retry logic
    if (retries < MAX_RETRIES) {
      console.log(`[Sound] ${soundLabel} - Tentando novamente (${retries + 1}/${MAX_RETRIES})`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return playSoundInternal(soundKey, soundFile, soundLabel, retries + 1);
    }
  }
}

// ============================================
// APIs PÚBLICAS
// ============================================

export async function preloadSounds(): Promise<void> {
  console.log('[Sound] Pré-carregando sons...');
  try {
    await initializeAudio();
    await getSound('beep', SOUND_FILES.beep);
    await getSound('error', SOUND_FILES.error);
    console.log('[Sound] Sons pré-carregados');
  } catch (error) {
    console.error('[Sound] Erro ao pré-carregar sons:', error);
  }
}

/** Toca beep padrão (compatibilidade) */
export async function playBeep(): Promise<void> {
  await playSoundInternal('beep', SOUND_FILES.beep, 'Beep');
}

/** Toca beep A (Shopee) */
export async function playBeepA(): Promise<void> {
  await playSoundInternal('beep', SOUND_FILES.beep, '🔔 Beep A (Shopee)');
}

/** Toca beep B (Mercado Livre) */
export async function playBeepB(): Promise<void> {
  await playSoundInternal('beep', SOUND_FILES.beep, '🔔 Beep B (Mercado Livre)');
}

/** Toca beep C (Avulso) */
export async function playBeepC(): Promise<void> {
  await playSoundInternal('beep', SOUND_FILES.beep, '🔔 Beep C (Avulso)');
}

/** Toca beep de erro */
export async function playError(): Promise<void> {
  await playSoundInternal('error', SOUND_FILES.error, '❌ Beep Error');
}

export async function unloadSounds(): Promise<void> {
  console.log('[Sound] Liberando recursos de áudio...');
  try {
    for (const [key, cache] of soundCache.entries()) {
      if (cache.sound) {
        await cache.sound.unloadAsync();
        console.log(`[Sound] Som liberado: ${key}`);
      }
    }
    soundCache.clear();
    isInitialized = false;
  } catch (error) {
    console.error('[Sound] Erro ao liberar sons:', error);
  }
}

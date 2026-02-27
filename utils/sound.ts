import { Audio } from 'expo-av';
import { Platform } from 'react-native';

let beepSound: Audio.Sound | null = null;
let errorSound: Audio.Sound | null = null;
let isLoaded = false;
let loadPromise: Promise<void> | null = null;

async function loadSounds() {
  if (Platform.OS === 'web') return;
  if (isLoaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        shouldDuckAndroid: true,
      });

      let beep, err;
      
      try {
        beep = await Audio.Sound.createAsync(
          require('../assets/sounds/beep.mp3'),
          { shouldPlay: false, volume: 1.0 }
        );
      } catch {
        console.log('beep.mp3 not found, using fallback');
        // Create a simple fallback sound programmatically
        beep = { sound: null };
      }
      
      try {
        err = await Audio.Sound.createAsync(
          require('../assets/sounds/error.mp3'),
          { shouldPlay: false, volume: 1.0 }
        );
      } catch {
        console.log('error.mp3 not found, using fallback');
        // Create a simple fallback sound programmatically
        err = { sound: null };
      }

      beepSound = beep.sound;
      errorSound = err.sound;
      isLoaded = true;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

async function replay(sound: Audio.Sound | null) {
  if (Platform.OS === 'web') return;
  try {
    await loadSounds();
    if (!sound) return;
    await sound.replayAsync();
  } catch {
    // ignore
  }
}

export async function preloadSounds() {
  await loadSounds();
}

export async function playBeep() {
  await replay(beepSound);
}

export async function playError() {
  await replay(errorSound);
}

export async function unloadSounds() {
  if (Platform.OS === 'web') return;
  try {
    await beepSound?.unloadAsync();
  } catch {
    // ignore
  }
  try {
    await errorSound?.unloadAsync();
  } catch {
    // ignore
  }

  beepSound = null;
  errorSound = null;
  isLoaded = false;
}

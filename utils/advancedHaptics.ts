import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticType = 
  | 'light'
  | 'medium'
  | 'heavy'
  | 'success'
  | 'warning'
  | 'error'
  | 'selection'
  | 'impact'
  | 'notification'
  | 'subtle'
  | 'dramatic'
  | 'pulse';

export type HapticPattern = 
  | 'single'
  | 'double'
  | 'triple'
  | 'long'
  | 'pulse'
  | 'ramp-up'
  | 'ramp-down'
  | 'complex';

interface HapticConfig {
  type: HapticType;
  pattern?: HapticPattern;
  intensity?: number;
  sharpness?: number;
  duration?: number;
  delay?: number;
}

class AdvancedHaptics {
  private isEnabled: boolean = true;
  private intensityMultiplier: number = 1.0;

  constructor() {
    this.checkHapticAvailability();
  }

  private async checkHapticAvailability() {
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      this.isEnabled = false;
      console.warn('Haptics not available on this device');
    }
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  setIntensity(multiplier: number) {
    this.intensityMultiplier = Math.max(0, Math.min(2, multiplier));
  }

  async trigger(config: HapticConfig | HapticType) {
    if (!this.isEnabled || Platform.OS === 'web') return;

    const hapticConfig = typeof config === 'string' 
      ? { type: config } 
      : config;

    const { type, pattern = 'single', intensity, sharpness, duration, delay } = hapticConfig;

    if (delay) {
      await this.delay(delay);
    }

    switch (pattern) {
      case 'single':
        await this.singleHaptic(type, intensity, sharpness);
        break;
      case 'double':
        await this.doubleHaptic(type, intensity, sharpness);
        break;
      case 'triple':
        await this.tripleHaptic(type, intensity, sharpness);
        break;
      case 'long':
        await this.longHaptic(type, intensity, sharpness, duration);
        break;
      case 'pulse':
        await this.pulseHaptic(type, intensity, sharpness);
        break;
      case 'ramp-up':
        await this.rampUpHaptic(type, intensity, sharpness);
        break;
      case 'ramp-down':
        await this.rampDownHaptic(type, intensity, sharpness);
        break;
      case 'complex':
        await this.complexHaptic(type, intensity, sharpness);
        break;
    }
  }

  private async singleHaptic(type: HapticType, intensity?: number, sharpness?: number) {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
      case 'subtle':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'dramatic':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  private async doubleHaptic(type: HapticType, intensity?: number, sharpness?: number) {
    await this.singleHaptic(type, intensity, sharpness);
    await this.delay(100);
    await this.singleHaptic(type, intensity, sharpness);
  }

  private async tripleHaptic(type: HapticType, intensity?: number, sharpness?: number) {
    await this.singleHaptic(type, intensity, sharpness);
    await this.delay(100);
    await this.singleHaptic(type, intensity, sharpness);
    await this.delay(100);
    await this.singleHaptic(type, intensity, sharpness);
  }

  private async longHaptic(type: HapticType, intensity?: number, sharpness?: number, duration: number = 500) {
    await this.singleHaptic(type, intensity, sharpness);
    await this.delay(duration);
  }

  private async pulseHaptic(type: HapticType, intensity?: number, sharpness?: number) {
    for (let i = 0; i < 3; i++) {
      await this.singleHaptic(type, intensity, sharpness);
      await this.delay(150);
    }
  }

  private async rampUpHaptic(type: HapticType, intensity?: number, sharpness?: number) {
    const steps = 3;
    for (let i = 1; i <= steps; i++) {
      const stepIntensity = (intensity || 1) * (i / steps);
      await this.singleHaptic(type, stepIntensity, sharpness);
      await this.delay(100);
    }
  }

  private async rampDownHaptic(type: HapticType, intensity?: number, sharpness?: number) {
    const steps = 3;
    for (let i = steps; i >= 1; i--) {
      const stepIntensity = (intensity || 1) * (i / steps);
      await this.singleHaptic(type, stepIntensity, sharpness);
      await this.delay(100);
    }
  }

  private async complexHaptic(type: HapticType, intensity?: number, sharpness?: number) {
    await this.singleHaptic('light', intensity, sharpness);
    await this.delay(50);
    await this.singleHaptic('medium', intensity, sharpness);
    await this.delay(100);
    await this.singleHaptic('heavy', intensity, sharpness);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Presets para ações específicas
  async onTabPress() {
    await this.trigger({ type: 'selection', pattern: 'single' });
  }

  async onScanSuccess() {
    await this.trigger({ type: 'success', pattern: 'pulse' });
  }

  async onScanError() {
    await this.trigger({ type: 'error', pattern: 'double' });
  }

  async onButtonPress() {
    await this.trigger({ type: 'light', pattern: 'single' });
  }

  async onModalOpen() {
    await this.trigger({ type: 'medium', pattern: 'ramp-up' });
  }

  async onModalClose() {
    await this.trigger({ type: 'medium', pattern: 'ramp-down' });
  }

  async onAchievement() {
    await this.trigger({ type: 'success', pattern: 'complex' });
  }

  async onWarning() {
    await this.trigger({ type: 'warning', pattern: 'pulse' });
  }

  async onDelete() {
    await this.trigger({ type: 'heavy', pattern: 'double' });
  }

  async onRefresh() {
    await this.trigger({ type: 'light', pattern: 'triple' });
  }

  async onLoadComplete() {
    await this.trigger({ type: 'success', pattern: 'single' });
  }

  async onSwipe() {
    await this.trigger({ type: 'subtle', pattern: 'single' });
  }

  async onLongPress() {
    await this.trigger({ type: 'medium', pattern: 'long' });
  }
}

export const advancedHaptics = new AdvancedHaptics();
export default advancedHaptics;

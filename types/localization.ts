/**
 * Multi-language System Types
 * Tipos para sistema de internacionalização
 */

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
  dateFormat: string;
  timeFormat: string;
  numberFormat: {
    decimal: string;
    thousands: string;
  };
  currency: {
    code: string;
    symbol: string;
    position: "before" | "after";
  };
}

export interface TranslationKey {
  key: string;
  context?: string;
  plural?: boolean;
  variables?: Record<string, any>;
}

export interface TranslationNamespace {
  common: Record<string, string>;
  scanner: Record<string, string>;
  gamification: Record<string, string>;
  financial: Record<string, string>;
  settings: Record<string, string>;
  errors: Record<string, string>;
  achievements: Record<string, string>;
  notifications: Record<string, string>;
}

export interface LocalizationConfig {
  defaultLanguage: string;
  fallbackLanguage: string;
  supportedLanguages: string[];
  autoDetect: boolean;
  persistChoice: boolean;
  enableRTL: boolean;
}

export interface TranslatedContent {
  [languageCode: string]: {
    [namespace: string]: Record<string, string>;
  };
}

export interface LocaleData {
  language: Language;
  translations: TranslationNamespace;
  dateFormat: Intl.DateTimeFormatOptions;
  numberFormat: Intl.NumberFormatOptions;
  currencyFormat: Intl.NumberFormatOptions;
}

export interface TranslationProgress {
  language: string;
  totalKeys: number;
  translatedKeys: number;
  progress: number;
  missingKeys: string[];
  outdatedKeys: string[];
}

export interface CulturalAdaptation {
  dateFormat: string;
  timeFormat: string;
  weekStart: number; // 0 = Sunday, 1 = Monday
  workingDays: number[];
  holidays: string[];
  currency: {
    code: string;
    symbol: string;
    position: "before" | "after";
  };
  units: {
    distance: "km" | "miles";
    weight: "kg" | "lbs";
    temperature: "celsius" | "fahrenheit";
  };
  formats: {
    phone: string;
    postal: string;
    id: string;
  };
}

export interface RTLConfig {
  enabled: boolean;
  autoDetect: boolean;
  flipIcons: boolean;
  textAlign: "right" | "left" | "auto";
}

export interface FontConfig {
  family: string;
  size: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  weight: {
    light: number;
    normal: number;
    medium: number;
    bold: number;
  };
}

export interface LanguageSettings {
  code: string;
  autoDetect: boolean;
  rtl: RTLConfig;
  font: FontConfig;
  adaptations: CulturalAdaptation;
}

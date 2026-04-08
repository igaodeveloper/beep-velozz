import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

// Import translations
import pt from './locales/pt.json';
import en from './locales/en.json';

const resources = {
  pt: { translation: pt },
  en: { translation: en },
};

// Get device language
const getDeviceLanguage = (): string => {
  const locales = RNLocalize.getLocales();
  return locales[0]?.languageCode || 'pt';
};

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false,
    },
  });

// Listen for language changes
RNLocalize.addEventListener('change', () => {
  const newLanguage = getDeviceLanguage();
  if (i18n.language !== newLanguage) {
    i18n.changeLanguage(newLanguage);
  }
});

export default i18n;
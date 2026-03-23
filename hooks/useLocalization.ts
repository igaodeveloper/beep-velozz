/**
 * Hook for Localization System
 * Hook React para sistema de multi-idioma
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  Language, 
  LanguageSettings,
  LocalizationConfig 
} from '@/types/localization';
import { localizationService } from '@/services/localizationService';

interface UseLocalizationOptions {
  autoDetect?: boolean;
  persistChoice?: boolean;
}

interface LocalizationState {
  currentLanguage: string;
  availableLanguages: Language[];
  isRTL: boolean;
  isLoading: boolean;
}

export function useLocalization({
  autoDetect = true,
  persistChoice = true,
}: UseLocalizationOptions = {}) {
  const [state, setState] = useState<LocalizationState>({
    currentLanguage: 'pt-BR',
    availableLanguages: [],
    isRTL: false,
    isLoading: true,
  });

  // Inicializar localização
  useEffect(() => {
    initializeLocalization();
  }, [autoDetect, persistChoice]);

  // Inicializar sistema de localização
  const initializeLocalization = useCallback(() => {
    try {
      // Configurar serviço
      localizationService.configure({
        autoDetect,
        persistChoice,
      });

      // Detectar idioma do dispositivo se habilitado
      if (autoDetect) {
        const deviceLanguage = localizationService.detectDeviceLanguage();
        localizationService.setLanguage(deviceLanguage);
      }

      // Carregar idiomas disponíveis
      const availableLanguages = localizationService.getAvailableLanguages();
      const currentLanguage = localizationService.getCurrentLanguage();
      const isRTL = localizationService.isRTL();

      setState({
        currentLanguage,
        availableLanguages,
        isRTL,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error initializing localization:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  }, [autoDetect, persistChoice]);

  // Traduzir texto
  const translate = useCallback((
    key: string, 
    namespace: string = 'common', 
    variables?: Record<string, any>
  ) => {
    return localizationService.translate(key, namespace, variables);
  }, []);

  // Mudar idioma
  const changeLanguage = useCallback((languageCode: string) => {
    try {
      localizationService.setLanguage(languageCode);
      
      const isRTL = localizationService.isRTL();
      
      setState(prev => ({
        ...prev,
        currentLanguage: languageCode,
        isRTL,
      }));
    } catch (error) {
      console.error('Error changing language:', error);
    }
  }, []);

  // Formatar data
  const formatDate = useCallback((date: Date) => {
    return localizationService.formatDate(date);
  }, []);

  // Formatar hora
  const formatTime = useCallback((date: Date) => {
    return localizationService.formatTime(date);
  }, []);

  // Formatar número
  const formatNumber = useCallback((number: number) => {
    return localizationService.formatNumber(number);
  }, []);

  // Formatar moeda
  const formatCurrency = useCallback((amount: number) => {
    return localizationService.formatCurrency(amount);
  }, []);

  // Obter dados do idioma atual
  const getCurrentLanguageData = useCallback(() => {
    return localizationService.getCurrentLanguageData();
  }, []);

  // Obter idioma por código
  const getLanguageByCode = useCallback((code: string) => {
    return state.availableLanguages.find(lang => lang.code === code);
  }, [state.availableLanguages]);

  // Verificar se idioma é suportado
  const isLanguageSupported = useCallback((code: string) => {
    return state.availableLanguages.some(lang => lang.code === code);
  }, [state.availableLanguages]);

  // Obter nome nativo do idioma
  const getLanguageNativeName = useCallback((code: string) => {
    const language = getLanguageByCode(code);
    return language?.nativeName || code;
  }, [getLanguageByCode]);

  // Obter bandeira do idioma
  const getLanguageFlag = useCallback((code: string) => {
    const language = getLanguageByCode(code);
    return language?.flag || '🌐';
  }, [getLanguageByCode]);

  // Obter direção do texto
  const getTextDirection = useCallback(() => {
    return state.isRTL ? 'rtl' : 'ltr';
  }, [state.isRTL]);

  // Obter alinhamento do texto
  const getTextAlign = useCallback(() => {
    return state.isRTL ? 'right' : 'left';
  }, [state.isRTL]);

  // Obter margem (para RTL)
  const getMarginStyle = useCallback((margin: number) => {
    return state.isRTL 
      ? { marginLeft: margin, marginRight: 0 }
      : { marginLeft: 0, marginRight: margin };
  }, [state.isRTL]);

  // Obter padding (para RTL)
  const getPaddingStyle = useCallback((padding: number) => {
    return state.isRTL 
      ? { paddingLeft: padding, paddingRight: 0 }
      : { paddingLeft: 0, paddingRight: padding };
  }, [state.isRTL]);

  // Traduzir com plural
  const translatePlural = useCallback((
    key: string,
    count: number,
    namespace: string = 'common',
    variables?: Record<string, any>
  ) => {
    // Implementar lógica de pluralização
    const pluralKey = count === 1 ? key : `${key}_plural`;
    
    return translate(pluralKey, namespace, { ...variables, count });
  }, [translate]);

  // Traduzir com contexto
  const translateWithContext = useCallback((
    key: string,
    context: string,
    variables?: Record<string, any>
  ) => {
    return translate(key, context, variables);
  }, [translate]);

  // Obter traduções de um namespace
  const getNamespaceTranslations = useCallback((namespace: string) => {
    // Implementar obtenção de todas as traduções de um namespace
    const translations: Record<string, string> = {};
    
    // Chaves comuns que poderiam ser necessárias
    const commonKeys = [
      'ok', 'cancel', 'save', 'delete', 'edit', 'add',
      'search', 'filter', 'loading', 'error', 'success',
      'yes', 'no', 'close', 'back', 'next', 'previous'
    ];

    commonKeys.forEach(key => {
      translations[key] = translate(key, namespace);
    });

    return translations;
  }, [translate]);

  // Validar tradução
  const validateTranslation = useCallback((
    key: string,
    namespace: string = 'common'
  ) => {
    const translation = translate(key, namespace);
    return translation !== key; // Retorna true se a tradução existir
  }, [translate]);

  // Obter estatísticas de tradução
  const getTranslationStats = useCallback(() => {
    // Implementar cálculo de estatísticas
    return {
      totalKeys: 0,
      translatedKeys: 0,
      progress: 100,
      missingKeys: [] as string[],
    };
  }, []);

  // Recarregar localização
  const reloadLocalization = useCallback(() => {
    setState(prev => ({ ...prev, isLoading: true }));
    initializeLocalization();
  }, [initializeLocalization]);

  // Exportar configurações
  const exportSettings = useCallback((): LanguageSettings => {
    const config = localizationService.getConfig();
    const currentLang = getCurrentLanguageData();
    
    return {
      code: state.currentLanguage,
      autoDetect: config.autoDetect,
      rtl: {
        enabled: config.enableRTL,
        autoDetect: true,
        flipIcons: true,
        textAlign: 'auto',
      },
      font: {
        family: 'System',
        size: {
          xs: 12,
          sm: 14,
          md: 16,
          lg: 18,
          xl: 20,
          xxl: 24,
        },
        weight: {
          light: 300,
          normal: 400,
          medium: 500,
          bold: 700,
        },
      },
      adaptations: currentLang ? {
        dateFormat: currentLang.dateFormat,
        timeFormat: currentLang.timeFormat,
        weekStart: 1,
        workingDays: [1, 2, 3, 4, 5],
        holidays: [],
        currency: currentLang.currency,
        units: {
          distance: 'km',
          weight: 'kg',
          temperature: 'celsius',
        },
        formats: {
          phone: '+55 (00) 00000-0000',
          postal: '00000-000',
          id: '000.000.000-00',
        },
      } : {
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        weekStart: 1,
        workingDays: [1, 2, 3, 4, 5],
        holidays: [],
        currency: {
          code: 'BRL',
          symbol: 'R$',
          position: 'before',
        },
        units: {
          distance: 'km',
          weight: 'kg',
          temperature: 'celsius',
        },
        formats: {
          phone: '+55 (00) 00000-0000',
          postal: '00000-000',
          id: '000.000.000-00',
        },
      },
    };
  }, [state.currentLanguage, getCurrentLanguageData]);

  return {
    // Estado
    ...state,

    // Métodos principais
    translate,
    changeLanguage,

    // Formatação
    formatDate,
    formatTime,
    formatNumber,
    formatCurrency,

    // Getters
    getCurrentLanguageData,
    getLanguageByCode,
    isLanguageSupported,
    getLanguageNativeName,
    getLanguageFlag,

    // Utilitários RTL
    getTextDirection,
    getTextAlign,
    getMarginStyle,
    getPaddingStyle,

    // Traduções avançadas
    translatePlural,
    translateWithContext,
    getNamespaceTranslations,
    validateTranslation,
    getTranslationStats,

    // Configurações
    exportSettings,
    reloadLocalization,
  };
}

/**
 * Localization Service
 * Sistema completo de multi-idioma e internacionalização
 */

import { 
  Language, 
  TranslationKey, 
  TranslationNamespace, 
  LocalizationConfig,
  LocaleData,
  LanguageSettings
} from '@/types/localization';

export class LocalizationService {
  private config: LocalizationConfig = {
    defaultLanguage: 'pt-BR',
    fallbackLanguage: 'en-US',
    supportedLanguages: ['pt-BR', 'en-US', 'es-ES'],
    autoDetect: true,
    persistChoice: true,
    enableRTL: false,
  };

  private currentLanguage: string = 'pt-BR';
  private translations: Map<string, TranslationNamespace> = new Map();
  private languages: Map<string, Language> = new Map();

  constructor() {
    this.initializeLanguages();
    this.loadTranslations();
  }

  /**
   * Inicializa idiomas disponíveis
   */
  private initializeLanguages(): void {
    const languages: Language[] = [
      {
        code: 'pt-BR',
        name: 'Portuguese (Brazil)',
        nativeName: 'Português (Brasil)',
        flag: '🇧🇷',
        rtl: false,
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        numberFormat: {
          decimal: ',',
          thousands: '.',
        },
        currency: {
          code: 'BRL',
          symbol: 'R$',
          position: 'before',
        },
      },
      {
        code: 'en-US',
        name: 'English (US)',
        nativeName: 'English (United States)',
        flag: '🇺🇸',
        rtl: false,
        dateFormat: 'MM/dd/yyyy',
        timeFormat: 'h:mm a',
        numberFormat: {
          decimal: '.',
          thousands: ',',
        },
        currency: {
          code: 'USD',
          symbol: '$',
          position: 'before',
        },
      },
      {
        code: 'es-ES',
        name: 'Spanish (Spain)',
        nativeName: 'Español (España)',
        flag: '🇪🇸',
        rtl: false,
        dateFormat: 'dd/MM/yyyy',
        timeFormat: 'HH:mm',
        numberFormat: {
          decimal: ',',
          thousands: '.',
        },
        currency: {
          code: 'EUR',
          symbol: '€',
          position: 'after',
        },
      },
    ];

    languages.forEach(lang => {
      this.languages.set(lang.code, lang);
    });
  }

  /**
   * Carrega traduções
   */
  private loadTranslations(): void {
    // Traduções em Português (Brasil)
    const ptBR: TranslationNamespace = {
      common: {
        ok: 'OK',
        cancel: 'Cancelar',
        save: 'Salvar',
        delete: 'Excluir',
        edit: 'Editar',
        add: 'Adicionar',
        search: 'Buscar',
        filter: 'Filtrar',
        loading: 'Carregando...',
        error: 'Erro',
        success: 'Sucesso',
        warning: 'Aviso',
        info: 'Informação',
        yes: 'Sim',
        no: 'Não',
        close: 'Fechar',
        back: 'Voltar',
        next: 'Próximo',
        previous: 'Anterior',
        finish: 'Finalizar',
        retry: 'Tentar novamente',
        refresh: 'Atualizar',
        settings: 'Configurações',
        profile: 'Perfil',
        logout: 'Sair',
        login: 'Entrar',
        register: 'Cadastrar',
      },
      scanner: {
        title: 'Scanner Industrial',
        scan_package: 'Escanear Pacote',
        manual_input: 'Entrada Manual',
        camera_permission: 'Permissão da Câmera',
        grant_permission: 'Conceder Permissão',
        scanning: 'Escaneando...',
        scan_success: 'Scan realizado com sucesso',
        scan_error: 'Erro no scan',
        duplicate_scan: 'Código duplicado',
        limit_reached: 'Limite atingido',
        package_type: 'Tipo de Pacote',
        shopee: 'Shopee',
        mercado_livre: 'Mercado Livre',
        avulso: 'Avulso',
        unknown: 'Desconhecido',
        total_scanned: 'Total Escaneado',
        remaining: 'Restante',
        session_time: 'Tempo da Sessão',
        scan_rate: 'Taxa de Scan',
        accuracy: 'Acurácia',
        start_session: 'Iniciar Sessão',
        end_session: 'Finalizar Sessão',
        pause_session: 'Pausar Sessão',
        resume_session: 'Retomar Sessão',
      },
      gamification: {
        achievements: 'Conquistas',
        leaderboard: 'Ranking',
        challenges: 'Desafios',
        level: 'Nível',
        experience: 'Experiência',
        points: 'Pontos',
        streak: 'Sequência',
        rank: 'Patente',
        badges: 'Medalhas',
        rewards: 'Recompensas',
        daily_challenge: 'Desafio Diário',
        weekly_challenge: 'Desafio Semanal',
        monthly_challenge: 'Desafio Mensal',
        achievement_unlocked: 'Conquista Desbloqueada',
        level_up: 'Subiu de Nível',
        new_high_score: 'Novo Recorde',
        streak_milestone: 'Marco de Sequência',
        congratulations: 'Parabéns',
        keep_going: 'Continue assim',
        amazing: 'Incrível',
        legendary: 'Lendário',
      },
      financial: {
        earnings: 'Ganhos',
        revenue: 'Receita',
        profit: 'Lucro',
        loss: 'Prejuízo',
        balance: 'Saldo',
        income: 'Renda',
        expenses: 'Despesas',
        bonus: 'Bônus',
        penalty: 'Penalidade',
        hourly_rate: 'Taxa Horária',
        daily_earnings: 'Ganhos Diários',
        weekly_earnings: 'Ganhos Semanais',
        monthly_earnings: 'Ganhos Mensais',
        roi: 'ROI',
        efficiency: 'Eficiência',
        performance: 'Performance',
        financial_report: 'Relatório Financeiro',
        earnings_summary: 'Resumo de Ganhos',
        cost_breakdown: 'Análise de Custos',
        revenue_projection: 'Projeção de Receita',
      },
      settings: {
        language: 'Idioma',
        theme: 'Tema',
        notifications: 'Notificações',
        sound: 'Som',
        vibration: 'Vibração',
        auto_detect_language: 'Detectar Idioma Automaticamente',
        enable_gamification: 'Ativar Gamificação',
        enable_financial_tracking: 'Ativar Acompanhamento Financeiro',
        enable_ai_features: 'Ativar Recursos de IA',
        privacy: 'Privacidade',
        about: 'Sobre',
        help: 'Ajuda',
        feedback: 'Feedback',
        version: 'Versão',
        developer: 'Desenvolvedor',
        contact: 'Contato',
        terms: 'Termos de Uso',
        privacy_policy: 'Política de Privacidade',
      },
      errors: {
        network_error: 'Erro de conexão',
        server_error: 'Erro no servidor',
        invalid_code: 'Código inválido',
        camera_error: 'Erro na câmera',
        permission_denied: 'Permissão negada',
        session_expired: 'Sessão expirada',
        invalid_credentials: 'Credenciais inválidas',
        user_not_found: 'Usuário não encontrado',
        email_already_used: 'E-mail já utilizado',
        weak_password: 'Senha fraca',
        invalid_email: 'E-mail inválido',
        required_field: 'Campo obrigatório',
        file_too_large: 'Arquivo muito grande',
        unsupported_format: 'Formato não suportado',
        unknown_error: 'Erro desconhecido',
        try_again: 'Tente novamente',
        contact_support: 'Contate o suporte',
      },
      achievements: {
        speed_demon: 'Demônio da Velocidade',
        perfectionist: 'Perfeccionista',
        on_fire: 'Em Chamas',
        busy_bee: 'Abelha Operosa',
        lightning_fast: 'Rápido como um Relâmpago',
        accuracy_master: 'Mestre da Precisão',
        unstoppable: 'Inparável',
        pac_machine: 'Máquina de Pacotes',
        speed_demon_desc: 'Escaneie 50 pacotes em menos de 5 minutos',
        perfectionist_desc: 'Alcance 100% de acurácia em uma sessão',
        on_fire_desc: 'Mantenha uma sequência de 5 dias ativos',
        busy_bee_desc: 'Escaneie 100 pacotes em um único dia',
        lightning_fast_desc: 'Mantenha média de menos de 2 segundos por scan',
        accuracy_master_desc: 'Mantenha 95% de acurácia por 7 dias seguidos',
        unstoppable_desc: 'Alcance uma sequência de 30 dias',
        pac_machine_desc: 'Escaneie 10.000 pacotes no total',
      },
      notifications: {
        new_achievement: 'Nova Conquista!',
        level_up_notification: 'Você subiu para o nível {level}!',
        streak_milestone_notification: 'Sequência de {streak} dias!',
        daily_challenge_complete: 'Desafio diário concluído!',
        weekly_challenge_complete: 'Desafio semanal concluído!',
        monthly_challenge_complete: 'Desafio mensal concluído!',
        new_high_score_notification: 'Novo recorde: {score} pontos!',
        session_summary: 'Resumo da sessão: {scans} pacotes, {accuracy}% acurácia',
        earnings_update: 'Ganhos atualizados: R$ {amount}',
        reminder_notification: 'Não se esqueça de escanear hoje!',
        maintenance_notification: 'Sistema em manutenção programada',
      },
    };

    // Traduções em Inglês (EUA)
    const enUS: TranslationNamespace = {
      common: {
        ok: 'OK',
        cancel: 'Cancel',
        save: 'Save',
        delete: 'Delete',
        edit: 'Edit',
        add: 'Add',
        search: 'Search',
        filter: 'Filter',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        warning: 'Warning',
        info: 'Information',
        yes: 'Yes',
        no: 'No',
        close: 'Close',
        back: 'Back',
        next: 'Next',
        previous: 'Previous',
        finish: 'Finish',
        retry: 'Retry',
        refresh: 'Refresh',
        settings: 'Settings',
        profile: 'Profile',
        logout: 'Logout',
        login: 'Login',
        register: 'Register',
      },
      scanner: {
        title: 'Industrial Scanner',
        scan_package: 'Scan Package',
        manual_input: 'Manual Input',
        camera_permission: 'Camera Permission',
        grant_permission: 'Grant Permission',
        scanning: 'Scanning...',
        scan_success: 'Scan successful',
        scan_error: 'Scan error',
        duplicate_scan: 'Duplicate code',
        limit_reached: 'Limit reached',
        package_type: 'Package Type',
        shopee: 'Shopee',
        mercado_livre: 'Mercado Livre',
        avulso: 'Individual',
        unknown: 'Unknown',
        total_scanned: 'Total Scanned',
        remaining: 'Remaining',
        session_time: 'Session Time',
        scan_rate: 'Scan Rate',
        accuracy: 'Accuracy',
        start_session: 'Start Session',
        end_session: 'End Session',
        pause_session: 'Pause Session',
        resume_session: 'Resume Session',
      },
      gamification: {
        achievements: 'Achievements',
        leaderboard: 'Leaderboard',
        challenges: 'Challenges',
        level: 'Level',
        experience: 'Experience',
        points: 'Points',
        streak: 'Streak',
        rank: 'Rank',
        badges: 'Badges',
        rewards: 'Rewards',
        daily_challenge: 'Daily Challenge',
        weekly_challenge: 'Weekly Challenge',
        monthly_challenge: 'Monthly Challenge',
        achievement_unlocked: 'Achievement Unlocked',
        level_up: 'Level Up',
        new_high_score: 'New High Score',
        streak_milestone: 'Streak Milestone',
        congratulations: 'Congratulations',
        keep_going: 'Keep Going',
        amazing: 'Amazing',
        legendary: 'Legendary',
      },
      financial: {
        earnings: 'Earnings',
        revenue: 'Revenue',
        profit: 'Profit',
        loss: 'Loss',
        balance: 'Balance',
        income: 'Income',
        expenses: 'Expenses',
        bonus: 'Bonus',
        penalty: 'Penalty',
        hourly_rate: 'Hourly Rate',
        daily_earnings: 'Daily Earnings',
        weekly_earnings: 'Weekly Earnings',
        monthly_earnings: 'Monthly Earnings',
        roi: 'ROI',
        efficiency: 'Efficiency',
        performance: 'Performance',
        financial_report: 'Financial Report',
        earnings_summary: 'Earnings Summary',
        cost_breakdown: 'Cost Breakdown',
        revenue_projection: 'Revenue Projection',
      },
      settings: {
        language: 'Language',
        theme: 'Theme',
        notifications: 'Notifications',
        sound: 'Sound',
        vibration: 'Vibration',
        auto_detect_language: 'Auto Detect Language',
        enable_gamification: 'Enable Gamification',
        enable_financial_tracking: 'Enable Financial Tracking',
        enable_ai_features: 'Enable AI Features',
        privacy: 'Privacy',
        about: 'About',
        help: 'Help',
        feedback: 'Feedback',
        version: 'Version',
        developer: 'Developer',
        contact: 'Contact',
        terms: 'Terms of Use',
        privacy_policy: 'Privacy Policy',
      },
      errors: {
        network_error: 'Network Error',
        server_error: 'Server Error',
        invalid_code: 'Invalid Code',
        camera_error: 'Camera Error',
        permission_denied: 'Permission Denied',
        session_expired: 'Session Expired',
        invalid_credentials: 'Invalid Credentials',
        user_not_found: 'User Not Found',
        email_already_used: 'Email Already Used',
        weak_password: 'Weak Password',
        invalid_email: 'Invalid Email',
        required_field: 'Required Field',
        file_too_large: 'File Too Large',
        unsupported_format: 'Unsupported Format',
        unknown_error: 'Unknown Error',
        try_again: 'Try Again',
        contact_support: 'Contact Support',
      },
      achievements: {
        speed_demon: 'Speed Demon',
        perfectionist: 'Perfectionist',
        on_fire: 'On Fire',
        busy_bee: 'Busy Bee',
        lightning_fast: 'Lightning Fast',
        accuracy_master: 'Accuracy Master',
        unstoppable: 'Unstoppable',
        pac_machine: 'Package Machine',
        speed_demon_desc: 'Scan 50 packages in less than 5 minutes',
        perfectionist_desc: 'Reach 100% accuracy in a session',
        on_fire_desc: 'Maintain a 5-day active streak',
        busy_bee_desc: 'Scan 100 packages in a single day',
        lightning_fast_desc: 'Maintain average of less than 2 seconds per scan',
        accuracy_master_desc: 'Maintain 95% accuracy for 7 consecutive days',
        unstoppable_desc: 'Reach a 30-day streak',
        pac_machine_desc: 'Scan 10,000 packages total',
      },
      notifications: {
        new_achievement: 'New Achievement!',
        level_up_notification: 'You reached level {level}!',
        streak_milestone_notification: '{streak} day streak!',
        daily_challenge_complete: 'Daily challenge completed!',
        weekly_challenge_complete: 'Weekly challenge completed!',
        monthly_challenge_complete: 'Monthly challenge completed!',
        new_high_score_notification: 'New high score: {score} points!',
        session_summary: 'Session summary: {scans} packages, {accuracy}% accuracy',
        earnings_update: 'Earnings updated: ${amount}',
        reminder_notification: 'Don\'t forget to scan today!',
        maintenance_notification: 'Scheduled system maintenance',
      },
    };

    // Traduções em Espanhol (Espanha)
    const esES: TranslationNamespace = {
      common: {
        ok: 'OK',
        cancel: 'Cancelar',
        save: 'Guardar',
        delete: 'Eliminar',
        edit: 'Editar',
        add: 'Añadir',
        search: 'Buscar',
        filter: 'Filtrar',
        loading: 'Cargando...',
        error: 'Error',
        success: 'Éxito',
        warning: 'Advertencia',
        info: 'Información',
        yes: 'Sí',
        no: 'No',
        close: 'Cerrar',
        back: 'Atrás',
        next: 'Siguiente',
        previous: 'Anterior',
        finish: 'Finalizar',
        retry: 'Reintentar',
        refresh: 'Actualizar',
        settings: 'Configuración',
        profile: 'Perfil',
        logout: 'Cerrar sesión',
        login: 'Iniciar sesión',
        register: 'Registrarse',
      },
      scanner: {
        title: 'Escáner Industrial',
        scan_package: 'Escanear Paquete',
        manual_input: 'Entrada Manual',
        camera_permission: 'Permiso de Cámara',
        grant_permission: 'Conceder Permiso',
        scanning: 'Escaneando...',
        scan_success: 'Escaneo exitoso',
        scan_error: 'Error en escaneo',
        duplicate_scan: 'Código duplicado',
        limit_reached: 'Límite alcanzado',
        package_type: 'Tipo de Paquete',
        shopee: 'Shopee',
        mercado_livre: 'Mercado Libre',
        avulso: 'Individual',
        unknown: 'Desconocido',
        total_scanned: 'Total Escaneado',
        remaining: 'Restante',
        session_time: 'Tiempo de Sesión',
        scan_rate: 'Tasa de Escaneo',
        accuracy: 'Precisión',
        start_session: 'Iniciar Sesión',
        end_session: 'Finalizar Sesión',
        pause_session: 'Pausar Sesión',
        resume_session: 'Reanudar Sesión',
      },
      gamification: {
        achievements: 'Logros',
        leaderboard: 'Tabla de Clasificación',
        challenges: 'Desafíos',
        level: 'Nivel',
        experience: 'Experiencia',
        points: 'Puntos',
        streak: 'Racha',
        rank: 'Rango',
        badges: 'Medallas',
        rewards: 'Recompensas',
        daily_challenge: 'Desafío Diario',
        weekly_challenge: 'Desafío Semanal',
        monthly_challenge: 'Desafío Mensual',
        achievement_unlocked: 'Logro Desbloqueado',
        level_up: 'Subió de Nivel',
        new_high_score: 'Nuevo Récord',
        streak_milestone: 'Hito de Racha',
        congratulations: 'Felicitaciones',
        keep_going: 'Continúa así',
        amazing: 'Increíble',
        legendary: 'Legendario',
      },
      financial: {
        earnings: 'Ganancias',
        revenue: 'Ingresos',
        profit: 'Beneficio',
        loss: 'Pérdida',
        balance: 'Saldo',
        income: 'Ingresos',
        expenses: 'Gastos',
        bonus: 'Bono',
        penalty: 'Penalización',
        hourly_rate: 'Tarifa por Hora',
        daily_earnings: 'Ganancias Diarias',
        weekly_earnings: 'Ganancias Semanales',
        monthly_earnings: 'Ganancias Mensuales',
        roi: 'ROI',
        efficiency: 'Eficiencia',
        performance: 'Rendimiento',
        financial_report: 'Informe Financiero',
        earnings_summary: 'Resumen de Ganancias',
        cost_breakdown: 'Análisis de Costos',
        revenue_projection: 'Proyección de Ingresos',
      },
      settings: {
        language: 'Idioma',
        theme: 'Tema',
        notifications: 'Notificaciones',
        sound: 'Sonido',
        vibration: 'Vibración',
        auto_detect_language: 'Detectar Idioma Automáticamente',
        enable_gamification: 'Activar Gamificación',
        enable_financial_tracking: 'Activar Seguimiento Financiero',
        enable_ai_features: 'Activar Características de IA',
        privacy: 'Privacidad',
        about: 'Acerca de',
        help: 'Ayuda',
        feedback: 'Comentarios',
        version: 'Versión',
        developer: 'Desarrollador',
        contact: 'Contacto',
        terms: 'Términos de Uso',
        privacy_policy: 'Política de Privacidad',
      },
      errors: {
        network_error: 'Error de Red',
        server_error: 'Error del Servidor',
        invalid_code: 'Código Inválido',
        camera_error: 'Error de Cámara',
        permission_denied: 'Permiso Denegado',
        session_expired: 'Sesión Expirada',
        invalid_credentials: 'Credenciales Inválidas',
        user_not_found: 'Usuario No Encontrado',
        email_already_used: 'Email Ya Utilizado',
        weak_password: 'Contraseña Débil',
        invalid_email: 'Email Inválido',
        required_field: 'Campo Requerido',
        file_too_large: 'Archivo Demasiado Grande',
        unsupported_format: 'Formato No Soportado',
        unknown_error: 'Error Desconocido',
        try_again: 'Intentar de Nuevo',
        contact_support: 'Contactar Soporte',
      },
      achievements: {
        speed_demon: 'Demonio de Velocidad',
        perfectionist: 'Perfeccionista',
        on_fire: 'En Llamas',
        busy_bee: 'Abeja Ocupada',
        lightning_fast: 'Rápido como un Relámpago',
        accuracy_master: 'Maestro de Precisión',
        unstoppable: 'Imparable',
        pac_machine: 'Máquina de Paquetes',
        speed_demon_desc: 'Escanee 50 paquetes en menos de 5 minutos',
        perfectionist_desc: 'Alcanze 100% de precisión en una sesión',
        on_fire_desc: 'Mantenga una racha de 5 días activos',
        busy_bee_desc: 'Escanee 100 paquetes en un solo día',
        lightning_fast_desc: 'Mantenga promedio de menos de 2 segundos por escaneo',
        accuracy_master_desc: 'Mantenga 95% de precisión por 7 días consecutivos',
        unstoppable_desc: 'Alcanze una racha de 30 días',
        pac_machine_desc: 'Escanee 10.000 paquetes en total',
      },
      notifications: {
        new_achievement: '¡Nuevo Logro!',
        level_up_notification: '¡Alcanzó el nivel {level}!',
        streak_milestone_notification: '¡Racha de {streak} días!',
        daily_challenge_complete: '¡Desafío diario completado!',
        weekly_challenge_complete: '¡Desafío semanal completado!',
        monthly_challenge_complete: '¡Desafío mensual completado!',
        new_high_score_notification: '¡Nuevo récord: {score} puntos!',
        session_summary: 'Resumen de sesión: {scans} paquetes, {accuracy}% precisión',
        earnings_update: 'Ganancias actualizadas: ${amount}',
        reminder_notification: '¡No olvide escanear hoy!',
        maintenance_notification: 'Mantenimiento programado del sistema',
      },
    };

    this.translations.set('pt-BR', ptBR);
    this.translations.set('en-US', enUS);
    this.translations.set('es-ES', esES);
  }

  /**
   * Traduz uma chave
   */
  translate(key: string, namespace: string = 'common', variables?: Record<string, any>): string {
    const lang = this.currentLanguage;
    const fallback = this.config.fallbackLanguage;
    
    // Tentar obter tradução no idioma atual
    let translation = this.getTranslation(key, namespace, lang);
    
    // Se não encontrar, tentar no fallback
    if (!translation) {
      translation = this.getTranslation(key, namespace, fallback);
    }
    
    // Se ainda não encontrar, retornar a chave
    if (!translation) {
      return key;
    }
    
    // Substituir variáveis
    if (variables) {
      Object.entries(variables).forEach(([varKey, value]) => {
        translation = translation!.replace(new RegExp(`{${varKey}}`, 'g'), String(value));
      });
    }
    
    return translation;
  }

  /**
   * Obtém tradução específica
   */
  private getTranslation(key: string, namespace: string, language: string): string | null {
    const langTranslations = this.translations.get(language);
    if (!langTranslations) return null;
    
    const namespaceTranslations = langTranslations[namespace as keyof TranslationNamespace];
    if (!namespaceTranslations) return null;
    
    return (namespaceTranslations as Record<string, string>)[key] || null;
  }

  /**
   * Define idioma atual
   */
  setLanguage(languageCode: string): void {
    if (!this.config.supportedLanguages.includes(languageCode)) {
      console.warn(`Language ${languageCode} not supported`);
      return;
    }
    
    this.currentLanguage = languageCode;
    
    // Salvar preferência
    if (this.config.persistChoice) {
      // Implementar persistência (AsyncStorage, etc.)
    }
  }

  /**
   * Obtém idioma atual
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
  }

  /**
   * Obtém idiomas disponíveis
   */
  getAvailableLanguages(): Language[] {
    return Array.from(this.languages.values());
  }

  /**
   * Obtém dados do idioma atual
   */
  getCurrentLanguageData(): Language | null {
    return this.languages.get(this.currentLanguage) || null;
  }

  /**
   * Detecta idioma do dispositivo
   */
  detectDeviceLanguage(): string {
    // Implementar detecção real baseada no dispositivo
    const deviceLanguage = 'pt-BR'; // Simulação
    
    if (this.config.supportedLanguages.includes(deviceLanguage)) {
      return deviceLanguage;
    }
    
    return this.config.defaultLanguage;
  }

  /**
   * Formata data
   */
  formatDate(date: Date): string {
    const langData = this.getCurrentLanguageData();
    if (!langData) return date.toLocaleDateString();
    
    return new Intl.DateTimeFormat(this.currentLanguage, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  /**
   * Formata hora
   */
  formatTime(date: Date): string {
    const langData = this.getCurrentLanguageData();
    if (!langData) return date.toLocaleTimeString();
    
    return new Intl.DateTimeFormat(this.currentLanguage, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  /**
   * Formata número
   */
  formatNumber(number: number): string {
    const langData = this.getCurrentLanguageData();
    if (!langData) return number.toString();
    
    return new Intl.NumberFormat(this.currentLanguage).format(number);
  }

  /**
   * Formata moeda
   */
  formatCurrency(amount: number): string {
    const langData = this.getCurrentLanguageData();
    if (!langData) return amount.toString();
    
    return new Intl.NumberFormat(this.currentLanguage, {
      style: 'currency',
      currency: langData.currency.code,
    }).format(amount);
  }

  /**
   * Verifica se é RTL
   */
  isRTL(): boolean {
    const langData = this.getCurrentLanguageData();
    return langData?.rtl || false;
  }

  /**
   * Configura serviço
   */
  configure(config: Partial<LocalizationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtém configuração
   */
  getConfig(): LocalizationConfig {
    return { ...this.config };
  }

  /**
   * Exporta dados de localização
   */
  exportData(): any {
    return {
      currentLanguage: this.currentLanguage,
      config: this.config,
      availableLanguages: Array.from(this.languages.values()),
    };
  }
}

// Export singleton instance
export const localizationService = new LocalizationService();

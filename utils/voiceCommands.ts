/**
 * Voice Commands System
 * Sistema de comandos de voz para controle do aplicativo
 */

import { Platform, Alert } from 'react-native';

// Interfaces para comandos de voz
export interface VoiceCommand {
  id: string;
  phrase: string;
  action: VoiceAction;
  confidence: number;
  timestamp: number;
}

export interface VoiceAction {
  type: 'start_session' | 'end_session' | 'scan_package' | 'show_report' | 'navigate' | 'help' | 'settings';
  parameters?: Record<string, any>;
}

export interface VoiceCommandResult {
  success: boolean;
  command?: VoiceCommand;
  error?: string;
  response?: string;
}

export interface VoiceConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  confidenceThreshold: number;
}

class VoiceCommandProcessor {
  private isListening: boolean = false;
  private isSupported: boolean = false;
  private recognition: any = null;
  private config: VoiceConfig;
  private commandHistory: VoiceCommand[] = [];
  private onCommandCallback?: (command: VoiceCommandResult) => void;

  // Mapeamento de comandos reconhecidos
  private commandPatterns: Map<string, VoiceAction> = new Map([
    // Iniciar sessão
    ['iniciar sessão', { type: 'start_session' }],
    ['iniciar conferência', { type: 'start_session' }],
    ['começar', { type: 'start_session' }],
    ['nova sessão', { type: 'start_session' }],
    
    // Finalizar sessão
    ['finalizar sessão', { type: 'end_session' }],
    ['terminar conferência', { type: 'end_session' }],
    ['encerrar', { type: 'end_session' }],
    ['fechar', { type: 'end_session' }],
    
    // Scanner
    ['escanear', { type: 'scan_package' }],
    ['scanner', { type: 'scan_package' }],
    ['ler código', { type: 'scan_package' }],
    ['próximo pacote', { type: 'scan_package' }],
    
    // Relatórios
    ['mostrar relatório', { type: 'show_report' }],
    ['ver relatório', { type: 'show_report' }],
    ['abrir relatório', { type: 'show_report' }],
    ['relatório', { type: 'show_report' }],
    
    // Navegação
    ['ir para analytics', { type: 'navigate', parameters: { screen: 'analytics' } }],
    ['abrir analytics', { type: 'navigate', parameters: { screen: 'analytics' } }],
    ['ir para histórico', { type: 'navigate', parameters: { screen: 'history' } }],
    ['abrir histórico', { type: 'navigate', parameters: { screen: 'history' } }],
    ['ir para configurações', { type: 'navigate', parameters: { screen: 'settings' } }],
    ['abrir configurações', { type: 'navigate', parameters: { screen: 'settings' } }],
    ['voltar', { type: 'navigate', parameters: { screen: 'back' } }],
    ['menu principal', { type: 'navigate', parameters: { screen: 'home' } }],
    
    // Ajuda
    ['ajuda', { type: 'help' }],
    ['ajudar', { type: 'help' }],
    ['como usar', { type: 'help' }],
    ['instruções', { type: 'help' }],
    
    // Configurações
    ['configurações', { type: 'settings' }],
    ['preferências', { type: 'settings' }],
    ['opções', { type: 'settings' }],
  ]);

  constructor(config: Partial<VoiceConfig> = {}) {
    this.config = {
      language: 'pt-BR',
      continuous: true,
      interimResults: false,
      maxAlternatives: 3,
      confidenceThreshold: 0.7,
      ...config,
    };

    this.initializeVoiceRecognition();
  }

  /**
   * Inicializa o reconhecimento de voz
   */
  private initializeVoiceRecognition(): void {
    try {
      // Verifica suporte para Web Speech API
      if (Platform.OS === 'web' && 'webkitSpeechRecognition' in window) {
        this.recognition = new (window as any).webkitSpeechRecognition();
        this.setupRecognition();
        this.isSupported = true;
        console.log('🎤 Voice recognition supported');
      } else if (Platform.OS === 'web' && 'SpeechRecognition' in window) {
        this.recognition = new (window as any).SpeechRecognition();
        this.setupRecognition();
        this.isSupported = true;
        console.log('🎤 Voice recognition supported');
      } else {
        // Para React Native, seria necessário usar expo-speech ou biblioteca similar
        console.log('📱 Voice recognition requires additional setup for React Native');
        this.isSupported = false;
      }
    } catch (error) {
      console.error('❌ Failed to initialize voice recognition:', error);
      this.isSupported = false;
    }
  }

  /**
   * Configura o reconhecimento de voz
   */
  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.lang = this.config.language;
    this.recognition.maxAlternatives = this.config.maxAlternatives;

    this.recognition.onstart = () => {
      console.log('🎤 Voice recognition started');
      this.isListening = true;
    };

    this.recognition.onend = () => {
      console.log('🔇 Voice recognition stopped');
      this.isListening = false;
    };

    this.recognition.onerror = (event: any) => {
      console.error('❌ Voice recognition error:', event.error);
      this.isListening = false;
      
      let errorMessage = 'Erro no reconhecimento de voz';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'Nenhum discurso detectado';
          break;
        case 'audio-capture':
          errorMessage = 'Erro ao capturar áudio';
          break;
        case 'not-allowed':
          errorMessage = 'Permissão de microfone negada';
          break;
        case 'network':
          errorMessage = 'Erro de conexão';
          break;
      }

      this.notifyCallback({
        success: false,
        error: errorMessage,
      });
    };

    this.recognition.onresult = (event: any) => {
      this.processSpeechResults(event);
    };
  }

  /**
   * Processa os resultados do reconhecimento de voz
   */
  private processSpeechResults(event: any): void {
    const last = event.results.length - 1;
    const result = event.results[last];

    if (!result.isFinal) return;

    const transcript = result[0].transcript.toLowerCase().trim();
    const confidence = result[0].confidence || 0;

    console.log(`🗣️ Recognized: "${transcript}" (confidence: ${confidence})`);

    // Verifica se a confiança é suficiente
    if (confidence < this.config.confidenceThreshold) {
      this.notifyCallback({
        success: false,
        error: 'Confiança baixa no reconhecimento',
      });
      return;
    }

    // Processa o comando
    const command = this.processCommand(transcript, confidence);
    this.notifyCallback(command);
  }

  /**
   * Processa o comando reconhecido
   */
  private processCommand(transcript: string, confidence: number): VoiceCommandResult {
    // Tenta encontrar correspondência exata
    for (const [pattern, action] of this.commandPatterns) {
      if (transcript.includes(pattern.toLowerCase())) {
        const command: VoiceCommand = {
          id: `voice_${Date.now()}`,
          phrase: transcript,
          action,
          confidence,
          timestamp: Date.now(),
        };

        this.commandHistory.push(command);
        return {
          success: true,
          command,
          response: this.generateResponse(action),
        };
      }
    }

    // Tenta reconhecimento por palavras-chave
    const keywordResult = this.processByKeywords(transcript, confidence);
    if (keywordResult) {
      return keywordResult;
    }

    // Comando não reconhecido
    return {
      success: false,
      error: 'Comando não reconhecido. Tente: "iniciar sessão", "escanear", "relatório", etc.',
    };
  }

  /**
   * Processa comando por palavras-chave
   */
  private processByKeywords(transcript: string, confidence: number): VoiceCommandResult | null {
    const keywords: Record<string, VoiceAction> = {
      'iniciar': { type: 'start_session' },
      'começar': { type: 'start_session' },
      'finalizar': { type: 'end_session' },
      'terminar': { type: 'end_session' },
      'escanear': { type: 'scan_package' },
      'scanner': { type: 'scan_package' },
      'relatório': { type: 'show_report' },
      'analytics': { type: 'navigate', parameters: { screen: 'analytics' } },
      'histórico': { type: 'navigate', parameters: { screen: 'history' } },
      'configurações': { type: 'settings' },
      'ajuda': { type: 'help' },
      'voltar': { type: 'navigate', parameters: { screen: 'back' } },
    };

    for (const [keyword, action] of Object.entries(keywords)) {
      if (transcript.includes(keyword)) {
        const command: VoiceCommand = {
          id: `voice_${Date.now()}`,
          phrase: transcript,
          action,
          confidence,
          timestamp: Date.now(),
        };

        this.commandHistory.push(command);
        return {
          success: true,
          command,
          response: this.generateResponse(action),
        };
      }
    }

    return null;
  }

  /**
   * Gera resposta para o comando
   */
  private generateResponse(action: VoiceAction): string {
    switch (action.type) {
      case 'start_session':
        return 'Iniciando nova sessão de conferência';
      case 'end_session':
        return 'Finalizando sessão atual';
      case 'scan_package':
        return 'Modo scanner ativado';
      case 'show_report':
        return 'Abrindo relatório';
      case 'navigate':
        const screen = action.parameters?.screen;
        if (screen === 'analytics') return 'Abrindo analytics';
        if (screen === 'history') return 'Abrindo histórico';
        if (screen === 'settings') return 'Abrindo configurações';
        if (screen === 'back') return 'Voltando';
        if (screen === 'home') return 'Indo para o menu principal';
        return 'Navegando';
      case 'help':
        return 'Comandos disponíveis: iniciar sessão, escanear, relatório, analytics, histórico, configurações, ajuda';
      case 'settings':
        return 'Abrindo configurações';
      default:
        return 'Comando executado';
    }
  }

  /**
   * Inicia o reconhecimento de voz
   */
  async startListening(): Promise<boolean> {
    if (!this.isSupported) {
      this.notifyCallback({
        success: false,
        error: 'Reconhecimento de voz não suportado neste dispositivo',
      });
      return false;
    }

    if (this.isListening) {
      console.log('🎤 Already listening');
      return true;
    }

    try {
      this.recognition.start();
      return true;
    } catch (error) {
      console.error('❌ Failed to start voice recognition:', error);
      this.notifyCallback({
        success: false,
        error: 'Falha ao iniciar reconhecimento de voz',
      });
      return false;
    }
  }

  /**
   * Para o reconhecimento de voz
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Verifica se está ouvindo
   */
  isActive(): boolean {
    return this.isListening;
  }

  /**
   * Verifica se é suportado
   */
  isVoiceSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Define callback para comandos
   */
  onCommand(callback: (result: VoiceCommandResult) => void): void {
    this.onCommandCallback = callback;
  }

  /**
   * Notifica callback
   */
  private notifyCallback(result: VoiceCommandResult): void {
    if (this.onCommandCallback) {
      this.onCommandCallback(result);
    }
  }

  /**
   * Obtém histórico de comandos
   */
  getCommandHistory(): VoiceCommand[] {
    return [...this.commandHistory];
  }

  /**
   * Limpa histórico
   */
  clearHistory(): void {
    this.commandHistory = [];
  }

  /**
   * Obtém comandos disponíveis
   */
  getAvailableCommands(): string[] {
    return Array.from(this.commandPatterns.keys());
  }

  /**
   * Atualiza configuração
   */
  updateConfig(newConfig: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.recognition) {
      this.recognition.lang = this.config.language;
      this.recognition.continuous = this.config.continuous;
      this.recognition.interimResults = this.config.interimResults;
      this.recognition.maxAlternatives = this.config.maxAlternatives;
    }
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  /**
   * Limpa recursos
   */
  cleanup(): void {
    this.stopListening();
    this.recognition = null;
    this.commandHistory = [];
    this.onCommandCallback = undefined;
  }

  /**
   * Simula comando para testes
   */
  simulateCommand(phrase: string): VoiceCommandResult {
    const command = this.processCommand(phrase.toLowerCase(), 1.0);
    return command;
  }
}

// Export singleton
export const voiceCommandProcessor = new VoiceCommandProcessor();

// Hook React para comandos de voz
export function useVoiceCommands() {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);

  useEffect(() => {
    setIsSupported(voiceCommandProcessor.isVoiceSupported());
    
    voiceCommandProcessor.onCommand((result) => {
      setLastResult(result);
    });

    return () => {
      voiceCommandProcessor.cleanup();
    };
  }, []);

  const startListening = useCallback(async () => {
    const success = await voiceCommandProcessor.startListening();
    setIsListening(success);
    return success;
  }, []);

  const stopListening = useCallback(() => {
    voiceCommandProcessor.stopListening();
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSupported,
    lastResult,
    startListening,
    stopListening,
    getCommandHistory: voiceCommandProcessor.getCommandHistory,
    clearHistory: voiceCommandProcessor.clearHistory,
    getAvailableCommands: voiceCommandProcessor.getAvailableCommands,
    simulateCommand: voiceCommandProcessor.simulateCommand,
  };
}

// Importar useState do React
import { useState, useCallback, useEffect } from 'react';

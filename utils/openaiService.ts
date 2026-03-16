/**
 * OpenAI ChatGPT Integration Service
 * Serviço inteligente de integração com OpenAI API para assistência contextual
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  context?: ChatContext;
}

export interface ChatContext {
  sessionId?: string;
  operatorId?: string;
  currentPackage?: string;
  scanRate?: number;
  errorRate?: number;
  packageType?: string;
  lastAction?: string;
  sessionProgress?: number;
}

export interface ChatGPTConfig {
  apiKey: string;
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
  maxTokens: number;
  temperature: number;
  baseUrl?: string;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  actions?: ChatAction[];
  confidence: number;
  context?: string;
}

export interface ChatAction {
  type: 'scan' | 'photo' | 'pause' | 'resume' | 'help' | 'report' | 'optimize';
  label: string;
  description: string;
  parameters?: Record<string, any>;
}

class OpenAIService {
  private config: ChatGPTConfig | null = null;
  private chatHistory: Map<string, ChatMessage[]> = new Map();
  private contextCache: Map<string, ChatContext> = new Map();

  /**
   * Inicializa o serviço com configuração
   */
  async initialize(config: Partial<ChatGPTConfig>): Promise<void> {
    const defaultConfig: ChatGPTConfig = {
      apiKey: config.apiKey || (await this.getStoredApiKey()) || '',
      model: config.model || 'gpt-3.5-turbo',
      maxTokens: config.maxTokens || 500,
      temperature: config.temperature || 0.7,
      baseUrl: config.baseUrl || 'https://api.openai.com/v1'
    };

    if (!defaultConfig.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.config = defaultConfig;
    await this.loadChatHistory();
    console.log('🤖 OpenAI service initialized');
  }

  /**
   * Envia mensagem para o ChatGPT com contexto industrial
   */
  async sendMessage(
    message: string,
    context?: ChatContext,
    sessionId: string = 'default'
  ): Promise<ChatResponse> {
    if (!this.config) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      // Atualiza contexto
      if (context) {
        this.contextCache.set(sessionId, context);
      }

      // Constrói prompt com contexto industrial
      const systemPrompt = this.buildSystemPrompt(context);
      
      // Obtém histórico do chat
      const history = this.chatHistory.get(sessionId) || [];
      
      // Prepara mensagens para a API
      const messages: any[] = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-10).map(msg => ({
          role: msg.role,
          content: msg.content
        })),
        { role: 'user', content: message }
      ];

      console.log('📤 Sending message to ChatGPT...');

      // Chamada à API OpenAI
      const response = await axios.post(
        `${this.config.baseUrl}/chat/completions`,
        {
          model: this.config.model,
          messages,
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const assistantMessage = response.data.choices[0].message.content;
      
      // Processa resposta
      const processedResponse = this.processResponse(assistantMessage, context);

      // Salva no histórico
      await this.saveMessage(sessionId, {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: Date.now(),
        context
      });

      await this.saveMessage(sessionId, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: processedResponse.message,
        timestamp: Date.now()
      });

      return processedResponse;

    } catch (error) {
      console.error('❌ Error sending message to OpenAI:', error);
      
      // Fallback para respostas offline
      return this.getFallbackResponse(message, context);
    }
  }

  /**
   * Gera sugestões inteligentes baseadas no contexto
   */
  async generateSuggestions(context?: ChatContext): Promise<string[]> {
    if (!context) {
      return [
        'Como posso melhorar minha velocidade de scanning?',
        'Quais os erros mais comuns em pacotes Shopee?',
        'Como otimizar minha sequência de trabalho?',
        'Preciso de ajuda com um pacote problemático'
      ];
    }

    const suggestions: string[] = [];

    // Sugestões baseadas no contexto
    if (context.scanRate && context.scanRate < 8) {
      suggestions.push('Dicas para aumentar minha velocidade de scanning');
    }

    if (context.errorRate && context.errorRate > 0.1) {
      suggestions.push('Como reduzir minha taxa de erros');
    }

    if (context.packageType) {
      suggestions.push(`Melhores práticas para pacotes ${context.packageType}`);
    }

    if (context.sessionProgress && context.sessionProgress > 0.8) {
      suggestions.push('Verificação final para evitar divergências');
    }

    // Sugestões genéricas
    suggestions.push(
      'Analisar meu desempenho nesta sessão',
      'Recomendações de eficiência',
      'Ajuda com pacotes danificados'
    );

    return suggestions.slice(0, 4);
  }

  /**
   * Analisa imagem com ChatGPT Vision
   */
  async analyzeImage(
    imageBase64: string,
    question: string,
    context?: ChatContext
  ): Promise<ChatResponse> {
    if (!this.config) {
      throw new Error('OpenAI service not initialized');
    }

    try {
      const systemPrompt = this.buildVisionSystemPrompt(context);
      
      const response = await axios.post(
        `${this.config.baseUrl}/chat/completions`,
        {
          model: 'gpt-4-vision-preview',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: question },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`
                  }
                }
              ]
            }
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature
        },
        {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000
        }
      );

      const assistantMessage = response.data.choices[0].message.content;
      return this.processResponse(assistantMessage, context);

    } catch (error) {
      console.error('❌ Error analyzing image:', error);
      return this.getFallbackResponse('Não foi possível analisar a imagem', context);
    }
  }

  /**
   * Constrói prompt de sistema com contexto industrial
   */
  private buildSystemPrompt(context?: ChatContext): string {
    const basePrompt = `Você é um assistente especializado em logística industrial e conferência de pacotes para o sistema Beep Velozz.

SUA FUNÇÃO:
- Ajudar operadores a otimizar seu trabalho de conferência
- Fornecer insights baseados em dados da sessão atual
- Sugerir melhorias de eficiência e qualidade
- Ajudar na resolução de problemas e divergências

CONTEXTO INDUSTRIAL:
- Sistema de conferência de pacotes (Shopee, Mercado Livre, Avulsos)
- Taxa ideal: 10-12 pacotes/minuto
- Taxa de erro aceitável: <5%
- Principais problemas: danos, divergências, código ilegível

ESTILO DE COMUNICAÇÃO:
- Direto e objetivo
- Focado em ações práticas
- Use emojis quando apropriado
- Sempre sugira ações concretas`;

    if (context) {
      const contextInfo = `
CONTEXTO ATUAL:
- Sessão: ${context.sessionId || 'N/A'}
- Operador: ${context.operatorId || 'N/A'}
- Taxa de scanning: ${context.scanRate || 'N/A'} pacotes/min
- Taxa de erro: ${context.errorRate ? (context.errorRate * 100).toFixed(1) : 'N/A'}%
- Progresso: ${context.sessionProgress ? (context.sessionProgress * 100).toFixed(1) : 'N/A'}%
- Tipo atual: ${context.packageType || 'N/A'}
- Última ação: ${context.lastAction || 'N/A'}`;

      return basePrompt + '\n\n' + contextInfo;
    }

    return basePrompt;
  }

  /**
   * Constrói prompt para análise de imagens
   */
  private buildVisionSystemPrompt(context?: ChatContext): string {
    return `Você é um especialista em análise de imagens de pacotes logísticos.

ANALISE A IMAGEM E IDENTIFIQUE:
1. Estado da embalagem (danos, rasgos, umidade, amassados)
2. Legibilidade dos códigos de barras
3. Conformidade com padrões de qualidade
4. Riscos potenciais para o conteúdo

FORNEÇA:
- Avaliação qualitativa (excelente/bom/ruim)
- Problemas específicos detectados
- Recomendações de ação
- Nível de urgência

CONTEXTO: ${context?.packageType || 'Pacote logístico geral'}`;
  }

  /**
   * Processa resposta do ChatGPT
   */
  private processResponse(assistantMessage: string, context?: ChatContext): ChatResponse {
    // Extrai sugestões e ações da resposta
    const suggestions = this.extractSuggestions(assistantMessage);
    const actions = this.extractActions(assistantMessage, context);

    return {
      message: assistantMessage,
      suggestions,
      actions,
      confidence: 0.85,
      context: context?.sessionId
    };
  }

  /**
   * Extrai sugestões da mensagem
   */
  private extractSuggestions(message: string): string[] {
    const suggestions: string[] = [];
    
    // Procura por padrões de sugestão
    const patterns = [
      /💡\s*(.+)/g,
      /📌\s*(.+)/g,
      /✅\s*(.+)/g,
      /Dica:\s*(.+)/gi,
      /Sugestão:\s*(.+)/gi
    ];

    patterns.forEach(pattern => {
      const matches = message.match(pattern);
      if (matches) {
        suggestions.push(...matches.map(m => m.replace(/[💡📌✅]|Dica:|Sugestão:/gi, '').trim()));
      }
    });

    return suggestions.slice(0, 3);
  }

  /**
   * Extrai ações acionáveis da mensagem
   */
  private extractActions(message: string, context?: ChatContext): ChatAction[] {
    const actions: ChatAction[] = [];

    // Ações baseadas em palavras-chave
    if (message.toLowerCase().includes('foto') || message.toLowerCase().includes('foto')) {
      actions.push({
        type: 'photo',
        label: 'Tirar Foto',
        description: 'Capturar imagem do pacote para análise'
      });
    }

    if (message.toLowerCase().includes('pausa') || message.toLowerCase().includes('parar')) {
      actions.push({
        type: 'pause',
        label: 'Pausar Sessão',
        description: 'Fazer uma pausa na conferência'
      });
    }

    if (message.toLowerCase().includes('ajuda') || message.toLowerCase().includes('suporte')) {
      actions.push({
        type: 'help',
        label: 'Obter Ajuda',
        description: 'Contactar supervisor ou suporte técnico'
      });
    }

    if (message.toLowerCase().includes('relatório') || message.toLowerCase().includes('relatorio')) {
      actions.push({
        type: 'report',
        label: 'Gerar Relatório',
        description: 'Gerar relatório de desempenho'
      });
    }

    return actions;
  }

  /**
   * Gera sugestões de fallback (síncrono)
   */
  private generateFallbackSuggestions(context?: ChatContext): string[] {
    if (!context) {
      return [
        'Como posso melhorar minha velocidade de scanning?',
        'Quais os erros mais comuns em pacotes Shopee?',
        'Como otimizar minha sequência de trabalho?',
        'Preciso de ajuda com um pacote problemático'
      ];
    }

    const suggestions: string[] = [];

    if (context.scanRate && context.scanRate < 8) {
      suggestions.push('Dicas para aumentar minha velocidade de scanning');
    }

    if (context.errorRate && context.errorRate > 0.1) {
      suggestions.push('Como reduzir minha taxa de erros');
    }

    if (context.packageType) {
      suggestions.push(`Melhores práticas para pacotes ${context.packageType}`);
    }

    suggestions.push('Analisar meu desempenho nesta sessão');

    return suggestions.slice(0, 4);
  }

  /**
   * Resposta de fallback quando API está indisponível
   */
  private getFallbackResponse(message: string, context?: ChatContext): ChatResponse {
    const fallbackMessages = [
      'Estou offline no momento. Tente novamente em alguns instantes.',
      'Não consegui conectar com meus servidores. Verifique sua conexão.',
      'Serviço temporariamente indisponível. Recomendo usar as ferramentas manuais.'
    ];

    return {
      message: fallbackMessages[Math.floor(Math.random() * fallbackMessages.length)],
      suggestions: this.generateFallbackSuggestions(context),
      actions: [{
        type: 'help',
        label: 'Ajuda Manual',
        description: 'Consultar guia de operação'
      }],
      confidence: 0.3
    };
  }

  /**
   * Salva mensagem no histórico
   */
  private async saveMessage(sessionId: string, message: ChatMessage): Promise<void> {
    const history = this.chatHistory.get(sessionId) || [];
    history.push(message);
    
    // Mantém apenas as últimas 50 mensagens
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
    
    this.chatHistory.set(sessionId, history);
    
    // Persiste no AsyncStorage
    try {
      await AsyncStorage.setItem(`chat_history_${sessionId}`, JSON.stringify(history));
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }

  /**
   * Carrega histórico do AsyncStorage
   */
  private async loadChatHistory(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const chatKeys = keys.filter(key => key.startsWith('chat_history_'));
      
      for (const key of chatKeys) {
        const sessionId = key.replace('chat_history_', '');
        const history = await AsyncStorage.getItem(key);
        
        if (history) {
          this.chatHistory.set(sessionId, JSON.parse(history));
        }
      }
      
      console.log('📚 Chat history loaded');
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  }

  /**
   * Obtém API key armazenada
   */
  private async getStoredApiKey(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('openai_api_key');
    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }

  /**
   * Salva API key
   */
  async saveApiKey(apiKey: string): Promise<void> {
    try {
      await AsyncStorage.setItem('openai_api_key', apiKey);
      if (this.config) {
        this.config.apiKey = apiKey;
      }
      console.log('🔑 API key saved');
    } catch (error) {
      console.error('Error saving API key:', error);
      throw error;
    }
  }

  /**
   * Limpa histórico do chat
   */
  async clearHistory(sessionId?: string): Promise<void> {
    if (sessionId) {
      this.chatHistory.delete(sessionId);
      await AsyncStorage.removeItem(`chat_history_${sessionId}`);
    } else {
      this.chatHistory.clear();
      const keys = await AsyncStorage.getAllKeys();
      const chatKeys = keys.filter(key => key.startsWith('chat_history_'));
      await AsyncStorage.multiRemove(chatKeys);
    }
    
    console.log('🗑️ Chat history cleared');
  }

  /**
   * Obtém estatísticas de uso
   */
  getUsageStats(): {
    totalSessions: number;
    totalMessages: number;
    activeSessions: string[];
  } {
    const totalSessions = this.chatHistory.size;
    const totalMessages = Array.from(this.chatHistory.values())
      .reduce((sum, history) => sum + history.length, 0);
    const activeSessions = Array.from(this.chatHistory.keys());

    return {
      totalSessions,
      totalMessages,
      activeSessions
    };
  }

  /**
   * Verifica se o serviço está inicializado
   */
  isInitialized(): boolean {
    return this.config !== null;
  }

  /**
   * Limpa recursos
   */
  cleanup(): void {
    this.chatHistory.clear();
    this.contextCache.clear();
    this.config = null;
  }
}

// Export singleton
export const openaiService = new OpenAIService();

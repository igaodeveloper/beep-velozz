/**
 * API Configuration Management
 * Gerenciamento seguro de configurações de APIs
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { openaiService } from './openaiService';

export interface APIConfig {
  openai: {
    apiKey: string;
    model: 'gpt-3.5-turbo' | 'gpt-4' | 'gpt-4-turbo';
    maxTokens: number;
    temperature: number;
    baseUrl: string;
  };
}

class APIConfigManager {
  private static readonly STORAGE_KEY = 'api_config';
  private static readonly OPENAI_KEY_KEY = 'openai_api_key';
  
  private config: APIConfig = {
    openai: {
      apiKey: '',
      model: 'gpt-3.5-turbo',
      maxTokens: 500,
      temperature: 0.7,
      baseUrl: 'https://api.openai.com/v1'
    }
  };

  /**
   * Carrega configurações do storage
   */
  async loadConfig(): Promise<void> {
    try {
      const storedConfig = await AsyncStorage.getItem(APIConfigManager.STORAGE_KEY);
      if (storedConfig) {
        this.config = { ...this.config, ...JSON.parse(storedConfig) };
      }

      // Carrega API key separadamente por segurança
      const apiKey = await AsyncStorage.getItem(APIConfigManager.OPENAI_KEY_KEY);
      if (apiKey) {
        this.config.openai.apiKey = apiKey;
      }

      console.log('🔑 API configuration loaded');
    } catch (error) {
      console.error('❌ Error loading API config:', error);
    }
  }

  /**
   * Salva configurações no storage
   */
  async saveConfig(): Promise<void> {
    try {
      // Salva configurações sem a API key
      const configToSave = { ...this.config };
      configToSave.openai = { ...configToSave.openai, apiKey: '' };
      
      await AsyncStorage.setItem(APIConfigManager.STORAGE_KEY, JSON.stringify(configToSave));
      
      // Salva API key separadamente
      if (this.config.openai.apiKey) {
        await AsyncStorage.setItem(APIConfigManager.OPENAI_KEY_KEY, this.config.openai.apiKey);
      }

      console.log('💾 API configuration saved');
    } catch (error) {
      console.error('❌ Error saving API config:', error);
      throw error;
    }
  }

  /**
   * Define a API key do OpenAI
   */
  async setOpenAIApiKey(apiKey: string): Promise<void> {
    if (!apiKey || !apiKey.startsWith('sk-')) {
      throw new Error('Invalid OpenAI API key format');
    }

    this.config.openai.apiKey = apiKey;
    await this.saveConfig();
    
    // Atualiza o serviço OpenAI
    if (openaiService.isInitialized()) {
      await openaiService.saveApiKey(apiKey);
    }

    console.log('🔐 OpenAI API key configured');
  }

  /**
   * Obtém a API key do OpenAI
   */
  getOpenAIApiKey(): string {
    return this.config.openai.apiKey;
  }

  /**
   * Configuração completa do OpenAI
   */
  getOpenAIConfig() {
    return { ...this.config.openai };
  }

  /**
   * Atualiza configurações do OpenAI
   */
  async updateOpenAIConfig(updates: Partial<APIConfig['openai']>): Promise<void> {
    this.config.openai = { ...this.config.openai, ...updates };
    await this.saveConfig();
    
    // Reinitializa o serviço se necessário
    if (openaiService.isInitialized() && updates.apiKey) {
      await openaiService.initialize(this.config.openai);
    }
  }

  /**
   * Remove a API key (logout)
   */
  async removeOpenAIApiKey(): Promise<void> {
    this.config.openai.apiKey = '';
    await AsyncStorage.removeItem(APIConfigManager.OPENAI_KEY_KEY);
    console.log('🗑️ OpenAI API key removed');
  }

  /**
   * Verifica se a API key está configurada
   */
  hasOpenAIApiKey(): boolean {
    return !!this.config.openai.apiKey && this.config.openai.apiKey.startsWith('sk-');
  }

  /**
   * Valida a API key
   */
  validateApiKey(apiKey: string): boolean {
    return !!(apiKey && 
           apiKey.startsWith('sk-') && 
           apiKey.length > 40 &&
           apiKey.includes('-'));
  }

  /**
   * Inicializa o serviço OpenAI com as configurações atuais
   */
  async initializeOpenAIService(): Promise<void> {
    if (!this.hasOpenAIApiKey()) {
      throw new Error('OpenAI API key not configured');
    }

    try {
      await openaiService.initialize(this.config.openai);
      console.log('🤖 OpenAI service initialized with stored config');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI service:', error);
      throw error;
    }
  }

  /**
   * Exporta configurações (sem API keys)
   */
  exportConfig(): Omit<APIConfig, 'openai'> & { openai: Omit<APIConfig['openai'], 'apiKey'> } {
    return {
      openai: {
        model: this.config.openai.model,
        maxTokens: this.config.openai.maxTokens,
        temperature: this.config.openai.temperature,
        baseUrl: this.config.openai.baseUrl
      }
    };
  }

  /**
   * Importa configurações
   */
  async importConfig(config: Partial<APIConfig>): Promise<void> {
    if (config.openai) {
      await this.updateOpenAIConfig(config.openai);
    }
  }

  /**
   * Limpa todas as configurações
   */
  async clearAll(): Promise<void> {
    await this.removeOpenAIApiKey();
    await AsyncStorage.removeItem(APIConfigManager.STORAGE_KEY);
    this.config = {
      openai: {
        apiKey: '',
        model: 'gpt-3.5-turbo',
        maxTokens: 500,
        temperature: 0.7,
        baseUrl: 'https://api.openai.com/v1'
      }
    };
    console.log('🗑️ All API configurations cleared');
  }

  /**
   * Obtém status das configurações
   */
  getStatus(): {
    hasOpenAIKey: boolean;
    openAIModel: string;
    openAIInitialized: boolean;
  } {
    return {
      hasOpenAIKey: this.hasOpenAIApiKey(),
      openAIModel: this.config.openai.model,
      openAIInitialized: openaiService.isInitialized()
    };
  }
}

// Export singleton
export const apiConfig = new APIConfigManager();

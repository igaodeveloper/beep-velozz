/**
 * API Initializer
 * Script de inicialização das APIs com as chaves fornecidas
 */

import { apiConfig } from './apiConfig';

/**
 * Inicializa as APIs com as chaves fornecidas
 */
export async function initializeAPIs(): Promise<void> {
  try {
    console.log('🚀 Initializing APIs...');
    
    // Carrega configurações existentes
    await apiConfig.loadConfig();
    
    // Verifica se já tem uma API key configurada
    if (!apiConfig.hasOpenAIApiKey()) {
      // Configura a API key fornecida
      await apiConfig.setOpenAIApiKey('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');
      
      // Configura parâmetros otimizados para uso industrial
      await apiConfig.updateOpenAIConfig({
        model: 'gpt-3.5-turbo',
        maxTokens: 500,
        temperature: 0.7
      });
    }
    
    // Inicializa o serviço OpenAI
    await apiConfig.initializeOpenAIService();
    
    console.log('✅ APIs initialized successfully');
    console.log('📊 Status:', apiConfig.getStatus());
    
  } catch (error) {
    console.error('❌ Failed to initialize APIs:', error);
    throw error;
  }
}

/**
 * Verifica se as APIs estão configuradas
 */
export async function checkAPIsStatus(): Promise<{
  openai: boolean;
  details: any;
}> {
  try {
    await apiConfig.loadConfig();
    const status = apiConfig.getStatus();
    
    return {
      openai: status.hasOpenAIKey && status.openAIInitialized,
      details: status
    };
  } catch (error) {
    console.error('❌ Error checking APIs status:', error);
    return {
      openai: false,
      details: { error: error instanceof Error ? error.message : String(error) }
    };
  }
}

/**
 * Reset das configurações de API
 */
export async function resetAPIs(): Promise<void> {
  try {
    console.log('🔄 Resetting API configurations...');
    await apiConfig.clearAll();
    console.log('✅ API configurations reset');
  } catch (error) {
    console.error('❌ Error resetting APIs:', error);
    throw error;
  }
}

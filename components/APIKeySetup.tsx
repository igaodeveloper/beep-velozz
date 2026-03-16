/**
 * API Key Setup Component
 * Componente para configuração segura da API key do ChatGPT
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiConfig } from '@/utils/apiConfig';
import { initializeAPIs, checkAPIsStatus } from '@/utils/apiInitializer';
import { useAppTheme } from '@/utils/useAppTheme';
import { advancedHaptics } from '@/utils/advancedHaptics';

interface APIKeySetupProps {
  onSetupComplete?: () => void;
  onSkip?: () => void;
}

export const APIKeySetup: React.FC<APIKeySetupProps> = ({
  onSetupComplete,
  onSkip
}) => {
  const theme = useAppTheme();
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    checkInitialStatus();
  }, []);

  const checkInitialStatus = async () => {
    try {
      const status = await checkAPIsStatus();
      setIsConfigured(status.openai);
      
      if (status.openai && onSetupComplete) {
        onSetupComplete();
      }
    } catch (error) {
      console.error('Error checking initial status:', error);
    }
  };

  const handleSetupWithProvidedKey = async () => {
    setIsLoading(true);
    setValidationError('');
    
    try {
      advancedHaptics.trigger('medium');
      
      // Usa a API key fornecida diretamente
      const providedKey = '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';
      
      await apiConfig.setOpenAIApiKey(providedKey);
      await apiConfig.updateOpenAIConfig({
        model: 'gpt-3.5-turbo',
        maxTokens: 500,
        temperature: 0.7
      });
      
      await initializeAPIs();
      
      advancedHaptics.trigger('success');
      setIsConfigured(true);
      
      Alert.alert(
        '✅ Sucesso!',
        'ChatGPT configurado com sucesso! O assistente IA está pronto para usar.',
        [
          {
            text: 'OK',
            onPress: () => onSetupComplete?.()
          }
        ]
      );
      
    } catch (error) {
      console.error('Error setting up API:', error);
      advancedHaptics.trigger('error');
      setValidationError('Erro ao configurar API. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSetup = async () => {
    if (!apiKey.trim()) {
      setValidationError('Digite uma API key válida');
      return;
    }

    if (!apiConfig.validateApiKey(apiKey)) {
      setValidationError('Formato de API key inválido');
      return;
    }

    setIsLoading(true);
    setValidationError('');
    
    try {
      advancedHaptics.trigger('medium');
      
      await apiConfig.setOpenAIApiKey(apiKey.trim());
      await initializeAPIs();
      
      advancedHaptics.trigger('success');
      setIsConfigured(true);
      
      Alert.alert(
        '✅ Sucesso!',
        'API key configurada com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => onSetupComplete?.()
          }
        ]
      );
      
    } catch (error) {
      console.error('Error setting up manual API:', error);
      advancedHaptics.trigger('error');
      setValidationError('Erro ao configurar API key. Verifique se está correta.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Pular Configuração',
      'O assistente IA funcionará em modo limitado sem API key. Você pode configurar depois nas configurações.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Pular',
          style: 'destructive',
          onPress: () => {
            advancedHaptics.trigger('light');
            onSkip?.();
          }
        }
      ]
    );
  };

  if (isConfigured) {
    return (
      <SafeAreaView className={`flex-1 ${theme.isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <View className="flex-1 items-center justify-center px-6">
          <View className="items-center">
            <Ionicons
              name="checkmark-circle"
              size={80}
              color="#10B981"
            />
            <Text className={`text-2xl font-bold mt-4 ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
              ChatGPT Configurado!
            </Text>
            <Text className={`text-center mt-2 ${theme.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              O assistente IA está pronto para ajudar na sua operação industrial.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${theme.isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <View className="flex-1 px-6 py-8">
        {/* Header */}
        <View className="items-center mb-8">
          <View className="w-20 h-20 bg-blue-100 rounded-full items-center justify-center mb-4">
            <Ionicons
              name="chatbubble-ellipses"
              size={40}
              color="#3B82F6"
            />
          </View>
          <Text className={`text-2xl font-bold text-center ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
            Assistente IA
          </Text>
          <Text className={`text-center mt-2 ${theme.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Configure o ChatGPT para assistência inteligente em tempo real
          </Text>
        </View>

        {/* Benefits */}
        <View className={`mb-8 p-4 rounded-lg ${theme.isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <Text className={`font-semibold mb-3 ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
            🚀 Benefícios:
          </Text>
          <View className="space-y-2">
            <Text className={`text-sm ${theme.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              • Assistência 24/7 para dúvidas operacionais
            </Text>
            <Text className={`text-sm ${theme.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              • Análise inteligente de imagens de pacotes
            </Text>
            <Text className={`text-sm ${theme.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              • Recomendações personalizadas de eficiência
            </Text>
            <Text className={`text-sm ${theme.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              • Detecção precoce de problemas e divergências
            </Text>
          </View>
        </View>

        {/* Quick Setup Button */}
        <TouchableOpacity
          onPress={handleSetupWithProvidedKey}
          disabled={isLoading}
          className="w-full bg-blue-500 p-4 rounded-lg mb-3"
        >
          {isLoading ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">
                Configurando...
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center justify-center">
              <Ionicons
                name="flash"
                size={20}
                color="#FFFFFF"
              />
              <Text className="text-white font-semibold ml-2">
                Configuração Rápida (Recomendado)
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Manual Setup */}
        {!showKeyInput && (
          <TouchableOpacity
            onPress={() => {
              advancedHaptics.trigger('light');
              setShowKeyInput(true);
            }}
            disabled={isLoading}
            className={`w-full p-4 rounded-lg border ${
              theme.isDark ? 'border-gray-700' : 'border-gray-300'
            }`}
          >
            <Text className={`text-center font-semibold ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
              Usar outra API Key
            </Text>
          </TouchableOpacity>
        )}

        {/* Manual Key Input */}
        {showKeyInput && (
          <View className="mt-4">
            <Text className={`font-semibold mb-2 ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
              API Key do ChatGPT:
            </Text>
            <TextInput
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="sk-proj-..."
              placeholderTextColor={theme.isDark ? '#6B7280' : '#9CA3AF'}
              multiline
              className={`w-full p-3 rounded-lg border ${
                theme.isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-800'
              }`}
              style={{ minHeight: 80 }}
            />
            
            {validationError ? (
              <Text className="text-red-500 text-sm mt-2">
                {validationError}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={handleManualSetup}
              disabled={isLoading || !apiKey.trim()}
              className={`w-full mt-3 p-4 rounded-lg ${
                isLoading || !apiKey.trim()
                  ? theme.isDark ? 'bg-gray-800' : 'bg-gray-300'
                  : 'bg-blue-500'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white font-semibold text-center">
                  Configurar API Key
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Validation Error */}
        {validationError && !showKeyInput && (
          <Text className="text-red-500 text-sm mt-2 text-center">
            {validationError}
          </Text>
        )}

        {/* Skip Button */}
        <TouchableOpacity
          onPress={handleSkip}
          disabled={isLoading}
          className="w-full mt-6"
        >
          <Text className={`text-center ${theme.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Pular por enquanto
          </Text>
        </TouchableOpacity>

        {/* Security Note */}
        <View className={`mt-8 p-3 rounded-lg ${theme.isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
          <Text className={`text-xs ${theme.isDark ? 'text-gray-400' : 'text-blue-700'}`}>
            🔒 Sua API key é armazenada de forma segura no dispositivo e não é compartilhada.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

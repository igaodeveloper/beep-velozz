/**
 * Intelligent Chat Component
 * Componente de chat inteligente com integração ChatGPT para assistência industrial
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Vibration,
  Modal,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { openaiService, ChatMessage, ChatContext, ChatResponse, ChatAction } from '@/utils/openaiService';
import { useAppTheme } from '@/utils/useAppTheme';
import { advancedHaptics } from '@/utils/advancedHaptics';

interface IntelligentChatProps {
  visible: boolean;
  onClose: () => void;
  context?: ChatContext;
  sessionId?: string;
}

interface MessageBubbleProps {
  message: ChatMessage;
  isUser: boolean;
  theme: any;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isUser, theme }) => {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      className={`max-w-[85%] ${isUser ? 'self-end' : 'self-start'} mb-3`}
    >
      <View
        className={`rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-500 rounded-br-sm'
            : theme.isDark ? 'bg-gray-700 rounded-bl-sm' : 'bg-gray-200 rounded-bl-sm'
        }`}
      >
        <Text
          className={`text-sm ${
            isUser ? 'text-white' : theme.isDark ? 'text-white' : 'text-gray-800'
          }`}
        >
          {message.content}
        </Text>
      </View>
      <Text
        className={`text-xs ${
          isUser ? 'text-right text-blue-400' : theme.isDark ? 'text-gray-400' : 'text-gray-500'
        } mt-1`}
      >
        {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })}
      </Text>
    </Animated.View>
  );
};

interface SuggestionChipProps {
  suggestion: string;
  onPress: (suggestion: string) => void;
  theme: any;
}

const SuggestionChip: React.FC<SuggestionChipProps> = ({ suggestion, onPress, theme }) => {
  return (
    <TouchableOpacity
      onPress={() => {
        advancedHaptics.trigger('light');
        onPress(suggestion);
      }}
      className={`mr-2 mb-2 px-3 py-2 rounded-full ${
        theme.isDark ? 'bg-gray-700' : 'bg-gray-100'
      }`}
    >
      <Text className={`text-sm ${theme.isDark ? 'text-gray-300' : 'text-gray-700'}`}>
        💡 {suggestion}
      </Text>
    </TouchableOpacity>
  );
};

interface ActionButtonProps {
  action: ChatAction;
  onPress: (action: ChatAction) => void;
  theme: any;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, onPress, theme }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'photo': return 'camera';
      case 'pause': return 'pause';
      case 'help': return 'help';
      case 'report': return 'document-text';
      case 'scan': return 'barcode';
      default: return 'chevron-forward';
    }
  };

  return (
    <TouchableOpacity
      onPress={() => {
        advancedHaptics.trigger('medium');
        onPress(action);
      }}
      className={`flex-row items-center justify-between p-3 mb-2 rounded-lg ${
        theme.isDark ? 'bg-gray-800' : 'bg-gray-50'
      }`}
    >
      <View className="flex-row items-center flex-1">
        <Ionicons
          name={getIcon(action.type) as any}
          size={20}
          color={theme.isDark ? '#60A5FA' : '#3B82F6'}
        />
        <View className="ml-3 flex-1">
          <Text className={`font-medium ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
            {action.label}
          </Text>
          <Text className={`text-xs mt-1 ${theme.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {action.description}
          </Text>
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={theme.isDark ? '#6B7280' : '#9CA3AF'}
      />
    </TouchableOpacity>
  );
};

export const IntelligentChat: React.FC<IntelligentChatProps> = ({
  visible,
  onClose,
  context,
  sessionId = 'default'
}) => {
  const theme = useAppTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [actions, setActions] = useState<ChatAction[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Carrega histórico e sugestões iniciais
  useEffect(() => {
    if (visible) {
      loadChatHistory();
      loadSuggestions();
      // Foca no input quando abre
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [visible, context]);

  /**
   * Carrega histórico do chat
   */
  const loadChatHistory = async () => {
    try {
      // O histórico já é carregado automaticamente pelo serviço
      // Aqui poderíamos obter as mensagens do serviço se necessário
      setMessages([]);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  /**
   * Carrega sugestões inteligentes
   */
  const loadSuggestions = async () => {
    try {
      const suggestionList = await openaiService.generateSuggestions(context);
      setSuggestions(suggestionList);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  /**
   * Envia mensagem para o ChatGPT
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
      context
    };

    // Adiciona mensagem do usuário imediatamente
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    setActions([]);
    setSuggestions([]);

    try {
      // Envia para OpenAI
      const response: ChatResponse = await openaiService.sendMessage(text, context, sessionId);

      // Adiciona resposta do assistente
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.message,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setActions(response.actions || []);
      
      // Se houver sugestões na resposta, atualiza
      if (response.suggestions && response.suggestions.length > 0) {
        setSuggestions(response.suggestions);
      } else {
        // Recarrega sugestões padrão
        loadSuggestions();
      }

      // Haptics de sucesso
      advancedHaptics.trigger('success');

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Mensagem de erro
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, tive um problema ao processar sua mensagem. Tente novamente.',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessage]);
      advancedHaptics.trigger('error');
    } finally {
      setIsLoading(false);
    }
  }, [context, sessionId, isLoading]);

  /**
   * Manipula ação do chat
   */
  const handleAction = useCallback(async (action: ChatAction) => {
    try {
      switch (action.type) {
        case 'photo':
          // Dispara evento para tirar foto
          Alert.alert('Ação de Foto', 'Funcionalidade de foto será implementada');
          break;
          
        case 'pause':
          Alert.alert('Pausar Sessão', 'Deseja pausar a sessão atual?', [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Pausar', onPress: () => console.log('Sessão pausada') }
          ]);
          break;
          
        case 'help':
          // Envia mensagem automática de ajuda
          sendMessage('Preciso de ajuda com meu trabalho atual');
          break;
          
        case 'report':
          Alert.alert('Relatório', 'Gerando relatório de desempenho...');
          break;
          
        case 'scan':
          Alert.alert('Scanning', 'Iniciando modo de scanning otimizado...');
          break;
          
        default:
          console.log('Unknown action:', action);
      }
    } catch (error) {
      console.error('Error handling action:', error);
    }
  }, [sendMessage]);

  /**
   * Analisa imagem com ChatGPT Vision
   */
  const analyzeImage = useCallback(async (imageUri: string) => {
    setIsLoading(true);
    
    try {
      const response = await openaiService.analyzeImage(
        imageUri,
        'Analise este pacote e identifique possíveis problemas',
        context
      );

      const message: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.message,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, message]);
      setActions(response.actions || []);

    } catch (error) {
      console.error('Error analyzing image:', error);
    } finally {
      setIsLoading(false);
    }
  }, [context]);

  /**
   * Renderiza mensagem
   */
  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <MessageBubble message={item} isUser={item.role === 'user'} theme={theme} />
  );

  /**
   * Renderiza sugestões
   */
  const renderSuggestions = () => {
    if (suggestions.length === 0) return null;

    return (
      <View className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
        <Text className={`text-xs font-medium mb-2 ${theme.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Sugestões rápidas:
        </Text>
        <View className="flex-row flex-wrap">
          {suggestions.map((suggestion, index) => (
            <SuggestionChip
              key={index}
              suggestion={suggestion}
              onPress={sendMessage}
              theme={theme}
            />
          ))}
        </View>
      </View>
    );
  };

  /**
   * Renderiza ações
   */
  const renderActions = () => {
    if (actions.length === 0) return null;

    return (
      <View className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <Text className={`text-xs font-medium mb-2 ${theme.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Ações disponíveis:
        </Text>
        {actions.map((action, index) => (
          <ActionButton
            key={index}
            action={action}
            onPress={handleAction}
            theme={theme}
          />
        ))}
      </View>
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView className={`flex-1 ${theme.isDark ? 'bg-gray-900' : 'bg-white'}`}>
        {/* Header */}
        <View className={`flex-row items-center justify-between px-4 py-3 border-b ${
          theme.isDark ? 'border-gray-800' : 'border-gray-200'
        }`}>
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onClose} className="mr-3">
              <Ionicons
                name="arrow-back"
                size={24}
                color={theme.isDark ? '#FFFFFF' : '#000000'}
              />
            </TouchableOpacity>
            <View>
              <Text className={`font-semibold text-lg ${theme.isDark ? 'text-white' : 'text-gray-800'}`}>
                Assistente IA
              </Text>
              <Text className={`text-xs ${theme.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {context?.sessionId ? `Sessão ${context.sessionId}` : 'Chat industrial'}
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center">
            <View className="w-2 h-2 bg-green-500 rounded-full mr-2" />
            <Text className={`text-xs ${theme.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Online
            </Text>
          </View>
        </View>

        {/* Messages */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item.id}
            className="flex-1 px-4 py-2"
            contentContainerStyle={{ paddingBottom: 16 }}
            onContentSizeChange={() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center py-8">
                <Ionicons
                  name="chatbubble-ellipses"
                  size={48}
                  color={theme.isDark ? '#4B5563' : '#9CA3AF'}
                />
                <Text className={`text-center mt-4 ${theme.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Olá! Sou seu assistente industrial 👋
                </Text>
                <Text className={`text-center text-sm mt-2 ${theme.isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                  Posso ajudar com otimização, problemas e dúvidas sobre sua operação
                </Text>
              </View>
            }
          />

          {/* Actions */}
          {renderActions()}

          {/* Loading indicator */}
          {isLoading && (
            <View className="px-4 py-2">
              <View className="flex-row items-center">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className={`ml-2 text-sm ${theme.isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Processando...
                </Text>
              </View>
            </View>
          )}

          {/* Suggestions */}
          {renderSuggestions()}

          {/* Input */}
          <View className={`px-4 py-3 border-t ${
            theme.isDark ? 'border-gray-800 bg-gray-800' : 'border-gray-200 bg-gray-50'
          }`}>
            <View className="flex-row items-end space-x-2">
              <TextInput
                ref={inputRef}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Digite sua mensagem..."
                placeholderTextColor={theme.isDark ? '#6B7280' : '#9CA3AF'}
                multiline
                maxLength={500}
                className={`flex-1 max-h-32 px-4 py-2 rounded-lg ${
                  theme.isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-800'
                }`}
                style={{ fontSize: 16 }}
              />
              
              <TouchableOpacity
                onPress={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
                className={`p-3 rounded-lg ${
                  inputText.trim() && !isLoading
                    ? 'bg-blue-500'
                    : theme.isDark ? 'bg-gray-700' : 'bg-gray-300'
                }`}
              >
                <Ionicons
                  name="send"
                  size={20}
                  color={inputText.trim() && !isLoading ? '#FFFFFF' : theme.isDark ? '#4B5563' : '#6B7280'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

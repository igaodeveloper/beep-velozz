/**
 * Support Chatbot Component
 * Chatbot de suporte inteligente com IA para ajuda aos usuários
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  type FlexAlignType,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { shouldAnimate } from '@/utils/performanceOptimizer';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: number;
  type: 'text' | 'quick_reply' | 'action' | 'info';
  metadata?: {
    suggestions?: string[];
    actions?: Array<{
      label: string;
      action: string;
      icon?: string;
    }>;
    confidence?: number;
  };
}

interface SupportCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  keywords: string[];
  priority: 'low' | 'medium' | 'high';
}

const SupportChatbot: React.FC<{
  visible: boolean;
  onClose: () => void;
}> = ({ visible, onClose }) => {
  const { colors } = useAppTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const slideAnimation = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnimation = useRef(new Animated.Value(0)).current;

  // Categorias de suporte
  const supportCategories: SupportCategory[] = [
    {
      id: 'scanner',
      name: 'Scanner',
      icon: 'barcode-outline',
      description: 'Problemas com o scanner de códigos',
      keywords: ['scanner', 'código', 'leitura', 'erro', 'não lê'],
      priority: 'high',
    },
    {
      id: 'session',
      name: 'Sessões',
      icon: 'time-outline',
      description: 'Gerenciamento de sessões de conferência',
      keywords: ['sessão', 'conferência', 'iniciar', 'finalizar'],
      priority: 'high',
    },
    {
      id: 'reports',
      name: 'Relatórios',
      icon: 'document-text-outline',
      description: 'Geração e análise de relatórios',
      keywords: ['relatório', 'análise', 'exportar', 'pdf'],
      priority: 'medium',
    },
    {
      id: 'performance',
      name: 'Performance',
      icon: 'speedometer-outline',
      description: 'Otimização e velocidade do sistema',
      keywords: ['lento', 'performance', 'rápido', 'otimizar'],
      priority: 'medium',
    },
    {
      id: 'account',
      name: 'Conta',
      icon: 'person-outline',
      description: 'Configurações de perfil e preferências',
      keywords: ['perfil', 'conta', 'configurações', 'senha'],
      priority: 'low',
    },
    {
      id: 'help',
      name: 'Ajuda Geral',
      icon: 'help-circle-outline',
      description: 'Dúvidas gerais sobre o sistema',
      keywords: ['ajuda', 'como', 'tutorial', 'guia'],
      priority: 'medium',
    },
  ];

  // Respostas pré-definidas
  const botResponses: Record<string, (query: string) => ChatMessage> = {
    scanner: (query) => ({
      id: `bot_${Date.now()}`,
      text: 'Para problemas com o scanner, tente estas soluções:\n\n📱 **Verifique a câmera:**\n• Limpe a lente da câmera\n• Garanta boa iluminação\n• Mantenha distância adequada\n\n🔧 **Configurações:**\n• Verifique permissões da câmera\n• Teste com diferentes códigos\n• Reinicie o aplicativo se necessário\n\nPrecisa de ajuda específica?',
      sender: 'bot',
      timestamp: Date.now(),
      type: 'info',
      metadata: {
        suggestions: ['Câmera não foca', 'Código não é lido', 'Erro de permissão'],
        actions: [
          { label: 'Testar Scanner', action: 'test_scanner', icon: 'barcode-outline' },
          { label: 'Configurar Câmera', action: 'setup_camera', icon: 'camera-outline' },
        ],
      },
    }),
    session: (query) => ({
      id: `bot_${Date.now()}`,
      text: 'Sobre as sessões de conferência:\n\n📋 **Iniciar Sessão:**\n• Clique em "Iniciar Conferência"\n• Informe operador e motorista\n• Declare as quantidades esperadas\n\n✅ **Durante a Sessão:**\n• Escaneie os pacotes\n• Monitore o progresso\n• Verifique divergências\n\n📊 **Finalizar:**\n• Verifique se não há divergências\n• Gere o relatório final\n• Salve os dados\n\nComo posso ajudar com sua sessão?',
      sender: 'bot',
      timestamp: Date.now(),
      type: 'info',
      metadata: {
        suggestions: ['Como iniciar sessão', 'Resolver divergência', 'Gerar relatório'],
        actions: [
          { label: 'Iniciar Nova Sessão', action: 'start_session', icon: 'play-circle-outline' },
          { label: 'Ver Histórico', action: 'view_history', icon: 'time-outline' },
        ],
      },
    }),
    reports: (query) => ({
      id: `bot_${Date.now()}`,
      text: 'Para gerar relatórios:\n\n📈 **Tipos Disponíveis:**\n• Relatório de sessão individual\n• Relatório consolidado\n• Análise de performance\n• Exportação em PDF\n\n🔍 **Onde encontrar:**\n• Após finalizar uma sessão\n• Na tela de analytics\n• No histórico de sessões\n\n✨ **Recursos:**\n• Gráficos e visualizações\n• Filtros por período\n• Exportação múltiplos formatos\n\nQue tipo de relatório você precisa?',
      sender: 'bot',
      timestamp: Date.now(),
      type: 'info',
      metadata: {
        suggestions: ['Relatório em PDF', 'Análise de performance', 'Dados históricos'],
        actions: [
          { label: 'Ver Analytics', action: 'view_analytics', icon: 'analytics-outline' },
          { label: 'Exportar Dados', action: 'export_data', icon: 'download-outline' },
        ],
      },
    }),
    default: (query) => ({
      id: `bot_${Date.now()}`,
      text: `Olá! 👋 Sou o assistente virtual do Beep Velozz.\n\nPosso ajudar com:\n📦 Scanner e conferência\n📊 Relatórios e analytics\n⚙️ Configurações do sistema\n🎯 Dicas e tutoriais\n\nEm que posso ajudar hoje?`,
      sender: 'bot',
      timestamp: Date.now(),
      type: 'text',
      metadata: {
        suggestions: ['Problemas com scanner', 'Ajuda com sessões', 'Gerar relatórios'],
        actions: supportCategories.map(cat => ({
          label: cat.name,
          action: cat.id,
          icon: cat.icon,
        })),
      },
    }),
  };

  // Animações de entrada/saída
  useEffect(() => {
    if (visible && shouldAnimate()) {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Mensagem de boas-vindas
      setTimeout(() => {
        addBotMessage('default');
      }, 500);
    } else if (!visible && shouldAnimate()) {
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: SCREEN_HEIGHT,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnimation, fadeAnimation]);

  // Auto-scroll para última mensagem
  useEffect(() => {
    if (scrollViewRef.current && messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Adiciona mensagem do bot
  const addBotMessage = useCallback((responseKey: string, query?: string) => {
    const response = botResponses[responseKey] || botResponses.default;
    const message = response(query || '');
    
    setMessages(prev => [...prev, message]);
    setIsTyping(false);
  }, []);

  // Processa mensagem do usuário
  const processUserMessage = useCallback((text: string) => {
    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      text,
      sender: 'user',
      timestamp: Date.now(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setShowQuickActions(false);

    // Simula processamento da IA
    setTimeout(() => {
      const lowercaseText = text.toLowerCase();
      
      // Verifica categorias baseadas em keywords
      for (const category of supportCategories) {
        if (category.keywords.some(keyword => lowercaseText.includes(keyword))) {
          addBotMessage(category.id, text);
          setSelectedCategory(category.id);
          return;
        }
      }

      // Resposta padrão
      addBotMessage('default', text);
      setSelectedCategory(null);
    }, 1000);
  }, [addBotMessage]);

  // Handler para envio de mensagem
  const handleSendMessage = useCallback(() => {
    if (inputText.trim() === '') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    processUserMessage(inputText);
    setInputText('');
  }, [inputText, processUserMessage]);

  // Handler para quick actions
  const handleQuickAction = useCallback((action: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    switch (action) {
      case 'start_session':
        processUserMessage('Como iniciar uma nova sessão?');
        break;
      case 'view_analytics':
        processUserMessage('Como ver os analytics?');
        break;
      case 'test_scanner':
        processUserMessage('O scanner não está funcionando');
        break;
      default:
        processUserMessage(action);
    }
  }, [processUserMessage]);

  // Handler para sugestões
  const handleSuggestion = useCallback((suggestion: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    processUserMessage(suggestion);
  }, [processUserMessage]);

  // Renderiza mensagem
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.sender === 'user';
    const messageStyle = [
      styles.message,
      {
        backgroundColor: isUser ? colors.primary : colors.surface,
        alignSelf: (isUser ? 'flex-end' : 'flex-start') as FlexAlignType,
        maxWidth: SCREEN_WIDTH * 0.8,
      },
    ];

    const textStyle = [
      styles.messageText,
      { color: isUser ? '#fff' : colors.text },
    ];

    return (
      <View key={message.id} style={messageStyle}>
        <Text style={textStyle}>{message.text}</Text>
        
        {/* Sugestões */}
        {message.metadata?.suggestions && (
          <View style={styles.suggestionsContainer}>
            {message.metadata.suggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.suggestion, { backgroundColor: colors.surface }]}
                onPress={() => handleSuggestion(suggestion)}
              >
                <Text style={[styles.suggestionText, { color: colors.text }]}>
                  {suggestion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Actions */}
        {message.metadata?.actions && (
          <View style={styles.actionsContainer}>
            {message.metadata.actions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => handleQuickAction(action.action)}
              >
                <Ionicons name={action.icon as any} size={16} color="#fff" />
                <Text style={styles.actionText}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={[styles.timestamp, { color: isUser ? '#fff8' : colors.secondary }]}>
          {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  // Renderiza quick actions iniciais
  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={[styles.quickActionsTitle, { color: colors.text }]}>
        Como posso ajudar?
      </Text>
      <View style={styles.quickActionsGrid}>
        {supportCategories.slice(0, 6).map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[styles.quickAction, { backgroundColor: colors.surface }]}
            onPress={() => handleQuickAction(category.id)}
          >
            <Ionicons name={category.icon as any} size={24} color={colors.primary} />
            <Text style={[styles.quickActionText, { color: colors.text }]}>
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnimation }]}>
      <Animated.View
        style={[
          styles.chatContainer,
          {
            backgroundColor: colors.bg,
            transform: [{ translateY: slideAnimation }],
          },
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <View style={styles.headerLeft}>
            <Ionicons name="help-circle-outline" size={24} color="#fff" />
            <Text style={styles.headerTitle}>Suporte Beep Velozz</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map(renderMessage)}
          
          {/* Indicador de digitação */}
          {isTyping && (
            <View style={[styles.typingIndicator, { backgroundColor: colors.surface }]}>
              <Text style={[styles.typingText, { color: colors.secondary }]}>
                Assistente está digitando...
              </Text>
            </View>
          )}

          {/* Quick Actions */}
          {showQuickActions && messages.length <= 1 && renderQuickActions()}
        </ScrollView>

        {/* Input */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.inputContainer, { backgroundColor: colors.surface }]}>
            <TextInput
              ref={inputRef}
              style={[
                styles.textInput,
                {
                  backgroundColor: colors.bg,
                  borderColor: colors.border,
                  color: colors.text,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Digite sua dúvida..."
              placeholderTextColor={colors.secondary}
              multiline
              maxLength={500}
              onSubmitEditing={handleSendMessage}
            />
            
            <TouchableOpacity
              style={[styles.sendButton, { backgroundColor: colors.primary }]}
              onPress={handleSendMessage}
              disabled={inputText.trim() === ''}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  chatContainer: {
    height: SCREEN_HEIGHT * 0.8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  message: {
    padding: 12,
    borderRadius: 16,
    maxWidth: SCREEN_WIDTH * 0.8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  suggestionsContainer: {
    marginTop: 8,
    gap: 6,
  },
  suggestion: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  suggestionText: {
    fontSize: 12,
  },
  actionsContainer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'right',
  },
  typingIndicator: {
    alignSelf: 'flex-start',
    padding: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  quickActionsContainer: {
    marginTop: 16,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 12,
  },
  quickAction: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    width: SCREEN_WIDTH * 0.25,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
});

export default SupportChatbot;

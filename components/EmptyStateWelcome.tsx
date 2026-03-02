import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';

interface EmptyStateWelcomeProps {
  onStartSession: () => void;
  onViewHistory: () => void;
}

export default function EmptyStateWelcome({
  onStartSession,
  onViewHistory,
}: EmptyStateWelcomeProps) {
  const { colors } = useAppTheme();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 24,
          paddingVertical: 48,
          gap: 32,
        }}
      >
        {/* Illustration area */}
        <View style={{ alignItems: 'center', gap: 16 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: 48 }}>📦</Text>
          </View>

          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: 24,
                fontWeight: '700',
                letterSpacing: 0.3,
              }}
            >
              Bem-vindo!
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 14,
                fontWeight: '400',
                textAlign: 'center',
                lineHeight: 20,
              }}
            >
              Comece uma nova sessão de verificação de pacotes
            </Text>
          </View>
        </View>

        {/* Stats preview (if any sessions exist) */}
        <View
          style={{
            width: '100%',
            paddingHorizontal: 16,
            paddingVertical: 16,
            borderRadius: 12,
            backgroundColor: colors.surface,
            gap: 12,
          }}
        >
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 12,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Dicas
          </Text>
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Text style={{ fontSize: 16, color: colors.primary }}>✓</Text>
              <Text
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 13,
                  fontWeight: '500',
                  lineHeight: 18,
                }}
              >
                Escaneie pacotes de forma rápida e precisa
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Text style={{ fontSize: 16, color: colors.primary }}>✓</Text>
              <Text
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 13,
                  fontWeight: '500',
                  lineHeight: 18,
                }}
              >
                Rastreie métricas em tempo real
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Text style={{ fontSize: 16, color: colors.primary }}>✓</Text>
              <Text
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: 13,
                  fontWeight: '500',
                  lineHeight: 18,
                }}
              >
                Gere relatórios detalhados de cada sessão
              </Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={{ width: '100%', gap: 12 }}>
          <TouchableOpacity
            onPress={onStartSession}
            style={{
              width: '100%',
              paddingVertical: 14,
              paddingHorizontal: 20,
              borderRadius: 10,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
            activeOpacity={0.85}
          >
            <Text
              style={{
                color: '#ffffff',
                fontSize: 15,
                fontWeight: '700',
                letterSpacing: 0.3,
              }}
            >
              Iniciar Nova Sessão
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onViewHistory}
            style={{
              width: '100%',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            activeOpacity={0.7}
          >
            <Text
              style={{
                color: colors.text,
                fontSize: 15,
                fontWeight: '600',
                letterSpacing: 0.3,
              }}
            >
              Ver Histórico
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

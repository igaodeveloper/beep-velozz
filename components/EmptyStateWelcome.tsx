import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { useResponsive } from '@/utils/useResponsive';

interface EmptyStateWelcomeProps {
  onStartSession: () => void;
  onViewHistory: () => void;
}

export default function EmptyStateWelcome({
  onStartSession,
  onViewHistory,
}: EmptyStateWelcomeProps) {
  const { colors } = useAppTheme();
  const responsive = useResponsive();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: responsive.isTablet ? responsive.padding.xl : responsive.padding.lg,
          paddingVertical: responsive.padding.xxl,
          gap: responsive.spacing.xxl,
        }}
      >
        {/* Illustration area */}
        <View style={{ alignItems: 'center', gap: responsive.padding.md }}>
          <View
            style={{
              width: responsive.isTablet ? 120 : 100,
              height: responsive.isTablet ? 120 : 100,
              borderRadius: responsive.isTablet ? 60 : 50,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: colors.primary,
            }}
          >
            <Text style={{ fontSize: responsive.fontSize.xxxxl }}>📦</Text>
          </View>

          <View style={{ alignItems: 'center', gap: 8 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: responsive.fontSize.xxxl,
                fontWeight: '700',
                letterSpacing: 0.3,
              }}
            >
              Bem-vindo!
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: responsive.fontSize.md,
                fontWeight: '400',
                textAlign: 'center',
                lineHeight: responsive.fontSize.lg,
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
            paddingHorizontal: responsive.padding.md,
            paddingVertical: responsive.padding.md,
            borderRadius: responsive.borderRadius.lg,
            backgroundColor: colors.surface,
            gap: responsive.padding.md,
          }}
        >
          <Text
            style={{
              color: colors.textMuted,
              fontSize: responsive.fontSize.sm,
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Dicas
          </Text>
          <View style={{ gap: responsive.spacing.sm }}>
            <View style={{ flexDirection: 'row', gap: responsive.spacing.sm }}>
              <Text style={{ fontSize: responsive.fontSize.md, color: colors.primary }}>✓</Text>
              <Text
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: responsive.fontSize.sm,
                  fontWeight: '500',
                  lineHeight: responsive.fontSize.md,
                }}
              >
                Escaneie pacotes de forma rápida e precisa
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: responsive.spacing.sm }}>
              <Text style={{ fontSize: responsive.fontSize.md, color: colors.primary }}>✓</Text>
              <Text
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: responsive.fontSize.sm,
                  fontWeight: '500',
                  lineHeight: responsive.fontSize.md,
                }}
              >
                Rastreie métricas em tempo real
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: responsive.spacing.sm }}>
              <Text style={{ fontSize: responsive.fontSize.md, color: colors.primary }}>✓</Text>
              <Text
                style={{
                  flex: 1,
                  color: colors.text,
                  fontSize: responsive.fontSize.sm,
                  fontWeight: '500',
                  lineHeight: responsive.fontSize.md,
                }}
              >
                Gere relatórios detalhados de cada sessão
              </Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={{ width: '100%', gap: responsive.padding.md }}>
          <TouchableOpacity
            onPress={onStartSession}
            style={{
              width: '100%',
              paddingVertical: responsive.padding.md,
              paddingHorizontal: responsive.padding.lg,
              borderRadius: responsive.borderRadius.md,
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
                fontSize: responsive.fontSize.md,
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
              paddingVertical: responsive.padding.md,
              paddingHorizontal: responsive.padding.lg,
              borderRadius: responsive.borderRadius.md,
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
                fontSize: responsive.fontSize.md,
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

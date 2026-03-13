import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { useResponsive } from '@/utils/useResponsive';
import { Session } from '@/types/session';

interface AppHeaderProps {
  currentSession?: Session | null;
}

export default function AppHeader({ currentSession }: AppHeaderProps) {
  const { colors } = useAppTheme();
  const responsive = useResponsive();
  
  return (
    <View
      style={{
        paddingHorizontal: responsive.padding.md,
        paddingVertical: responsive.padding.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}
    >
      <View style={{ gap: responsive.spacing.sm }}>
        {/* Logo + Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: responsive.spacing.md }}>
          <View
            style={{
              width: responsive.isTablet ? 48 : 40,
              height: responsive.isTablet ? 48 : 40,
              borderRadius: responsive.borderRadius.lg,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text style={{ fontSize: responsive.fontSize.xxl }}>📦</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: responsive.fontSize.xl,
                fontWeight: '700',
                letterSpacing: 0.3,
              }}
            >
              Beep Velozz
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: responsive.fontSize.sm,
                fontWeight: '400',
                marginTop: 2,
              }}
            >
              Gerenciador de Logística
            </Text>
          </View>
          {/* Status indicator */}
          <View
            style={{
              width: responsive.isTablet ? 16 : 12,
              height: responsive.isTablet ? 16 : 12,
              borderRadius: responsive.isTablet ? 8 : 6,
              backgroundColor: currentSession ? colors.primary : colors.border2,
              shadowColor: currentSession ? colors.primary : 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: currentSession ? 0.5 : 0,
              shadowRadius: 3,
              elevation: currentSession ? 2 : 0,
            }}
          />
        </View>

        {/* Session Info */}
        {currentSession && (
          <View
            style={{
              paddingHorizontal: responsive.padding.sm,
              paddingVertical: responsive.spacing.xs,
              borderRadius: responsive.borderRadius.md,
              backgroundColor: colors.surface,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ color: colors.textMuted, fontSize: responsive.fontSize.xs, fontWeight: '500' }}>
                Sessão Atual
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: responsive.fontSize.sm,
                  fontWeight: '600',
                  marginTop: 2,
                }}
              >
                {currentSession.driverName} • {currentSession.operatorName}
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: responsive.spacing.sm,
                paddingVertical: responsive.spacing.xs,
                borderRadius: responsive.borderRadius.sm,
                backgroundColor: colors.primary,
              }}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: responsive.fontSize.xs,
                  fontWeight: '600',
              }}
              >
                Ativa
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

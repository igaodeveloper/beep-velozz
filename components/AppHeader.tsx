import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { Session } from '@/types/session';

interface AppHeaderProps {
  currentSession?: Session | null;
}

export default function AppHeader({ currentSession }: AppHeaderProps) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  
  return (
    <View
      style={{
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.bg,
      }}
    >
      <View style={{ gap: 8 }}>
        {/* Logo + Title */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
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
            <Text style={{ fontSize: 20 }}>📦</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.text,
                fontSize: 18,
                fontWeight: '700',
                letterSpacing: 0.3,
              }}
            >
              Beep Velozz
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 12,
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
              width: 12,
              height: 12,
              borderRadius: 6,
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
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: colors.surface,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '500' }}>
                Sessão Atual
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 13,
                  fontWeight: '600',
                  marginTop: 2,
                }}
              >
                {currentSession.driverName} • {currentSession.operatorName}
              </Text>
            </View>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
                backgroundColor: colors.primary,
              }}
            >
              <Text
                style={{
                  color: '#ffffff',
                  fontSize: 11,
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

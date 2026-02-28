import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { ScannedPackage } from '@/types/session';
import { formatTimestamp, packageTypeLabel, packageTypeBadgeColors } from '@/utils/session';
import Animated, { FadeInDown, FadeOutDown, Layout } from 'react-native-reanimated';
import { useAppTheme } from '@/utils/useAppTheme';

interface PackageListProps {
  packages: ScannedPackage[];
  expanded: boolean;
  onToggle: () => void;
}

export default function PackageList({ packages, expanded, onToggle }: PackageListProps) {
  const { colors } = useAppTheme();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (pkg: ScannedPackage) => {
    try {
      await Clipboard.setStringAsync(pkg.code);
      setCopiedId(pkg.id);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setTimeout(() => setCopiedId(current => (current === pkg.id ? null : current)), 1200);
    } catch {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
    }
  };

  return (
    <View style={{
      backgroundColor: colors.bg,
      borderTopWidth: 1,
      borderTopColor: colors.surface2,
    }}>
      {/* Header toggle */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>
            PACOTES ESCANEADOS
          </Text>
          <View style={{
            backgroundColor: colors.surface2, borderRadius: 10,
            paddingHorizontal: 8, paddingVertical: 2,
          }}>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>
              {packages.length}
            </Text>
          </View>
        </View>
        <Text style={{ color: colors.textSubtle, fontSize: 18 }}>
          {expanded ? '▼' : '▲'}
        </Text>
      </TouchableOpacity>

      {/* List */}
      {expanded && (
        <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOutDown.duration(160)} layout={Layout.springify()}>
          <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
            {packages.length === 0 ? (
              <View style={{ padding: 24, alignItems: 'center' }}>
                <Text style={{ color: colors.textMuted, fontSize: 14 }}>Nenhum pacote escaneado</Text>
              </View>
            ) : (
              [...packages].reverse().map((pkg, idx) => {
                const badge = packageTypeBadgeColors(pkg.type);
                const isCopied = copiedId === pkg.id;
                return (
                  <Animated.View
                    key={pkg.id}
                    entering={FadeInDown.duration(220).delay(Math.min(idx * 20, 180))}
                    layout={Layout.springify()}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderTopWidth: 1,
                      borderTopColor: colors.surface2,
                    }}
                  >
                    {/* Index */}
                    <Text style={{ color: colors.textMuted, fontSize: 11, width: 28, fontWeight: '600' }}>
                      #{packages.length - idx}
                    </Text>
                    {/* Code */}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', fontFamily: 'SpaceMono-Regular' }}>
                        {pkg.code}
                      </Text>
                      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                        {formatTimestamp(pkg.scannedAt)}
                      </Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleCopy(pkg)}
                      activeOpacity={0.85}
                      style={{
                        backgroundColor: isCopied ? 'rgba(249,115,22,0.16)' : 'rgba(51,65,85,0.35)',
                        borderWidth: 1,
                        borderColor: isCopied ? 'rgba(249,115,22,0.6)' : colors.textMuted,
                        borderRadius: 10,
                        paddingHorizontal: 10,
                        paddingVertical: 8,
                        marginRight: 10,
                      }}
                    >
                      <Text style={{
                        color: isCopied ? colors.primary : colors.text,
                        fontSize: 11,
                        fontWeight: '800',
                        letterSpacing: 0.4,
                      }}>
                        {isCopied ? 'COPIADO' : 'COPIAR'}
                      </Text>
                    </TouchableOpacity>

                    {/* Badge */}
                    <View style={{
                      backgroundColor: badge.bg,
                      borderRadius: 6,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                    }}>
                      <Text style={{ color: badge.text, fontSize: 10, fontWeight: '700' }}>
                        {packageTypeLabel(pkg.type)}
                      </Text>
                    </View>
                  </Animated.View>
                );
              })
            )}
            <View style={{ height: 8 }} />
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
}

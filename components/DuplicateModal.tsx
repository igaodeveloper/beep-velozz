import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { ScannedPackage } from '@/types/session';
import { formatTimestamp } from '@/utils/session';
import Animated, { FadeIn, FadeOut, ZoomIn, ZoomOut } from 'react-native-reanimated';
import { useAppTheme } from '@/utils/useAppTheme';

interface DuplicateModalProps {
  visible: boolean;
  code: string;
  originalPackage?: ScannedPackage;
  onDismiss: () => void;
}

export default function DuplicateModal({ visible, code, originalPackage, onDismiss }: DuplicateModalProps) {
  const { colors } = useAppTheme();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(239,68,68,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
      }}>
        <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(120)} style={{ width: '100%', maxWidth: 400 }}>
          <Animated.View
            entering={ZoomIn.duration(220)}
            exiting={ZoomOut.duration(180)}
            style={{
              backgroundColor: colors.bg,
              borderRadius: 20,
              borderWidth: 2,
              borderColor: colors.danger,
              padding: 28,
              width: '100%',
              alignItems: 'center',
            }}
          >
          {/* Alert icon */}
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: '#7f1d1d',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 36 }}>🚫</Text>
          </View>

          <Text style={{
            color: colors.danger, fontSize: 20, fontWeight: '800',
            letterSpacing: 1, marginBottom: 8, textAlign: 'center',
          }}>
            DUPLICATA DETECTADA
          </Text>

          <Text style={{
            color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 20,
          }}>
            Este pacote já foi escaneado anteriormente
          </Text>

          {/* Code display */}
          <View style={{
            backgroundColor: colors.surface2, borderRadius: 10,
            padding: 14, width: '100%', marginBottom: 16,
            borderWidth: 1, borderColor: colors.textMuted,
          }}>
            <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>
              CÓDIGO
            </Text>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', fontFamily: 'SpaceMono-Regular' }}>
              {code}
            </Text>
          </View>

          {/* Original scan time */}
          {originalPackage && (
            <View style={{
              backgroundColor: colors.surface2, borderRadius: 10,
              padding: 14, width: '100%', marginBottom: 24,
              borderWidth: 1, borderColor: colors.textMuted,
            }}>
              <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 }}>
                PRIMEIRO ESCANEAMENTO
              </Text>
              <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>
                {formatTimestamp(originalPackage.scannedAt)}
              </Text>
            </View>
          )}

          <TouchableOpacity
            onPress={onDismiss}
            activeOpacity={0.85}
            style={{
              backgroundColor: colors.danger,
              borderRadius: 12,
              padding: 16,
              width: '100%',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 1 }}>
              DISPENSAR
            </Text>
          </TouchableOpacity>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

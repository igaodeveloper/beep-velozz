import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useAppTheme } from '@/utils/useAppTheme';

interface DivergenceScreenProps {
  visible: boolean;
  scannedCount: number;
  declaredCount: number;
  onCancel: () => void;
}

export default function DivergenceScreen({
  visible,
  scannedCount,
  declaredCount,
  onCancel,
}: DivergenceScreenProps) {
  const { colors } = useAppTheme();
  const delta = scannedCount - declaredCount;
  const isShort = delta < 0;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Animated.View
        entering={FadeIn.duration(140)}
        exiting={FadeOut.duration(120)}
        style={{
          flex: 1,
          backgroundColor: 'rgba(245,158,11,0.08)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}
      >
        <Animated.View
          entering={SlideInDown.duration(260)}
          exiting={SlideOutDown.duration(200)}
          style={{
            backgroundColor: '#0f0e0a',
            borderRadius: 20,
            borderWidth: 2,
            borderColor: colors.primary,
            padding: 28,
            width: '100%',
            maxWidth: 400,
            alignItems: 'center',
          }}
        >
          {/* Warning icon */}
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: '#78350f',
            alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Text style={{ fontSize: 36 }}>⚠️</Text>
          </View>

          <Text style={{
            color: colors.primary, fontSize: 20, fontWeight: '800',
            letterSpacing: 1, marginBottom: 8, textAlign: 'center',
          }}>
            DIVERGÊNCIA DETECTADA
          </Text>

          <Text style={{
            color: '#94a3b8', fontSize: 13, textAlign: 'center', marginBottom: 24,
          }}>
            A quantidade conferida não corresponde à declarada. Continue bipando até corrigir.
          </Text>

          {/* Delta display */}
          <View style={{
            backgroundColor: '#1e293b', borderRadius: 14,
            padding: 20, width: '100%', marginBottom: 24,
            borderWidth: 1, borderColor: '#334155',
            alignItems: 'center',
          }}>
            <View style={{ flexDirection: 'row', gap: 24, justifyContent: 'center', marginBottom: 16 }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                  DECLARADO
                </Text>
                <Text style={{ color: '#e2e8f0', fontSize: 28, fontWeight: '800', marginTop: 4 }}>
                  {declaredCount}
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>
                  CONFERIDO
                </Text>
                <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '800', marginTop: 4 }}>
                  {scannedCount}
                </Text>
              </View>
            </View>

            {/* Delta */}
            <View style={{
              backgroundColor: '#78350f', borderRadius: 10,
              paddingHorizontal: 16, paddingVertical: 8,
            }}>
              <Text style={{ color: colors.primary, fontSize: 22, fontWeight: '800', textAlign: 'center' }}>
                Δ {delta > 0 ? '+' : ''}{delta}
              </Text>
              <Text style={{ color: '#d97706', fontSize: 11, textAlign: 'center', marginTop: 2 }}>
                {isShort ? `${Math.abs(delta)} pacote(s) a menos` : `${delta} pacote(s) a mais`}
              </Text>
            </View>
          </View>

          {/* Action button */}
          <TouchableOpacity
            onPress={onCancel}
            activeOpacity={0.85}
            style={{
              backgroundColor: colors.primary,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Text style={{ color: '#000', fontSize: 16, fontWeight: '800' }}>
              CONTINUAR BIPANDO
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

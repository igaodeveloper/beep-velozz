/**
 * Exemplo de Integração do Scanner Industrial
 * Demonstra como usar o novo sistema robusto em componentes
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
  Platform,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useIndustrialScanner } from '@/utils/useIndustrialScanner';
import { useAppTheme } from '@/utils/useAppTheme';
import { preloadSounds, unloadSounds } from '@/utils/sound';
import { ScannerState } from '@/types/scanner';
import { getPackageTypeLabel } from '@/utils/scannerIdentification';

interface IndustrialScannerViewProps {
  // Configuração de limites
  maxScans: {
    shopee: number;
    mercado_livre: number;
    avulso: number;
  };
  // Callbacks
  onScanned?: (code: string, type: string) => void;
  onLimitReached?: (limitedTypes: string[]) => void;
  onEndSession: () => void;
}

/**
 * Componente de Scanner Industrial
 * Utiliza o novo sistema modular e robusto
 */
export default function IndustrialScannerView({
  maxScans,
  onScanned,
  onLimitReached,
  onEndSession,
}: IndustrialScannerViewProps) {
  const { colors } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();

  // Estado local UI
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [barcodeLocked, setBarcodeLocked] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [manualInputExpanded, setManualInputExpanded] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Animações
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  // Modal de limite
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [limitModalMessage, setLimitModalMessage] = useState('');

  // Hook do scanner - coração da lógica
  const scanner = useIndustrialScanner({
    maxAllowedScans: maxScans,
    debounceMs: 400,
    onStateChange: (state) => {
      if (state === ScannerState.LIMIT_REACHED) {
        const types = scanner.stats.limitReached;
        const limitedList = Object.entries(types)
          .filter(([_, reached]) => reached)
          .map(([type]) => type);

        setLimitModalMessage(
          `Limite atingido para: ${limitedList.map(t => getPackageTypeLabel(t as any)).join(', ')}`
        );
        setLimitModalVisible(true);
        onLimitReached?.(limitedList);
      }
    },
  });

  // Preload de sons
  useEffect(() => {
    preloadSounds();
    return () => {
      void unloadSounds();
    };
  }, []);

  // Animação de pulse
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.04,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  // Animação de linha de scan
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Requisição de permissão
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!permission) return;
    if (permission.status === 'undetermined') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Handlers
  const handleBarcode = async (event: any) => {
    console.debug(`[IndustrialScannerView] Barcode scanned: "${event?.data}"`);
    if (barcodeLocked || scanner.state === ScannerState.LIMIT_REACHED) {
      console.debug(`[IndustrialScannerView] Ignored: locked=${barcodeLocked}, limitReached=${scanner.state === ScannerState.LIMIT_REACHED}`);
      return;
    }

    // attempt to extract id field if payload is JSON
    let scanned = event?.data || '';
    if (scanned.startsWith('{') && scanned.endsWith('}')) {
      try {
        const obj = JSON.parse(scanned);
        if (obj && typeof obj.id === 'string') {
          console.debug(`[IndustrialScannerView] extracted id from JSON payload: ${obj.id}`);
          scanned = obj.id;
        }
      } catch {
        // ignore
      }
    }

    setBarcodeLocked(true);
    const result = await scanner.processScan(scanned);
    console.debug(`[IndustrialScannerView] Process result: success=${result.success}, reason=${result.reason}, type=${result.type}`);

    if (result.success) {
      onScanned?.(result.code, result.type || 'unknown');
    }

    setTimeout(() => setBarcodeLocked(false), 400);
  };

  const handleManualSubmit = async () => {
    console.log(`[IndustrialScannerView] 🎯 MANUAL SUBMIT TRIGGERED: "${manualCode}"`);
    setManualError(null);

    if (!manualCode.trim()) {
      setManualError('Código vazio');
      return;
    }

    if (scanner.state === ScannerState.LIMIT_REACHED) {
      setManualError('Limite atingido');
      return;
    }

    console.log(`[IndustrialScannerView] 📤 PROCESSING MANUAL SCAN: "${manualCode}"`);
    const result = await scanner.processScan(manualCode);
    console.log(`[IndustrialScannerView] 📥 MANUAL RESULT: success=${result.success}, type=${result.type}, reason=${result.reason}`);

    if (result.success) {
      onScanned?.(result.code, result.type || 'unknown');
      setManualCode('');
    } else {
      switch (result.reason) {
        case 'duplicate':
          setManualError('Código já foi escaneado');
          break;
        case 'limit_reached':
          setManualError('Limite atingido para este tipo');
          break;
        case 'invalid':
          setManualError('Código inválido');
          break;
        default:
          setManualError('Erro ao processar código');
      }
    }
    setManualCode('');
  };

  const reticleWidth = Math.max(200, Math.min(windowWidth - 64, 320));
  const reticleHeight = Math.max(120, Math.min(reticleWidth * 0.62, 220));

  // Status color baseado no estado do scanner
  const statusColor =
    scanner.state === ScannerState.LIMIT_REACHED ? colors.danger :
    scanner.state === ScannerState.PAUSED ? colors.warning :
    colors.success;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, position: 'relative' }}>
      {/* Câmera */}
      <View
        style={{
          flex: 1,
          backgroundColor: colors.surface2,
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        {Platform.OS !== 'web' && permission?.granted && (
          <CameraView
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            facing="back"
            enableTorch={torchEnabled}
            barcodeScannerSettings={{
              barcodeTypes: [
                'qr',
                'code128',
                'code39',
                'ean13',
                'ean8',
                'upc_a',
                'upc_e',
                'pdf417',
                'aztec',
                'datamatrix',
              ],
            }}
            onBarcodeScanned={handleBarcode}
          />
        )}

        {/* Flash toggle */}
        {Platform.OS !== 'web' && permission?.granted && (
          <View
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => setTorchEnabled(v => !v)}
              activeOpacity={0.85}
              style={{
                backgroundColor: torchEnabled ? colors.primary : 'rgba(15,23,42,0.85)',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: torchEnabled ? colors.primary : colors.border2,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800' }}>
                {torchEnabled ? '💡 ON' : '🔦 OFF'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reticle */}
        <Animated.View
          style={{
            width: reticleWidth,
            height: reticleHeight,
            transform: [{ scale: pulseAnim }],
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderWidth: 2,
              borderColor: statusColor,
              borderRadius: 16,
              opacity: 0.8,
            }}
          />
          <Animated.View
            style={{
              position: 'absolute',
              left: 8,
              right: 8,
              height: 2,
              backgroundColor: statusColor,
              transform: [{
                translateY: scanLineAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-(reticleHeight * 0.35), reticleHeight * 0.35],
                }),
              }],
            }}
          />
          <View style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: statusColor,
          }} />
        </Animated.View>

        {/* Status text */}
        <Text style={{
          color: statusColor,
          fontSize: 12,
          marginTop: 20,
          fontWeight: '600',
          letterSpacing: 0.3,
        }}>
          {scanner.state === ScannerState.LIMIT_REACHED ? '🛑 LIMITE ATINGIDO' :
           scanner.state === ScannerState.PAUSED ? '⏸ PAUSA' :
           '📷 ESCANEANDO'}
        </Text>

        {/* Progresso */}
        <View style={{ marginTop: 12, width: '80%', alignItems: 'center' }}>
          {Object.entries(scanner.counts).map(([type, count], idx) => (
            <View key={type}>
              {idx > 0 && <View style={{ height: 8 }} />}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>
                  {getPackageTypeLabel(type as any)}
                </Text>
                <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>
                  {count}/{maxScans[type as keyof typeof maxScans]}
                </Text>
              </View>
              <View
                style={{
                  height: 8,
                  width: '100%',
                  backgroundColor: colors.surface2,
                  borderRadius: 8,
                  marginTop: 4,
                  overflow: 'hidden',
                }}
              >
                <View
                  style={{
                    width: `${Math.min(100, (count / maxScans[type as keyof typeof maxScans]) * 100)}%`,
                    height: '100%',
                    backgroundColor: statusColor,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Manual input */}
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => setManualInputExpanded(!manualInputExpanded)}
          activeOpacity={0.7}
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>
            ⌨️ ENTRADA MANUAL
          </Text>
          <Text style={{ color: colors.primary, fontSize: 16, fontWeight: '700' }}>
            {manualInputExpanded ? '−' : '+'}
          </Text>
        </TouchableOpacity>

        {manualInputExpanded && (
          <View
            style={{
              padding: 16,
              paddingTop: 8,
              flexDirection: 'row',
              gap: 10,
              alignItems: 'center',
              borderTopWidth: 1,
              borderTopColor: colors.border2,
            }}
          >
            <TextInput
              value={manualCode}
              onChangeText={setManualCode}
              placeholder="Código..."
              placeholderTextColor={colors.textMuted}
              returnKeyType="done"
              onSubmitEditing={handleManualSubmit}
              autoCapitalize="characters"
              editable={scanner.state !== ScannerState.LIMIT_REACHED}
              style={{
                flex: 1,
                backgroundColor: colors.surface2,
                borderWidth: 1,
                borderColor: colors.textMuted,
                borderRadius: 10,
                padding: 12,
                color: colors.text,
                fontSize: 15,
              }}
            />
            <TouchableOpacity
              onPress={handleManualSubmit}
              activeOpacity={0.85}
              disabled={scanner.state === ScannerState.LIMIT_REACHED}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 10,
                padding: 13,
                justifyContent: 'center',
                alignItems: 'center',
                opacity: scanner.state === ScannerState.LIMIT_REACHED ? 0.5 : 1,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>+</Text>
            </TouchableOpacity>
          </View>
        )}

        {manualError && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '700' }}>
              {manualError}
            </Text>
          </View>
        )}
      </View>

      {/* End session */}
      <View
        style={{
          backgroundColor: colors.surface,
          paddingHorizontal: 16,
          paddingBottom: 16,
          paddingTop: 4,
          flexDirection: 'row',
          gap: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => scanner.reset()}
          activeOpacity={0.85}
          style={{
            flex: 1,
            backgroundColor: colors.surface2,
            borderRadius: 10,
            padding: 13,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.textMuted,
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700' }}>
            🔄 RESET
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onEndSession}
          activeOpacity={0.85}
          style={{
            flex: 1,
            backgroundColor: colors.danger,
            borderRadius: 10,
            padding: 13,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700' }}>
            ⏹ ENCERRAR
          </Text>
        </TouchableOpacity>
      </View>

      {/* Limit reached modal */}
      <Modal visible={limitModalVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.bg,
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              width: '100%',
              maxWidth: 400,
            }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: colors.danger,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 36 }}>⚠️</Text>
            </View>
            <Text
              style={{
                color: colors.danger,
                fontSize: 20,
                fontWeight: '800',
                textAlign: 'center',
              }}
            >
              LIMITE ATINGIDO
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: 14,
                textAlign: 'center',
                marginTop: 8,
              }}
            >
              {limitModalMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setLimitModalVisible(false)}
              activeOpacity={0.85}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 12,
                padding: 16,
                width: '100%',
                alignItems: 'center',
                marginTop: 24,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>
                ENTENDI
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

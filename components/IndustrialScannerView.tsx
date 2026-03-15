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
  Animated as RNAnimated,
  Easing,
  Platform,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withRepeat,
  withSequence,
  interpolate,
  Easing as ReEasing,
} from 'react-native-reanimated';
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
  onBack?: () => void;
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
  onBack,
}: IndustrialScannerViewProps) {
  const { colors } = useAppTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Detectar tipo de tela
  const isTablet = useMemo(() => {
    const aspectRatio = Math.max(windowWidth, windowHeight) / Math.min(windowWidth, windowHeight);
    const isLargeScreen = Math.max(windowWidth, windowHeight) >= 768;
    return isLargeScreen || aspectRatio < 1.3;
  }, [windowWidth, windowHeight]);
  
  const isUltraWide = useMemo(() => {
    const aspectRatio = windowWidth / windowHeight;
    return aspectRatio > 2.0;
  }, [windowWidth, windowHeight]);
  
  // Estado local UI
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [barcodeLocked, setBarcodeLocked] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [manualInputExpanded, setManualInputExpanded] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  // Animações
  const pulseAnim = useSharedValue(1);
  const scanLineAnim = useSharedValue(0);
  const cornerPulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);
  const radarAnim = useSharedValue(0);

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

  // Animações avançadas
  useEffect(() => {
    // Pulse animation principal
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1200, easing: ReEasing.inOut(ReEasing.ease) }),
        withTiming(1, { duration: 1200, easing: ReEasing.inOut(ReEasing.ease) })
      ),
      -1,
      true
    );

    // Corner pulse animation
    cornerPulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 800, easing: ReEasing.out(ReEasing.ease) }),
        withTiming(1, { duration: 800, easing: ReEasing.inOut(ReEasing.ease) })
      ),
      -1,
      true
    );

    // Glow animation
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: ReEasing.inOut(ReEasing.ease) }),
        withTiming(0, { duration: 2000, easing: ReEasing.inOut(ReEasing.ease) })
      ),
      -1,
      true
    );

    // Radar animation
    radarAnim.value = withRepeat(
      withTiming(1, { duration: 3000, easing: ReEasing.linear }),
      -1,
      false
    );
  }, []);

  // Animação de linha de scan
  useEffect(() => {
    scanLineAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1100, easing: ReEasing.inOut(ReEasing.ease) }),
        withTiming(0, { duration: 1100, easing: ReEasing.inOut(ReEasing.ease) })
      ),
      -1,
      true
    );
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

  // Dimensões responsivas do reticle (minimalista e elegante)
  const reticleDimensions = useMemo(() => {
    const baseWidth = Math.min(windowWidth, windowHeight);
    
    if (isTablet) {
      // Tablets: reticle elegante e proporcional
      const width = Math.max(280, Math.min(baseWidth * 0.45, 380));
      const height = Math.max(200, Math.min(width * 0.65, 280));
      return { width, height };
    } else if (isUltraWide) {
      // Telas ultra largas: reticle balanceado
      const width = Math.max(250, Math.min(baseWidth * 0.4, 320));
      const height = Math.max(180, Math.min(width * 0.75, 260));
      return { width, height };
    } else {
      // Celulares normais: reticle minimalista
      const width = Math.max(220, Math.min(baseWidth * 0.55, 300));
      const height = Math.max(160, Math.min(width * 0.7, 240));
      return { width, height };
    }
  }, [windowWidth, windowHeight, isTablet, isUltraWide]);
  
  const { width: reticleWidth, height: reticleHeight } = reticleDimensions;

  // Status color baseado no estado do scanner
  const statusColor =
    scanner.state === ScannerState.LIMIT_REACHED ? colors.danger :
    scanner.state === ScannerState.PAUSED ? colors.warning :
    colors.success;

  // Verifica se todos os limites foram atingidos
  const allLimitsReached = useMemo(() => {
    return Object.entries(maxScans).every(([type, max]) => 
      scanner.counts[type as keyof typeof maxScans] >= max
    );
  }, [scanner.counts, maxScans]);

  // Verifica se algum progresso foi feito (para mostrar botão apenas se houver atividade)
  const hasSomeProgress = useMemo(() => {
    return Object.values(scanner.counts).some(count => count > 0);
  }, [scanner.counts]);

  // Toca feedback quando todos os limites são atingidos
  useEffect(() => {
    if (allLimitsReached && hasSomeProgress) {
      // Feedback tátil de sucesso
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    }
  }, [allLimitsReached, hasSomeProgress]);

  // Animated styles
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(
        scanLineAnim.value,
        [0, 1],
        [-(reticleHeight * 0.35), reticleHeight * 0.35]
      )
    }],
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#000', position: 'relative', paddingBottom: 80 }}>
      {/* Câmera em tela cheia absoluta */}
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

      {/* Botão de Voltar */}
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.8}
          style={{
            position: 'absolute',
            top: isTablet ? 20 : 16,
            left: isTablet ? 20 : 16,
            zIndex: 10,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: isTablet ? 12 : 10,
            paddingHorizontal: isTablet ? 12 : 10,
            paddingVertical: isTablet ? 8 : 6,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        >
          <Text style={{ 
            color: '#fff', 
            fontSize: isTablet ? 16 : 14, 
            fontWeight: '600',
          }}>
            ←
          </Text>
        </TouchableOpacity>
      )}

      {/* Flash toggle minimalista sobre a câmera */}
      {Platform.OS !== 'web' && permission?.granted && (
          <View
            style={{
              position: 'absolute',
              top: isTablet ? 20 : 16,
              right: isTablet ? 20 : 16,
              zIndex: 10,
            }}
          >
            <TouchableOpacity
              onPress={() => setTorchEnabled(v => !v)}
              activeOpacity={0.8}
              style={{
                backgroundColor: torchEnabled ? statusColor : 'rgba(0,0,0,0.3)',
                borderRadius: isTablet ? 12 : 10,
                paddingHorizontal: isTablet ? 12 : 10,
                paddingVertical: isTablet ? 8 : 6,
                borderWidth: 1,
                borderColor: torchEnabled ? statusColor : 'rgba(255,255,255,0.2)',
              }}
            >
              <Text style={{ 
                color: '#fff', 
                fontSize: isTablet ? 11 : 9, 
                fontWeight: '600',
                letterSpacing: 0.3,
              }}>
                {torchEnabled ? '💡' : '🔦'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Máscara de Scanner Minimalista */}
        <Animated.View
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            marginTop: -(reticleHeight / 2),
            marginLeft: -(reticleWidth / 2),
            width: reticleWidth,
            height: reticleHeight,
            transform: [{ scale: pulseAnim }],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Border principal minimalista */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderWidth: isTablet ? 2 : 1.5,
              borderColor: statusColor,
              borderRadius: isTablet ? 16 : 12,
              opacity: 0.8,
            }}
          />

          {/* Cantos minimalistas */}
          {/* Superior esquerdo */}
          <View
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              width: isTablet ? 24 : 20,
              height: isTablet ? 24 : 20,
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: 2,
                backgroundColor: statusColor,
                borderTopLeftRadius: 2,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 2,
                height: '100%',
                backgroundColor: statusColor,
                borderTopLeftRadius: 2,
              }}
            />
          </View>

          {/* Superior direito */}
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: isTablet ? 24 : 20,
              height: isTablet ? 24 : 20,
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '100%',
                height: 2,
                backgroundColor: statusColor,
                borderTopRightRadius: 2,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 2,
                height: '100%',
                backgroundColor: statusColor,
                borderTopRightRadius: 2,
              }}
            />
          </View>

          {/* Inferior esquerdo */}
          <View
            style={{
              position: 'absolute',
              bottom: -4,
              left: -4,
              width: isTablet ? 24 : 20,
              height: isTablet ? 24 : 20,
            }}
          >
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: 2,
                backgroundColor: statusColor,
                borderBottomLeftRadius: 2,
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 2,
                height: '100%',
                backgroundColor: statusColor,
                borderBottomLeftRadius: 2,
              }}
            />
          </View>

          {/* Inferior direito */}
          <View
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: isTablet ? 24 : 20,
              height: isTablet ? 24 : 20,
            }}
          >
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '100%',
                height: 2,
                backgroundColor: statusColor,
                borderBottomRightRadius: 2,
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 2,
                height: '100%',
                backgroundColor: statusColor,
                borderBottomRightRadius: 2,
              }}
            />
          </View>

          {/* Linha de scan minimalista */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                left: isTablet ? 12 : 8,
                right: isTablet ? 12 : 8,
                height: 1.5,
                backgroundColor: statusColor,
                borderRadius: 1,
              },
              scanLineStyle
            ]}
          />

          {/* Centro minimalista */}
          <View style={{
            width: isTablet ? 6 : 5,
            height: isTablet ? 6 : 5,
            borderRadius: isTablet ? 3 : 2.5,
            backgroundColor: statusColor,
            opacity: 0.8,
          }} />
        </Animated.View>

        {/* Contadores minimalistas */}
        <View style={{
          position: 'absolute',
          bottom: isTablet ? 110 : 100,
          left: isTablet ? 30 : 20,
          right: isTablet ? 30 : 20,
          backgroundColor: 'rgba(0,0,0,0.6)',
          borderRadius: isTablet ? 16 : 12,
          padding: isTablet ? 20 : 16,
          maxWidth: isTablet ? 500 : '100%',
          alignSelf: 'center',
        }}>
          {/* Status minimalista */}
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: isTablet ? 12 : 10,
          }}>
            <Text style={{
              color: statusColor,
              fontSize: isTablet ? 8 : 7,
              fontWeight: '500',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              opacity: 0.7,
            }}>
              {allLimitsReached ? 'Concluído' :
               scanner.state === ScannerState.LIMIT_REACHED ? 'Limite' :
               scanner.state === ScannerState.PAUSED ? 'Pausado' :
               'Escaneando'}
            </Text>
            
            {/* Indicador minimalista */}
            <View style={{
              width: isTablet ? 6 : 5,
              height: isTablet ? 6 : 5,
              borderRadius: isTablet ? 3 : 2.5,
              backgroundColor: statusColor,
              opacity: scanner.state === ScannerState.LIMIT_REACHED ? 0.3 : 0.6,
            }} />
          </View>

          {/* Progresso minimalista */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            gap: isTablet ? 16 : 10,
          }}>
            {Object.entries(scanner.counts).map(([type, count]) => (
              <View key={type} style={{ 
                flex: 1, 
                alignItems: 'center',
              }}>
                <Text style={{ 
                  color: 'rgba(255,255,255,0.5)', 
                  fontSize: isTablet ? 9 : 8, 
                  fontWeight: '400',
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  marginBottom: 2,
                }}>
                  {getPackageTypeLabel(type as any)}
                </Text>
                <Text style={{ 
                  color: '#ffffff', 
                  fontSize: isTablet ? 13 : 11, 
                  fontWeight: '600',
                }}>
                  {count}/{maxScans[type as keyof typeof maxScans]}
                </Text>
                <View
                  style={{
                    height: isTablet ? 3 : 2,
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: isTablet ? 2 : 1,
                    marginTop: isTablet ? 4 : 3,
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

          {/* Botão de Finalizar (aparece quando todos os limites são atingidos) */}
          {allLimitsReached && hasSomeProgress && (
            <TouchableOpacity
              onPress={onEndSession}
              activeOpacity={0.8}
              style={{
                backgroundColor: '#10b981',
                borderRadius: isTablet ? 12 : 10,
                paddingVertical: isTablet ? 16 : 14,
                paddingHorizontal: isTablet ? 24 : 20,
                alignItems: 'center',
                marginTop: isTablet ? 16 : 12,
                borderWidth: 2,
                borderColor: '#059669',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text style={{
                color: '#ffffff',
                fontSize: isTablet ? 16 : 14,
                fontWeight: '700',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}>
                Finalizar Sessão
              </Text>
              <Text style={{
                color: 'rgba(255,255,255,0.8)',
                fontSize: isTablet ? 11 : 9,
                fontWeight: '500',
                marginTop: 4,
              }}>
                Todos os pacotes escaneados
              </Text>
            </TouchableOpacity>
          )}
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

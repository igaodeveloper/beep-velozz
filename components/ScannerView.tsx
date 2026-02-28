import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { ScannedPackage } from '@/types/session';
import { classifyPackage, packageTypeLabel, packageTypeBadgeColors, generateId, getPackageValue, getSessionMetrics } from '@/utils/session';
import { useAppTheme } from '@/utils/useAppTheme';
import { playBeep, playError, preloadSounds, unloadSounds } from '@/utils/sound';

interface ScannerViewProps {
  // Return true if the package was accepted, false for duplicates/limits
  onScan: (pkg: ScannedPackage) => boolean;
  onDuplicate: (code: string) => void;
  packages: ScannedPackage[];
  declaredCounts: { shopee: number; mercadoLivre: number; avulso: number };
  lastScanned?: ScannedPackage | null;
  onEndSession: () => void;
}

export default function ScannerView({
  onScan,
  onDuplicate,
  packages,
  declaredCounts,
  lastScanned,
  onEndSession,
}: ScannerViewProps) {
  const { colors } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [manualCode, setManualCode] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const [permission, requestPermission] = useCameraPermissions();
  const [barcodeLocked, setBarcodeLocked] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [facing, setFacing] = useState<'back' | 'front'>('back');
  const lastAcceptedRef = useRef<{ code: string; at: number } | null>(null);

  const metrics = getSessionMetrics(packages);

  const [limitVisible, setLimitVisible] = useState(false);
  const [limitLabel, setLimitLabel] = useState('');
  const [limitValue, setLimitValue] = useState(0);

  const checkLimit = (type: 'shopee' | 'mercado_livre' | 'avulso') => {
    let currentCount = 0;
    let limit = 0;
    let label = '';
    switch (type) {
      case 'shopee':
        currentCount = metrics.shopee;
        limit = declaredCounts.shopee;
        label = 'Shopee';
        break;
      case 'mercado_livre':
        currentCount = metrics.mercadoLivre;
        limit = declaredCounts.mercadoLivre;
        label = 'Mercado Livre';
        break;
      case 'avulso':
        currentCount = metrics.avulsos;
        limit = declaredCounts.avulso;
        label = 'Avulso';
        break;
    }
    if (currentCount >= limit) {
      setLimitLabel(label);
      setLimitValue(limit);
      setLimitVisible(true);
      return false;
    }
    return true;
  };

  const normalizeCode = (raw: string) => {
    const trimmed = (raw ?? '').trim();
    const upperRaw = trimmed.toUpperCase();

    const extracted =
      upperRaw.match(/(BR[0-9A-Z]{6,})/)?.[1] ||
      upperRaw.match(/(20000[0-9]{6,})/)?.[1] ||
      upperRaw.match(/(46[0-9]{6,})/)?.[1] ||
      upperRaw.match(/(45[0-9]{6,})/)?.[1] ||
      upperRaw.match(/(LM[0-9A-Z]{2,})/)?.[1];

    if (extracted) return extracted;

    const cleaned = trimmed.replace(/[^0-9a-zA-Z]/g, '');
    return cleaned.toUpperCase();
  };

  const forceTypeByPrefix = (upperCleaned: string) => {
    if (upperCleaned.startsWith('BR')) return 'shopee' as const;
    if (upperCleaned.startsWith('20000') || upperCleaned.startsWith('46')) return 'mercado_livre' as const;
    if (upperCleaned.startsWith('LM')) return 'avulso' as const;
    return null;
  };

  // Pulse animation for reticle
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

  useEffect(() => {
    preloadSounds();
    return () => {
      unloadSounds();
    };
  }, []);

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

  // Feedback flash when scanned
  useEffect(() => {
    if (lastScanned) {
      setShowFeedback(true);
      Animated.sequence([
        Animated.timing(feedbackAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(feedbackAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start(() => setShowFeedback(false));
    }
  }, [lastScanned]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!permission) return;
    if (permission.status === 'undetermined') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleManualSubmit = () => {
    const code = normalizeCode(manualCode);
    if (!code) return;

    const duplicate = packages.find(p => p.code === code);
    if (duplicate) {
      onDuplicate(code);
      playError();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      setManualCode('');
      return;
    }

    const forced = forceTypeByPrefix(code);
    const type = forced ?? classifyPackage(code);
    // check limit
    if (!checkLimit(type)) {
      playError();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      setManualCode('');
      return;
    }

    const pkg: ScannedPackage = {
      id: generateId(),
      code,
      type,
      value: getPackageValue(type),
      scannedAt: new Date().toISOString(),
    };
    const accepted = onScan(pkg);
    if (accepted) {
      lastAcceptedRef.current = { code, at: Date.now() };
      playBeep();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } else {
      playError();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
    }
    setManualCode('');
  };

  const handleScannedCode = (raw: string) => {
    const code = normalizeCode(raw);
    if (!code) return;

    const now = Date.now();
    const lastAccepted = lastAcceptedRef.current;
    if (lastAccepted && lastAccepted.code === code && now - lastAccepted.at < 2000) {
      return;
    }

    const duplicate = packages.find(p => p.code === code);
    if (duplicate) {
      onDuplicate(code);
      playError();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      return;
    }

    const forced = forceTypeByPrefix(code);
    const type = forced ?? classifyPackage(code);

    // check per‑type limit before emitting
    if (!checkLimit(type)) {
      playError();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      return;
    }

    const pkg: ScannedPackage = {
      id: generateId(),
      code,
      type,
      value: getPackageValue(type),
      scannedAt: new Date().toISOString(),
    };

    const accepted = onScan(pkg);
    if (accepted) {
      lastAcceptedRef.current = { code, at: now };
      playBeep();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } else {
      playError();
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
    }
  };

  const handleBarcodeScanned = (event: any) => {
    if (barcodeLocked) return;
    setBarcodeLocked(true);

    handleScannedCode(event?.data);

    setTimeout(() => {
      setBarcodeLocked(false);
    }, 900);
  };

  const lastBadge = lastScanned ? packageTypeBadgeColors(lastScanned.type) : null;

  const reticleWidth = Math.max(200, Math.min(windowWidth - 64, 320));
  const reticleHeight = Math.max(120, Math.min(reticleWidth * 0.62, 220));
  const overlayExtraX = Math.min(260, Math.max(180, Math.round(reticleWidth * 1.15)));
  const overlayExtraY = Math.min(220, Math.max(160, Math.round(reticleHeight * 1.3)));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, position: 'relative' }}>
      {/* Camera area (mock/placeholder for web compat) */}
      <View style={{
        flex: 1,
        backgroundColor: colors.surface2,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}>
        {Platform.OS !== 'web' && permission?.granted && (
          <CameraView
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            facing={facing}
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
            onBarcodeScanned={handleBarcodeScanned}
          />
        )}

        {Platform.OS !== 'web' && permission?.granted && (
          <View style={{
            position: 'absolute',
            top: 14,
            right: 14,
            flexDirection: 'row',
            gap: 10,
            alignItems: 'center',
          }}>
            <TouchableOpacity
              onPress={() => setTorchEnabled(v => !v)}
              activeOpacity={0.85}
              style={{
                backgroundColor: torchEnabled ? colors.primary : 'rgba(15,23,42,0.9)',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: torchEnabled ? colors.primary : colors.border2,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>
                {torchEnabled ? 'FLASH ON' : 'FLASH OFF'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setFacing(v => (v === 'back' ? 'front' : 'back'))}
              activeOpacity={0.85}
              style={{
                backgroundColor: 'rgba(15,23,42,0.9)',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderWidth: 1,
                borderColor: colors.border2,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>
                {facing === 'back' ? 'CÂMERA TRAS.' : 'CÂMERA FRNT.'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Grid lines overlay */}
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          opacity: 0.04,
        }}>
          {[...Array(8)].map((_, i) => (
            <View key={i} style={{
              position: 'absolute',
              left: 0, right: 0,
              top: `${(i + 1) * 12}%` as any,
              height: 1,
              backgroundColor: colors.primary,
            }} />
          ))}
          {[...Array(5)].map((_, i) => (
            <View key={i} style={{
              position: 'absolute',
              top: 0, bottom: 0,
              left: `${(i + 1) * 16}%` as any,
              width: 1,
              backgroundColor: colors.primary,
            }} />
          ))}
        </View>

        {/* Scanner Reticle */}
        <Animated.View style={{
          width: reticleWidth,
          height: reticleHeight,
          transform: [{ scale: pulseAnim }],
          position: 'relative',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <View style={{
            position: 'absolute',
            top: -overlayExtraY,
            left: -overlayExtraX,
            right: -overlayExtraX,
            bottom: -overlayExtraY,
            backgroundColor: 'rgba(2,6,23,0.55)',
            borderRadius: 18,
          }} />

          <View style={{
            position: 'absolute',
            top: -8,
            left: -8,
            right: -8,
            bottom: -8,
            backgroundColor: 'rgba(249,115,22,0.05)',
            borderWidth: 1,
            borderColor: 'rgba(249,115,22,0.4)',
            borderRadius: 18,
          }} />

          {/* Corner brackets */}
          {[
            { top: 0, left: 0 },
            { top: 0, right: 0 },
            { bottom: 0, left: 0 },
            { bottom: 0, right: 0 },
          ].map((pos, i) => (
            <View
              key={i}
              style={{
                position: 'absolute',
                width: 24, height: 24,
                ...pos,
                borderColor: colors.primary,
                borderTopWidth: i < 2 ? 3 : 0,
                borderBottomWidth: i >= 2 ? 3 : 0,
                borderLeftWidth: i === 0 || i === 2 ? 3 : 0,
                borderRightWidth: i === 1 || i === 3 ? 3 : 0,
              }}
            />
          ))}

          {/* Scan line */}
          <Animated.View style={{
            position: 'absolute',
            left: 10,
            right: 10,
            height: 2,
            backgroundColor: colors.primary,
            opacity: 0.75,
            transform: [{
              translateY: scanLineAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-(reticleHeight * 0.35), reticleHeight * 0.35],
              }),
            }],
          }} />

          {/* Center dot */}
          <View style={{
            width: 8, height: 8, borderRadius: 4,
            backgroundColor: colors.primary, opacity: 0.8,
          }} />
        </Animated.View>

        <Text style={{
          color: '#334155', fontSize: 12, marginTop: 20,
          fontWeight: '500', letterSpacing: 0.5,
        }}>
          Posicione o QR Code ou código de barras
        </Text>
        {/* counts vs declared */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 6 }}>
          <Text style={{ color: '#fb923c', fontSize: 10, fontWeight: '600' }}>
            SHOPEE {metrics.shopee}/{declaredCounts.shopee}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}>
            ML {metrics.mercadoLivre}/{declaredCounts.mercadoLivre}
          </Text>
          <Text style={{ color: colors.success, fontSize: 10, fontWeight: '600' }}>
            AVULSO {metrics.avulsos}/{declaredCounts.avulso}
          </Text>
        </View>

        {lastScanned && lastBadge && (
          <View style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 14,
            backgroundColor: 'rgba(15,23,42,0.92)',
            borderWidth: 1,
            borderColor: colors.border2,
            borderRadius: 14,
            paddingHorizontal: 12,
            paddingVertical: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}>
            <View style={{
              backgroundColor: lastBadge.bg,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 999,
              marginRight: 4,
            }}>
              <Text style={{ color: lastBadge.text, fontSize: 11, fontWeight: '800' }}>
                {packageTypeLabel(lastScanned.type)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '800' }} numberOfLines={1}>
                {lastScanned.code}
              </Text>
              <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '600' }}>
                Último lido
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '800' }}>
                R$ {lastScanned.value.toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Status: camera not available on web, show manual entry hint */}
        <View style={{
          marginTop: 12,
          backgroundColor: colors.surface2,
          borderRadius: 8,
          paddingHorizontal: 12, paddingVertical: 6,
        }}>
          {Platform.OS === 'web' ? (
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>
              📱 Câmera não disponível no Web. Use a entrada manual abaixo
            </Text>
          ) : permission?.granted ? (
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>
              📷 Aponte para o QR Code ou código de barras
            </Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', flex: 1 }}>
                🔒 Permissão de câmera necessária. Você pode usar a entrada manual, ou liberar a câmera.
              </Text>
              <TouchableOpacity
                onPress={() => requestPermission()}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '800' }}>
                  PERMITIR
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Last scanned feedback overlay */}
        {showFeedback && lastScanned && lastBadge && (
          <Animated.View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(16,185,129,0.08)',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: feedbackAnim,
          }}>
            <View style={{
              backgroundColor: colors.surface2,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.success,
              padding: 16,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 28 }}>✅</Text>
              <Text style={{ color: colors.success, fontSize: 14, fontWeight: '700', marginTop: 4 }}>
                ESCANEADO
              </Text>
              <View style={{
                backgroundColor: lastBadge.bg, borderRadius: 6,
                paddingHorizontal: 10, paddingVertical: 4, marginTop: 6,
              }}>
                <Text style={{ color: lastBadge.text, fontSize: 11, fontWeight: '700' }}>
                  {packageTypeLabel(lastScanned.type)}
                </Text>
              </View>
              <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '800', marginTop: 8 }}>
                R$ {lastScanned.value.toFixed(2)}
              </Text>
            </View>
          </Animated.View>
        )}
      </View>

      {/* Manual Input Bar */}
      <View style={{
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        padding: 16,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
      }}>
        <TextInput
          value={manualCode}
          onChangeText={setManualCode}
          placeholder="Inserir código manualmente..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="done"
          onSubmitEditing={handleManualSubmit}
          autoCapitalize="characters"
          style={{
            flex: 1,
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.textMuted,
            borderRadius: 10,
            padding: 12,
            color: colors.text,
            fontSize: 15,
            fontFamily: 'SpaceMono-Regular',
          }}
        />
        <TouchableOpacity
          onPress={handleManualSubmit}
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 10,
            padding: 13,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>+</Text>
        </TouchableOpacity>
      </View>

      {/* End Session Button */}
      <View style={{
        backgroundColor: colors.surface,
        paddingHorizontal: 16,
        paddingBottom: 16,
        paddingTop: 4,
      }}>
        <TouchableOpacity
          onPress={onEndSession}
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.surface2,
            borderRadius: 10,
            padding: 13,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.textMuted,
          }}
        >
          <Text style={{ color: colors.primary, fontSize: 14, fontWeight: '700', letterSpacing: 0.5 }}>
            ⏹ ENCERRAR SESSÃO
          </Text>
        </TouchableOpacity>
      </View>

      {/* Per‑type limit warning modal */}
      {limitVisible && (
        <Modal visible transparent animationType="fade">
          <View style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.6)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}>
            <View style={{
              backgroundColor: colors.bg,
              borderRadius: 16,
              padding: 24,
              alignItems: 'center',
              width: '100%',
              maxWidth: 400,
            }}>
              {/* warning icon */}
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: colors.danger,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 36 }}>⚠️</Text>
              </View>
              <Text style={{
                color: colors.danger,
                fontSize: 20,
                fontWeight: '800',
                letterSpacing: 1,
                textAlign: 'center',
              }}>
                LIMITE ATINGIDO
              </Text>
              <Text style={{
                color: colors.textMuted,
                fontSize: 14,
                textAlign: 'center',
                marginTop: 8,
              }}>
                Quantidade declarada de {limitLabel} ({limitValue}) já foi escaneada.
              </Text>
              <TouchableOpacity
                onPress={() => setLimitVisible(false)}
                activeOpacity={0.85}
                style={{
                  backgroundColor: colors.primary,
                  borderRadius: 12,
                  padding: 16,
                  width: '100%',
                  alignItems: 'center',
                  marginTop: 24,
                }}>
                <Text style={{ color: colors.secondary, fontSize: 16, fontWeight: '800', letterSpacing: 1 }}>
                  ENTENDI
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

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
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
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
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { ScannedPackage } from '@/types/session';
import { PackageType } from '@/types/scanner';
import { packageTypeLabel, packageTypeBadgeColors, generateId, getPackageValue, getSessionMetrics } from '@/utils/session';
import { normalizeCode as normalizeScannerCode, identifyPackage } from '@/utils/scannerIdentification';
import { useAppTheme } from '@/utils/useAppTheme';
import { useResponsive, responsiveSize, responsiveValue } from '@/utils/useResponsive';
import { preloadSounds, unloadSounds } from '@/utils/sound';
import { ScannerAudioService, ScannerAudioType } from '@/utils/scannerAudio';

interface ScannerViewProps {
  // Return true if the package was accepted, false for duplicates/limits
  onScan: (pkg: ScannedPackage) => boolean;
  onDuplicate: (code: string) => void;
  packages: ScannedPackage[];
  declaredCounts: { shopee: number; mercadoLivre: number; avulso: number };
  lastScanned?: ScannedPackage | null;
  onEndSession: () => void;
  onRequestPhoto?: (pkg: ScannedPackage) => void;
}

export default function ScannerView({
  onScan,
  onDuplicate,
  packages,
  declaredCounts,
  lastScanned,
  onEndSession,
  onRequestPhoto,
}: ScannerViewProps) {
  const { colors } = useAppTheme();
  const { width: windowWidth } = useWindowDimensions();
  const responsive = useResponsive();
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [manualInputExpanded, setManualInputExpanded] = useState(false);
  const [showOutOfAreaWarning, setShowOutOfAreaWarning] = useState(false);
  const feedbackAnim = useSharedValue(0);
  const pulseAnim = useSharedValue(1);
  const scanLineAnim = useSharedValue(0);
  const outOfAreaAnim = useSharedValue(0);
  const [permission, requestPermission] = useCameraPermissions();
  const [barcodeLocked, setBarcodeLocked] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const lastAcceptedRef = useRef<{ code: string; at: number } | null>(null);
  const audioService = useRef(new ScannerAudioService()).current;

  const metrics = getSessionMetrics(packages);

  // quick lookup set for faster duplicate detection
  const packageSet = useMemo(() => new Set(packages.map(p => p.code)), [packages]);

  // Helper para mapear tipo de pacote para áudio
  const getAudioTypeForPackage = (type: PackageType): ScannerAudioType => {
    switch (type) {
      case 'shopee':
        return ScannerAudioType.BEEP_A;
      case 'mercado_livre':
        return ScannerAudioType.BEEP_B;
      case 'avulso':
        return ScannerAudioType.BEEP_C;
      case 'unknown':
      default:
        return ScannerAudioType.BEEP_ERROR;
    }
  };

  const [limitVisible, setLimitVisible] = useState(false);
  const [limitLabel, setLimitLabel] = useState('');
  const [limitValue, setLimitValue] = useState(0);

  const checkLimit = (type: PackageType) => {
    // Se for unknown, não verifica limite
    if (type === 'unknown') return true;
    
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


  // Pulse animation for reticle
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 900, easing: ReEasing.inOut(ReEasing.ease) }),
        withTiming(1, { duration: 900, easing: ReEasing.inOut(ReEasing.ease) })
      ),
      -1,
      true
    );
  }, []);

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

  useEffect(() => {
    if (lastScanned) {
      setShowFeedback(true);
      feedbackAnim.value = withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 600 })
      );
      setTimeout(() => setShowFeedback(false), 750);
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
    console.log(`[ScannerView] 🎯 MANUAL SUBMIT TRIGGERED`);
    setManualError(null);
    console.log(`[ScannerView] 📝 MANUAL INPUT: "${manualCode}"`);
    const code = normalizeScannerCode(manualCode);
    console.log(`[ScannerView] 🔄 MANUAL NORMALIZADO: "${code}"`);
    if (!code) {
      setManualError('Código inválido');
      return;
    }

    if (packageSet.has(code)) {
      onDuplicate(code);
      audioService.playAudio(ScannerAudioType.BEEP_ERROR);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      setManualCode('');
      setManualError('Código já escaneado');
      return;
    }

    const pkgInfo = identifyPackage(code);
    console.log(`[ScannerView] 🎯 MANUAL IDENTIFICADO: type="${pkgInfo.type}", matched=${pkgInfo.matched}, confidence=${pkgInfo.confidence}`);
    const type = pkgInfo.type;

  // check limit
  if (type === 'unknown' || !checkLimit(type)) {
    audioService.playAudio(ScannerAudioType.BEEP_ERROR);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    }
    setManualCode('');
    setManualError(type === 'unknown' ? 'Tipo de pacote não identificado' : 'Limite atingido para este tipo');
    return;
  }

    const pkg: ScannedPackage = {
      id: generateId(),
      code,
      type,
      value: getPackageValue(type),
      scannedAt: new Date().toISOString(),
    };
    console.log(`[ScannerView] 📦 MANUAL PACOTE CRIADO: ${JSON.stringify(pkg)}`);
    const accepted = onScan(pkg);
    console.log(`[ScannerView] ✅ MANUAL ACEITO: ${accepted}`);
    if (accepted) {
      lastAcceptedRef.current = { code, at: Date.now() };
      const audioType = getAudioTypeForPackage(type);
      console.log(`[ScannerView] 🔊 MANUAL ÁUDIO: type="${type}" -> audioType="${audioType}"`);
      audioService.playAudio(audioType);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } else {
      console.log(`[ScannerView] ❌ MANUAL REJEITADO: onScan retornou false`);
      audioService.playAudio(ScannerAudioType.BEEP_ERROR);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      setManualError('Não foi possível aceitar o pacote');
    }
    setManualCode('');
  };

  const handleScannedCode = (raw: string) => {
    console.log(`[ScannerView] 📥 ENTRADA: "${raw}"`);
    const code = normalizeScannerCode(raw);
    console.log(`[ScannerView] 🔄 NORMALIZADO: "${code}"`);
    if (!code) {
      console.log(`[ScannerView] ❌ CÓDIGO VAZIO APÓS NORMALIZAÇÃO`);
      return;
    }

    const now = Date.now();
    const lastAccepted = lastAcceptedRef.current;
    if (lastAccepted && lastAccepted.code === code && now - lastAccepted.at < 2000) {
      return;
    }

    if (packageSet.has(code)) {
      onDuplicate(code);
      audioService.playAudio(ScannerAudioType.BEEP_ERROR);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      return;
    }

    const pkgInfo = identifyPackage(code);
    const type = pkgInfo.type;
    console.log(`[ScannerView] 🎯 IDENTIFICADO: type="${type}", matched=${pkgInfo.matched}, confidence=${pkgInfo.confidence}`);

    // check per‑type limit before emitting
    if (!checkLimit(type)) {
      audioService.playAudio(ScannerAudioType.BEEP_ERROR);
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
      const audioType = getAudioTypeForPackage(type);
      console.log(`[ScannerView] ✅ ACEITO: type="${type}" -> audioType="${audioType}"`);
      audioService.playAudio(audioType);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    } else {
      audioService.playAudio(ScannerAudioType.BEEP_ERROR);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
    }
  };

  const handleBarcodeScanned = (event: any) => {
    if (barcodeLocked) return;
    setBarcodeLocked(true);

    // Verificar se o código está dentro da área do reticle
    if (event?.bounds && !isCodeInReticleArea(event.bounds)) {
      console.log(`[ScannerView] ❌ Código fora da área do reticle - ignorando`);
      
      // Mostrar feedback visual de fora de área
      setShowOutOfAreaWarning(true);
      outOfAreaAnim.value = withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 800 })
      );
      
      // Feedback tátil e sonoro para fora de área
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      audioService.playAudio(ScannerAudioType.BEEP_ERROR);
      
      setTimeout(() => {
        setShowOutOfAreaWarning(false);
        setBarcodeLocked(false);
      }, 1000);
      return;
    }

    handleScannedCode(event?.data);

    setTimeout(() => {
      setBarcodeLocked(false);
    }, 900);
  };

  // Função para verificar se o código está dentro da área do reticle
  const isCodeInReticleArea = (bounds: any): boolean => {
    if (!bounds) return true; // Se não tiver bounds, assume que está dentro
    
    const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
    
    // Calcular centro do reticle (baseado nas dimensões atuais)
    const reticleCenterX = screenWidth / 2;
    const reticleCenterY = screenHeight / 2;
    
    // Área do reticle com margem de tolerância
    const reticleAreaWidth = reticleWidth * 0.9; // 90% do reticle para margem
    const reticleAreaHeight = reticleHeight * 0.9;
    
    // Limites do reticle
    const reticleLeft = reticleCenterX - reticleAreaWidth / 2;
    const reticleRight = reticleCenterX + reticleAreaWidth / 2;
    const reticleTop = reticleCenterY - reticleAreaHeight / 2;
    const reticleBottom = reticleCenterY + reticleAreaHeight / 2;
    
    // Coordenadas do código escaneado
    const codeLeft = bounds.x || 0;
    const codeRight = (bounds.x || 0) + (bounds.width || 0);
    const codeTop = bounds.y || 0;
    const codeBottom = (bounds.y || 0) + (bounds.height || 0);
    
    // Verificar se o código está completamente dentro do reticle
    const isWithinArea = 
      codeLeft >= reticleLeft &&
      codeRight <= reticleRight &&
      codeTop >= reticleTop &&
      codeBottom <= reticleBottom;
    
    console.log(`[ScannerView] 🎯 Verificação de área:`, {
      codeBounds: { left: codeLeft, right: codeRight, top: codeTop, bottom: codeBottom },
      reticleBounds: { left: reticleLeft, right: reticleRight, top: reticleTop, bottom: reticleBottom },
      isWithinArea
    });
    
    return isWithinArea;
  };

  const lastBadge = lastScanned ? packageTypeBadgeColors(lastScanned.type) : null;

  // Dimensões responsivas do reticle baseadas no tipo de dispositivo
  const reticleWidth = useMemo(() => {
    if (responsive.isTablet) return responsiveSize(responsive, 280, 400, 450, 250);
    if (responsive.isUltraWide) return responsiveSize(responsive, 320, 450, 500, 280);
    return Math.max(200, Math.min(windowWidth - 64, 320));
  }, [responsive, windowWidth]);

  const reticleHeight = useMemo(() => {
    if (responsive.isTablet) return reticleWidth * 0.65;
    if (responsive.isUltraWide) return reticleWidth * 0.6;
    return Math.max(120, Math.min(reticleWidth * 0.62, 220));
  }, [reticleWidth, responsive]);

  const overlayExtraX = useMemo(() => {
    if (responsive.isTablet) return Math.round(reticleWidth * 1.2);
    if (responsive.isUltraWide) return Math.round(reticleWidth * 1.15);
    return Math.min(260, Math.max(180, Math.round(reticleWidth * 1.15)));
  }, [reticleWidth, responsive]);

  const overlayExtraY = useMemo(() => {
    if (responsive.isTablet) return Math.round(reticleHeight * 1.4);
    if (responsive.isUltraWide) return Math.round(reticleHeight * 1.3);
    return Math.min(220, Math.max(160, Math.round(reticleHeight * 1.3)));
  }, [reticleHeight, responsive]);

  // Animated styles
  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(
        scanLineAnim.value,
        [0, 1],
        [-(reticleHeight * 0.35), reticleHeight * 0.35]
      )
    }],
  }));

  const feedbackStyle = useAnimatedStyle(() => ({
    opacity: feedbackAnim.value,
  }));

  const outOfAreaStyle = useAnimatedStyle(() => ({
    opacity: outOfAreaAnim.value,
  }));

  // Gerenciar fullscreen automático
  useEffect(() => {
    if (Platform.OS !== 'web') {
      StatusBar.setHidden(true, 'fade');
    }
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, position: 'relative' }}>
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
            onBarcodeScanned={handleBarcodeScanned}
          />
        )}

        {Platform.OS !== 'web' && permission?.granted && (
          <View style={{
            position: 'absolute',
            top: Platform.OS === 'ios' ? responsive.padding.xxl : responsive.padding.lg,
            right: responsive.padding.md,
            zIndex: 10,
            gap: responsive.spacing.sm,
          }}>
            <TouchableOpacity
              onPress={() => setTorchEnabled(v => !v)}
              activeOpacity={0.85}
              style={{
                backgroundColor: torchEnabled ? colors.primary : 'rgba(15,23,42,0.85)',
                borderRadius: responsive.borderRadius.lg,
                paddingHorizontal: responsive.padding.md,
                paddingVertical: responsive.padding.md,
                borderWidth: 1,
                borderColor: torchEnabled ? colors.primary : colors.border2,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
                minWidth: responsive.fontSize.xl * 2,
                minHeight: responsive.fontSize.xl * 2,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ 
                color: '#fff', 
                fontSize: responsive.fontSize.md, 
                fontWeight: '800', 
                letterSpacing: 0.5,
                lineHeight: responsive.fontSize.lg,
              }}>
                {torchEnabled ? '💡' : '🔦'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={onEndSession}
              activeOpacity={0.85}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.9)',
                borderRadius: responsive.borderRadius.lg,
                paddingHorizontal: responsive.padding.md,
                paddingVertical: responsive.padding.md,
                borderWidth: 1,
                borderColor: '#ef4444',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 4,
                elevation: 3,
                minWidth: responsive.fontSize.xl * 2,
                minHeight: responsive.fontSize.xl * 2,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ 
                color: '#fff', 
                fontSize: responsive.fontSize.md, 
                fontWeight: '800', 
                letterSpacing: 0.5,
                lineHeight: responsive.fontSize.lg,
              }}>
                ⏹
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
        <Animated.View style={[
          {
            width: reticleWidth,
            height: reticleHeight,
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
          },
          pulseStyle
        ]}>
          {/* Overlay escuro */}
          <View style={{
            position: 'absolute',
            top: -overlayExtraY,
            left: -overlayExtraX,
            right: -overlayExtraX,
            bottom: -overlayExtraY,
            backgroundColor: 'rgba(2,6,23,0.6)',
            borderRadius: 20,
          }} />

          {/* Border principal */}
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderWidth: 2,
            borderColor: colors.primary,
            borderRadius: 16,
            opacity: 0.8,
          }} />

          {/* Corner brackets - superior esquerdo */}
          <View
            style={{
              position: 'absolute',
              top: -4,
              left: -4,
              width: 32,
              height: 32,
              borderTopWidth: 3,
              borderLeftWidth: 3,
              borderColor: colors.primary,
              borderTopLeftRadius: 8,
            }}
          />

          {/* Corner brackets - superior direito */}
          <View
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              width: 32,
              height: 32,
              borderTopWidth: 3,
              borderRightWidth: 3,
              borderColor: colors.primary,
              borderTopRightRadius: 8,
            }}
          />

          {/* Corner brackets - inferior esquerdo */}
          <View
            style={{
              position: 'absolute',
              bottom: -4,
              left: -4,
              width: 32,
              height: 32,
              borderBottomWidth: 3,
              borderLeftWidth: 3,
              borderColor: colors.primary,
              borderBottomLeftRadius: 8,
            }}
          />

          {/* Corner brackets - inferior direito */}
          <View
            style={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              width: 32,
              height: 32,
              borderBottomWidth: 3,
              borderRightWidth: 3,
              borderColor: colors.primary,
              borderBottomRightRadius: 8,
            }}
          />

          {/* Scan line animada */}
          <Animated.View style={[
            {
              position: 'absolute',
              left: 8,
              right: 8,
              height: 2,
              backgroundColor: colors.primary,
              opacity: 0.7,
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.6,
              shadowRadius: 8,
              elevation: 5,
            },
            scanLineStyle
          ]} />

          {/* Center dot */}
          <View style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.primary,
            opacity: 0.9,
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.7,
            shadowRadius: 4,
            elevation: 3,
          }} />
        </Animated.View>

        <Text style={{
          color: colors.text, 
          fontSize: responsive.fontSize.sm, 
          marginTop: responsive.spacing.lg,
          fontWeight: '600', 
          letterSpacing: 0.3,
          textAlign: 'center',
          paddingHorizontal: responsive.padding.md,
        }}>
          Apenas códigos dentro da área verde serão lidos
        </Text>
        {/* counts vs declared with compact progress */}
        <View style={{ 
          marginTop: responsive.spacing.sm, 
          width: responsive.isTablet ? '70%' : responsive.isUltraWide ? '60%' : '86%', 
          alignItems: 'center',
          maxWidth: responsive.maxWidth.md,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>Shopee</Text>
            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>{metrics.shopee}/{declaredCounts.shopee}</Text>
          </View>
          <View style={{ height: 8, width: '100%', backgroundColor: colors.surface2, borderRadius: 8, marginTop: 6, overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(100, declaredCounts.shopee ? Math.round((metrics.shopee / declaredCounts.shopee) * 100) : 0)}%`, height: '100%', backgroundColor: '#fb923c' }} />
          </View>
          <View style={{ height: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>Mercado Livre</Text>
            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>{metrics.mercadoLivre}/{declaredCounts.mercadoLivre}</Text>
          </View>
          <View style={{ height: 8, width: '100%', backgroundColor: colors.surface2, borderRadius: 8, marginTop: 6, overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(100, declaredCounts.mercadoLivre ? Math.round((metrics.mercadoLivre / declaredCounts.mercadoLivre) * 100) : 0)}%`, height: '100%', backgroundColor: '#ffe600' }} />
          </View>
          <View style={{ height: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>Avulso</Text>
            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>{metrics.avulsos}/{declaredCounts.avulso}</Text>
          </View>
          <View style={{ height: 8, width: '100%', backgroundColor: colors.surface2, borderRadius: 8, marginTop: 6, overflow: 'hidden' }}>
            <View style={{ width: `${Math.min(100, declaredCounts.avulso ? Math.round((metrics.avulsos / declaredCounts.avulso) * 100) : 0)}%`, height: '100%', backgroundColor: colors.success }} />
          </View>
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
              <Text style={{ color: colors.primary, fontSize: responsive.fontSize.sm, fontWeight: '800' }}>
                R$ {(lastScanned.value || 0).toFixed(2)}
              </Text>
            </View>
            {onRequestPhoto && (
              <TouchableOpacity
                onPress={() => onRequestPhoto(lastScanned)}
                style={{
                  marginLeft: 8,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  backgroundColor: colors.surface2,
                }}
              >
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>
                  📸 Foto
                </Text>
              </TouchableOpacity>
            )}
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
          ) : permission?.status === 'undetermined' ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', flex: 1 }}>
                Solicitando permissão da câmera...
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', flex: 1 }}>
                🔒 Permissão de câmera necessária. Você pode usar a entrada manual, ou liberar a câmera.
              </Text>
              <TouchableOpacity
                onPress={() => requestPermission()}
                accessibilityRole="button"
                accessibilityLabel="Permitir câmera"
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

        {/* Out of area warning overlay */}
        {showOutOfAreaWarning && (
          <Animated.View style={[
            {
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
            },
            outOfAreaStyle
          ]}>
            <View style={{
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#ef4444',
              padding: 16,
              alignItems: 'center',
            }}>
              <Text style={{ fontSize: 28 }}>🎯</Text>
              <Text style={{ color: '#fff', fontSize: 14, fontWeight: '700', marginTop: 4 }}>
                FORA DA ÁREA
              </Text>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 2, textAlign: 'center' }}>
                Posicione o código dentro do quadrado verde
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Last scanned feedback overlay */}
        {showFeedback && lastScanned && lastBadge && (
          <Animated.View style={[
            {
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(16,185,129,0.08)',
              justifyContent: 'center',
              alignItems: 'center',
            },
            feedbackStyle
          ]}>
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
              <Text style={{ color: colors.primary, fontSize: responsive.fontSize.lg, fontWeight: '800', marginTop: 8 }}>
                R$ {(lastScanned.value || 0).toFixed(2)}
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
        display: 'none', // Sempre oculto em modo fullscreen automático
      }}>
        {/* Toggle Header */}
        <TouchableOpacity
          onPress={() => setManualInputExpanded(!manualInputExpanded)}
          activeOpacity={0.7}
          style={{
            paddingHorizontal: responsive.padding.md,
            paddingVertical: responsive.padding.md,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: colors.textMuted, fontSize: responsive.fontSize.xs, fontWeight: '600', letterSpacing: 0.5 }}>
            ⌨️ ENTRADA MANUAL
          </Text>
          <Text style={{ color: colors.primary, fontSize: responsive.fontSize.md, fontWeight: '700' }}>
            {manualInputExpanded ? '−' : '+'}
          </Text>
        </TouchableOpacity>

        {/* Expanded Content */}
        {manualInputExpanded && (
          <View style={{
            padding: responsive.padding.md,
            paddingTop: responsive.padding.sm,
            flexDirection: 'row',
            gap: responsive.spacing.sm,
            alignItems: 'center',
            flexWrap: 'wrap',
            borderTopWidth: 1,
            borderTopColor: colors.border2,
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
                borderRadius: responsive.borderRadius.md,
                padding: responsive.padding.md,
                color: colors.text,
                fontSize: responsive.fontSize.md,
                fontFamily: 'SpaceMono-Regular',
                minHeight: responsive.fontSize.lg * 2,
              }}
            />
            <TouchableOpacity
              onPress={handleManualSubmit}
              activeOpacity={0.85}
              style={{
                backgroundColor: colors.primary,
                borderRadius: responsive.borderRadius.md,
                padding: responsive.padding.md,
                justifyContent: 'center',
                alignItems: 'center',
                minWidth: responsive.fontSize.lg * 2,
                minHeight: responsive.fontSize.lg * 2,
              }}
            >
              <Text style={{ color: '#fff', fontSize: responsive.fontSize.md, fontWeight: '800' }}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {manualError ? (
        <View style={{ backgroundColor: colors.surface, paddingHorizontal: 16, paddingVertical: 8 }}>
          <Text style={{ color: colors.danger, fontSize: 13, fontWeight: '700' }}>{manualError}</Text>
        </View>
      ) : null}

      {/* End Session Button */}
      <View style={{
        backgroundColor: colors.surface,
        paddingHorizontal: responsive.padding.md,
        paddingBottom: responsive.padding.md,
        paddingTop: responsive.padding.xs,
        display: 'none', // Sempre oculto em modo fullscreen automático
      }}>
        <TouchableOpacity
          onPress={onEndSession}
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.surface2,
            borderRadius: responsive.borderRadius.md,
            padding: responsive.padding.md,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.textMuted,
          }}
        >
          <Text style={{ color: colors.primary, fontSize: responsive.fontSize.sm, fontWeight: '700', letterSpacing: 0.5 }}>
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
    </View>
  );
}

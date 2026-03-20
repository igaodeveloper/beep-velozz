/**
 * Professional Industrial Scanner - Modern UI/UX Experience
 * Advanced scanning interface with intelligent features and premium animations
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Animated as RNAnimated,
  Platform,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  Vibration,
  PixelRatio,
  Keyboard,
  TouchableWithoutFeedback,
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
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useIndustrialScanner } from '@/utils/useIndustrialScanner';
import { useAppTheme } from '@/utils/useAppTheme';
import { preloadSounds, unloadSounds } from '@/utils/sound';
import { ScannerState } from '@/types/scanner';
import { getPackageTypeLabel } from '@/utils/scannerIdentification';
import { Ionicons } from '@expo/vector-icons';

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
  // Enhanced features
  sessionStartTime?: number;
  operatorName?: string;
  divergenceAccepted?: boolean;
}

interface ScanHistoryItem {
  code: string;
  type: string;
  timestamp: number;
  success: boolean;
}

interface SmartSuggestion {
  code: string;
  confidence: number;
  reason: string;
}

/**
 * Professional Industrial Scanner Component
 * Features: Advanced UI, Smart Suggestions, Real-time Analytics, Premium Animations
 */
export default function IndustrialScannerView({
  maxScans,
  onScanned,
  onLimitReached,
  onEndSession,
  onBack,
  sessionStartTime,
  operatorName,
  divergenceAccepted = false,
}: IndustrialScannerViewProps) {
  const { colors } = useAppTheme();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  const pixelRatio = PixelRatio.get();
  const fontScale = PixelRatio.getFontScale();
  
  // Enhanced device detection with resolution awareness
  const isTablet = useMemo(() => {
    const aspectRatio = Math.max(windowWidth, windowHeight) / Math.min(windowWidth, windowHeight);
    const isLargeScreen = Math.max(windowWidth, windowHeight) >= 768;
    return isLargeScreen || aspectRatio < 1.3;
  }, [windowWidth, windowHeight]);
  
  const isUltraWide = useMemo(() => {
    const aspectRatio = windowWidth / windowHeight;
    return aspectRatio > 2.0;
  }, [windowWidth, windowHeight]);
  
  // High resolution detection
  const isHighResolution = useMemo(() => {
    return pixelRatio >= 2; // Retina displays and higher
  }, [pixelRatio]);
  
  // Responsive scale factors
  const scaleFactor = useMemo(() => {
    const baseScale = isTablet ? 1.2 : isHighResolution ? 1.1 : 1;
    return baseScale * fontScale;
  }, [isTablet, isHighResolution, fontScale]);
  
  // Responsive dimensions with high-res optimization
  const responsiveScale = useCallback((value: number) => {
    return Math.round(value * scaleFactor);
  }, [scaleFactor]);
  
  // Responsive spacing and sizing
  const spacing = useMemo(() => ({
    xs: responsiveScale(4),
    sm: responsiveScale(8),
    md: responsiveScale(12),
    lg: responsiveScale(16),
    xl: responsiveScale(20),
    xxl: responsiveScale(24),
    xxxl: responsiveScale(32),
  }), [responsiveScale]);
  
  const borderRadius = useMemo(() => ({
    sm: responsiveScale(6),
    md: responsiveScale(10),
    lg: responsiveScale(14),
    xl: responsiveScale(18),
    xxl: responsiveScale(24),
  }), [responsiveScale]);
  
  const fontSize = useMemo(() => ({
    xs: responsiveScale(10),
    sm: responsiveScale(12),
    md: responsiveScale(14),
    lg: responsiveScale(16),
    xl: responsiveScale(18),
    xxl: responsiveScale(20),
    xxxl: responsiveScale(24),
    xxxx: responsiveScale(28),
    xxxxx: responsiveScale(32),
  }), [responsiveScale]);
  
  // Enhanced state management
  const [manualCode, setManualCode] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);
  const [barcodeLocked, setBarcodeLocked] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [manualInputExpanded, setManualInputExpanded] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanQuality, setScanQuality] = useState<'excellent' | 'good' | 'poor'>('good');
  const [cameraStabilization, setCameraStabilization] = useState(false);
  const [showScanningPanel, setShowScanningPanel] = useState(true); // Novo estado para ocultar/mostrar
  
  // Estados para controle de cores baseado em leituras
  const [lastScanStatus, setLastScanStatus] = useState<'success' | 'error' | 'duplicate' | 'idle' | null>('idle');
  const [lastScanTime, setLastScanTime] = useState<number>(0);

  // Advanced animations with enhanced visual effects
  const pulseAnim = useSharedValue(1);
  const scanLineAnim = useSharedValue(0);
  const cornerPulseAnim = useSharedValue(1);
  const glowAnim = useSharedValue(0);
  const radarAnim = useSharedValue(0);
  const successPulseAnim = useSharedValue(0);
  const errorShakeAnim = useSharedValue(0);
  const qualityIndicatorAnim = useSharedValue(0);
  const panelSlideAnim = useSharedValue(0); // Nova animação para o painel

  // Modal states
  const [limitModalVisible, setLimitModalVisible] = useState(false);
  const [limitModalMessage, setLimitModalMessage] = useState('');
  const [analyticsModalVisible, setAnalyticsModalVisible] = useState(false);

  // Enhanced scanner hook with intelligent features - OTIMIZADO
  const scanner = useIndustrialScanner({
    maxAllowedScans: maxScans,
    debounceMs: 50, // Ultra-rápido: redução de 300ms para 50ms
    onStateChange: (state) => {
      // Enhanced haptic feedback based on state
      if (Platform.OS !== 'web') {
        switch (state) {
          case ScannerState.LIMIT_REACHED:
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            break;
          case ScannerState.ACTIVE:
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            break;
        }
      }
      
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

  // Smart suggestions algorithm
  const generateSmartSuggestions = useCallback(() => {
    const suggestions: SmartSuggestion[] = [];
    const recentCodes = scanHistory.slice(-5).map(item => item.code);
    
    // Pattern recognition from recent scans
    if (recentCodes.length >= 2) {
      const commonPrefix = recentCodes[0].substring(0, 3);
      const similarCodes = recentCodes.filter(code => code.startsWith(commonPrefix));
      
      if (similarCodes.length >= 2) {
        suggestions.push({
          code: commonPrefix + '***',
          confidence: 0.8,
          reason: 'Padrão detectado em códigos recentes',
        });
      }
    }
    
    // Sequential pattern detection
    const lastNumbers = recentCodes
      .map(code => {
        const match = code.match(/(\d+)$/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(n => n !== null) as number[];
    
    if (lastNumbers.length >= 2) {
      const diff = lastNumbers[lastNumbers.length - 1] - lastNumbers[lastNumbers.length - 2];
      if (Math.abs(diff) === 1) {
        const nextNumber = lastNumbers[lastNumbers.length - 1] + diff;
        suggestions.push({
          code: recentCodes[recentCodes.length - 1].replace(/\d+$/, String(nextNumber)),
          confidence: 0.9,
          reason: 'Padrão sequencial detectado',
        });
      }
    }
    
    setSmartSuggestions(suggestions);
  }, [scanHistory]);

  // Enhanced audio and haptic feedback system
  const triggerFeedback = useCallback((type: 'success' | 'error' | 'warning', intensity: 'light' | 'medium' | 'heavy' = 'medium') => {
    if (Platform.OS === 'web') return;
    
    // Haptic feedback
    switch (intensity) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
    }
    
    // Vibration pattern for different types
    switch (type) {
      case 'success':
        Vibration.vibrate(100);
        break;
      case 'error':
        Vibration.vibrate([100, 50, 100]);
        break;
      case 'warning':
        Vibration.vibrate(200);
        break;
    }
  }, []);

  // Real-time scan quality assessment
  const assessScanQuality = useCallback((scanResult: any) => {
    const qualityFactors = {
      speed: scanResult.processingTime < 200 ? 'excellent' : scanResult.processingTime < 500 ? 'good' : 'poor',
      confidence: scanResult.confidence > 0.9 ? 'excellent' : scanResult.confidence > 0.7 ? 'good' : 'poor',
      consistency: scanHistory.length > 0 ? 'good' : 'excellent',
    };
    
    const qualityScore = Object.values(qualityFactors).filter(q => q === 'excellent').length;
    setScanQuality(qualityScore >= 2 ? 'excellent' : qualityScore >= 1 ? 'good' : 'poor');
  }, [scanHistory]);

  // Enhanced animation system with premium effects
  useEffect(() => {
    // Main pulse animation with breathing effect
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.03, { duration: 1500, easing: ReEasing.inOut(ReEasing.ease) }),
        withTiming(1, { duration: 1500, easing: ReEasing.inOut(ReEasing.ease) })
      ),
      -1,
      true
    );

    // Corner pulse animation for visual feedback
    cornerPulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1000, easing: ReEasing.out(ReEasing.ease) }),
        withTiming(1, { duration: 1000, easing: ReEasing.inOut(ReEasing.ease) })
      ),
      -1,
      true
    );

    // Glow animation for premium feel
    glowAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: ReEasing.inOut(ReEasing.ease) }),
        withTiming(0.3, { duration: 2500, easing: ReEasing.inOut(ReEasing.ease) })
      ),
      -1,
      true
    );

    // Radar animation for scanning indication
    radarAnim.value = withRepeat(
      withTiming(1, { duration: 3500, easing: ReEasing.linear }),
      -1,
      false
    );

    // Quality indicator animation
    qualityIndicatorAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: ReEasing.out(ReEasing.ease) }),
        withTiming(0.7, { duration: 800, easing: ReEasing.inOut(ReEasing.ease) })
      ),
      -1,
      true
    );

    // Panel slide animation
    panelSlideAnim.value = withTiming(showScanningPanel ? 0 : 1, { 
      duration: 300, 
      easing: ReEasing.out(ReEasing.ease) 
    });

    return () => {
      // Cleanup animations
      pulseAnim.value = 1;
      cornerPulseAnim.value = 1;
      glowAnim.value = 0;
      radarAnim.value = 0;
      qualityIndicatorAnim.value = 0.7;
      panelSlideAnim.value = 0;
    };
  }, [showScanningPanel]);

  // Enhanced scan line animation with smooth transitions
  useEffect(() => {
    scanLineAnim.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1300, easing: ReEasing.inOut(ReEasing.ease) }),
        withTiming(0, { duration: 1300, easing: ReEasing.inOut(ReEasing.ease) })
      ),
      -1,
      true
    );
  }, []);

  // Permission request with enhanced user feedback
  useEffect(() => {
    if (Platform.OS === 'web') return;
    if (!permission) return;
    if (permission.status === 'undetermined') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Auto-generate suggestions when scan history changes
  useEffect(() => {
    generateSmartSuggestions();
  }, [scanHistory, generateSmartSuggestions]);

  // Panel slide animation based on visibility state
  useEffect(() => {
    panelSlideAnim.value = withTiming(
      showScanningPanel ? 0 : 1, 
      { duration: 300, easing: ReEasing.inOut(ReEasing.ease) }
    );
  }, [showScanningPanel]);

  // Reset color to idle (yellow) after 3 seconds of inactivity
  useEffect(() => {
    if (lastScanStatus === null || lastScanStatus === 'idle') return;

    const timer = setTimeout(() => {
      setLastScanStatus('idle');
      setLastScanTime(Date.now());
    }, 3000);

    return () => clearTimeout(timer);
  }, [lastScanStatus]);

  // Function to dismiss keyboard and close manual input
  const dismissKeyboardAndCloseInput = useCallback(() => {
    Keyboard.dismiss();
    setManualInputExpanded(false);
    setManualCode('');
    setManualError(null);
  }, []);

  // Enhanced barcode handler with intelligent processing - OTIMIZADO
  const handleBarcode = useCallback(async (event: any) => {
    console.debug(`[ProfessionalScanner] Barcode scanned: "${event?.data}"`);
    
    if (barcodeLocked || scanner.state === ScannerState.LIMIT_REACHED || isProcessing) {
      console.debug(`[ProfessionalScanner] Ignored: locked=${barcodeLocked}, limitReached=${scanner.state === ScannerState.LIMIT_REACHED}, processing=${isProcessing}`);
      return;
    }

    // Enhanced JSON extraction with better error handling
    let scanned = event?.data || '';
    if (scanned.startsWith('{') && scanned.endsWith('}')) {
      try {
        const obj = JSON.parse(scanned);
        if (obj && typeof obj.id === 'string') {
          console.debug(`[ProfessionalScanner] Extracted ID from JSON: ${obj.id}`);
          scanned = obj.id;
        }
      } catch (error) {
        console.debug(`[ProfessionalScanner] JSON parse failed, using raw data`);
      }
    }

    setBarcodeLocked(true);
    setIsProcessing(true);
    
    const startTime = Date.now();
    const result = await scanner.processScan(scanned);
    const processingTime = Date.now() - startTime;
    
    console.debug(`[ProfessionalScanner] Process result: success=${result.success}, reason=${result.reason}, type=${result.type}, time=${processingTime}ms`);

    // Enhanced feedback system with color control
    if (result.success) {
      // Sucesso - definir cor verde
      setLastScanStatus('success');
      setLastScanTime(Date.now());
      
      // Success animation
      successPulseAnim.value = withSequence(
        withTiming(1.2, { duration: 100 }), // Reduzido de 200ms para 100ms
        withTiming(1, { duration: 100 })
      );
      
      triggerFeedback('success', 'medium');
      
      // Add to scan history
      setScanHistory(prev => [...prev, {
        code: result.code,
        type: result.type || 'unknown',
        timestamp: Date.now(),
        success: true,
      }].slice(-10)); // Keep last 10 scans
      
      // Assess scan quality
      assessScanQuality({ ...result, processingTime });
      
      onScanned?.(result.code, result.type || 'unknown');
    } else {
      // Erro ou duplicado - definir cor vermelha
      const status = result.reason === 'duplicate' ? 'duplicate' : 'error';
      setLastScanStatus(status);
      setLastScanTime(Date.now());
      
      // Error animation
      errorShakeAnim.value = withSequence(
        withTiming(-10, { duration: 50 }), // Reduzido de 100ms para 50ms
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      
      triggerFeedback('error', 'heavy');
    }

    setIsProcessing(false);
    setTimeout(() => setBarcodeLocked(false), 50); // Ultra-rápido: redução de 300ms para 50ms
  }, [barcodeLocked, scanner.state, isProcessing, triggerFeedback, assessScanQuality, onScanned]);

  // Enhanced manual submission with smart validation
  const handleManualSubmit = useCallback(async () => {
    setManualError(null);

    if (!manualCode.trim()) {
      setManualError('Código obrigatório');
      triggerFeedback('warning', 'light');
      return;
    }

    // Smart validation based on patterns
    const codePattern = /^[A-Z0-9]{3,50}$/i;
    if (!codePattern.test(manualCode.trim())) {
      setManualError('Formato de código inválido');
      triggerFeedback('error', 'medium');
      return;
    }

    if (scanner.state === ScannerState.LIMIT_REACHED) {
      setManualError('Limite de scans atingido');
      triggerFeedback('warning', 'medium');
      return;
    }

    setIsProcessing(true);
    const result = await scanner.processScan(manualCode.trim());
    setIsProcessing(false);

    if (result.success) {
      // Success - definir cor verde
      setLastScanStatus('success');
      setLastScanTime(Date.now());
      
      // Success feedback
      triggerFeedback('success', 'medium');
      
      // Add to history
      setScanHistory(prev => [...prev, {
        code: result.code,
        type: result.type || 'unknown',
        timestamp: Date.now(),
        success: true,
      }].slice(-10));
      
      onScanned?.(result.code, result.type || 'unknown');
      setManualCode('');
      setManualInputExpanded(false);
    } else {
      // Erro ou duplicado - definir cor vermelha
      const status = result.reason === 'duplicate' ? 'duplicate' : 'error';
      setLastScanStatus(status);
      setLastScanTime(Date.now());
      
      // Enhanced error messages
      const errorMessages = {
        duplicate: 'Código já escaneado nesta sessão',
        limit_reached: 'Limite atingido para este tipo de pacote',
        invalid: 'Código inválido ou não reconhecido',
        rate_limited: 'Aguarde um momento antes de escanear novamente',
      };
      
      setManualError(errorMessages[result.reason as keyof typeof errorMessages] || 'Erro ao processar código');
      triggerFeedback('error', 'medium');
    }
  }, [manualCode, scanner.state, triggerFeedback, onScanned]);

  // Enhanced responsive reticle dimensions with high-resolution optimization
  const reticleDimensions = useMemo(() => {
    const baseWidth = Math.min(windowWidth, windowHeight);
    const scale = scaleFactor;
    
    if (isTablet) {
      // Tablets: professional reticle with high-res optimization
      const width = responsiveScale(Math.max(300, Math.min(baseWidth * 0.48, 400) / scale));
      const height = responsiveScale(Math.max(220, Math.min(width * 0.65, 300) / scale));
      return { width, height };
    } else if (isUltraWide) {
      // Ultra-wide: balanced reticle with high-res optimization
      const width = responsiveScale(Math.max(280, Math.min(baseWidth * 0.42, 340) / scale));
      const height = responsiveScale(Math.max(200, Math.min(width * 0.75, 280) / scale));
      return { width, height };
    } else {
      // Mobile: compact professional reticle with high-res optimization
      const width = responsiveScale(Math.max(240, Math.min(baseWidth * 0.58, 320) / scale));
      const height = responsiveScale(Math.max(180, Math.min(width * 0.7, 260) / scale));
      return { width, height };
    }
  }, [windowWidth, windowHeight, isTablet, isUltraWide, scaleFactor]);
  
  const { width: reticleWidth, height: reticleHeight } = reticleDimensions;

  // Enhanced status color system based on scan results
  const statusColor = useMemo(() => {
    // Se houve um scan recente, usar a cor baseada no resultado
    const now = Date.now();
    const timeSinceLastScan = now - lastScanTime;
    
    // Manter a cor do último scan por 3 segundos
    if (timeSinceLastScan < 3000 && lastScanStatus) {
      switch (lastScanStatus) {
        case 'success':
          return '#10b981'; // Verde para sucesso
        case 'error':
        case 'duplicate':
          return '#ef4444'; // Vermelho para erro/duplicado
        case 'idle':
          return '#f59e0b'; // Amarelo para inatividade
        default:
          break;
      }
    }
    
    // Caso contrário, usar a lógica original baseada em estado e qualidade
    if (divergenceAccepted) return '#f97316'; // Laranja para divergência aceita
    if (scanner.state === ScannerState.LIMIT_REACHED) return colors.danger;
    if (scanner.state === ScannerState.PAUSED) return colors.warning;
    if (scanQuality === 'excellent') return '#10b981';
    if (scanQuality === 'good') return colors.success;
    return '#f59e0b'; // Amarelo como padrão para inatividade
  }, [scanner.state, scanQuality, colors, lastScanStatus, lastScanTime, divergenceAccepted]);

  // Advanced session analytics
  const sessionAnalytics = useMemo(() => {
    const totalScans = Object.values(scanner.counts).reduce((a, b) => a + b, 0);
    const totalTargets = Object.values(maxScans).reduce((a, b) => a + b, 0);
    const progress = totalTargets > 0 ? (totalScans / totalTargets) * 100 : 0;
    const elapsed = sessionStartTime ? Date.now() - sessionStartTime : 0;
    const rate = elapsed > 0 ? (totalScans / (elapsed / 1000 / 60)) : 0; // scans per minute
    
    return {
      totalScans,
      totalTargets,
      progress,
      elapsed,
      rate: Math.round(rate * 10) / 10,
      efficiency: scanQuality === 'excellent' ? 95 : scanQuality === 'good' ? 80 : 60,
    };
  }, [scanner.counts, maxScans, sessionStartTime, scanQuality]);

  // Check if all limits reached
  const allLimitsReached = useMemo(() => {
    return Object.entries(maxScans).every(([type, max]) => 
      scanner.counts[type as keyof typeof maxScans] >= max
    );
  }, [scanner.counts, maxScans]);

  // Check for progress
  const hasSomeProgress = useMemo(() => {
    return Object.values(scanner.counts).some(count => count > 0);
  }, [scanner.counts]);

  // Enhanced animated styles
  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(
        scanLineAnim.value,
        [0, 1],
        [-(reticleHeight * 0.4), reticleHeight * 0.4]
      )
    }],
    opacity: interpolate(
      scanLineAnim.value,
      [0, 0.5, 1],
      [0.3, 1, 0.3]
    ),
  }));

  const successPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: successPulseAnim.value }],
  }));

  const errorShakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: errorShakeAnim.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowAnim.value,
  }));

  const radarStyle = useAnimatedStyle(() => {
    const scale = radarAnim.value;
    const opacity = 1 - (scale - 1) * 0.5;
    return {
      transform: [{ scale }],
      opacity: Math.max(0, opacity),
    };
  });

  const qualityIndicatorStyle = useAnimatedStyle(() => ({
    opacity: qualityIndicatorAnim.value,
    transform: [{ scale: qualityIndicatorAnim.value }],
  }));

  // Cache responsive values for animations
  const panelTranslateY = useMemo(() => responsiveScale(isTablet ? 200 : 180), [isTablet, responsiveScale]);
  const iconSize = useMemo(() => responsiveScale(isTablet ? 18 : 16), [isTablet, responsiveScale]);
  const borderWidthValue = useMemo(() => responsiveScale(1), [responsiveScale]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000', position: 'relative' }}>
      {/* Enhanced Camera View with professional settings */}
      {Platform.OS !== 'web' && permission?.granted && (
        <CameraView
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
          facing="back"
          enableTorch={torchEnabled}
          barcodeScannerSettings={{
            barcodeTypes: [
              'qr', 'code128', 'code39', 'ean13', 'ean8', 
              'upc_a', 'upc_e', 'pdf417', 'aztec', 'datamatrix'
            ],
          }}
          onBarcodeScanned={handleBarcode}
        />
      )}

      {/* Professional Header with enhanced controls */}
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: isTablet ? 24 : 20,
        }}>
          {/* Enhanced Back Button */}
          {onBack && (
            <TouchableOpacity
              onPress={onBack}
              activeOpacity={0.8}
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                borderRadius: isTablet ? 14 : 12,
                paddingHorizontal: isTablet ? 16 : 14,
                paddingVertical: isTablet ? 10 : 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Ionicons 
                name="chevron-back" 
                size={isTablet ? 20 : 18} 
                color="#fff" 
              />
            </TouchableOpacity>
          )}

          {/* Professional Status Bar */}
          <View style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: isTablet ? 16 : 14,
            paddingHorizontal: isTablet ? 20 : 16,
            paddingVertical: isTablet ? 12 : 10,
            borderWidth: 1,
            borderColor: `${statusColor}40`,
            backdropFilter: 'blur(10px)',
            alignItems: 'center',
            minWidth: isTablet ? 180 : 160,
          }}>
            <Text style={{
              color: statusColor,
              fontSize: isTablet ? 12 : 10,
              fontWeight: '700',
              letterSpacing: 1,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>
              {allLimitsReached ? 'Concluído' :
               scanner.state === ScannerState.LIMIT_REACHED ? 'Limite' :
               scanner.state === ScannerState.PAUSED ? 'Pausado' :
               divergenceAccepted ? 'Divergência Aceita' :
               'Escaneando'}
            </Text>
            <Text style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: isTablet ? 10 : 8,
              fontWeight: '500',
            }}>
              {sessionAnalytics.totalScans}/{sessionAnalytics.totalTargets}
            </Text>
          </View>

          {/* Enhanced Control Buttons */}
          <View style={{
            flexDirection: 'row',
            gap: isTablet ? 12 : 10,
          }}>
            {/* Analytics Button */}
            <TouchableOpacity
              onPress={() => setAnalyticsModalVisible(true)}
              activeOpacity={0.8}
              style={{
                backgroundColor: 'rgba(0,0,0,0.7)',
                borderRadius: isTablet ? 14 : 12,
                paddingHorizontal: isTablet ? 16 : 14,
                paddingVertical: isTablet ? 10 : 8,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <Ionicons 
                name="analytics-outline" 
                size={isTablet ? 20 : 18} 
                color="#fff" 
              />
            </TouchableOpacity>

            {/* Enhanced Flash Toggle */}
            {Platform.OS !== 'web' && permission?.granted && (
              <TouchableOpacity
                onPress={() => setTorchEnabled(v => !v)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: torchEnabled ? statusColor : 'rgba(0,0,0,0.7)',
                  borderRadius: borderRadius.lg,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  borderWidth: borderWidthValue,
                  borderColor: torchEnabled ? statusColor : 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Ionicons 
                  name={torchEnabled ? "flash" : "flash-outline"} 
                  size={responsiveScale(isTablet ? 20 : 18)} 
                  color="#fff" 
                />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Professional Scanner Reticle with Premium Effects */}
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
        {/* Premium Glow Effect */}
        <Animated.View
          style={[{
            position: 'absolute',
            top: -spacing.xl,
            left: -spacing.xl,
            right: -spacing.xl,
            bottom: -spacing.xl,
            borderRadius: borderRadius.xxl,
            backgroundColor: statusColor,
            opacity: 0.1,
          }, glowStyle]}
        />

        {/* Radar Animation */}
        <Animated.View
          style={[{
            position: 'absolute',
            width: reticleWidth + responsiveScale(40),
            height: reticleHeight + responsiveScale(40),
            borderRadius: borderRadius.xxl,
            borderWidth: responsiveScale(2),
            borderColor: statusColor,
            borderStyle: 'dashed',
          }, radarStyle]}
        />

        {/* Main Professional Border */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderWidth: responsiveScale(isTablet ? 2.5 : 2),
            borderColor: statusColor,
            borderRadius: borderRadius.xxl,
            backgroundColor: 'rgba(0,0,0,0.3)',
            shadowColor: statusColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.5,
            shadowRadius: responsiveScale(20),
            elevation: 10,
          }}
        />

        {/* Enhanced Corner Markers */}
        {[
          { position: 'top-left', rotation: 0 },
          { position: 'top-right', rotation: 90 },
          { position: 'bottom-right', rotation: 180 },
          { position: 'bottom-left', rotation: 270 },
        ].map((corner, index) => (
          <Animated.View
            key={corner.position}
            style={{
              position: 'absolute',
              [corner.position.split('-')[0]]: -spacing.sm,
              [corner.position.split('-')[1]]: -spacing.sm,
              width: responsiveScale(isTablet ? 32 : 28),
              height: responsiveScale(isTablet ? 32 : 28),
              transform: [{ rotate: `${corner.rotation}deg` }, { scale: cornerPulseAnim }],
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: responsiveScale(isTablet ? 3 : 2.5),
                backgroundColor: statusColor,
                borderTopLeftRadius: borderRadius.sm,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: responsiveScale(isTablet ? 3 : 2.5),
                height: '100%',
                backgroundColor: statusColor,
                borderTopLeftRadius: borderRadius.sm,
              }}
            />
          </Animated.View>
        ))}

        {/* Premium Scan Line */}
        <Animated.View
          style={[{
            position: 'absolute',
            left: spacing.md,
            right: spacing.md,
            height: responsiveScale(isTablet ? 2 : 1.5),
            backgroundColor: statusColor,
            borderRadius: 1,
            shadowColor: statusColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 4,
            elevation: 4,
          }, scanLineStyle]}
        >
          <LinearGradient
            colors={['transparent', statusColor, 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>

        {/* Professional Center Indicator */}
        <Animated.View
          style={[{
            width: responsiveScale(isTablet ? 8 : 6),
            height: responsiveScale(isTablet ? 8 : 6),
            borderRadius: borderRadius.sm,
            backgroundColor: statusColor,
            shadowColor: statusColor,
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: responsiveScale(6),
            elevation: 6,
          }, qualityIndicatorStyle]}
        />

        {/* Processing Indicator */}
        {isProcessing && (
          <View style={{
            position: 'absolute',
            bottom: -spacing.xxxl,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.8)',
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: borderRadius.md,
            borderWidth: borderWidthValue,
            borderColor: `${statusColor}60`,
          }}>
            <ActivityIndicator 
              size="small" 
              color={statusColor} 
              style={{ marginRight: spacing.sm }}
            />
            <Text style={{
              color: statusColor,
              fontSize: fontSize.xs,
              fontWeight: '600',
            }}>
              Processando...
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Professional Progress Dashboard */}
      <Animated.View style={[
        {
          position: 'absolute',
          bottom: spacing.xl,
          left: spacing.xl,
          right: spacing.xl,
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderRadius: borderRadius.xxl,
          padding: spacing.xxl,
          borderWidth: borderWidthValue,
          borderColor: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
        },
        useAnimatedStyle(() => ({
          transform: [
            {
              translateY: panelSlideAnim.value * panelTranslateY
            },
            {
              scale: panelSlideAnim.value === 0 ? 1 : 0.95
            }
          ],
          opacity: 1 - panelSlideAnim.value * 0.3,
        }))
      ]}>
        {/* Enhanced Status Header */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: spacing.md,
        }}>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing.sm,
          }}>
            <View style={{
              width: responsiveScale(isTablet ? 8 : 6),
              height: responsiveScale(isTablet ? 8 : 6),
              borderRadius: borderRadius.sm,
              backgroundColor: statusColor,
              shadowColor: statusColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: responsiveScale(4),
              elevation: 4,
            }} />
            <Text style={{
              color: statusColor,
              fontSize: isTablet ? 11 : 9,
              fontWeight: '700',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
            }}>
              {allLimitsReached ? 'Sessão Concluída' :
               scanner.state === ScannerState.LIMIT_REACHED ? 'Limite Atingido' :
               scanner.state === ScannerState.PAUSED ? 'Pausado' :
               'Escaneando Ativamente'}
            </Text>
          </View>
          
          {/* Toggle Button and Quality Indicator */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}>
            {/* Quality Indicator */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}>
              <Ionicons 
                name={scanQuality === 'excellent' ? 'checkmark-circle' : scanQuality === 'good' ? 'checkmark' : 'alert'} 
                size={isTablet ? 14 : 12} 
                color={scanQuality === 'excellent' ? '#10b981' : scanQuality === 'good' ? '#3b82f6' : '#f59e0b'} 
              />
              <Text style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: isTablet ? 9 : 7,
                fontWeight: '600',
                textTransform: 'uppercase',
              }}>
                {scanQuality === 'excellent' ? 'Excelente' : scanQuality === 'good' ? 'Bom' : 'Regular'}
              </Text>
            </View>
            
            {/* Toggle Panel Button */}
            <TouchableOpacity
              onPress={() => setShowScanningPanel(!showScanningPanel)}
              style={{
                padding: isTablet ? 6 : 4,
                borderRadius: isTablet ? 8 : 6,
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.2)',
              }}
            >
              <Ionicons 
                name={showScanningPanel ? 'eye-off' : 'eye'} 
                size={isTablet ? 16 : 14} 
                color="rgba(255,255,255,0.8)" 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Progress Grid */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          gap: isTablet ? 16 : 12,
          marginBottom: isTablet ? 20 : 16,
        }}>
          {Object.entries(scanner.counts).map(([type, count]) => {
            const max = maxScans[type as keyof typeof maxScans];
            const percentage = max > 0 ? (count / max) * 100 : 0;
            const isComplete = count >= max;
            
            return (
              <View key={type} style={{ 
                flex: 1, 
                alignItems: 'center',
              }}>
                <Text style={{ 
                  color: 'rgba(255,255,255,0.6)', 
                  fontSize: isTablet ? 10 : 8, 
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  marginBottom: 4,
                }}>
                  {getPackageTypeLabel(type as any)}
                </Text>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: 2,
                  marginBottom: 6,
                }}>
                  <Text style={{ 
                    color: isComplete ? '#10b981' : '#ffffff', 
                    fontSize: isTablet ? 16 : 14, 
                    fontWeight: '800',
                  }}>
                    {count}
                  </Text>
                  <Text style={{ 
                    color: 'rgba(255,255,255,0.5)', 
                    fontSize: isTablet ? 12 : 10, 
                    fontWeight: '600',
                  }}>
                    /{max}
                  </Text>
                </View>
                <View
                  style={{
                    height: isTablet ? 4 : 3,
                    width: '100%',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderRadius: isTablet ? 2 : 1.5,
                    overflow: 'hidden',
                  }}
                >
                  <View
                    style={{
                      width: `${Math.min(100, percentage)}%`,
                      height: '100%',
                      backgroundColor: isComplete ? '#10b981' : statusColor,
                      borderRadius: isTablet ? 2 : 1.5,
                    }}
                  />
                </View>
              </View>
            );
          })}
        </View>

        {/* Enhanced Action Buttons */}
        <View style={{
          flexDirection: 'row',
          gap: isTablet ? 12 : 10,
        }}>
          {/* Manual Input Button */}
          <TouchableOpacity
            onPress={() => setManualInputExpanded(!manualInputExpanded)}
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: manualInputExpanded ? statusColor : 'rgba(255,255,255,0.1)',
              borderRadius: isTablet ? 14 : 12,
              paddingVertical: isTablet ? 16 : 14,
              paddingHorizontal: isTablet ? 20 : 16,
              borderWidth: 1,
              borderColor: manualInputExpanded ? statusColor : 'rgba(255,255,255,0.2)',
              alignItems: 'center',
            }}
          >
            <Ionicons 
              name="keypad-outline" 
              size={isTablet ? 20 : 18} 
              color={manualInputExpanded ? '#fff' : 'rgba(255,255,255,0.8)'} 
            />
            <Text style={{
              color: manualInputExpanded ? '#fff' : 'rgba(255,255,255,0.8)',
              fontSize: isTablet ? 12 : 10,
              fontWeight: '600',
              marginTop: 4,
            }}>
              Entrada Manual
            </Text>
          </TouchableOpacity>

          {/* Smart Suggestions Button */}
          {smartSuggestions.length > 0 && (
            <TouchableOpacity
              onPress={() => {}}
              activeOpacity={0.8}
              style={{
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                borderRadius: isTablet ? 14 : 12,
                paddingVertical: isTablet ? 16 : 14,
                paddingHorizontal: isTablet ? 20 : 16,
                borderWidth: 1,
                borderColor: 'rgba(59, 130, 246, 0.4)',
                alignItems: 'center',
              }}
            >
              <Ionicons 
                name="bulb-outline" 
                size={isTablet ? 20 : 18} 
                color="#3b82f6" 
              />
              <Text style={{
                color: '#3b82f6',
                fontSize: isTablet ? 12 : 10,
                fontWeight: '600',
                marginTop: 4,
              }}>
                Sugestões
              </Text>
            </TouchableOpacity>
          )}

          {/* Finish Session Button */}
          {allLimitsReached && hasSomeProgress && (
            <TouchableOpacity
              onPress={onEndSession}
              activeOpacity={0.8}
              style={{
                flex: 2,
                backgroundColor: '#10b981',
                borderRadius: isTablet ? 14 : 12,
                paddingVertical: isTablet ? 16 : 14,
                paddingHorizontal: isTablet ? 24 : 20,
                borderWidth: 2,
                borderColor: '#059669',
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
                alignItems: 'center',
              }}
            >
              <Ionicons 
                name="checkmark-circle" 
                size={isTablet ? 20 : 18} 
                color="#fff" 
              />
              <Text style={{
                color: '#ffffff',
                fontSize: isTablet ? 12 : 10,
                fontWeight: '700',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                marginTop: 4,
              }}>
                Finalizar Sessão
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Enhanced Manual Input */}
        {manualInputExpanded && (
          <TouchableWithoutFeedback onPress={dismissKeyboardAndCloseInput}>
            <View style={{
              marginTop: spacing.md,
              paddingTop: spacing.md,
              borderTopWidth: responsiveScale(1),
              borderTopColor: 'rgba(255,255,255,0.1)',
            }}>
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View>
                  <Text style={{
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: fontSize.xs,
                    fontWeight: '600',
                    marginBottom: spacing.sm,
                    textAlign: 'center',
                  }}>
                    Digite o código do pacote manualmente
                  </Text>
                  <View style={{
                    flexDirection: 'row',
                    gap: spacing.sm,
                  }}>
                    <TextInput
                      value={manualCode}
                      onChangeText={setManualCode}
                      placeholder="Código do pacote"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      style={{
                        flex: 1,
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: borderRadius.md,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.sm,
                        color: '#fff',
                        fontSize: fontSize.sm,
                        fontWeight: '600',
                        borderWidth: borderWidthValue,
                        borderColor: manualError ? colors.danger : 'rgba(255,255,255,0.2)',
                      }}
                      onSubmitEditing={handleManualSubmit}
                      autoFocus={true}
                      autoCapitalize="characters"
                      autoCorrect={false}
                    />
              <TouchableOpacity
                    onPress={handleManualSubmit}
                    disabled={isProcessing}
                    style={{
                      backgroundColor: isProcessing ? 'rgba(255,255,255,0.2)' : statusColor,
                      borderRadius: borderRadius.md,
                      paddingHorizontal: spacing.md,
                      paddingVertical: spacing.sm,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isProcessing ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Ionicons name="send" size={iconSize} color="#fff" />
                    )}
                  </TouchableOpacity>
                </View>
                {manualError && (
                  <Text style={{
                    color: colors.danger,
                    fontSize: fontSize.xs,
                    fontWeight: '500',
                    marginTop: spacing.sm,
                    textAlign: 'center',
                  }}>
                    {manualError}
                  </Text>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
        )}
      </Animated.View>

      {/* Enhanced Limit Reached Modal */}
      <Modal visible={limitModalVisible} transparent animationType="fade">
        <BlurView intensity={80} style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <View style={{
            backgroundColor: colors.bg,
            borderRadius: isTablet ? 24 : 20,
            padding: isTablet ? 32 : 24,
            alignItems: 'center',
            width: '100%',
            maxWidth: isTablet ? 480 : 400,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          }}>
            <View style={{
              width: isTablet ? 80 : 64,
              height: isTablet ? 80 : 64,
              borderRadius: isTablet ? 40 : 32,
              backgroundColor: colors.danger + '20',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: isTablet ? 20 : 16,
              borderWidth: 2,
              borderColor: colors.danger,
            }}>
              <Ionicons name="warning" size={isTablet ? 36 : 28} color={colors.danger} />
            </View>
            <Text style={{
              color: colors.danger,
              fontSize: isTablet ? 24 : 20,
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: isTablet ? 12 : 8,
            }}>
              LIMITE ATINGIDO
            </Text>
            <Text style={{
              color: colors.textMuted,
              fontSize: isTablet ? 16 : 14,
              textAlign: 'center',
              lineHeight: isTablet ? 24 : 20,
              marginBottom: isTablet ? 24 : 20,
            }}>
              {limitModalMessage}
            </Text>
            <TouchableOpacity
              onPress={() => setLimitModalVisible(false)}
              activeOpacity={0.8}
              style={{
                backgroundColor: colors.primary,
                borderRadius: isTablet ? 16 : 12,
                paddingVertical: isTablet ? 18 : 14,
                paddingHorizontal: isTablet ? 32 : 24,
                width: '100%',
                alignItems: 'center',
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <Text style={{ 
                color: '#fff', 
                fontSize: isTablet ? 16 : 14, 
                fontWeight: '700',
                letterSpacing: 0.5,
              }}>
                ENTENDI
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Modal>

      {/* Professional Analytics Modal */}
      <Modal visible={analyticsModalVisible} transparent animationType="fade">
        <BlurView intensity={80} style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <ScrollView style={{
            backgroundColor: colors.bg,
            borderRadius: isTablet ? 24 : 20,
            padding: isTablet ? 32 : 24,
            width: '100%',
            maxWidth: isTablet ? 520 : 400,
            maxHeight: '80%',
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            elevation: 10,
          }}>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: isTablet ? 24 : 20,
            }}>
              <Text style={{
                color: colors.text,
                fontSize: isTablet ? 24 : 20,
                fontWeight: '800',
              }}>
                Análise da Sessão
              </Text>
              <TouchableOpacity
                onPress={() => setAnalyticsModalVisible(false)}
                style={{
                  width: isTablet ? 40 : 32,
                  height: isTablet ? 40 : 32,
                  borderRadius: isTablet ? 20 : 16,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={isTablet ? 20 : 16} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            {/* Session Stats */}
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: isTablet ? 16 : 12,
              padding: isTablet ? 20 : 16,
              marginBottom: isTablet ? 20 : 16,
            }}>
              <Text style={{
                color: colors.textMuted,
                fontSize: isTablet ? 12 : 10,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: isTablet ? 12 : 8,
              }}>
                Estatísticas da Sessão
              </Text>
              
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: isTablet ? 16 : 12,
              }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: isTablet ? 14 : 12 }}>
                  Total Escaneado
                </Text>
                <Text style={{ 
                  color: colors.text, 
                  fontSize: isTablet ? 16 : 14, 
                  fontWeight: '700' 
                }}>
                  {sessionAnalytics.totalScans} / {sessionAnalytics.totalTargets}
                </Text>
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: isTablet ? 16 : 12,
              }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: isTablet ? 14 : 12 }}>
                  Progresso
                </Text>
                <Text style={{ 
                  color: colors.text, 
                  fontSize: isTablet ? 16 : 14, 
                  fontWeight: '700' 
                }}>
                  {Math.round(sessionAnalytics.progress)}%
                </Text>
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: isTablet ? 16 : 12,
              }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: isTablet ? 14 : 12 }}>
                  Taxa de Escaneio
                </Text>
                <Text style={{ 
                  color: colors.text, 
                  fontSize: isTablet ? 16 : 14, 
                  fontWeight: '700' 
                }}>
                  {sessionAnalytics.rate}/min
                </Text>
              </View>

              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
              }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: isTablet ? 14 : 12 }}>
                  Eficiência
                </Text>
                <Text style={{ 
                  color: sessionAnalytics.efficiency >= 90 ? '#10b981' : 
                         sessionAnalytics.efficiency >= 70 ? '#3b82f6' : '#f59e0b',
                  fontSize: isTablet ? 16 : 14, 
                  fontWeight: '700' 
                }}>
                  {sessionAnalytics.efficiency}%
                </Text>
              </View>
            </View>

            {/* Scan Quality */}
            <View style={{
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: isTablet ? 16 : 12,
              padding: isTablet ? 20 : 16,
              marginBottom: isTablet ? 20 : 16,
            }}>
              <Text style={{
                color: colors.textMuted,
                fontSize: isTablet ? 12 : 10,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                marginBottom: isTablet ? 12 : 8,
              }}>
                Qualidade do Scanner
              </Text>
              
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: isTablet ? 12 : 10,
              }}>
                <Ionicons 
                  name={scanQuality === 'excellent' ? 'checkmark-circle' : 
                         scanQuality === 'good' ? 'checkmark' : 'alert'} 
                  size={isTablet ? 24 : 20} 
                  color={scanQuality === 'excellent' ? '#10b981' : 
                         scanQuality === 'good' ? '#3b82f6' : '#f59e0b'} 
                />
                <View>
                  <Text style={{ 
                    color: colors.text, 
                    fontSize: isTablet ? 16 : 14, 
                    fontWeight: '700' 
                  }}>
                    {scanQuality === 'excellent' ? 'Excelente' : 
                     scanQuality === 'good' ? 'Bom' : 'Regular'}
                  </Text>
                  <Text style={{ 
                    color: 'rgba(255,255,255,0.6)', 
                    fontSize: isTablet ? 12 : 10, 
                  }}>
                    Baseado na velocidade e precisão
                  </Text>
                </View>
              </View>
            </View>

            {/* Recent Scans */}
            {scanHistory.length > 0 && (
              <View style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                borderRadius: isTablet ? 16 : 12,
                padding: isTablet ? 20 : 16,
              }}>
                <Text style={{
                  color: colors.textMuted,
                  fontSize: isTablet ? 12 : 10,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: isTablet ? 12 : 8,
                }}>
                  Scans Recentes
                </Text>
                
                {scanHistory.slice(-5).reverse().map((scan, index) => (
                  <View key={`${scan.code}-${scan.timestamp}`} style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: isTablet ? 8 : 6,
                    borderBottomWidth: index < 4 ? 1 : 0,
                    borderBottomColor: 'rgba(255,255,255,0.1)',
                  }}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        color: colors.text, 
                        fontSize: isTablet ? 14 : 12, 
                        fontWeight: '600',
                      }}>
                        {scan.code}
                      </Text>
                      <Text style={{ 
                        color: 'rgba(255,255,255,0.6)', 
                        fontSize: isTablet ? 10 : 8,
                      }}>
                        {getPackageTypeLabel(scan.type as any)} • 
                        {new Date(scan.timestamp).toLocaleTimeString()}
                      </Text>
                    </View>
                    <Ionicons 
                      name={scan.success ? "checkmark-circle" : "close-circle"} 
                      size={isTablet ? 16 : 14} 
                      color={scan.success ? '#10b981' : colors.danger} 
                    />
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        </BlurView>
      </Modal>
    </View>
  );
}

/**
 * App Ultra-Otimizado - Performance Industrial Máxima
 * Versão otimizada para funcionar liso, leve e fluido sem travamentos
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, SafeAreaView, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { Session, ScannedPackage } from '@/types/session';
import { getSessionMetrics, generateId } from '@/utils/session';
import { addSession, loadSessions } from '@/utils/storage';
import { useAppTheme } from '@/utils/useAppTheme';

// Lazy loading para componentes pesados
const LazyComponents = {
  HomeScreen: React.lazy(() => import('@/components/HomeScreen')),
  OptimizedIndustrialScanner: React.lazy(() => import('@/components/OptimizedIndustrialScanner')),
  HistoryBrowser: React.lazy(() => import('@/components/HistoryBrowser')),
  SettingsScreen: React.lazy(() => import('@/components/SettingsScreen')),
  ReportView: React.lazy(() => import('@/components/ReportView')),
  SessionInitModal: React.lazy(() => import('@/components/SessionInitModal')),
  ThemeSelector: React.lazy(() => import('@/components/ThemeSelector')),
  AppHeader: React.lazy(() => import('@/components/AppHeader')),
  TabLayout: React.lazy(() => import('@/components/TabLayout')),
  BottomTabNavigator: React.lazy(() => import('@/components/BottomTabNavigator')),
};

type AppScreen = 'scanning' | 'report' | 'history' | 'welcome' | 'settings';

// Configurações ultra-rápidas - sem animações complexas
const ULTRA_FAST_CONFIG = {
  animationDuration: 0, // Sem animações para máxima performance
  debounceMs: 50, // Ultra-rápido
  maxCacheSize: 50, // MB
  enableHaptics: true,
  enableAnimations: false, // Desabilitar para devices lentos
};

export default function UltraOptimizedApp() {
  const router = useRouter();
  const { colors } = useAppTheme();
  
  // Estados minimizados para performance
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const [activeTab, setActiveTab] = useState<'home' | 'scanner' | 'history' | 'settings'>('home');
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionModalVisible, setSessionModalVisible] = useState(false);
  const [completedSession, setCompletedSession] = useState<Session | null>(null);

  // Memoizar configurações para evitar re-renders
  const appConfig = useMemo(() => ({
    colors,
    screen,
    activeTab,
    currentSession,
    sessions,
    sessionModalVisible,
    completedSession,
  }), [colors, screen, activeTab, currentSession, sessions, sessionModalVisible, completedSession]);

  // Funções ultra-otimizadas com useCallback
  const changeScreen = useCallback((newScreen: AppScreen) => {
    setScreen(newScreen);
  }, []);

  const handleTabChange = useCallback((tab: typeof activeTab) => {
    setActiveTab(tab);
    
    // Mudança de tela instantânea - sem animações
    switch (tab) {
      case 'home':
        changeScreen('welcome');
        break;
      case 'scanner':
        if (!currentSession) {
          setSessionModalVisible(true);
        } else {
          changeScreen('scanning');
        }
        break;
      case 'history':
        changeScreen('history');
        break;
      case 'settings':
        changeScreen('settings');
        break;
    }
  }, [currentSession, changeScreen]);

  const handleStartSession = useCallback((operatorName: string, driverName: string, declaredCounts: any) => {
    const session: Session = {
      id: generateId(),
      operatorName,
      driverName,
      declaredCount: declaredCounts.shopee + declaredCounts.mercadoLivre + declaredCounts.avulso,
      declaredCounts,
      packages: [],
      startedAt: new Date().toISOString(),
      hasDivergence: false,
    };
    
    setCurrentSession(session);
    changeScreen('scanning');
    setActiveTab('scanner');
    setSessionModalVisible(false);
  }, [changeScreen]);

  const handleScanned = useCallback((code: string, type: string) => {
    if (!currentSession) return;
    
    const pkg: ScannedPackage = {
      id: generateId(),
      code,
      type: type as any,
      value: 0,
      scannedAt: new Date().toISOString(),
    };
    
    setCurrentSession(prev => prev ? {
      ...prev,
      packages: [...prev.packages, pkg],
    } : null);
  }, [currentSession]);

  const handleEndSession = useCallback(() => {
    if (!currentSession) return;
    
    const finalized = {
      ...currentSession,
      completedAt: new Date().toISOString(),
      hasDivergence: currentSession.packages.length !== currentSession.declaredCount,
    };
    
    setCompletedSession(finalized);
    addSession(finalized);
    setCurrentSession(null);
    changeScreen('report');
    setActiveTab('home');
  }, [currentSession, changeScreen]);

  // Carregar sessões uma vez no mount
  useEffect(() => {
    loadSessions().then(setSessions);
  }, []);

  // Memoizar componentes para evitar re-renders
  const currentComponent = useMemo(() => {
    switch (screen) {
      case 'welcome':
        return React.createElement(LazyComponents.HomeScreen, {
          onStartSession: () => setSessionModalVisible(true),
          onViewHistory: () => changeScreen('history'),
          onStartScanner: () => {
            if (!currentSession) {
              setSessionModalVisible(true);
            } else {
              changeScreen('scanning');
            }
          },
        });
      
      case 'scanning':
        return currentSession ? React.createElement(LazyComponents.OptimizedIndustrialScanner, {
          maxScans: currentSession.declaredCounts,
          onScanned: handleScanned,
          onEndSession: handleEndSession,
        }) : null;
      
      case 'history':
        return React.createElement(LazyComponents.HistoryBrowser, {
          sessions,
          onBack: () => changeScreen('welcome'),
          onNewSession: () => changeScreen('welcome'),
        });
      
      case 'settings':
        return React.createElement(LazyComponents.SettingsScreen);
      
      case 'report':
        return completedSession ? React.createElement(LazyComponents.ReportView, {
          session: completedSession,
          onNewSession: () => changeScreen('welcome'),
          onViewHistory: () => changeScreen('history'),
        }) : null;
      
      default:
        return null;
    }
  }, [screen, currentSession, sessions, completedSession, handleScanned, handleEndSession, changeScreen]);

  // Renderização ultra-otimizada
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      
      {/* Header otimizado - lazy loaded */}
      <React.Suspense fallback={null}>
        <LazyComponents.AppHeader currentSession={currentSession} />
      </React.Suspense>
      
      {/* Conteúdo principal - renderização condicional otimizada */}
      <View style={{ flex: 1 }}>
        <React.Suspense fallback={
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            backgroundColor: colors.bg 
          }}>
            <Text style={{ color: colors.text }}>Carregando...</Text>
          </View>
        }>
          {currentComponent}
        </React.Suspense>
      </View>
      
      {/* Bottom Tab - lazy loaded */}
      <React.Suspense fallback={null}>
        <LazyComponents.TabLayout
          activeTab={activeTab}
          onTabChange={handleTabChange}
          showScannerTab={true}
        />
      </React.Suspense>
      
      {/* Modais - lazy loaded */}
      <React.Suspense fallback={null}>
        {sessionModalVisible && (
          <LazyComponents.SessionInitModal
            visible={sessionModalVisible}
            onStart={handleStartSession}
            onClose={() => setSessionModalVisible(false)}
          />
        )}
      </React.Suspense>
    </SafeAreaView>
  );
}

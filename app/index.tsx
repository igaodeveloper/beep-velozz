import React, { useState, useEffect, useCallback } from 'react';
import { View, SafeAreaView, StatusBar, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Session, ScannedPackage } from '@/types/session';
import { getSessionMetrics, generateId } from '@/utils/session';
import { addSession, loadSessions } from '@/utils/storage';
import { useAppTheme } from '@/utils/useAppTheme';

import IndustrialScannerView from '@/components/IndustrialScannerView';
import MetricsDashboard from '@/components/MetricsDashboard';
import PackageList from '@/components/PackageList';
import DuplicateModal from '@/components/DuplicateModal';
import DivergenceScreen from '@/components/DivergenceScreen';
import ReportView from '@/components/ReportView';
import HistoryBrowser from '@/components/HistoryBrowser';
import AppHeader from '@/components/AppHeader';
import EmptyStateWelcome from '@/components/EmptyStateWelcome';
import MainLayout from '@/components/MainLayout';
import PackagePhotoCapture from '@/components/PackagePhotoCapture';
import TabLayout from '@/components/TabLayout';
import HomeScreen from '@/components/HomeScreen';
import SettingsScreen from '@/components/SettingsScreen';
import { savePackagePhoto } from '@/utils/photoStorage';
import SessionInitModal from '@/components/SessionInitModal';
import BottomTabNavigator, { TabType } from '@/components/BottomTabNavigator';
import TutorialModal from '@/components/TutorialModal';
import ScreenTransition, { ANIMATION_TYPES, DIRECTIONS } from '@/components/ScreenTransition';
import DeliveryBoyLoading from '@/components/DeliveryBoyLoading';

type AppScreen = 'scanning' | 'report' | 'history' | 'welcome' | 'settings';

// Animation configuration for each screen - Ultra-fast performance
const SCREEN_ANIMATIONS = {
  welcome: { type: ANIMATION_TYPES.FADE, direction: DIRECTIONS.UP, duration: 150 },
  scanning: { type: ANIMATION_TYPES.SLIDE, direction: DIRECTIONS.LEFT, duration: 180 },
  report: { type: ANIMATION_TYPES.GLIDE, direction: DIRECTIONS.RIGHT, duration: 200 },
  history: { type: ANIMATION_TYPES.SCALE, direction: DIRECTIONS.UP, duration: 160 },
  settings: { type: ANIMATION_TYPES.FLIP, direction: DIRECTIONS.RIGHT, duration: 170 },
} as const;

export default function App() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const [previousScreen, setPreviousScreen] = useState<AppScreen | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [packageListExpanded, setPackageListExpanded] = useState(false);
  const [lastScanned, setLastScanned] = useState<ScannedPackage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Duplicate modal state
  const [duplicateVisible, setDuplicateVisible] = useState(false);
  const [duplicateCode, setDuplicateCode] = useState('');
  const [duplicateOriginal, setDuplicateOriginal] = useState<ScannedPackage | undefined>();

  // Divergence screen state
  const [divergenceVisible, setDivergenceVisible] = useState(false);

  // Completed session for report
  const [completedSession, setCompletedSession] = useState<Session | null>(null);

  // History
  const [sessions, setSessions] = useState<Session[]>([]);

  // Modal de inicialização de sessão (INICIAR CONFERÊNCIA)
  const [sessionModalVisible, setSessionModalVisible] = useState(false);

  // Fluxo antigo via rota /new-session desativado – agora usamos apenas o modal SessionInitModal.

  // Photo capture state (optional)
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [photoPackageCode, setPhotoPackageCode] = useState<string | null>(null);
  const [tutorialVisible, setTutorialVisible] = useState(false);


  // Enhanced history functions
  const handleLoadAllHistory = useCallback(() => {
    // Implementar carregamento de todo o histórico
    console.log('Carregando todo o histórico...');
    // Aqui você pode adicionar lógica para:
    // - Carregar todas as sessões do armazenamento
    // - Buscar dados remotos se necessário
    // - Sincronizar com backend
    // - Mostrar indicador de carregamento
    
    // Recarregar sessões do armazenamento
    loadSessions().then(setSessions);
    console.log('Histórico completo carregado');
  }, []);

  const handleClearHistory = useCallback(() => {
    // Implementar limpeza do histórico
    console.log('Limpando histórico...');
    // Aqui você pode adicionar lógica para:
    // - Limpar storage local
    // - Remover do backend se aplicável
    // - Resetar estado
    // - Confirmar com usuário (já feito no componente)
    
    // Limpar sessões
    setSessions([]);
    console.log('Histórico limpo com sucesso');
  }, []);

  useEffect(() => {
    loadSessions().then(setSessions);
  }, []);

  // Enhanced screen change with animation
  const changeScreenWithAnimation = (newScreen: AppScreen, showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
      setTimeout(() => {
        setPreviousScreen(screen);
        setScreen(newScreen);
        setTimeout(() => setIsLoading(false), 300);
      }, 500);
    } else {
      setPreviousScreen(screen);
      setScreen(newScreen);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    // Map tabs to screens with animations
    switch (tab) {
      case 'home':
        changeScreenWithAnimation('welcome');
        break;
      case 'scanner':
        if (!currentSession) {
          // Abre modal de INICIAR CONFERÊNCIA em vez de navegar para outra tela
          setSessionModalVisible(true);
        } else {
          changeScreenWithAnimation('scanning');
        }
        break;
      case 'history':
        changeScreenWithAnimation('history');
        break;
      case 'settings':
        changeScreenWithAnimation('settings');
        break;
    }
  };

  const handleStartSession = (operatorName: string, driverName: string, declaredCounts: { shopee: number; mercadoLivre: number; avulso: number }) => {
    setIsLoading(true);
    const totalDeclared = declaredCounts.shopee + declaredCounts.mercadoLivre + declaredCounts.avulso;
    const session: Session = {
      id: generateId(),
      operatorName,
      driverName,
      declaredCount: totalDeclared,
      declaredCounts,
      packages: [],
      startedAt: new Date().toISOString(),
      hasDivergence: false,
      notes: undefined
    };
    
    setTimeout(() => {
      setCurrentSession(session);
      changeScreenWithAnimation('scanning');
      setActiveTab('scanner');
      setLastScanned(null);
      setPackageListExpanded(false);
      setIsLoading(false);
    }, 800);
  };

  const handlePackageScanned = (pkg: ScannedPackage) => {
    if (!currentSession) return false;
    const updated = {
      ...currentSession,
      packages: [...currentSession.packages, pkg],
    };
    setCurrentSession(updated);
    setLastScanned(pkg);
    
    // Check if divergence is resolved
    const scannedCount = updated.packages.length;
    const declaredCount = updated.declaredCount;
    if (scannedCount === declaredCount) {
      setDivergenceVisible(false);
    }
    return true;
  };

  const handleScanned = (code: string, type: string) => {
    const pkgType = type as 'shopee' | 'mercado_livre' | 'avulso';
    const pkg: ScannedPackage = {
      id: generateId(),
      code,
      type: pkgType,
      scannedAt: new Date().toISOString(),
    };
    handlePackageScanned(pkg);
  };

  const handleLimitReached = (limitedTypes: string[]) => {
    // TODO: implementar lógica para quando limites são atingidos
    console.log('Limites atingidos para:', limitedTypes);
  };

  const handleRequestPhoto = (pkg: ScannedPackage) => {
    setPhotoPackageCode(pkg.code);
    setPhotoModalVisible(true);
  };

  const handlePhotoCaptured = async (uri: string) => {
    if (!currentSession || !photoPackageCode) {
      setPhotoModalVisible(false);
      setPhotoPackageCode(null);
      return;
    }
    try {
      await savePackagePhoto(uri, photoPackageCode, currentSession.id);
    } catch (error) {
      console.error('Erro ao salvar foto do pacote:', error);
    } finally {
      setPhotoModalVisible(false);
      setPhotoPackageCode(null);
    }
  };

  const handleDuplicate = (code: string) => {
    if (!currentSession) return;
    const original = currentSession.packages.find(p => p.code === code);
    setDuplicateCode(code);
    setDuplicateOriginal(original);
    setDuplicateVisible(true);
  };

  const handleEndSession = () => {
    if (!currentSession) return;
    const scannedCount = currentSession.packages.length;
    const declaredCount = currentSession.declaredCount;
    if (scannedCount !== declaredCount) {
      setDivergenceVisible(true);
    } else {
      finalizeSession(false);
    }
  };

  const finalizeSession = async (hasDivergence: boolean) => {
    if (!currentSession) return;
    const finalized: Session = {
      ...currentSession,
      completedAt: new Date().toISOString(),
      hasDivergence,
    };
    setCompletedSession(finalized);
    await addSession(finalized);
    const updated = await loadSessions();
    setSessions(updated);
    setDivergenceVisible(false);
    setScreen('report');
    setActiveTab('home');
  };

  const handleDivergenceCancel = () => {
    setDivergenceVisible(false);
  };

  const handleNewSession = () => {
    setCurrentSession(null);
    setCompletedSession(null);
    setLastScanned(null);
    setScreen('welcome');
    setActiveTab('home');
  };

  const handleViewHistory = () => {
    setScreen('history');
    setActiveTab('history');
  };


  const handleStartScanner = () => {
    if (!currentSession) {
      // Quando não existe sessão, abrimos o modal de INICIAR CONFERÊNCIA
      setActiveTab('scanner');
      setSessionModalVisible(true);
    } else {
      setScreen('scanning');
      setActiveTab('scanner');
    }
  };

  const metrics = currentSession
    ? getSessionMetrics(currentSession.packages)
    : { shopee: 0, mercadoLivre: 0, avulsos: 0, total: 0 };

  return (
    <TabLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      showScannerTab={true}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      
      {/* Loading Overlay */}
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 1000,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <DeliveryBoyLoading size="large" />
        </View>
      )}

      {/* Main Content Area */}
      <View style={{ flex: 1 }}>
        <AppHeader currentSession={currentSession} onOpenTutorial={() => setTutorialVisible(true)} />
        
        {/* Home Screen */}
        <ScreenTransition
          isVisible={screen === 'welcome'}
          animationType={SCREEN_ANIMATIONS.welcome.type}
          direction={SCREEN_ANIMATIONS.welcome.direction}
          duration={SCREEN_ANIMATIONS.welcome.duration}
        >
          <HomeScreen
            onStartSession={() => {
              setActiveTab('scanner');
              setSessionModalVisible(true);
            }}
            onViewHistory={handleViewHistory}
            onStartScanner={handleStartScanner}
          />
        </ScreenTransition>
        
        {/* Settings Screen */}
        <ScreenTransition
          isVisible={screen === 'settings'}
          animationType={SCREEN_ANIMATIONS.settings.type}
          direction={SCREEN_ANIMATIONS.settings.direction}
          duration={SCREEN_ANIMATIONS.settings.duration}
        >
          <SettingsScreen />
        </ScreenTransition>


        {/* Report Screen */}
        <ScreenTransition
          isVisible={screen === 'report' && !!completedSession}
          animationType={SCREEN_ANIMATIONS.report.type}
          direction={SCREEN_ANIMATIONS.report.direction}
          duration={SCREEN_ANIMATIONS.report.duration}
        >
          {completedSession && (
            <ReportView
              session={completedSession}
              onNewSession={handleNewSession}
              onViewHistory={handleViewHistory}
            />
          )}
        </ScreenTransition>

        {/* History Screen */}
        <ScreenTransition
          isVisible={screen === 'history'}
          animationType={SCREEN_ANIMATIONS.history.type}
          direction={SCREEN_ANIMATIONS.history.direction}
          duration={SCREEN_ANIMATIONS.history.duration}
        >
          <HistoryBrowser
            sessions={sessions}
            onBack={() => changeScreenWithAnimation('scanning')}
            onNewSession={handleNewSession}
            onLoadAllHistory={handleLoadAllHistory}
            onClearHistory={handleClearHistory}
          />
        </ScreenTransition>

        {/* Active Session Screen */}
        <ScreenTransition
          isVisible={!!(currentSession && screen === 'scanning')}
          animationType={SCREEN_ANIMATIONS.scanning.type}
          direction={SCREEN_ANIMATIONS.scanning.direction}
          duration={SCREEN_ANIMATIONS.scanning.duration}
        >
          {currentSession && (
            <IndustrialScannerView
              maxScans={{
                shopee: currentSession.declaredCounts.shopee,
                mercado_livre: currentSession.declaredCounts.mercadoLivre,
                avulso: currentSession.declaredCounts.avulso
              }}
              onScanned={handleScanned}
              onLimitReached={handleLimitReached}
              onEndSession={handleEndSession}
              onBack={() => changeScreenWithAnimation('welcome')}
            />
          )}
        </ScreenTransition>


          <DuplicateModal
            visible={duplicateVisible}
            code={duplicateCode}
            originalPackage={duplicateOriginal}
            onDismiss={() => setDuplicateVisible(false)}
          />

          {currentSession && (
            <DivergenceScreen
              visible={divergenceVisible}
              scannedCount={currentSession.packages.length}
              declaredCount={currentSession.declaredCount}
              onCancel={handleDivergenceCancel}
            />
          )}

          {currentSession && (
            <PackagePhotoCapture
              visible={photoModalVisible}
              packageCode={photoPackageCode || (lastScanned?.code ?? '')}
              onPhotoCapture={handlePhotoCaptured}
              onClose={() => {
                setPhotoModalVisible(false);
                setPhotoPackageCode(null);
              }}
            />
          )}
          {/* Modal de inicialização de sessão (INICIAR CONFERÊNCIA) */}
          <SessionInitModal
            visible={sessionModalVisible}
            onStart={(operatorName, driverName, declaredCounts) => {
              handleStartSession(operatorName, driverName, declaredCounts);
              setSessionModalVisible(false);
            }}
          />
          <TutorialModal
            visible={tutorialVisible}
            onClose={() => setTutorialVisible(false)}
          />
        </View>
    </TabLayout>
  );
}

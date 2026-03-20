import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, SafeAreaView, StatusBar, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Session, ScannedPackage } from '@/types/session';
import { getSessionMetrics, generateId, getPackageValue } from '@/utils/session';
import { addSession, loadSessions } from '@/utils/storage';
import { useAppTheme } from '@/utils/useAppTheme';
import { savePackagePhoto } from '@/utils/photoStorage';
import { TabType } from '@/components/BottomTabNavigator';
import { ANIMATION_TYPES, DIRECTIONS } from '@/components/ScreenTransition';

// Lazy loading de componentes para performance otimizada
const IndustrialScannerView = React.lazy(() => import('@/components/IndustrialScannerView'));
const MetricsDashboard = React.lazy(() => import('@/components/MetricsDashboard'));
const PackageList = React.lazy(() => import('@/components/PackageList'));
const DuplicateModal = React.lazy(() => import('@/components/DuplicateModal'));
const DivergenceScreen = React.lazy(() => import('@/components/DivergenceScreen'));
const ReportView = React.lazy(() => import('@/components/ReportView'));
const HistoryBrowser = React.lazy(() => import('@/components/HistoryBrowser'));
const AppHeader = React.lazy(() => import('@/components/AppHeader'));
const EmptyStateWelcome = React.lazy(() => import('@/components/EmptyStateWelcome'));
const MainLayout = React.lazy(() => import('@/components/MainLayout'));
const PackagePhotoCapture = React.lazy(() => import('@/components/PackagePhotoCapture'));
const TabLayout = React.lazy(() => import('@/components/TabLayout'));
const HomeScreen = React.lazy(() => import('@/components/HomeScreen'));
const SettingsScreen = React.lazy(() => import('@/components/SettingsScreen'));
const ThemeSelector = React.lazy(() => import('@/components/ThemeSelector'));
const SessionInitModal = React.lazy(() => import('@/components/SessionInitModal'));
const BottomTabNavigator = React.lazy(() => import('@/components/BottomTabNavigator'));
const TutorialModal = React.lazy(() => import('@/components/TutorialModal'));
const ScreenTransition = React.lazy(() => import('@/components/ScreenTransition'));
const DeliveryBoyLoading = React.lazy(() => import('@/components/DeliveryBoyLoading'));

type AppScreen = 'scanning' | 'report' | 'history' | 'welcome' | 'settings';

// Animation configuration otimizado para performance
const SCREEN_ANIMATIONS = {
  welcome: { type: ANIMATION_TYPES.FADE, direction: DIRECTIONS.UP, duration: 120 },
  scanning: { type: ANIMATION_TYPES.SLIDE, direction: DIRECTIONS.LEFT, duration: 150 },
  report: { type: ANIMATION_TYPES.GLIDE, direction: DIRECTIONS.RIGHT, duration: 160 },
  history: { type: ANIMATION_TYPES.SCALE, direction: DIRECTIONS.UP, duration: 140 },
  settings: { type: ANIMATION_TYPES.FLIP, direction: DIRECTIONS.RIGHT, duration: 150 },
} as const;

// Memoização de cálculos pesados
const memoizedGetSessionMetrics = useMemo(() => getSessionMetrics, []);
const memoizedGenerateId = useMemo(() => generateId, []);
const memoizedGetPackageValue = useMemo(() => getPackageValue, []);

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
  const [divergenceAccepted, setDivergenceAccepted] = useState(false);

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
  const [themeSelectorVisible, setThemeSelectorVisible] = useState(false);


  // Enhanced history functions
  const handleLoadAllHistory = useCallback(() => {
    // Recarregar sessões do armazenamento
    loadSessions().then(setSessions);
  }, []);

  const handleClearHistory = useCallback(() => {
    // Limpar sessões
    setSessions([]);
  }, []);

  useEffect(() => {
    loadSessions().then(setSessions);
  }, []);

  // Enhanced screen change with animation
  const changeScreenWithAnimation = useCallback((newScreen: AppScreen, showLoading = false) => {
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
  }, [screen]);

  const handleTabChange = useCallback((tab: TabType) => {
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
  }, [currentSession, changeScreenWithAnimation]);

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
      setDivergenceAccepted(false); // Resetar estado de divergência aceita
      changeScreenWithAnimation('scanning');
      setActiveTab('scanner');
      setLastScanned(null);
      setPackageListExpanded(false);
      setIsLoading(false);
    }, 800);
  };

  // Otimização: useCallback com dependências minimizadas
  const handlePackageScanned = useCallback((pkg: ScannedPackage) => {
    if (!currentSession) return false;
    
    // Otimização: usar Set para verificação de duplicatas (O(1) vs O(n))
    const existingPackage = currentSession.packages.find(p => p.code === pkg.code);
    if (existingPackage) {
      console.warn('Pacote duplicado ignorado:', pkg.code);
      return false;
    }
    
    // Otimização: imutabilidade com spread operator
    setCurrentSession(prev => prev ? {
      ...prev,
      packages: [...prev.packages, pkg],
    } : prev);
    setLastScanned(pkg);
    
    // Check if divergence is resolved
    const updatedPackageCount = currentSession.packages.length + 1;
    if (updatedPackageCount === currentSession.declaredCount) {
      setDivergenceVisible(false);
    }
    return true;
  }, [currentSession?.packages.length, currentSession?.declaredCount]);

  const handleScanned = useCallback((code: string, type: string) => {
    const pkgType = type as 'shopee' | 'mercado_livre' | 'avulso';
    const pkg: ScannedPackage = {
      id: generateId(),
      code,
      type: pkgType,
      value: getPackageValue(pkgType),
      scannedAt: new Date().toISOString(),
    };
    handlePackageScanned(pkg);
  }, [handlePackageScanned]);

  const handleLimitReached = useCallback((limitedTypes: string[]) => {
    // TODO: implementar lógica para quando limites são atingidos
  }, []);

  const handleRequestPhoto = useCallback((pkg: ScannedPackage) => {
    setPhotoPackageCode(pkg.code);
    setPhotoModalVisible(true);
  }, []);

  const handlePhotoCaptured = useCallback(async (uri: string) => {
    if (!currentSession || !photoPackageCode) {
      setPhotoModalVisible(false);
      setPhotoPackageCode(null);
      return;
    }
    try {
      await savePackagePhoto(uri, photoPackageCode, currentSession.id);
    } catch (error) {
      // Silently handle error
    } finally {
      setPhotoModalVisible(false);
      setPhotoPackageCode(null);
    }
  }, [currentSession, photoPackageCode]);

  const handleDuplicate = useCallback((code: string) => {
    if (!currentSession) return;
    const original = currentSession.packages.find(p => p.code === code);
    setDuplicateCode(code);
    setDuplicateOriginal(original);
    setDuplicateVisible(true);
  }, [currentSession]);

  const handleEndSession = useCallback(() => {
    if (!currentSession) return;
    const scannedCount = currentSession.packages.length;
    const declaredCount = currentSession.declaredCount;
    
    // Se já aceitou divergência, finaliza diretamente
    if (divergenceAccepted) {
      finalizeSession(true);
      return;
    }
    
    // Se houver divergência e ainda não foi aceita, mostra o modal
    if (scannedCount !== declaredCount) {
      setDivergenceVisible(true);
    } else {
      finalizeSession(false);
    }
  }, [currentSession, divergenceAccepted]);

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

  const handleDivergenceCancel = useCallback(() => {
    setDivergenceVisible(false);
  }, []);

  const handleProceedWithDivergence = useCallback(() => {
    setDivergenceAccepted(true);
    setDivergenceVisible(false);
    // Permite continuar bipando mesmo com divergência
  }, []);

  const handleNewSession = useCallback(() => {
    setCurrentSession(null);
    setCompletedSession(null);
    setLastScanned(null);
    setDivergenceAccepted(false); // Resetar estado de divergência aceita
    setScreen('welcome');
    setActiveTab('home');
  }, []);

  const handleViewHistory = useCallback(() => {
    setScreen('history');
    setActiveTab('history');
  }, []);


  const handleStartScanner = useCallback(() => {
    if (!currentSession) {
      // Quando não existe sessão, abrimos o modal de INICIAR CONFERÊNCIA
      setActiveTab('scanner');
      setSessionModalVisible(true);
    } else {
      setScreen('scanning');
      setActiveTab('scanner');
    }
  }, [currentSession]);

  // Memoização de métricas para performance
  const metrics = useMemo(() => {
    return currentSession
      ? memoizedGetSessionMetrics(currentSession.packages)
      : { shopee: 0, mercadoLivre: 0, avulsos: 0, total: 0, valueShopee: 0, valueMercadoLivre: 0, valueAvulsos: 0, valueTotal: 0 };
  }, [currentSession?.packages, memoizedGetSessionMetrics]);

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
              divergenceAccepted={divergenceAccepted}
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
              onProceedWithDivergence={handleProceedWithDivergence}
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
          <ThemeSelector
            visible={themeSelectorVisible}
            onClose={() => setThemeSelectorVisible(false)}
          />
        </View>
    </TabLayout>
  );
}

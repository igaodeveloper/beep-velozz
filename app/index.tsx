import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, StatusBar } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Session, ScannedPackage } from '@/types/session';
import { getSessionMetrics, generateId, getPackageValue } from '@/utils/session';
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
import AdvancedAnalytics from '@/components/AdvancedAnalytics';
import { savePackagePhoto } from '@/utils/photoStorage';
import SessionInitModal from '@/components/SessionInitModal';
import BottomTabNavigator, { TabType } from '@/components/BottomTabNavigator';
import TutorialModal from '@/components/TutorialModal';

type AppScreen = 'scanning' | 'report' | 'history' | 'welcome' | 'settings' | 'analytics';

export default function App() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { colors } = useAppTheme();
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [packageListExpanded, setPackageListExpanded] = useState(false);
  const [lastScanned, setLastScanned] = useState<ScannedPackage | null>(null);

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

  useEffect(() => {
    loadSessions().then(setSessions);
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    
    // Map tabs to screens
    switch (tab) {
      case 'home':
        setScreen('welcome');
        break;
      case 'scanner':
        if (!currentSession) {
          // Abre modal de INICIAR CONFERÊNCIA em vez de navegar para outra tela
          setSessionModalVisible(true);
        } else {
          setScreen('scanning');
        }
        break;
      case 'analytics':
        setScreen('analytics');
        break;
      case 'history':
        setScreen('history');
        break;
      case 'settings':
        setScreen('settings');
        break;
    }
  };

  const handleStartSession = (operatorName: string, driverName: string, declaredCounts: { shopee: number; mercadoLivre: number; avulso: number }) => {
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
    setCurrentSession(session);
    setScreen('scanning');
    setActiveTab('scanner');
    setLastScanned(null);
    setPackageListExpanded(false);
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
      value: getPackageValue(pkgType),
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

  const handleViewAnalytics = () => {
    setScreen('analytics');
    setActiveTab('analytics');
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
    : { shopee: 0, mercadoLivre: 0, avulsos: 0, total: 0, valueShopee: 0, valueMercadoLivre: 0, valueAvulsos: 0, valueTotal: 0 };

  return (
    <TabLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
      showScannerTab={true}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
        {/* Main Content Area */}
        <View style={{ flex: 1 }}>
          <AppHeader currentSession={currentSession} onOpenTutorial={() => setTutorialVisible(true)} />
          {/* Home Screen - permanece ativa mesmo com sessão em andamento */}
          {screen === 'welcome' && (
            <HomeScreen
              onStartSession={() => {
                setActiveTab('scanner');
                setSessionModalVisible(true);
              }}
              onViewHistory={handleViewHistory}
              onViewAnalytics={handleViewAnalytics}
              onStartScanner={handleStartScanner}
            />
          )}
          
          {/* Settings Screen */}
          {screen === 'settings' && (
            <SettingsScreen />
          )}

          {/* Analytics Screen */}
          {screen === 'analytics' && (
            <AdvancedAnalytics
              sessions={sessions}
              onClose={() => setScreen('welcome')}
            />
          )}

          {/* Report Screen */}
          {(screen === 'report' && completedSession) ? (
            <ReportView
              session={completedSession}
              onNewSession={handleNewSession}
              onViewHistory={handleViewHistory}
            />
          ) : /* History Screen */ screen === 'history' ? (
            <HistoryBrowser
              sessions={sessions}
              onBack={() => setScreen('scanning')}
              onNewSession={handleNewSession}
            />
          ) : /* Active Session Screen */ currentSession && screen === 'scanning' ? (
            <IndustrialScannerView
              maxScans={{
                shopee: currentSession.declaredCounts.shopee,
                mercado_livre: currentSession.declaredCounts.mercadoLivre,
                avulso: currentSession.declaredCounts.avulso
              }}
              onScanned={handleScanned}
              onLimitReached={handleLimitReached}
              onEndSession={handleEndSession}
              onBack={() => setScreen('welcome')}
            />
          ) : null}


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

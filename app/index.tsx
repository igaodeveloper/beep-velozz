import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, StatusBar } from 'react-native';
import { Session, ScannedPackage } from '@/types/session';
import { getSessionMetrics, generateId } from '@/utils/session';
import { addSession, loadSessions } from '@/utils/storage';
import { useAppTheme } from '@/utils/useAppTheme';

import SessionInitModal from '@/components/SessionInitModal';
import ScannerView from '@/components/ScannerView';
import MetricsDashboard from '@/components/MetricsDashboard';
import PackageList from '@/components/PackageList';
import DuplicateModal from '@/components/DuplicateModal';
import DivergenceScreen from '@/components/DivergenceScreen';
import ReportView from '@/components/ReportView';
import HistoryBrowser from '@/components/HistoryBrowser';
import AppHeader from '@/components/AppHeader';
import EmptyStateWelcome from '@/components/EmptyStateWelcome';
import MainLayout from '@/components/MainLayout';

type AppScreen = 'scanning' | 'report' | 'history';

export default function HomeScreen() {
  const { colors } = useAppTheme();
  const [screen, setScreen] = useState<AppScreen>('scanning');
  const [showInitModal, setShowInitModal] = useState(false);
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

  useEffect(() => {
    loadSessions().then(setSessions);
  }, []);

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
    };
    setCurrentSession(session);
    setShowInitModal(false);
    setScreen('scanning');
    setLastScanned(null);
    setPackageListExpanded(false);
  };

  const handleScan = (pkg: ScannedPackage) => {
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
  };

  const handleDivergenceCancel = () => {
    setDivergenceVisible(false);
  };

  const handleNewSession = () => {
    setCurrentSession(null);
    setCompletedSession(null);
    setLastScanned(null);
    setShowInitModal(false);
    setScreen('scanning');
  };

  const handleViewHistory = () => {
    setScreen('history');
  };

  const metrics = currentSession
    ? getSessionMetrics(currentSession.packages)
    : { shopee: 0, mercadoLivre: 0, avulsos: 0, total: 0, valueShopee: 0, valueMercadoLivre: 0, valueAvulsos: 0, valueTotal: 0 };

  return (
    <MainLayout>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* Header - sempre visível */}
        {screen !== 'history' && screen !== 'report' && (
          <AppHeader currentSession={currentSession} />
        )}

        {/* Main Content Area */}
        <View style={{ flex: 1 }}>
          {/* Report Screen */}
          {screen === 'report' && completedSession ? (
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
          ) : /* Active Session Screen */ currentSession ? (
            <View style={{ flex: 1 }}>
              {/* Metrics Dashboard */}
              <MetricsDashboard
                metrics={metrics}
                declaredCount={currentSession.declaredCount}
              />

              {/* Scanner */}
              <View style={{ flex: 1 }}>
                <ScannerView
                  onScan={handleScan}
                  onDuplicate={handleDuplicate}
                  packages={currentSession.packages}
                  declaredCounts={currentSession.declaredCounts}
                  lastScanned={lastScanned}
                  onEndSession={handleEndSession}
                />
              </View>

              {/* Package list panel */}
              <PackageList
                packages={currentSession.packages}
                expanded={packageListExpanded}
                onToggle={() => setPackageListExpanded(v => !v)}
              />
            </View>
          ) : /* Welcome State */ (
            <EmptyStateWelcome
              onStartSession={() => setShowInitModal(true)}
              onViewHistory={handleViewHistory}
            />
          )}
        </View>

        {/* Modals and Overlays */}
        <SessionInitModal
          visible={showInitModal}
          onStart={handleStartSession}
        />

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
      </SafeAreaView>
    </MainLayout>
  );
}

import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, StatusBar } from 'react-native';
import { Session, ScannedPackage } from '@/types/session';
import { getSessionMetrics, generateId } from '@/utils/session';
import { addSession, loadSessions } from '@/utils/storage';
import { theme } from '@/utils/theme';

import SessionInitModal from '@/components/SessionInitModal';
import ScannerView from '@/components/ScannerView';
import MetricsDashboard from '@/components/MetricsDashboard';
import PackageList from '@/components/PackageList';
import DuplicateModal from '@/components/DuplicateModal';
import DivergenceScreen from '@/components/DivergenceScreen';
import ReportView from '@/components/ReportView';
import HistoryBrowser from '@/components/HistoryBrowser';

type AppScreen = 'scanning' | 'report' | 'history';

export default function HomeScreen() {
  const [screen, setScreen] = useState<AppScreen>('scanning');
  const [showInitModal, setShowInitModal] = useState(true);
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

  const handleStartSession = (operatorName: string, driverName: string, declaredCount: number) => {
    const session: Session = {
      id: generateId(),
      operatorName,
      driverName,
      declaredCount,
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
    if (!currentSession) return;
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
    setShowInitModal(true);
    setScreen('scanning');
  };

  const handleViewHistory = () => {
    setScreen('history');
  };

  const metrics = currentSession
    ? getSessionMetrics(currentSession.packages)
    : { shopee: 0, mercadoLivre: 0, avulsos: 0, total: 0 };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.bg} />
      <SafeAreaView style={{ flex: 1 }}>
        {/* App Header */}
        {screen !== 'history' && screen !== 'report' && (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 10,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.border,
          }}>
            <View style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: theme.colors.primary,
              alignItems: 'center', justifyContent: 'center',
              marginRight: 10,
            }}>
              <Text style={{ fontSize: 16 }}>📦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.5 }}>
                LogManager Pro
              </Text>
              {currentSession && (
                <Text style={{ color: '#475569', fontSize: 11 }} numberOfLines={1}>
                  {currentSession.driverName} · Op: {currentSession.operatorName}
                </Text>
              )}
            </View>
            <View style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: currentSession ? theme.colors.primary : theme.colors.border2,
            }} />
          </View>
        )}

        {/* Main Content */}
        {screen === 'report' && completedSession ? (
          <ReportView
            session={completedSession}
            onNewSession={handleNewSession}
            onViewHistory={handleViewHistory}
          />
        ) : screen === 'history' ? (
          <HistoryBrowser
            sessions={sessions}
            onBack={() => setScreen('scanning')}
            onNewSession={handleNewSession}
          />
        ) : currentSession ? (
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
        ) : (
          // Empty state while waiting for modal
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#1e293b', fontSize: 40 }}>📦</Text>
          </View>
        )}

        {/* Session Init Modal */}
        <SessionInitModal
          visible={showInitModal}
          onStart={handleStartSession}
        />

        {/* Duplicate Modal */}
        <DuplicateModal
          visible={duplicateVisible}
          code={duplicateCode}
          originalPackage={duplicateOriginal}
          onDismiss={() => setDuplicateVisible(false)}
        />

        {/* Divergence Screen */}
        {currentSession && (
          <DivergenceScreen
            visible={divergenceVisible}
            scannedCount={currentSession.packages.length}
            declaredCount={currentSession.declaredCount}
            onCancel={handleDivergenceCancel}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

import React from 'react';
import { View, Text, SafeAreaView, StatusBar } from 'react-native';
import { useSession } from '../contexts/SessionContext';
import { getSessionMetrics } from '@/utils/session';
import { theme } from '@/utils/theme';

import SessionInitModal from '@/components/SessionInitModal';
import ScannerView from '@/components/ScannerView';
import MetricsDashboard from '@/components/MetricsDashboard';
import PackageList from '@/components/PackageList';
import DuplicateModal from '@/components/DuplicateModal';
import DivergenceScreen from '@/components/DivergenceScreen';
import ReportView from '@/components/ReportView';
import HistoryBrowser from '@/components/HistoryBrowser';

export default function HomeScreen() {
  const {
    screen,
    showInitModal,
    currentSession,
    packageListExpanded,
    lastScanned,
    duplicateVisible,
    duplicateCode,
    duplicateOriginal,
    divergenceVisible,
    completedSession,
    sessions,
    isLoading,
    setScreen,
    handleStartSession,
    handleScan,
    handleDuplicate,
    handleEndSession,
    handleDivergenceCancel,
    handleNewSession,
    handleViewHistory,
    setPackageListExpanded,
    setDuplicateVisible,
  } = useSession();

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
                isLoading={isLoading}
              />
            </View>

            {/* Package list panel */}
            <PackageList
              packages={currentSession.packages}
              expanded={packageListExpanded}
              onToggle={() => setPackageListExpanded(!packageListExpanded)}
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

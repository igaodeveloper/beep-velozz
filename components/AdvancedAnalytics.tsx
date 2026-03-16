import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Session } from '@/types/session';
import { OperatorStats } from '@/utils/analytics';
import { useAppTheme } from '@/utils/useAppTheme';
import {
  calculateOperatorStats,
  detectAnomalies,
  generateInsights,
  generatePerformanceReport,
} from '@/utils/analytics';
import MainLayout from '@/components/MainLayout';

interface AdvancedAnalyticsProps {
  sessions: Session[];
  onClose: () => void;
  onAnalyzeAll?: () => void;
  onResetAnalysis?: () => void;
}

export default function AdvancedAnalytics({ 
  sessions, 
  onClose, 
  onAnalyzeAll, 
  onResetAnalysis 
}: AdvancedAnalyticsProps) {
  const { colors } = useAppTheme();

  const operatorStats = useMemo(() => calculateOperatorStats(sessions), [sessions]);
  const insights = useMemo(() => generateInsights(sessions), [sessions]);
  const report = useMemo(() => generatePerformanceReport(sessions), [sessions]);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ 
          paddingBottom: 32,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={true}
      >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.surface2,
        }}
      >
        <View>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 }}>
            ANÁLISE AVANÇADA
          </Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>
            Performance & Insights
          </Text>
        </View>
        
        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Zerar Análise Button */}
          <TouchableOpacity
            onPress={onResetAnalysis}
            style={{
              height: 40,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: '#ef4444',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: '#dc2626',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
              ZERAR
            </Text>
          </TouchableOpacity>
          
          {/* Tudo Button */}
          <TouchableOpacity
            onPress={onAnalyzeAll}
            style={{
              height: 40,
              paddingHorizontal: 12,
              borderRadius: 10,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
              TUDO
            </Text>
          </TouchableOpacity>
          
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.surface2,
            }}
          >
            <Text style={{ fontSize: 18, color: colors.text }}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ padding: 16, paddingTop: 20 }}>
        {/* Performance Report */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.surface2,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
            SUMMARY EXECUTIVO
          </Text>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: 12 }}>
            {report.summary}
          </Text>

          {Object.entries(report.metrics).map(([key, value]) => (
            <View key={key} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>{key}</Text>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>{value}</Text>
            </View>
          ))}

          {report.warnings.length > 0 && (
            <View
              style={{
                backgroundColor: '#78350f',
                borderRadius: 10,
                padding: 10,
                marginTop: 12,
              }}
            >
              {report.warnings.map((warning, idx) => (
                <Text key={idx} style={{ color: colors.warning, fontSize: 12, fontWeight: '600', marginBottom: idx === report.warnings.length - 1 ? 0 : 6 }}>
                  {warning}
                </Text>
              ))}
            </View>
          )}
        </View>

        {/* Insights */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.surface2,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
            INSIGHTS AUTOMÁTICOS
          </Text>
          {insights.map((insight, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: colors.surface2,
                borderRadius: 10,
                padding: 10,
                marginBottom: idx === insights.length - 1 ? 0 : 8,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '500' }}>{insight}</Text>
            </View>
          ))}
        </View>

        {/* Operador Rankings */}
        {operatorStats.length > 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.surface2,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
              RANKING DE OPERADORES
            </Text>

            {/* Sort by accuracy score */}
            {operatorStats
              .sort((a, b) => b.accuracyScore - a.accuracyScore)
              .map((operator, idx) => (
                <OperatorCard key={operator.name} operator={operator} rank={idx + 1} colors={colors} />
              ))}
          </View>
        )}

        {/* Anomalies Detection */}
        {sessions.length > 0 && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.surface2,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
              DETECÇÃO DE ANOMALIAS
            </Text>

            {sessions
              .map((session) => {
                const anomaly = detectAnomalies(session, sessions.filter((s) => s.id !== session.id));
                return { session, anomaly };
              })
              .filter(({ anomaly }) => anomaly.severity !== 'low')
              .slice(0, 3)
              .map(({ session, anomaly }, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor:
                      anomaly.severity === 'high'
                        ? '#7c2d12'
                        : anomaly.severity === 'medium'
                          ? '#78350f'
                          : colors.surface2,
                    borderRadius: 10,
                    padding: 10,
                    marginBottom: idx === Math.min(sessions.length - 1, 2) ? 0 : 8,
                    borderLeftWidth: 4,
                    borderLeftColor: anomaly.severity === 'high' ? '#dc2626' : '#f97316',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
                      {session.operatorName} - {new Date(session.startedAt).toLocaleDateString('pt-BR')}
                    </Text>
                    <Text
                      style={{
                        color: colors.warning,
                        fontSize: 10,
                        fontWeight: '700',
                        backgroundColor: anomaly.severity === 'high' ? 'rgba(220, 38, 38, 0.2)' : 'rgba(249, 115, 22, 0.2)',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: 4,
                      }}
                    >
                      {anomaly.severity.toUpperCase()} - {(anomaly.score * 100).toFixed(0)}%
                    </Text>
                  </View>
                  {anomaly.flags.map((flag, fidx) => (
                    <Text
                      key={fidx}
                      style={{
                        color: colors.textMuted,
                        fontSize: 11,
                        marginBottom: fidx === anomaly.flags.length - 1 ? 0 : 4,
                      }}
                    >
                      • {flag}
                    </Text>
                  ))}
                </View>
              ))}

            {sessions.filter((session) => {
              const anomaly = detectAnomalies(session, sessions.filter((s) => s.id !== session.id));
              return anomaly.severity !== 'low';
            }).length === 0 && (
              <View style={{ backgroundColor: '#052e16', borderRadius: 10, padding: 12 }}>
                <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600', textAlign: 'center' }}>
                  ✅ Nenhuma anomalia detectada
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
      </ScrollView>
    </View>
  );
}

interface OperatorCardProps {
  operator: OperatorStats;
  rank: number;
  colors: any;
}

function OperatorCard({ operator, rank, colors }: OperatorCardProps) {
  const medalEmoji = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '🔹';

  return (
    <View
      style={{
        backgroundColor: colors.surface2,
        borderRadius: 10,
        padding: 12,
        marginBottom: 10,
        borderLeftWidth: 4,
        borderLeftColor: rank === 1 ? '#f59e0b' : colors.primary,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
            {medalEmoji} {operator.name}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
            {operator.totalSessions} sessões • {operator.totalPackages} pacotes
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text
            style={{
              color: operator.accuracyScore > 95 ? colors.success : operator.accuracyScore > 80 ? colors.primary : colors.warning,
              fontSize: 14,
              fontWeight: '800',
            }}
          >
            {operator.accuracyScore}%
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 2 }}>Acurácia</Text>
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <MetricRow label="Velocidade" value={`${operator.avgRatePerMinute} pkg/min`} color={colors.textMuted} />
        <MetricRow label="Taxa de Erro" value={`${operator.errorRate}%`} color={colors.textMuted} />
        <MetricRow label="Tempo Médio" value={`${operator.avgResponseTime} min`} color={colors.textMuted} />
        <MetricRow label="Preferência" value={operator.preferredMarketplace.replace('_', ' ')} color={colors.primary} />
      </View>
    </View>
  );
}

function MetricRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontSize: 11, color, fontWeight: '500' }}>{label}</Text>
      <Text style={{ fontSize: 11, color, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

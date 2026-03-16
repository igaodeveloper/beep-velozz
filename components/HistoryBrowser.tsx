import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { Session } from '@/types/session';
import { formatDate, formatTimestamp, getSessionMetrics, packageTypeBadgeColors, packageTypeLabel } from '@/utils/session';
import { useAppTheme } from '@/utils/useAppTheme';
import MainLayout from '@/components/MainLayout';

interface HistoryBrowserProps {
  sessions: Session[];
  onBack: () => void;
  onNewSession: () => void;
  onLoadAllHistory?: () => void;
  onClearHistory?: () => void;
}

export default function HistoryBrowser({ 
  sessions, 
  onBack, 
  onNewSession, 
  onLoadAllHistory, 
  onClearHistory 
}: HistoryBrowserProps) {
  const { colors } = useAppTheme();
  const [filter, setFilter] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const filtered = sessions.filter(s =>
    s.operatorName.toLowerCase().includes(filter.toLowerCase()) ||
    s.driverName.toLowerCase().includes(filter.toLowerCase()) ||
    formatDate(s.startedAt).includes(filter)
  );

  if (selectedSession) {
    return (
      <MainLayout>
        <SessionDetailView
          session={selectedSession}
          onBack={() => setSelectedSession(null)}
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.surface2,
        gap: 12,
      }}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Text style={{ color: colors.primary, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
            ARQUIVO
          </Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>
            Histórico de Sessões
          </Text>
        </View>
        
        {/* Action Buttons */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Zerar Histórico Button */}
          <TouchableOpacity
            onPress={() => {
              if (onClearHistory) {
                Alert.alert(
                  'Zerar Histórico',
                  'Tem certeza que deseja apagar todo o histórico? Esta ação não pode ser desfeita.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    { 
                      text: 'Zerar', 
                      style: 'destructive',
                      onPress: onClearHistory
                    }
                  ]
                );
              }
            }}
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
            onPress={onLoadAllHistory}
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
          
          {/* Session Count Badge */}
          <View style={{
            backgroundColor: colors.surface2, borderRadius: 10,
            paddingHorizontal: 10, paddingVertical: 4,
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: colors.surface2,
          }}>
            <Text style={{ color: colors.textSubtle, fontSize: 13, fontWeight: '700' }}>{sessions.length}</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
        <TextInput
          value={filter}
          onChangeText={setFilter}
          placeholder="Buscar por operador, motorista ou data..."
          placeholderTextColor={colors.textMuted}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.surface2,
            borderRadius: 10,
            padding: 12,
            color: colors.text,
            fontSize: 14,
          }}
        />
      </View>

      {/* List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}>
        {filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', paddingTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>📭</Text>
            <Text style={{ color: colors.textMuted, fontSize: 16, fontWeight: '600' }}>Nenhuma sessão encontrada</Text>
          </View>
        ) : (
          filtered.map(session => {
            const metrics = getSessionMetrics(session.packages);
            return (
              <TouchableOpacity
                key={session.id}
                onPress={() => setSelectedSession(session)}
                activeOpacity={0.8}
                style={{
                  backgroundColor: colors.surface,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: session.hasDivergence ? '#78350f' : colors.surface2,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <View>
                    <Text style={{ color: '#e2e8f0', fontSize: 15, fontWeight: '700' }}>
                      {session.driverName}
                    </Text>
                    <Text style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                      {session.operatorName} · {formatDate(session.startedAt)}
                    </Text>
                  </View>
                  {session.hasDivergence ? (
                    <View style={{
                      backgroundColor: '#78350f', borderRadius: 8,
                      paddingHorizontal: 8, paddingVertical: 4,
                      borderWidth: 1, borderColor: '#f59e0b',
                    }}>
                      <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: '700' }}>⚠️ DIVERG.</Text>
                    </View>
                  ) : (
                    <View style={{
                      backgroundColor: '#052e16', borderRadius: 8,
                      paddingHorizontal: 8, paddingVertical: 4,
                      borderWidth: 1, borderColor: colors.success,
                      }}>
                        <Text style={{ color: colors.success, fontSize: 10, fontWeight: '700' }}>✅ OK</Text>
                    </View>
                  )}
                </View>

                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                  <CountBadge label="SP" count={metrics.shopee} color="#ff5722" />
                  <CountBadge label="ML" count={metrics.mercadoLivre} color="#ffe600" />
                  <CountBadge label="AV" count={metrics.avulsos} color="#64748b" />
                  <View style={{ flex: 1 }} />
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ color: colors.primary, fontSize: 18, fontWeight: '800' }}>{metrics.total}</Text>
                    <Text style={{ color: colors.textSubtle, fontSize: 9 }}>/ {session.declaredCount} decl.</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Bottom button */}
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#1e293b' }}>
        <TouchableOpacity
          onPress={onNewSession}
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.primary,
            borderRadius: 12, padding: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>+ NOVA SESSÃO</Text>
        </TouchableOpacity>
      </View>
      </View>
    </MainLayout>
  );
}

function CountBadge({ label, count, color }: { label: string; count: number; color: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{
      backgroundColor: colors.surface2, borderRadius: 8,
      paddingHorizontal: 10, paddingVertical: 5,
      alignItems: 'center', gap: 2,
    }}>
      <Text style={{ color, fontSize: 13, fontWeight: '800' }}>{count}</Text>
      <Text style={{ color: colors.textSubtle, fontSize: 9, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

// --- Session Detail View ---
function SessionDetailView({ session, onBack }: { session: Session; onBack: () => void }) {
  const { colors } = useAppTheme();
  const metrics = getSessionMetrics(session.packages);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.border,
        gap: 12,
      }}>
        <TouchableOpacity onPress={onBack} style={{ padding: 4 }}>
          <Text style={{ color: colors.primary, fontSize: 22 }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', letterSpacing: 1.5 }}>
            DETALHES
          </Text>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }} numberOfLines={1}>
            {session.driverName}
          </Text>
        </View>
        {session.hasDivergence ? (
          <View style={{
            backgroundColor: '#78350f', borderRadius: 8,
            paddingHorizontal: 10, paddingVertical: 5,
            borderWidth: 1, borderColor: '#f59e0b',
          }}>
            <Text style={{ color: '#f59e0b', fontSize: 10, fontWeight: '700' }}>⚠️ DIVERGÊNCIA</Text>
          </View>
        ) : (
          <View style={{
            backgroundColor: '#052e16', borderRadius: 8,
            paddingHorizontal: 10, paddingVertical: 5,
            borderWidth: 1, borderColor: colors.success,
          }}>
            <Text style={{ color: colors.success, fontSize: 10, fontWeight: '700' }}>✅ OK</Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Info */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: 14,
          borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 14,
        }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}>
            INFORMAÇÕES
          </Text>
          {[
            ['Data', formatDate(session.startedAt)],
            ['Início', formatTimestamp(session.startedAt)],
            ...(session.completedAt ? [['Fim', formatTimestamp(session.completedAt)]] : []),
            ['Operador', session.operatorName],
            ['Motorista', session.driverName],
          ].map(([label, value]) => (
            <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Metrics */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: 14,
          borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 14,
        }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}>
            MÉTRICAS
          </Text>
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
            <MetricItem label="Shopee" count={metrics.shopee} color="#ff5722" />
            <MetricItem label="Merc. Livre" count={metrics.mercadoLivre} color="#ffe600" />
            <MetricItem label="Avulsos" count={metrics.avulsos} color="#64748b" />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', backgroundColor: colors.surface2, borderRadius: 10, padding: 12 }}>
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>CONFERIDO</Text>
              <Text style={{ color: colors.primary, fontSize: 24, fontWeight: '800' }}>{metrics.total}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700' }}>DECLARADO</Text>
              <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{session.declaredCount}</Text>
            </View>
          </View>
          {session.hasDivergence && (
            <View style={{ backgroundColor: '#78350f', borderRadius: 8, padding: 10, marginTop: 8 }}>
              <Text style={{ color: colors.warning, fontSize: 13, fontWeight: '700' }}>
                Δ {metrics.total - session.declaredCount > 0 ? '+' : ''}{metrics.total - session.declaredCount} pacote(s)
              </Text>
            </View>
          )}
        </View>

        {/* Package list */}
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 14,
          borderWidth: 1, borderColor: '#1e293b', padding: 16,
        }}>
          <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 10 }}>
            PACOTES ({session.packages.length})
          </Text>
          {session.packages.map((pkg, idx) => {
            const badge = packageTypeBadgeColors(pkg.type);
            return (
              <View key={pkg.id} style={{
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: 8,
                borderTopWidth: idx > 0 ? 1 : 0, borderTopColor: colors.border,
              }}>
                <Text style={{ color: colors.textMuted, fontSize: 11, width: 28 }}>#{idx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'SpaceMono-Regular' }}>{pkg.code}</Text>
                  <Text style={{ color: colors.textSubtle, fontSize: 10 }}>{formatTimestamp(pkg.scannedAt)}</Text>
                </View>
                <View style={{ backgroundColor: badge.bg, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 }}>
                  <Text style={{ color: badge.text, fontSize: 9, fontWeight: '700' }}>{packageTypeLabel(pkg.type)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

function MetricItem({ label, count, color }: { label: string; count: number; color: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.surface2, borderRadius: 10, padding: 10, alignItems: 'center' }}>
      <Text style={{ color, fontSize: 18, fontWeight: '800' }}>{count}</Text>
      <Text style={{ color: colors.textSubtle, fontSize: 9, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

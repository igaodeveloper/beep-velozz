import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share, Platform, Linking } from 'react-native';
import { Session } from '@/types/session';
import { getSessionMetrics, formatWhatsAppMessage, formatDate, formatTimestamp, packageTypeLabel, packageTypeBadgeColors } from '@/utils/session';
import { useAppTheme } from '@/utils/useAppTheme';

interface ReportViewProps {
  session: Session;
  onNewSession: () => void;
  onViewHistory: () => void;
}

export default function ReportView({ session, onNewSession, onViewHistory }: ReportViewProps) {
  const { colors } = useAppTheme();
  const metrics = getSessionMetrics(session.packages);
  const hasDivergence = session.hasDivergence;

  const handleWhatsApp = async () => {
    const message = formatWhatsAppMessage(session);
    const encoded = encodeURIComponent(message);
    const url = `whatsapp://send?text=${encoded}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Fallback: share
      await Share.share({ message });
    }
  };

  const handleShare = async () => {
    const message = formatWhatsAppMessage(session);
    await Share.share({ message });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
        borderBottomWidth: 1, borderBottomColor: colors.surface2,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 }}>
            RELATÓRIO
          </Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>
            Sessão Concluída
          </Text>
        </View>
        {hasDivergence ? (
          <View style={{
            backgroundColor: '#78350f', borderRadius: 8,
            paddingHorizontal: 10, paddingVertical: 5,
            borderWidth: 1, borderColor: colors.warning,
          }}>
            <Text style={{ color: colors.warning, fontSize: 11, fontWeight: '700' }}>⚠️ DIVERGÊNCIA</Text>
          </View>
        ) : (
          <View style={{
            backgroundColor: '#052e16', borderRadius: 8,
            paddingHorizontal: 10, paddingVertical: 5,
            borderWidth: 1, borderColor: colors.success,
          }}>
            <Text style={{ color: colors.success, fontSize: 11, fontWeight: '700' }}>✅ OK</Text>
          </View>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Session Info */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: 14,
          borderWidth: 1, borderColor: colors.surface2,
          padding: 16, marginBottom: 16,
        }}>
          <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
            INFORMAÇÕES DA SESSÃO
          </Text>
          <InfoRow label="Data" value={formatDate(session.startedAt)} />
          <InfoRow label="Início" value={formatTimestamp(session.startedAt)} />
          {session.completedAt && <InfoRow label="Fim" value={formatTimestamp(session.completedAt)} />}
          <InfoRow label="Operador" value={session.operatorName} />
          <InfoRow label="Motorista" value={session.driverName} />
        </View>

        {/* Summary metrics */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: 14,
          borderWidth: 1, borderColor: colors.surface2,
          padding: 16, marginBottom: 16,
        }}>
          <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
            RESUMO DE PACOTES
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <SummaryBox label="Shopee" value={metrics.shopee} color="#ff5722" />
            <SummaryBox label="Merc. Livre" value={metrics.mercadoLivre} color="#ffe600" />
            <SummaryBox label="Avulsos" value={metrics.avulsos} color="#64748b" />
          </View>

          <View style={{
            backgroundColor: '#1e293b', borderRadius: 10,
            padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <View>
              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>TOTAL CONFERIDO</Text>
              <Text style={{ color: colors.primary, fontSize: 32, fontWeight: '800' }}>{metrics.total}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>DECLARADO</Text>
              <Text style={{ color: '#e2e8f0', fontSize: 32, fontWeight: '800' }}>{session.declaredCount}</Text>
            </View>
          </View>

          {hasDivergence && (
            <View style={{
              backgroundColor: '#78350f', borderRadius: 10,
              padding: 12, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
            }}>
              <Text style={{ fontSize: 18 }}>⚠️</Text>
              <Text style={{ color: '#f59e0b', fontSize: 13, fontWeight: '700', flex: 1 }}>
                Divergência: {metrics.total - session.declaredCount > 0 ? '+' : ''}{metrics.total - session.declaredCount} pacote(s)
              </Text>
            </View>
          )}
        </View>

        {/* Package list */}
        <View style={{
          backgroundColor: '#0f172a', borderRadius: 14,
          borderWidth: 1, borderColor: '#1e293b',
          padding: 16, marginBottom: 20,
        }}>
          <Text style={{ color: '#64748b', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
            LISTA DE PACOTES ({session.packages.length})
          </Text>
          {session.packages.map((pkg, idx) => {
            const badge = packageTypeBadgeColors(pkg.type);
            return (
              <View key={pkg.id} style={{
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: 8,
                borderTopWidth: idx > 0 ? 1 : 0,
                borderTopColor: '#1e293b',
              }}>
                <Text style={{ color: '#334155', fontSize: 11, width: 28 }}>#{idx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#e2e8f0', fontSize: 12, fontFamily: 'SpaceMono-Regular' }}>{pkg.code}</Text>
                  <Text style={{ color: '#475569', fontSize: 10 }}>{formatTimestamp(pkg.scannedAt)}</Text>
                </View>
                <View style={{ backgroundColor: badge.bg, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: badge.text, fontSize: 9, fontWeight: '700' }}>{packageTypeLabel(pkg.type)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={{
        padding: 16, gap: 10,
        borderTopWidth: 1, borderTopColor: '#1e293b',
        backgroundColor: '#080d18',
      }}>
        <TouchableOpacity
          onPress={handleWhatsApp}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#25d366',
            borderRadius: 12, padding: 16,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Text style={{ fontSize: 20 }}>💬</Text>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800' }}>ENVIAR VIA WHATSAPP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.85}
          style={{
            backgroundColor: '#1e293b',
            borderRadius: 12, padding: 14,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            borderWidth: 1, borderColor: '#334155',
          }}
        >
          <Text style={{ fontSize: 18 }}>📤</Text>
          <Text style={{ color: colors.textMuted, fontSize: 16, fontWeight: '700' }}>{}Compartilhar</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            onPress={onViewHistory}
            activeOpacity={0.85}
            style={{
              flex: 1, backgroundColor: '#1e293b',
              borderRadius: 12, padding: 14, alignItems: 'center',
              borderWidth: 1, borderColor: '#334155',
            }}
          >
            <Text style={{ color: '#94a3b8', fontSize: 14, fontWeight: '700' }}>📋 Histórico</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNewSession}
            activeOpacity={0.85}
            style={{
              flex: 1, backgroundColor: colors.primary,
              borderRadius: 12, padding: 14, alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '800' }}>+ Nova Sessão</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ color: '#64748b', fontSize: 13 }}>{label}</Text>
      <Text style={{ color: '#e2e8f0', fontSize: 13, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

function SummaryBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={{
      flex: 1, backgroundColor: '#1e293b', borderRadius: 10,
      padding: 12, alignItems: 'center',
    }}>
      <Text style={{ color, fontSize: 22, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '600', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

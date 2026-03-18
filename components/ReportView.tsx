import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Share, Platform, Linking } from 'react-native';
import { Session } from '@/types/session';
import { getSessionMetrics, formatWhatsAppMessage, formatDate, formatTimestamp, packageTypeLabel, packageTypeBadgeColors } from '@/utils/session';
import { useAppTheme } from '@/utils/useAppTheme';
import PackagePhotoGallery from '@/components/PackagePhotoGallery';
import { exportSessionWithPhotosToPDF } from '@/utils/pdfExport';
import MainLayout from '@/components/MainLayout';

interface ReportViewProps {
  session: Session;
  onNewSession: () => void;
  onViewHistory: () => void;
}

export default function ReportView({ session, onNewSession, onViewHistory }: ReportViewProps) {
  const { colors } = useAppTheme();
  const metrics = getSessionMetrics(session.packages);
  const hasDivergence = session.hasDivergence;

  const [showPhotoGallery, setShowPhotoGallery] = useState(false);

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

  const handleExportWithPhotos = async () => {
    try {
      await exportSessionWithPhotosToPDF(session);
    } catch (error) {
      console.error('Erro ao exportar PDF com fotos:', error);
    }
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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
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

          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <SummaryBox label="Shopee" count={metrics.shopee} value={metrics.valueShopee} color="#ff5722" />
            <SummaryBox label="Merc. Livre" count={metrics.mercadoLivre} value={metrics.valueMercadoLivre} color="#ffe600" />
            <SummaryBox label="Avulsos" count={metrics.avulsos} value={metrics.valueAvulsos} color="#64748b" />
          </View>

          <View style={{
            backgroundColor: colors.surface2, borderRadius: 10,
            padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <View>
              <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>TOTAL CONFERIDO</Text>
              <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '800' }}>{metrics.total}</Text>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700', marginTop: 4 }}>R$ {metrics.valueTotal.toFixed(2)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 1 }}>DECLARADO</Text>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800' }}>{session.declaredCount}</Text>
            </View>
          </View>

          {hasDivergence && (
            <View style={{
              backgroundColor: '#78350f', borderRadius: 10,
              padding: 12, marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
            }}>
              <Text style={{ fontSize: 18 }}>⚠️</Text>
              <Text style={{ color: colors.warning, fontSize: 13, fontWeight: '700', flex: 1 }}>
                Divergência: {metrics.total - session.declaredCount > 0 ? '+' : ''}{metrics.total - session.declaredCount} pacote(s)
              </Text>
            </View>
          )}
        </View>

        {/* Package list */}
        <View style={{
          backgroundColor: colors.surface, borderRadius: 14,
          borderWidth: 1, borderColor: colors.border,
          padding: 16, marginBottom: 20,
        }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
            LISTA DE PACOTES ({session.packages.length})
          </Text>
          {session.packages.map((pkg, idx) => {
            const badge = packageTypeBadgeColors(pkg.type);
            return (
              <View key={pkg.id} style={{
                flexDirection: 'row', alignItems: 'center',
                paddingVertical: 8,
                borderTopWidth: idx > 0 ? 1 : 0,
                borderTopColor: colors.border,
              }}>
                <Text style={{ color: colors.textMuted, fontSize: 11, width: 28 }}>#{idx + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 12, fontFamily: 'SpaceMono-Regular' }}>{pkg.code}</Text>
                  <Text style={{ color: colors.textSubtle, fontSize: 10 }}>{formatTimestamp(pkg.scannedAt)}</Text>
                </View>
                <View style={{ backgroundColor: badge.bg, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 }}>
                  <Text style={{ color: badge.text, fontSize: 9, fontWeight: '700' }}>{packageTypeLabel(pkg.type)}</Text>
                </View>
                <View style={{ backgroundColor: colors.primary, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: colors.secondary, fontSize: 9, fontWeight: '700' }}>R$ {(pkg.value || 0).toFixed(2)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Action buttons */}
      <View style={{
        padding: 16, gap: 10,
        borderTopWidth: 1, borderTopColor: colors.border,
        backgroundColor: colors.bg,
        flexWrap: 'wrap',
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
          <Text style={{ color: colors.secondary, fontSize: 16, fontWeight: '800' }}>ENVIAR VIA WHATSAPP</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleShare}
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12, padding: 14,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            borderWidth: 1, borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 18 }}>📤</Text>
          <Text style={{ color: colors.textMuted, fontSize: 16, fontWeight: '700' }}>Compartilhar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowPhotoGallery(true)}
          activeOpacity={0.85}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 18 }}>📸</Text>
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>
            Fotos dos pacotes (opcional)
          </Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
          <TouchableOpacity
            onPress={onViewHistory}
            activeOpacity={0.85}
            style={{
              flex: 1, backgroundColor: colors.surface,
              borderRadius: 12, padding: 14, alignItems: 'center',
              borderWidth: 1, borderColor: colors.border,
            }}
          >
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>📋 Histórico</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNewSession}
            activeOpacity={0.85}
            style={{
              flex: 1, backgroundColor: colors.primary,
              borderRadius: 12, padding: 14, alignItems: 'center',
            }}
          >
            <Text style={{ color: colors.secondary, fontSize: 14, fontWeight: '800' }}>+ Nova Sessão</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PackagePhotoGallery
        session={session}
        visible={showPhotoGallery}
        onClose={() => setShowPhotoGallery(false)}
        onExportWithPhotos={handleExportWithPhotos}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

function SummaryBox({ label, count, value, color }: { label: string; count: number; value: number; color: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={{
      flex: 1, backgroundColor: colors.surface2, borderRadius: 10,
      padding: 12, alignItems: 'center',
    }}>
      <Text style={{ color, fontSize: 20, fontWeight: '800' }}>{count}</Text>
      <Text style={{ color: colors.textSubtle, fontSize: 9, fontWeight: '600', marginTop: 2 }}>{label}</Text>
      <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', marginTop: 4 }}>R$ {value.toFixed(2)}</Text>
    </View>
  );
}

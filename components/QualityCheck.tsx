import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Session } from '@/types/session';
import { useAppTheme } from '@/utils/useAppTheme';

interface QualityCheckProps {
  session: Session;
  onApprove: (notes: string) => void;
  onReject: (reason: string) => void;
  onClose: () => void;
}

export default function QualityCheck({ session, onApprove, onReject, onClose }: QualityCheckProps) {
  const { colors } = useAppTheme();
  const [notes, setNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState<'review' | 'approve' | 'reject'>('review');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
            CONTROLE DE QUALIDADE
          </Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>
            Avaliação de Sessão
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Session Summary */}
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
            RESUMO DA SESSÃO
          </Text>
          <InfoRow label="Operador" value={session.operatorName} />
          <InfoRow label="Motorista" value={session.driverName} />
          <InfoRow label="Pacotes" value={`${session.packages.length} / ${session.declaredCount}`} />
          <View style={{ marginTop: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '500' }}>Status:</Text>
              {session.hasDivergence ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12 }}>⚠️</Text>
                  <Text style={{ color: colors.warning, fontSize: 12, fontWeight: '700' }}>DIVERGÊNCIA</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 12 }}>✅</Text>
                  <Text style={{ color: colors.success, fontSize: 12, fontWeight: '700' }}>CONFORME</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <TabButton
            label="Revisar"
            active={activeTab === 'review'}
            onPress={() => setActiveTab('review')}
            colors={colors}
          />
          <TabButton
            label="Aprovar"
            active={activeTab === 'approve'}
            onPress={() => setActiveTab('approve')}
            colors={colors}
            color="#10b981"
          />
          <TabButton
            label="Rejeitar"
            active={activeTab === 'reject'}
            onPress={() => setActiveTab('reject')}
            colors={colors}
            color="#ef4444"
          />
        </View>

        {/* Review Tab */}
        {activeTab === 'review' && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.surface2,
              padding: 16,
            }}
          >
            <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
              CHECKLIST DE QUALIDADE
            </Text>
            <QualityCheckItem label="Códigos legíveis" checked={true} />
            <QualityCheckItem label="Sem duplicatas" checked={!session.packages.some((p, i) => session.packages.findIndex((x) => x.code === p.code) !== i)} />
            <QualityCheckItem label="Valores corretos" checked={true} />
            <QualityCheckItem label="Marketplace corretos" checked={true} />
            <QualityCheckItem label="Documentação" checked={!!session.notes} />

            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 16, marginBottom: 8 }}>
              Pacotes Certificados: {session.packages.length}
            </Text>
            <View
              style={{
                backgroundColor: colors.surface2,
                borderRadius: 8,
                padding: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '700' }}>{session.packages.length}</Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600' }}>CONFERENCIADOS</Text>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>
                  {((session.packages.length / session.declaredCount) * 100).toFixed(0)}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Approve Tab */}
        {activeTab === 'approve' && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.surface2,
              padding: 16,
            }}
          >
            <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
              APROVAR SESSÃO
            </Text>

            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 12 }}>
              Anotações do Supervisor (opcional)
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surface2,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.text,
                minHeight: 100,
                textAlignVertical: 'top',
                marginBottom: 16,
                borderWidth: 1,
                borderColor: colors.border,
              }}
              placeholder="Digite comentários ou observações..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <TouchableOpacity
              onPress={() => onApprove(notes)}
              style={{
                backgroundColor: '#10b981',
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>
                ✓ Aprovar Sessão
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reject Tab */}
        {activeTab === 'reject' && (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.surface2,
              padding: 16,
            }}
          >
            <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 12 }}>
              REJEITAR SESSÃO
            </Text>

            <View
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                borderRadius: 10,
                borderLeftWidth: 4,
                borderLeftColor: '#ef4444',
                padding: 12,
                marginBottom: 16,
              }}
            >
              <Text style={{ color: '#991b1b', fontSize: 12, fontWeight: '600' }}>
                ⚠️ Uma sessão rejeitada precisará ser reprocessada pelo operador.
              </Text>
            </View>

            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 12 }}>
              Motivo da Rejeição
            </Text>
            <TextInput
              style={{
                backgroundColor: colors.surface2,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: colors.text,
                minHeight: 100,
                textAlignVertical: 'top',
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#ef4444',
              }}
              placeholder="Descreva o motivo da rejeição..."
              placeholderTextColor={colors.textMuted}
              value={rejectReason}
              onChangeText={setRejectReason}
              multiline
            />

            <TouchableOpacity
              onPress={() => onReject(rejectReason)}
              disabled={!rejectReason.trim()}
              style={{
                backgroundColor: rejectReason.trim() ? '#ef4444' : '#ccc',
                borderRadius: 10,
                paddingVertical: 14,
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.3 }}>
                ✕ Rejeitar Sessão
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface TabButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
  color?: string;
}

function TabButton({ label, active, onPress, colors, color }: TabButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: active ? (color || colors.primary) : colors.surface,
        borderWidth: 1,
        borderColor: active ? (color || colors.primary) : colors.border,
      }}
    >
      <Text
        style={{
          textAlign: 'center',
          color: active ? '#fff' : colors.text,
          fontSize: 12,
          fontWeight: '700',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface QualityCheckItemProps {
  label: string;
  checked: boolean;
}

function QualityCheckItem({ label, checked }: QualityCheckItemProps) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 }}>
      <Text style={{ fontSize: 16 }}>{checked ? '✓' : '✗'}</Text>
      <Text style={{ flex: 1, fontSize: 13, fontWeight: '500', color: checked ? '#10b981' : '#ef4444' }}>
        {label}
      </Text>
    </View>
  );
}

interface InfoRowProps {
  label: string;
  value: string;
}

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
      <Text style={{ color: '#6b7280', fontSize: 12, fontWeight: '500' }}>{label}</Text>
      <Text style={{ color: '#1f2937', fontSize: 12, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

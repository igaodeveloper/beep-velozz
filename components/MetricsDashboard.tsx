import React from 'react';
import { View, Text } from 'react-native';
import { SessionMetrics } from '@/types/session';
import { useAppTheme } from '@/utils/useAppTheme';

interface MetricCardProps {
  label: string;
  count: number;
  value: number;
  color: string;
  emoji: string;
}

function MetricCard({ label, count, value, color, emoji }: MetricCardProps) {
  const { colors } = useAppTheme();
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 12,
      alignItems: 'center',
      minWidth: 0,
    }}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <Text style={{ color, fontSize: 24, fontWeight: '800', marginTop: 4 }}>
        {count}
      </Text>
      <Text style={{ color: colors.textSubtle, fontSize: 9, fontWeight: '600', marginTop: 2 }}>
        {label}
      </Text>
      <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700', marginTop: 4 }}>
        R$ {value.toFixed(2)}
      </Text>
    </View>
  );
}

interface MetricsDashboardProps {
  metrics: SessionMetrics;
  declaredCount: number;
}

export default function MetricsDashboard({ metrics, declaredCount }: MetricsDashboardProps) {
  const { colors } = useAppTheme();
  const progressPct = declaredCount > 0 ? Math.min((metrics.total / declaredCount) * 100, 100) : 0;
  const isComplete = metrics.total === declaredCount && declaredCount > 0;
  const isOver = metrics.total > declaredCount && declaredCount > 0;

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
      {/* Progress bar */}
      <View style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>
            PROGRESSO
          </Text>
          <Text style={{
            color: isComplete ? colors.success : isOver ? colors.danger : colors.primary,
            fontSize: 11, fontWeight: '700'
          }}>
            {metrics.total} / {declaredCount}
          </Text>
        </View>
        <View style={{ height: 6, backgroundColor: colors.surface2, borderRadius: 3 }}>
          <View style={{
            height: 6,
            width: `${progressPct}%` as any,
            backgroundColor: isComplete ? colors.success : isOver ? colors.danger : colors.primary,
            borderRadius: 3,
          }} />
        </View>
      </View>

      {/* Metric Cards */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
        <MetricCard label="SHOPEE" count={metrics.shopee} value={metrics.valueShopee} color="#ff5722" emoji="🛍️" />
        <MetricCard label="MERC. LIVRE" count={metrics.mercadoLivre} value={metrics.valueMercadoLivre} color="#ffe600" emoji="🟡" />
        <MetricCard label="AVULSOS" count={metrics.avulsos} value={metrics.valueAvulsos} color="#64748b" emoji="📦" />
      </View>

      {/* Total Card */}
      <View style={{
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center'
      }}>
        <Text style={{ color: colors.secondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 }}>
          TOTAL GERAL
        </Text>
        <Text style={{ color: colors.secondary, fontSize: 32, fontWeight: '800', marginTop: 4 }}>
          {metrics.total}
        </Text>
        <Text style={{ color: colors.secondary, fontSize: 16, fontWeight: '700', marginTop: 4 }}>
          R$ {metrics.valueTotal.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

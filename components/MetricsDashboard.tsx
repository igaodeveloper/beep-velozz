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
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 10,
      alignItems: 'center',
      minWidth: 0,
    }}>
      <Text style={{ fontSize: 16 }}>{emoji}</Text>
      <Text style={{ color, fontSize: 18, fontWeight: '800', marginTop: 3 }}>
        {count}
      </Text>
      <Text style={{ color: colors.textSubtle, fontSize: 8, fontWeight: '600', marginTop: 1 }}>
        {label}
      </Text>
      <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700', marginTop: 3 }}>
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
    <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 }}>
      {/* Progress bar */}
      <View style={{ marginBottom: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
          <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '600', letterSpacing: 0.3 }}>
            PROGRESSO
          </Text>
          <Text style={{
            color: isComplete ? colors.success : isOver ? colors.danger : colors.primary,
            fontSize: 10, fontWeight: '700'
          }}>
            {metrics.total} / {declaredCount}
          </Text>
        </View>
        <View style={{ height: 5, backgroundColor: colors.surface2, borderRadius: 2.5 }}>
          <View style={{
            height: 5,
            width: `${progressPct}%` as any,
            backgroundColor: isComplete ? colors.success : isOver ? colors.danger : colors.primary,
            borderRadius: 2.5,
          }} />
        </View>
      </View>

      {/* Metric Cards */}
      <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <MetricCard label="SHOPEE" count={metrics.shopee} value={metrics.valueShopee} color="#ff5722" emoji="🛍️" />
        <MetricCard label="MERC. LIVRE" count={metrics.mercadoLivre} value={metrics.valueMercadoLivre} color="#ffe600" emoji="🟡" />
        <MetricCard label="AVULSOS" count={metrics.avulsos} value={metrics.valueAvulsos} color="#64748b" emoji="📦" />
      </View>

      {/* Total Card */}
      <View style={{
        backgroundColor: colors.primary,
        borderRadius: 10,
        padding: 10,
        alignItems: 'center'
      }}>
        <Text style={{ color: colors.secondary, fontSize: 10, fontWeight: '600', letterSpacing: 0.3 }}>
          TOTAL GERAL
        </Text>
        <Text style={{ color: colors.secondary, fontSize: 18, fontWeight: '800', marginTop: 2 }}>
          {metrics.total}
        </Text>
        <Text style={{ color: colors.secondary, fontSize: 11, fontWeight: '600', marginTop: 1 }}>
          R$ {metrics.valueTotal.toFixed(2)}
        </Text>
      </View>
    </View>
  );
}

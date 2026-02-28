import React from 'react';
import { View, Text } from 'react-native';
import { SessionMetrics } from '@/types/session';
import { useAppTheme } from '@/utils/useAppTheme';

interface MetricCardProps {
  label: string;
  value: number;
  color: string;
  emoji: string;
}

function MetricCard({ label, value, color, emoji }: MetricCardProps) {
  const { colors } = useAppTheme();
  return (
    <View style={{
      flex: 1,
      backgroundColor: colors.bg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.surface2,
      padding: 12,
      alignItems: 'center',
      minWidth: 0,
    }}>
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
      <Text style={{ color, fontSize: 26, fontWeight: '800', marginTop: 4, lineHeight: 30 }}>
        {value}
      </Text>
      <Text style={{ color: colors.textSubtle, fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textAlign: 'center', marginTop: 2 }}>
        {label}
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
          <Text style={{ color: colors.textSubtle, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 }}>
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
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <MetricCard label="SHOPEE" value={metrics.shopee} color="#ff5722" emoji="🛍️" />
        <MetricCard label="MERC. LIVRE" value={metrics.mercadoLivre} color="#ffe600" emoji="🟡" />
        <MetricCard label="AVULSOS" value={metrics.avulsos} color="#64748b" emoji="📦" />
        <MetricCard label="TOTAL" value={metrics.total} color={colors.primary} emoji="✅" />
      </View>
    </View>
  );
}

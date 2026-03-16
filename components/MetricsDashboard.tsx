import React, { memo, useMemo } from 'react';
import { View, Text } from 'react-native';
import { SessionMetrics } from '@/types/session';
import { useAppTheme } from '@/utils/useAppTheme';

interface MetricCardProps {
  label: string;
  count: number;
  color: string;
  emoji: string;
}

const MetricCard = memo(({ label, count, color, emoji }: MetricCardProps) => {
  const { colors } = useAppTheme();
  const cardStyle = useMemo(() => ({
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    alignItems: 'center' as const,
    minWidth: 0,
  }), [colors]);
  
  const countStyle = useMemo(() => ({
    color, 
    fontSize: 18, 
    fontWeight: '800' as const, 
    marginTop: 3
  }), [color]);
  
  const labelStyle = useMemo(() => ({
    color: colors.textSubtle, 
    fontSize: 8, 
    fontWeight: '600' as const, 
    marginTop: 1
  }), [colors.textSubtle]);
  
  return (
    <View style={cardStyle}>
      <Text style={{ fontSize: 16 }}>{emoji}</Text>
      <Text style={countStyle}>
        {count}
      </Text>
      <Text style={labelStyle}>
        {label}
      </Text>
    </View>
  );
});

MetricCard.displayName = 'MetricCard';

interface MetricsDashboardProps {
  metrics: SessionMetrics;
  declaredCount: number;
}

export default memo(function MetricsDashboard({ metrics, declaredCount }: MetricsDashboardProps) {
  const { colors } = useAppTheme();
  
  const progressData = useMemo(() => {
    const progressPct = declaredCount > 0 ? Math.min((metrics.total / declaredCount) * 100, 100) : 0;
    const isComplete = metrics.total === declaredCount && declaredCount > 0;
    const isOver = metrics.total > declaredCount && declaredCount > 0;
    return { progressPct, isComplete, isOver };
  }, [metrics.total, declaredCount]);
  
  const containerStyle = useMemo(() => ({
    paddingHorizontal: 12, 
    paddingTop: 8, 
    paddingBottom: 4
  }), []);
  
  const progressContainerStyle = useMemo(() => ({ marginBottom: 8 }), []);
  
  const progressHeaderStyle = useMemo(() => ({
    flexDirection: 'row' as const, 
    justifyContent: 'space-between' as const, 
    marginBottom: 4
  }), []);
  
  const progressLabelStyle = useMemo(() => ({
    color: colors.textMuted, 
    fontSize: 10, 
    fontWeight: '600' as const, 
    letterSpacing: 0.3
  }), [colors.textMuted]);
  
  const progressCountStyle = useMemo(() => ({
    color: progressData.isComplete ? colors.success : progressData.isOver ? colors.danger : colors.primary,
    fontSize: 10, 
    fontWeight: '700' as const
  }), [progressData.isComplete, progressData.isOver, colors]);
  
  const progressBarBgStyle = useMemo(() => ({
    height: 5, 
    backgroundColor: colors.surface2, 
    borderRadius: 2.5
  }), [colors.surface2]);
  
  const progressBarStyle = useMemo(() => ({
    height: 5,
    width: `${progressData.progressPct}%` as any,
    backgroundColor: progressData.isComplete ? colors.success : progressData.isOver ? colors.danger : colors.primary,
    borderRadius: 2.5,
  }), [progressData.progressPct, progressData.isComplete, progressData.isOver, colors]);
  
  const metricCardsContainerStyle = useMemo(() => ({
    flexDirection: 'row' as const, 
    gap: 6, 
    marginBottom: 8, 
    flexWrap: 'wrap' as const
  }), []);
  
  const totalCardStyle = useMemo(() => ({
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 10,
    alignItems: 'center' as const
  }), [colors.primary]);
  
  const totalLabelStyle = useMemo(() => ({
    color: colors.secondary, 
    fontSize: 10, 
    fontWeight: '600' as const, 
    letterSpacing: 0.3
  }), [colors.secondary]);
  
  const totalValueStyle = useMemo(() => ({
    color: colors.secondary, 
    fontSize: 18, 
    fontWeight: '800' as const, 
    marginTop: 2
  }), [colors.secondary]);

  return (
    <View style={containerStyle}>
      {/* Progress bar */}
      <View style={progressContainerStyle}>
        <View style={progressHeaderStyle}>
          <Text style={progressLabelStyle}>
            PROGRESSO
          </Text>
          <Text style={progressCountStyle}>
            {metrics.total} / {declaredCount}
          </Text>
        </View>
        <View style={progressBarBgStyle}>
          <View style={progressBarStyle} />
        </View>
      </View>

      {/* Metric Cards */}
      <View style={metricCardsContainerStyle}>
        <MetricCard label="SHOPEE" count={metrics.shopee} color="#ff5722" emoji="🛍️" />
        <MetricCard label="MERC. LIVRE" count={metrics.mercadoLivre} color="#ffe600" emoji="🟡" />
        <MetricCard label="AVULSOS" count={metrics.avulsos} color="#64748b" emoji="📦" />
      </View>

      {/* Total Card */}
      <View style={totalCardStyle}>
        <Text style={totalLabelStyle}>
          TOTAL GERAL
        </Text>
        <Text style={totalValueStyle}>
          {metrics.total}
        </Text>
      </View>
    </View>
  );
});

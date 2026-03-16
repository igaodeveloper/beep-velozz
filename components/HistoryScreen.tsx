import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import MainLayout from '@/components/MainLayout';
import SimpleScrollView from '@/components/SimpleScrollView';
import OptimizedFlatList from '@/components/OptimizedFlatList';
import { Session } from '@/types/session';
import { loadSessions } from '@/utils/storage';
import { getSessionMetrics } from '@/utils/session';
import {
  Calendar,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  Users,
  Package,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react-native';
import { useResponsive, useResponsiveTypography, useResponsiveSpacing, useResponsiveGrid } from '@/hooks/useResponsiveAdvanced';

interface HistoryScreenProps {
  onSessionSelect?: (session: Session) => void;
  onBack?: () => void;
}

export default function HistoryScreen({ onSessionSelect, onBack }: HistoryScreenProps) {
  const { colors } = useAppTheme();
  const responsive = useResponsive();
  const typography = useResponsiveTypography();
  const spacing = useResponsiveSpacing();
  const grid = useResponsiveGrid();
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'operator' | 'packages'>('date');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessionsData();
  }, []);

  useEffect(() => {
    filterAndSortSessions();
  }, [sessions, searchQuery, selectedFilter, sortBy]);

  const loadSessionsData = async () => {
    try {
      const loadedSessions = await loadSessions();
      setSessions(loadedSessions.reverse()); // Most recent first
    } catch (error) {
      console.error('Error loading sessions:', error);
      Alert.alert('Erro', 'Não foi possível carregar o histórico');
    }
  };

  const filterAndSortSessions = useCallback(() => {
    let filtered = [...sessions];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(session =>
        session.operatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply date filter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    switch (selectedFilter) {
      case 'today':
        filtered = filtered.filter(session => {
          const sessionDate = new Date(session.startedAt);
          return sessionDate >= today;
        });
        break;
      case 'week':
        filtered = filtered.filter(session => {
          const sessionDate = new Date(session.startedAt);
          return sessionDate >= weekAgo;
        });
        break;
      case 'month':
        filtered = filtered.filter(session => {
          const sessionDate = new Date(session.startedAt);
          return sessionDate >= monthAgo;
        });
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime();
        case 'operator':
          return a.operatorName.localeCompare(b.operatorName);
        case 'packages':
          return b.packages.length - a.packages.length;
        default:
          return 0;
      }
    });

    setFilteredSessions(filtered);
  }, [sessions, searchQuery, selectedFilter, sortBy]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSessionsData();
    setRefreshing(false);
  }, []);

  const getSessionStatusColor = useCallback((session: Session) => {
    if (session.hasDivergence) return colors.danger;
    if (session.packages.length === 0) return colors.warning;
    return colors.success;
  }, [colors]);

  const getSessionStatusText = useCallback((session: Session) => {
    if (session.hasDivergence) return 'Divergência';
    if (session.packages.length === 0) return 'Vazia';
    return 'Concluída';
  }, []);

  const formatDate = useCallback((dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  // Responsive styles
  const cardStyle = useMemo(() => ({
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: responsive.isMobile ? 12 : 14,
    padding: responsive.isMobile ? spacing.md : spacing.lg,
    marginBottom: spacing.sm,
  }), [responsive, colors, spacing]);

  const headerStyle = useMemo(() => ({
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.lg,
    padding: spacing.lg,
  }), [spacing]);

  const filterButtonStyle = useCallback((isActive: boolean) => ({
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: responsive.isMobile ? spacing.xs : spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: responsive.isMobile ? 8 : 10,
    backgroundColor: isActive ? colors.primary : colors.surface,
    borderColor: isActive ? colors.primary : colors.border,
    borderWidth: 1,
    marginRight: spacing.xs,
  }), [responsive, colors, spacing]);

  // Render session item
  const renderSessionItem = useCallback(({ item: session }: { item: Session }) => (
    <TouchableOpacity
      style={cardStyle}
      onPress={() => onSessionSelect?.(session)}
      activeOpacity={0.7}
    >
      {/* Session Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: typography.h3, fontWeight: '600', marginBottom: spacing.xs }}>
            {session.operatorName}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: typography.caption }}>
            {formatDate(session.startedAt)}
          </Text>
        </View>
        <View style={{
          backgroundColor: getSessionStatusColor(session) + '20',
          paddingHorizontal: spacing.sm,
          paddingVertical: spacing.xs,
          borderRadius: 6,
        }}>
          <Text style={{ color: getSessionStatusColor(session), fontSize: typography.small, fontWeight: '600' }}>
            {getSessionStatusText(session)}
          </Text>
        </View>
      </View>

      {/* Session Metrics */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Package size={responsive.isMobile ? 16 : 20} color={colors.textMuted} style={{ marginRight: spacing.xs }} />
          <Text style={{ color: colors.text, fontSize: typography.body, fontWeight: '500' }}>
            {session.packages.length}/{session.declaredCount}
          </Text>
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Clock size={responsive.isMobile ? 16 : 20} color={colors.textMuted} style={{ marginRight: spacing.xs }} />
          <Text style={{ color: colors.textMuted, fontSize: typography.caption }}>
            {new Date(session.startedAt).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {session.hasDivergence && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <AlertTriangle size={responsive.isMobile ? 16 : 20} color={colors.danger} style={{ marginRight: spacing.xs }} />
            <Text style={{ color: colors.danger, fontSize: typography.caption, fontWeight: '600' }}>
              Atenção
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  ), [cardStyle, colors, typography, spacing, responsive, getSessionStatusColor, getSessionStatusText, formatDate, onSessionSelect]);

  // Render filter buttons
  const renderFilterButtons = () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md }}>
      {[
        { key: 'all', label: 'Todos' },
        { key: 'today', label: 'Hoje' },
        { key: 'week', label: '7 dias' },
        { key: 'month', label: '30 dias' },
      ].map((filter) => (
        <TouchableOpacity
          key={filter.key}
          style={filterButtonStyle(selectedFilter === filter.key)}
          onPress={() => setSelectedFilter(filter.key as any)}
          activeOpacity={0.7}
        >
          <Text style={{
            color: selectedFilter === filter.key ? colors.secondary : colors.textMuted,
            fontSize: typography.caption,
            fontWeight: '600',
          }}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <MainLayout>
      <SimpleScrollView
        enableRefreshControl
        onRefresh={onRefresh}
        refreshing={refreshing}
        responsivePadding
      >
        {/* Header */}
        <View style={headerStyle}>
          <View>
            <Text style={{ color: colors.text, fontSize: typography.h1, fontWeight: '700', marginBottom: spacing.sm }}>
              Histórico
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: typography.body }}>
              {filteredSessions.length} sessões encontradas
            </Text>
          </View>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={{ padding: spacing.sm }}>
              <Text style={{ color: colors.primary, fontSize: typography.body, fontWeight: '600' }}>
                ← Voltar
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.lg }}>
          {renderFilterButtons()}
          
          {/* Sort Options */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.textMuted, fontSize: typography.caption }}>
              Ordenar por:
            </Text>
            <View style={{ flexDirection: 'row' }}>
              {[
                { key: 'date', label: 'Data' },
                { key: 'operator', label: 'Operador' },
                { key: 'packages', label: 'Pacotes' },
              ].map((sort) => (
                <TouchableOpacity
                  key={sort.key}
                  style={{
                    paddingVertical: spacing.xs,
                    paddingHorizontal: spacing.sm,
                    marginLeft: spacing.xs,
                    backgroundColor: sortBy === sort.key ? colors.primary : 'transparent',
                    borderRadius: 6,
                  }}
                  onPress={() => setSortBy(sort.key as any)}
                  activeOpacity={0.7}
                >
                  <Text style={{
                    color: sortBy === sort.key ? colors.secondary : colors.textMuted,
                    fontSize: typography.small,
                    fontWeight: '600',
                  }}>
                    {sort.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Sessions List */}
        <View style={{ paddingHorizontal: spacing.lg }}>
          <OptimizedFlatList
            data={filteredSessions}
            renderItem={renderSessionItem}
            itemHeight={responsive.isMobile ? 120 : 140}
            maxToRenderPerBatch={10}
            removeClippedSubviews
            emptyText="Nenhuma sessão encontrada"
          />
        </View>

        {/* Summary Stats */}
        {filteredSessions.length > 0 && (
          <View style={{ 
            marginHorizontal: spacing.lg, 
            marginTop: spacing.xl,
            padding: spacing.lg,
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: responsive.isMobile ? 12 : 14,
          }}>
            <Text style={{ color: colors.text, fontSize: typography.h3, fontWeight: '600', marginBottom: spacing.md }}>
              Resumo do Período
            </Text>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: colors.primary, fontSize: typography.h2, fontWeight: '700' }}>
                  {filteredSessions.length}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: typography.caption }}>
                  Sessões
                </Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: colors.success, fontSize: typography.h2, fontWeight: '700' }}>
                  {filteredSessions.reduce((sum, s) => sum + s.packages.length, 0)}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: typography.caption }}>
                  Pacotes
                </Text>
              </View>
              
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: colors.danger, fontSize: typography.h2, fontWeight: '700' }}>
                  {filteredSessions.filter(s => s.hasDivergence).length}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: typography.caption }}>
                  Divergências
                </Text>
              </View>
            </View>
          </View>
        )}
      </SimpleScrollView>
    </MainLayout>
  );
}

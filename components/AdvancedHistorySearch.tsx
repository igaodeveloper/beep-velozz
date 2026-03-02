import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, FlatList } from 'react-native';
import { Session } from '@/types/session';
import { useAppTheme } from '@/utils/useAppTheme';
import { getSessionMetrics } from '@/utils/session';

interface AdvancedHistorySearchProps {
  sessions: Session[];
  onSessionSelect: (session: Session) => void;
  onClose: () => void;
}

export default function AdvancedHistorySearch({
  sessions,
  onSessionSelect,
  onClose,
}: AdvancedHistorySearchProps) {
  const { colors } = useAppTheme();

  // Filtros
  const [searchText, setSearchText] = useState('');
  const [filterOperator, setFilterOperator] = useState<string | null>(null);
  const [filterDriver, setFilterDriver] = useState<string | null>(null);
  const [filterMarketplace, setFilterMarketplace] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'ok' | 'divergence' | 'pending'>('all');
  const [dateRange, setDateRange] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Extrair valores únicos para filtros
  const uniqueOperators = useMemo(() => [...new Set(sessions.map((s) => s.operatorName))], [sessions]);
  const uniqueDrivers = useMemo(() => [...new Set(sessions.map((s) => s.driverName))], [sessions]);

  // Filtrar sessões
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      // Busca por texto
      const matchesSearch =
        searchText === '' ||
        session.operatorName.toLowerCase().includes(searchText.toLowerCase()) ||
        session.driverName.toLowerCase().includes(searchText.toLowerCase()) ||
        session.id.toLowerCase().includes(searchText.toLowerCase());

      // Filtro de operador
      const matchesOperator = !filterOperator || session.operatorName === filterOperator;

      // Filtro de motorista
      const matchesDriver = !filterDriver || session.driverName === filterDriver;

      // Filtro de marketplace
      let matchesMarketplace = true;
      if (filterMarketplace) {
        const metrics = getSessionMetrics(session.packages);
        const hasMarketplace =
          (filterMarketplace === 'shopee' && metrics.shopee > 0) ||
          (filterMarketplace === 'mercado_livre' && metrics.mercadoLivre > 0) ||
          (filterMarketplace === 'avulso' && metrics.avulsos > 0);
        matchesMarketplace = hasMarketplace;
      }

      // Filtro de status
      let matchesStatus = true;
      if (filterStatus === 'ok') {
        matchesStatus = !session.hasDivergence;
      } else if (filterStatus === 'divergence') {
        matchesStatus = session.hasDivergence;
      } else if (filterStatus === 'pending') {
        matchesStatus = !session.completedAt;
      }

      // Filtro de data
      let matchesDateRange = true;
      const now = new Date();
      const sessionDate = new Date(session.startedAt);

      if (dateRange === 'today') {
        matchesDateRange =
          sessionDate.toDateString() === now.toDateString();
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        matchesDateRange = sessionDate >= weekAgo;
      } else if (dateRange === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        matchesDateRange = sessionDate >= monthAgo;
      }

      return (
        matchesSearch &&
        matchesOperator &&
        matchesDriver &&
        matchesMarketplace &&
        matchesStatus &&
        matchesDateRange
      );
    });
  }, [sessions, searchText, filterOperator, filterDriver, filterMarketplace, filterStatus, dateRange]);

  const stats = useMemo(() => {
    const metrics = filteredSessions.map((s) => getSessionMetrics(s.packages));
    return {
      total: filteredSessions.length,
      packages: metrics.reduce((sum, m) => sum + m.total, 0),
      value: metrics.reduce((sum, m) => sum + m.valueTotal, 0),
      divergences: filteredSessions.filter((s) => s.hasDivergence).length,
    };
  }, [filteredSessions]);

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
            BUSCA AVANÇADA
          </Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>
            Histórico de Sessões
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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
        {/* Search Bar */}
        <TextInput
          style={{
            backgroundColor: colors.surface,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: colors.text,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
          placeholder="Buscar por operador, motorista ou ID..."
          placeholderTextColor={colors.textMuted}
          value={searchText}
          onChangeText={setSearchText}
        />

        {/* Filter Sections */}
        <FilterSection
          title="Status"
          options={[
            { label: 'Todos', value: 'all', icon: '📋' },
            { label: 'Conforme', value: 'ok', icon: '✅' },
            { label: 'Divergência', value: 'divergence', icon: '⚠️' },
            { label: 'Pendente', value: 'pending', icon: '⏳' },
          ]}
          selected={filterStatus}
          onSelect={(value) => setFilterStatus(value as any)}
          colors={colors}
        />

        <FilterSection
          title="Período"
          options={[
            { label: 'Todos', value: 'all', icon: '📅' },
            { label: 'Hoje', value: 'today', icon: '📅' },
            { label: 'Esta Semana', value: 'week', icon: '📅' },
            { label: 'Este Mês', value: 'month', icon: '📅' },
          ]}
          selected={dateRange}
          onSelect={(value) => setDateRange(value as any)}
          colors={colors}
        />

        {/* Operador Filter */}
        {uniqueOperators.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
              OPERADORES
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
              <FilterTag
                label="Todos"
                selected={!filterOperator}
                onPress={() => setFilterOperator(null)}
                colors={colors}
              />
              {uniqueOperators.map((op) => (
                <FilterTag
                  key={op}
                  label={op}
                  selected={filterOperator === op}
                  onPress={() => setFilterOperator(op)}
                  colors={colors}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Motorista Filter */}
        {uniqueDrivers.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
              MOTORISTAS
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16, paddingHorizontal: 16 }}>
              <FilterTag
                label="Todos"
                selected={!filterDriver}
                onPress={() => setFilterDriver(null)}
                colors={colors}
              />
              {uniqueDrivers.map((driver) => (
                <FilterTag
                  key={driver}
                  label={driver}
                  selected={filterDriver === driver}
                  onPress={() => setFilterDriver(driver)}
                  colors={colors}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Marketplace Filter */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
            MARKETPLACE
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <FilterTag
              label="Todos"
              selected={!filterMarketplace}
              onPress={() => setFilterMarketplace(null)}
              colors={colors}
            />
            <FilterTag
              label="🛍️ Shopee"
              selected={filterMarketplace === 'shopee'}
              onPress={() => setFilterMarketplace('shopee')}
              colors={colors}
            />
            <FilterTag
              label="🟡 ML"
              selected={filterMarketplace === 'mercado_livre'}
              onPress={() => setFilterMarketplace('mercado_livre')}
              colors={colors}
            />
            <FilterTag
              label="📦 Avulsos"
              selected={filterMarketplace === 'avulso'}
              onPress={() => setFilterMarketplace('avulso')}
              colors={colors}
            />
          </View>
        </View>

        {/* Stats */}
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
            RESUMO DOS RESULTADOS
          </Text>
          <View style={{ gap: 8 }}>
            <StatRow label="Sessões Encontradas" value={stats.total.toString()} colors={colors} />
            <StatRow label="Total de Pacotes" value={stats.packages.toString()} colors={colors} />
            <StatRow label="Valor Total" value={`R$ ${stats.value.toFixed(2).replace('.', ',')}`} colors={colors} />
            <StatRow
              label="Com Divergência"
              value={stats.divergences.toString()}
              colors={colors}
              color={stats.divergences > 0 ? colors.warning : colors.success}
            />
          </View>
        </View>

        {/* Sessions List */}
        {filteredSessions.length > 0 ? (
          <FlatList
            scrollEnabled={false}
            data={filteredSessions}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <SessionItemCompact session={item} onPress={() => onSessionSelect(item)} colors={colors} />
            )}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          />
        ) : (
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 14,
              padding: 24,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 4 }}>
              Nenhuma sessão encontrada
            </Text>
            <Text style={{ color: colors.textMuted, fontSize: 12, textAlign: 'center' }}>
              Tente ajustar suas preferências de filtro
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

interface FilterSectionProps {
  title: string;
  options: { label: string; value: string; icon: string }[];
  selected: string;
  onSelect: (value: string) => void;
  colors: any;
}

function FilterSection({ title, options, selected, onSelect, colors }: FilterSectionProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 }}>
        {title}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => onSelect(option.value)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 8,
              backgroundColor: selected === option.value ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: selected === option.value ? colors.primary : colors.border,
            }}
          >
            <Text
              style={{
                color: selected === option.value ? '#fff' : colors.text,
                fontSize: 12,
                fontWeight: '600',
              }}
            >
              {option.icon} {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

interface FilterTagProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  colors: any;
}

function FilterTag({ label, selected, onPress, colors }: FilterTagProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        backgroundColor: selected ? colors.primary : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        marginRight: 8,
      }}
    >
      <Text
        style={{
          color: selected ? '#fff' : colors.text,
          fontSize: 11,
          fontWeight: '600',
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

interface StatRowProps {
  label: string;
  value: string;
  colors: any;
  color?: string;
}

function StatRow({ label, value, colors, color }: StatRowProps) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '500' }}>{label}</Text>
      <Text style={{ color: color || colors.primary, fontSize: 13, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

interface SessionItemCompactProps {
  session: Session;
  onPress: () => void;
  colors: any;
}

function SessionItemCompact({ session, onPress, colors }: SessionItemCompactProps) {
  const metrics = getSessionMetrics(session.packages);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: colors.surface,
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.surface2,
        borderLeftWidth: 4,
        borderLeftColor: session.hasDivergence ? colors.warning : colors.success,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
            {session.operatorName}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
            {new Date(session.startedAt).toLocaleDateString('pt-BR')} às{' '}
            {new Date(session.startedAt).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {session.hasDivergence ? (
            <Text style={{ fontSize: 14 }}>⚠️</Text>
          ) : (
            <Text style={{ fontSize: 14 }}>✅</Text>
          )}
        </View>
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ color: colors.textMuted, fontSize: 11 }}>
          {metrics.total} pacotes • R$ {metrics.valueTotal.toFixed(2).replace('.', ',')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

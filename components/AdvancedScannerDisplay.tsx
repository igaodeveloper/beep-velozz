import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useAppTheme } from '@/utils/useAppTheme';
import {
  analyzeCodeAdvanced,
  AdvancedScanAnalysis,
  ConfidenceLevel,
} from '@/utils/advancedScanner';

interface AdvancedScannerDisplayProps {
  analysis?: AdvancedScanAnalysis;
  isLoading?: boolean;
  onInput?: (code: string) => void;
  hideRawAnalysis?: boolean;
}

/**
 * Componente visual profissional para exibição de análise de scan avançada
 */
export default function AdvancedScannerDisplay({
  analysis,
  isLoading = false,
  onInput,
  hideRawAnalysis = false,
}: AdvancedScannerDisplayProps) {
  const { colors } = useAppTheme();
  const [inputValue, setInputValue] = useState('');
  const [displayAnalysis, setDisplayAnalysis] = useState<AdvancedScanAnalysis | null>(null);

  useEffect(() => {
    setDisplayAnalysis(analysis || null);
  }, [analysis]);

  const handleInputChange = (text: string) => {
    setInputValue(text);
    if (onInput) onInput(text);
  };

  const getConfidenceColor = (confidence: ConfidenceLevel): string => {
    switch (confidence) {
      case 'critical':
        return '#22c55e'; // green
      case 'high':
        return '#3b82f6'; // blue
      case 'medium':
        return '#f59e0b'; // amber
      case 'low':
        return '#ef4444'; // red
      case 'rejected':
        return '#6b7280'; // gray
      default:
        return colors.textMuted;
    }
  };

  const getConfidenceIcon = (confidence: ConfidenceLevel): 'verified' | 'check-circle' | 'help' | 'warning' | 'block' | 'help-outline' => {
    switch (confidence) {
      case 'critical':
        return 'verified';
      case 'high':
        return 'check-circle';
      case 'medium':
        return 'help';
      case 'low':
        return 'warning';
      case 'rejected':
        return 'block';
      default:
        return 'help-outline';
    }
  };

  const getConfidenceLabel = (confidence: ConfidenceLevel): string => {
    switch (confidence) {
      case 'critical':
        return 'Crítico ✓';
      case 'high':
        return 'Alto';
      case 'medium':
        return 'Médio';
      case 'low':
        return 'Baixo';
      case 'rejected':
        return 'Rejeitado';
      default:
        return 'Desconhecido';
    }
  };

  const typeColors: Record<string, { bg: string; text: string }> = {
    shopee: { bg: '#ff5722', text: '#fff' },
    mercado_livre: { bg: '#ffe600', text: '#333' },
    avulso: { bg: '#64748b', text: '#fff' },
    unknown: { bg: '#9ca3af', text: '#fff' },
  };

  const typeColor = typeColors[displayAnalysis?.type || 'unknown'];

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Input para manual testing */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 8 }}>
          CÓDIGO (manual)
        </Text>
        <TextInput
          value={inputValue}
          onChangeText={handleInputChange}
          placeholder="Scan ou digite um código..."
          placeholderTextColor={colors.textSubtle}
          style={{
            backgroundColor: colors.surface2,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 8,
            padding: 12,
            color: colors.text,
            fontSize: 16,
            fontWeight: '500',
          }}
        />
      </View>

      {isLoading && (
        <View style={{ alignItems: 'center', padding: 20 }}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      )}

      {!displayAnalysis && !isLoading && (
        <View style={{ alignItems: 'center', padding: 40 }}>
          <MaterialIcons name="qr-code-scanner" size={48} color={colors.textMuted} />
          <Text style={{ color: colors.textMuted, marginTop: 12, fontSize: 14 }}>
            Escaneie um código para análise
          </Text>
        </View>
      )}

      {displayAnalysis && !isLoading && (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header com tipo e código */}
          <View
            style={{
              backgroundColor: typeColor.bg,
              padding: 16,
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <Text style={{ color: typeColor.text, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>
              {displayAnalysis.type.toUpperCase()}
            </Text>
            <Text style={{ color: typeColor.text, fontSize: 18, fontWeight: '800', fontFamily: 'monospace' }}>
              {displayAnalysis.normalized}
            </Text>
            {displayAnalysis.marketplace && (
              <Text style={{ color: typeColor.text, fontSize: 11, marginTop: 6 }}>
                📍 {displayAnalysis.marketplace}
              </Text>
            )}
          </View>

          {/* Confiança - Card destaque */}
          <View
            style={[
              styles.confidenceCard,
              {
                backgroundColor: getConfidenceColor(displayAnalysis.confidence) + '15',
                borderColor: getConfidenceColor(displayAnalysis.confidence),
                borderWidth: 2,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <MaterialIcons
                name={getConfidenceIcon(displayAnalysis.confidence)}
                size={28}
                color={getConfidenceColor(displayAnalysis.confidence)}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>
                  GRAU DE CONFIANÇA
                </Text>
                <Text
                  style={{
                    color: getConfidenceColor(displayAnalysis.confidence),
                    fontSize: 20,
                    fontWeight: '800',
                  }}
                >
                  {getConfidenceLabel(displayAnalysis.confidence)} ({displayAnalysis.confidence_score}%)
                </Text>
              </View>
            </View>
          </View>

          {/* Padrão Detectado */}
          {displayAnalysis.matched_pattern && (
            <View style={[styles.infoCard, { borderColor: colors.border }]}>
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 6 }}>
                PADRÃO
              </Text>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
                ✓ {displayAnalysis.matched_pattern}
              </Text>
            </View>
          )}

          {/* Validação de Checksum */}
          {displayAnalysis.checksum_valid !== undefined && (
            <View style={[styles.infoCard, { borderColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons
                  name={displayAnalysis.checksum_valid ? 'verified' : 'error'}
                  size={20}
                  color={displayAnalysis.checksum_valid ? '#22c55e' : '#ef4444'}
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>
                    CHECKSUM
                  </Text>
                  <Text
                    style={{
                      color: displayAnalysis.checksum_valid ? '#22c55e' : '#ef4444',
                      fontSize: 13,
                      fontWeight: '600',
                    }}
                  >
                    {displayAnalysis.checksum_valid ? 'Válido' : 'Inválido'}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Alertas de Anomalias */}
          {displayAnalysis.is_suspicious && displayAnalysis.anomaly_flags.length > 0 && (
            <View style={[styles.warningCard, { borderColor: '#ef4444' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                <MaterialIcons name="warning" size={20} color="#ef4444" />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 8 }}>
                    ⚠️ ALERTAS
                  </Text>
                  {displayAnalysis.anomaly_flags.map((flag, idx) => (
                    <Text key={idx} style={{ color: colors.text, fontSize: 12, marginBottom: 4 }}>
                      • {flag.replace(/_/g, ' ')}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Análise Raw (opcional) */}
          {!hideRawAnalysis && (
            <View
              style={[
                styles.rawAnalysisCard,
                {
                  backgroundColor: colors.surface2,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 12 }}>
                ANÁLISE DETALHADA
              </Text>
              <View style={{ gap: 8 }}>
                <DetailRow
                  label="Comprimento"
                  value={`${displayAnalysis.raw_analysis.length} caracteres`}
                  colors={colors}
                />
                <DetailRow
                  label="Padrão"
                  value={displayAnalysis.raw_analysis.looks_like_barcode ? 'Barcode Numérico' : 'Alfanumérico'}
                  colors={colors}
                />
                <DetailRow
                  label="Prefixo"
                  value={displayAnalysis.raw_analysis.prefix || 'Nenhum'}
                  colors={colors}
                />
                <DetailRow
                  label="Múltiplas Correspondências"
                  value={`${displayAnalysis.raw_analysis.matches_multiple_patterns} padrão(ões)`}
                  colors={colors}
                />
              </View>
            </View>
          )}

          {/* Código Original */}
          <View style={[styles.infoCard, { borderColor: colors.border }]}>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '700', marginBottom: 6 }}>
              CÓDIGO ORIGINAL
            </Text>
            <Text
              style={{
                color: colors.text,
                fontSize: 12,
                fontFamily: 'monospace',
                backgroundColor: colors.surface2,
                padding: 8,
                borderRadius: 6,
              }}
            >
              {displayAnalysis.code}
            </Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </View>
  );
}

function DetailRow(
  props: {
    label: string;
    value: string;
    colors: any;
  }
) {
  const { label, value, colors } = props;
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ color: colors.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  confidenceCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  warningCard: {
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: '#ef444415',
  },
  rawAnalysisCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
});

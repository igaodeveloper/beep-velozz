/**
 * Enhanced Industrial Scanner with AI Features
 * Exemplo de integração das funcionalidades de IA no scanner existente
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useIndustrialScanner } from '@/utils/useIndustrialScanner';
import { useSmartScanner } from '@/hooks/useSmartScanner';
import { PackageType } from '@/types/scanner';
import { ScannedPackage } from '@/types/session';
import { SmartSuggestion } from '@/types/aiPatternRecognition';
import SmartSuggestionsOverlay from '@/components/SmartSuggestionsOverlay';
import { useAppTheme } from '@/utils/useAppTheme';

interface EnhancedIndustrialScannerProps {
  sessionId: string;
  operatorId: string;
  operatorName: string;
  maxScans: {
    shopee: number;
    mercado_livre: number;
    avulso: number;
  };
  onScanned: (code: string, type: string) => void;
  onEndSession: () => void;
}

export default function EnhancedIndustrialScanner({
  sessionId,
  operatorId,
  operatorName,
  maxScans,
  onScanned,
  onEndSession,
}: EnhancedIndustrialScannerProps) {
  const { colors } = useAppTheme();
  
  // Scanner industrial existente
  const scanner = useIndustrialScanner({
    maxAllowedScans: maxScans,
    debounceMs: 50,
  });

  // Novo sistema de IA
  const smartScanner = useSmartScanner({
    sessionId,
    operatorId,
    enablePatternDetection: true,
    enableSmartSuggestions: true,
    enableOperatorLearning: true,
  });

  // Estados locais
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [lastScanTime, setLastScanTime] = useState(0);

  // Handle de scan integrado com IA
  const handleEnhancedScan = useCallback(async (code: string) => {
    const now = Date.now();
    
    // Prevenir scans muito rápidos
    if (now - lastScanTime < 100) {
      return;
    }
    setLastScanTime(now);

    // Predição usando IA
    const prediction = smartScanner.predictPackageType(code);
    
    // Processar com scanner industrial
    const result = await scanner.processScan(code);
    
    if (result.success) {
      // Processar com IA para aprendizado
      await smartScanner.processScan(
        code,
        result.type as PackageType,
        prediction.type,
        now - lastScanTime
      );

      // Callback original
      onScanned(result.code, result.type || 'unknown');

      // Mostrar sugestões se houver alta confiança
      if (smartScanner.hasHighConfidenceSuggestions) {
        setTimeout(() => setShowSuggestions(true), 500);
      }
    } else {
      // Registrar falha para aprendizado
      await smartScanner.processScan(
        code,
        'avulso', // tipo fallback
        prediction.type,
        now - lastScanTime
      );
    }
  }, [scanner, smartScanner, onScanned, lastScanTime]);

  // Handle seleção de sugestão
  const handleSuggestionSelected = useCallback((suggestion: SmartSuggestion) => {
    // Processar sugestão como se fosse um scan manual
    handleEnhancedScan(suggestion.code);
    setShowSuggestions(false);
  }, [handleEnhancedScan]);

  // Toggle sugestões manualmente
  const toggleSuggestions = useCallback(() => {
    if (smartScanner.currentSuggestions.length > 0) {
      setShowSuggestions(!showSuggestions);
    } else {
      Alert.alert('Sugestões', 'Nenhuma sugestão disponível no momento.');
    }
  }, [smartScanner.currentSuggestions, showSuggestions]);

  // Gerar análise preditiva
  const showPredictiveAnalysis = useCallback(() => {
    const analysis = smartScanner.generatePredictiveAnalysis();
    
    Alert.alert(
      'Análise Preditiva',
      `Confiança de padrão: ${Math.round(analysis.currentSession.patternConfidence * 100)}%\n` +
      `Tempo estimado: ${Math.round(analysis.currentSession.completionPrediction)} min\n` +
      `Acurácia esperada: ${Math.round(analysis.currentSession.accuracyPrediction * 100)}%\n\n` +
      `Insights:\n${analysis.sessionInsights.join('\n')}`,
      [{ text: 'OK', style: 'default' }]
    );
  }, [smartScanner]);

  // Mostrar insights do operador
  const showOperatorInsights = useCallback(() => {
    const insights = smartScanner.operatorInsights;
    
    if (insights.length === 0) {
      Alert.alert('Insights', 'Nenhum insight disponível ainda.');
      return;
    }

    Alert.alert(
      'Seus Insights',
      insights.join('\n\n'),
      [{ text: 'OK', style: 'default' }]
    );
  }, [smartScanner.operatorInsights]);

  return (
    <View style={{ flex: 1 }}>
      {/* Header com informações da IA */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>
            🤖 IA Ativa
          </Text>
          {smartScanner.hasPatternsDetected && (
            <Text style={{ color: colors.success, fontSize: 10 }}>
              🔍 Padrões
            </Text>
          )}
          {smartScanner.hasHighConfidenceSuggestions && (
            <Text style={{ color: colors.warning, fontSize: 10 }}>
              💡 Sugestões
            </Text>
          )}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Botão de sugestões */}
          <TouchableOpacity
            onPress={toggleSuggestions}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: colors.primary,
              borderRadius: 12,
            }}
            disabled={smartScanner.currentSuggestions.length === 0}
          >
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
              💡 ({smartScanner.currentSuggestions.length})
            </Text>
          </TouchableOpacity>

          {/* Botão de análise */}
          <TouchableOpacity
            onPress={showPredictiveAnalysis}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: colors.success,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
              📊
            </Text>
          </TouchableOpacity>

          {/* Botão de insights */}
          <TouchableOpacity
            onPress={showOperatorInsights}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: colors.warning,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
              👤
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Área principal do scanner (substituir pelo componente existente) */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text, fontSize: 16, marginBottom: 16 }}>
          Scanner Industrial com IA
        </Text>
        
        <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', paddingHorizontal: 32 }}>
          Escaneie códigos para usar detecção de padrões, sugestões inteligentes e aprendizado contínuo.
        </Text>

        {/* Status da IA */}
        {smartScanner.insights.length > 0 && (
          <View style={{
            marginTop: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: colors.background,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            {smartScanner.insights.slice(0, 3).map((insight, index) => (
              <Text key={index} style={{ color: colors.textSecondary, fontSize: 11 }}>
                {insight}
              </Text>
            ))}
          </View>
        )}
      </View>

      {/* Overlay de sugestões inteligentes */}
      <SmartSuggestionsOverlay
        visible={showSuggestions}
        recentPackages={[]} // Preencher com pacotes reais da sessão
        operatorId={operatorId}
        onSuggestionSelected={handleSuggestionSelected}
        onDismiss={() => setShowSuggestions(false)}
      />

      {/* Indicador de processamento */}
      {smartScanner.isProcessing && (
        <View style={{
          position: 'absolute',
          top: 100,
          left: 16,
          backgroundColor: colors.primary,
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 12,
        }}>
          <Text style={{ color: 'white', fontSize: 10, fontWeight: '600' }}>
            🧠 Processando...
          </Text>
        </View>
      )}
    </View>
  );
}

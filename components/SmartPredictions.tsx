import React, { useMemo, useEffect, useState } from "react";
import { View, Text } from "react-native";
import { Session, ScannedPackage } from "@/types/session";
import { useAppTheme } from "@/utils/useAppTheme";
import {
  estimateCompletionTime,
  calculateOperatorStats,
} from "@/utils/analytics";

interface SmartPredictionsProps {
  packages: ScannedPackage[];
  declaredCount: number;
  historicalSessions: Session[];
  currentOperator: string;
}

export default function SmartPredictions({
  packages,
  declaredCount,
  historicalSessions,
  currentOperator,
}: SmartPredictionsProps) {
  const { colors } = useAppTheme();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Atualizar tempo decorrido
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const predictions = useMemo(() => {
    const remaining = Math.max(0, declaredCount - packages.length);
    const estimatedMinutes = estimateCompletionTime(
      packages.length,
      remaining,
      historicalSessions,
    );
    const elapsedMinutes = elapsedSeconds / 60;
    const ratePerMinute =
      elapsedMinutes > 0 ? packages.length / elapsedMinutes : 0;

    // Calcular velocidade do operador
    const operatorStats = calculateOperatorStats(historicalSessions);
    const operatorData = operatorStats.find(
      (stat) => stat.name === currentOperator,
    );
    const historicalRate = operatorData?.avgRatePerMinute || 10;

    // Estimativa em minutos
    const remainingTimeMinutes = estimatedMinutes;
    const remainingTimeSeconds = Math.round(remainingTimeMinutes * 60);
    const hours = Math.floor(remainingTimeMinutes / 60);
    const mins = Math.floor(remainingTimeMinutes % 60);

    // Velocidade atual vs esperada
    const velocityDiff = ratePerMinute - historicalRate;
    const velocityPercentage =
      historicalRate > 0 ? (velocityDiff / historicalRate) * 100 : 0;

    // Acurácia esperada
    const expectedAccuracy = operatorData?.accuracyScore || 85;

    return {
      remaining,
      estimatedMinutes: remainingTimeMinutes,
      estimatedTime: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
      ratePerMinute: Math.round(ratePerMinute * 100) / 100,
      historicalRate: Math.round(historicalRate * 100) / 100,
      velocityDiff,
      velocityPercentage,
      isAheadOfSchedule: velocityDiff > 0,
      expectedAccuracy,
      elapsedMinutes: Math.round(elapsedMinutes * 10) / 10,
    };
  }, [
    packages,
    declaredCount,
    historicalSessions,
    currentOperator,
    elapsedSeconds,
  ]);

  if (declaredCount === 0) {
    return null;
  }

  const progressPercent = (packages.length / declaredCount) * 100;
  const statusColor =
    progressPercent >= 90
      ? colors.success
      : progressPercent >= 70
        ? colors.primary
        : colors.warning;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.surface2,
        padding: 14,
        marginTop: 10,
      }}
    >
      {/* Progress Bar */}
      <View style={{ marginBottom: 12 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: "600",
              letterSpacing: 0.5,
            }}
          >
            PROGRESSO
          </Text>
          <Text style={{ color: statusColor, fontSize: 11, fontWeight: "700" }}>
            {packages.length} / {declaredCount} ({progressPercent.toFixed(0)}%)
          </Text>
        </View>
        <View
          style={{
            height: 6,
            backgroundColor: colors.surface2,
            borderRadius: 3,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: 6,
              width: `${Math.min(progressPercent, 100)}%`,
              backgroundColor: statusColor,
              borderRadius: 3,
            }}
          />
        </View>
      </View>

      {/* Predictions Grid */}
      <View style={{ gap: 8 }}>
        {/* Tempo Restante */}
        <PredictionRow
          icon="⏱️"
          label="Tempo Restante"
          value={predictions.estimatedTime}
          subtitle={`${predictions.remaining} pacotes • ${predictions.estimatedMinutes.toFixed(1)} min`}
          colors={colors}
        />

        {/* Velocidade */}
        <PredictionRow
          icon={predictions.isAheadOfSchedule ? "⚡" : "🐢"}
          label="Velocidade"
          value={`${predictions.ratePerMinute} pkg/min`}
          subtitle={
            predictions.isAheadOfSchedule
              ? `+${predictions.velocityPercentage.toFixed(0)}% acima da média`
              : `${predictions.velocityPercentage.toFixed(0)}% abaixo da média`
          }
          colors={colors}
          subtitleColor={
            predictions.isAheadOfSchedule ? colors.success : colors.warning
          }
        />

        {/* Tempo Decorrido */}
        <PredictionRow
          icon="⏳"
          label="Tempo Decorrido"
          value={`${predictions.elapsedMinutes} min`}
          subtitle={`Velocidade histórica: ${predictions.historicalRate} pkg/min`}
          colors={colors}
        />

        {/* Acurácia Esperada */}
        <PredictionRow
          icon="🎯"
          label="Acurácia Esperada"
          value={`${predictions.expectedAccuracy.toFixed(1)}%`}
          subtitle={
            predictions.expectedAccuracy > 95
              ? "Excelente desempenho"
              : predictions.expectedAccuracy > 85
                ? "Bom desempenho"
                : "Atenção necessária"
          }
          colors={colors}
          subtitleColor={
            predictions.expectedAccuracy > 95
              ? colors.success
              : predictions.expectedAccuracy > 85
                ? colors.primary
                : colors.warning
          }
        />
      </View>

      {/* Smart Tip */}
      {predictions.remaining > 0 && (
        <View
          style={{
            backgroundColor: colors.surface2,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 8,
            marginTop: 12,
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: "600" }}>
            💡{" "}
            {getSmartTip(
              predictions.remaining,
              predictions.estimatedTime,
              predictions.expectedAccuracy,
            )}
          </Text>
        </View>
      )}
    </View>
  );
}

interface PredictionRowProps {
  icon: string;
  label: string;
  value: string;
  subtitle: string;
  colors: any;
  subtitleColor?: string;
}

function PredictionRow({
  icon,
  label,
  value,
  subtitle,
  colors,
  subtitleColor,
}: PredictionRowProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 6,
      }}
    >
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.textMuted,
            fontSize: 10,
            fontWeight: "600",
            letterSpacing: 0.5,
          }}
        >
          {label}
        </Text>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginTop: 2,
          }}
        >
          <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
            {value}
          </Text>
          <Text
            style={{
              color: subtitleColor || colors.textMuted,
              fontSize: 10,
              fontWeight: "500",
              flex: 1,
            }}
          >
            {subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Gera dicas inteligentes baseado na situação atual
 */
function getSmartTip(
  remaining: number,
  estimatedTime: string,
  expectedAccuracy: number,
): string {
  if (remaining === 0) {
    return "Parabéns! Todas as conferências foram completadas. Revise antes de finalizar.";
  }

  if (expectedAccuracy < 80) {
    return "Atenção: Sua acurácia está abaixo da média. Verifique cada código cuidadosamente.";
  }

  if (remaining > 20) {
    return `Faltam ${remaining} pacotes. Manutenha o ritmo para concluir em ${estimatedTime}.`;
  }

  return `Você está na reta final! Apenas ${remaining} pacotes restantes.`;
}

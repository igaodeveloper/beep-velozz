import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Share,
  Platform,
  Linking,
  Alert,
  Modal,
} from "react-native";
import { Session } from "@/types/session";
import {
  getSessionMetrics,
  formatWhatsAppMessage,
  formatDate,
  formatTimestamp,
  packageTypeLabel,
  packageTypeBadgeColors,
} from "@/utils/session";
import { useAppTheme } from "@/utils/useAppTheme";
import MainLayout from "@/components/MainLayout";
import { debounce } from "@/utils/performanceOptimizer";
import WhatsAppShareButton from "@/components/ui/WhatsAppShareButton";
import { ShareResult } from "@/services/whatsappShareService";

interface ReportViewProps {
  session: Session;
  onNewSession: () => void;
  onViewHistory: () => void;
}

export default function ReportView({
  session,
  onNewSession,
  onViewHistory,
}: ReportViewProps) {
  const { colors } = useAppTheme();
  const metrics = getSessionMetrics(session.packages);
  const hasDivergence = session.hasDivergence;

  const [isSharing, setIsSharing] = useState(false);
  const [shareOptions] = useState({
    includeDetailedList: true,
    includePhotos: true,
  });

  // Memoizar mensagem formatada para evitar recálculos
  const formattedMessage = useMemo(() => {
    return formatWhatsAppMessage(session);
  }, [session.id, session.packages.length, session.declaredCount]);

  // Handler profissional para compartilhamento
  const handleShareComplete = useCallback((result: ShareResult) => {
    if (result.success) {
      console.log(`Compartilhado via ${result.method}`);
    } else {
      console.error('Erro no compartilhamento:', result.error);
    }
  }, []);

  // Handler para compartilhamento genérico (fallback)
  const handleShare = useCallback(debounce(async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    try {
      const message = formattedMessage;
      await Share.share({ message });
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      // Silencioso - usuário cancelou ou erro não crítico
    } finally {
      setIsSharing(false);
    }
  }, 300), [formattedMessage, isSharing]);


  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: colors.surface2,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: colors.primary,
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 1.5,
            }}
          >
            RELATÓRIO
          </Text>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>
            Sessão Concluída
          </Text>
        </View>
        {hasDivergence ? (
          <View
            style={{
              backgroundColor: "#78350f",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: colors.warning,
            }}
          >
            <Text
              style={{ color: colors.warning, fontSize: 11, fontWeight: "700" }}
            >
              ⚠️ DIVERGÊNCIA
            </Text>
          </View>
        ) : (
          <View
            style={{
              backgroundColor: "#052e16",
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderWidth: 1,
              borderColor: colors.success,
            }}
          >
            <Text
              style={{ color: colors.success, fontSize: 11, fontWeight: "700" }}
            >
              ✅ OK
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Session Info */}
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
          <Text
            style={{
              color: colors.textSubtle,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            INFORMAÇÕES DA SESSÃO
          </Text>
          <InfoRow label="Data" value={formatDate(session.startedAt)} />
          <InfoRow label="Início" value={formatTimestamp(session.startedAt)} />
          {session.completedAt && (
            <InfoRow label="Fim" value={formatTimestamp(session.completedAt)} />
          )}
          <InfoRow label="Operador" value={session.operatorName} />
          <InfoRow label="Motorista" value={session.driverName} />
        </View>

        {/* Status de Conformidade com Bolinhas Coloridas */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.surface2,
            padding: 20,
            marginBottom: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text
            style={{
              color: colors.textSubtle,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1,
              marginBottom: 16,
              textAlign: "center",
            }}
          >
            STATUS DE CONFORMIDADE
          </Text>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            {/* Shopee - Bolinha Laranja */}
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "#ff5722",
                  marginBottom: 8,
                  shadowColor: "#ff5722",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              />
              <Text
                style={{
                  color: colors.text,
                  fontSize: 12,
                  fontWeight: "700",
                  marginBottom: 2,
                }}
              >
                SHOPEE
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 10,
                  fontWeight: "600",
                }}
              >
                {metrics.shopee} unid.
              </Text>
            </View>

            {/* Mercado Livre - Bolinha Amarela */}
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "#ffe600",
                  marginBottom: 8,
                  shadowColor: "#ffe600",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              />
              <Text
                style={{
                  color: colors.text,
                  fontSize: 12,
                  fontWeight: "700",
                  marginBottom: 2,
                }}
              >
                MERC. LIVRE
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 10,
                  fontWeight: "600",
                }}
              >
                {metrics.mercadoLivre} unid.
              </Text>
            </View>

            {/* Avulsos - Bolinha Verde */}
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: "#22c55e",
                  marginBottom: 8,
                  shadowColor: "#22c55e",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              />
              <Text
                style={{
                  color: colors.text,
                  fontSize: 12,
                  fontWeight: "700",
                  marginBottom: 2,
                }}
              >
                AVULSOS
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 10,
                  fontWeight: "600",
                }}
              >
                {metrics.avulsos} unid.
              </Text>
            </View>
          </View>

          {/* Linha Divisória */}
          <View
            style={{
              height: 1,
              backgroundColor: colors.border,
              marginVertical: 12,
            }}
          />

          {/* Status Final */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              gap: 8,
            }}
          >
            <View
              style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: hasDivergence ? colors.warning : colors.success,
                shadowColor: hasDivergence ? colors.warning : colors.success,
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.4,
                shadowRadius: 2,
                elevation: 2,
              }}
            />
            <Text
              style={{
                color: hasDivergence ? colors.warning : colors.success,
                fontSize: 14,
                fontWeight: "800",
                letterSpacing: 0.5,
              }}
            >
              {hasDivergence ? "COM DIVERGÊNCIA" : "CONFORMIDADE TOTAL"}
            </Text>
          </View>
        </View>

        
          {/* Resumo Financeiro Profissional */}
        <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.surface2,
              padding: 20,
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text
              style={{
                color: colors.textSubtle,
                fontSize: 11,
                fontWeight: "700",
                letterSpacing: 1,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              RESUMO FINANCEIRO
            </Text>

            <View
              style={{
                backgroundColor: colors.surface2,
                borderRadius: 12,
                padding: 16,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View>
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  TOTAL CONFERIDO
                </Text>
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 32,
                    fontWeight: "800",
                    lineHeight: 36,
                  }}
                >
                  {metrics.total}
                </Text>
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 14,
                    fontWeight: "700",
                    marginTop: 4,
                  }}
                >
                  R$ {metrics.valueTotal.toFixed(2)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    color: colors.textMuted,
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  DECLARADO
                </Text>
                <Text
                  style={{
                    color: colors.text,
                    fontSize: 32,
                    fontWeight: "800",
                    lineHeight: 36,
                  }}
                >
                  {session.declaredCount}
                </Text>
              </View>
            </View>

            {hasDivergence && (
              <View
                style={{
                  backgroundColor: "#78350f",
                  borderRadius: 12,
                  padding: 14,
                  marginTop: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  borderWidth: 1,
                  borderColor: colors.warning,
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: colors.warning,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontSize: 12, fontWeight: "800", color: "#78350f" }}>
                    !
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.warning,
                      fontSize: 13,
                      fontWeight: "700",
                      marginBottom: 2,
                    }}
                  >
                    DIVERGÊNCIA DETECTADA
                  </Text>
                  <Text
                    style={{
                      color: colors.warning,
                      fontSize: 11,
                      fontWeight: "600",
                      opacity: 0.9,
                    }}
                  >
                    Diferença: {metrics.total - session.declaredCount > 0 ? "+" : ""}
                    {metrics.total - session.declaredCount} pacote(s)
                  </Text>
                </View>
              </View>
            )}
          </View>

        {/* Package list */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: colors.textMuted,
              fontSize: 11,
              fontWeight: "700",
              letterSpacing: 1,
              marginBottom: 12,
            }}
          >
            LISTA DE PACOTES ({session.packages.length})
          </Text>
          {session.packages.map((pkg, idx) => {
            const badge = packageTypeBadgeColors(pkg.type);
            return (
              <View
                key={pkg.id}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingVertical: 8,
                  borderTopWidth: idx > 0 ? 1 : 0,
                  borderTopColor: colors.border,
                }}
              >
                <Text
                  style={{ color: colors.textMuted, fontSize: 11, width: 28 }}
                >
                  #{idx + 1}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 12,
                      fontFamily: "SpaceMono-Regular",
                    }}
                  >
                    {pkg.code}
                  </Text>
                  <Text style={{ color: colors.textSubtle, fontSize: 10 }}>
                    {formatTimestamp(pkg.scannedAt)}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: badge.bg,
                    borderRadius: 5,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      color: badge.text,
                      fontSize: 9,
                      fontWeight: "700",
                    }}
                  >
                    {packageTypeLabel(pkg.type)}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colors.primary,
                    borderRadius: 5,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text
                    style={{
                      color: colors.secondary,
                      fontSize: 9,
                      fontWeight: "700",
                    }}
                  >
                    R$ {(pkg.value || 0).toFixed(2)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Botão único de compartilhamento WhatsApp */}
      <View
        style={{
          padding: 20,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <WhatsAppShareButton
          session={session}
          options={shareOptions}
          size="large"
          variant="primary"
          onShareStart={() => setIsSharing(true)}
          onShareComplete={(result) => {
            setIsSharing(false);
            handleShareComplete(result);
          }}
        />
      </View>


    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 8,
      }}
    >
      <Text style={{ color: colors.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "600" }}>
        {value}
      </Text>
    </View>
  );
}

function SummaryBox({
  label,
  count,
  value,
  color,
}: {
  label: string;
  count: number;
  value: number;
  color: string;
}) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.surface2,
        borderRadius: 10,
        padding: 12,
        alignItems: "center",
      }}
    >
      <Text style={{ color, fontSize: 20, fontWeight: "800" }}>{count}</Text>
      <Text
        style={{
          color: colors.textSubtle,
          fontSize: 9,
          fontWeight: "600",
          marginTop: 2,
        }}
      >
        {label}
      </Text>
      <Text
        style={{
          color: colors.primary,
          fontSize: 10,
          fontWeight: "700",
          marginTop: 4,
        }}
      >
        R$ {value.toFixed(2)}
      </Text>
    </View>
  );
}

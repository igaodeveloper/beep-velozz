import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
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
  Animated,
  Dimensions,
  StatusBar,
} from "react-native";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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
  const screenWidth = Dimensions.get('window').width;

  // Animações
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const [isSharing, setIsSharing] = useState(false);
  const [shareOptions] = useState({
    includeDetailedList: true,
    includePhotos: true,
  });
  const [animatedMetrics, setAnimatedMetrics] = useState({
    total: 0,
    valueTotal: 0,
    shopee: 0,
    mercadoLivre: 0,
    avulsos: 0,
  });

  // Animações de entrada
  useEffect(() => {
    const startAnimations = async () => {
      // Feedback tátil inicial
      if (Platform.OS !== "web") {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      // Animação de fade e slide
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Animação de pulso contínuo para status
      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();

      // Animação dos números
      const animateNumbers = () => {
        Animated.timing(progressAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        }).start();
      };

      setTimeout(animateNumbers, 300);

      // Atualizar métricas animadas
      const interval = setInterval(() => {
        setAnimatedMetrics(prev => ({
          total: prev.total < metrics.total ? prev.total + 1 : metrics.total,
          valueTotal: prev.valueTotal < metrics.valueTotal ? prev.valueTotal + (metrics.valueTotal / 20) : metrics.valueTotal,
          shopee: prev.shopee < metrics.shopee ? prev.shopee + 1 : metrics.shopee,
          mercadoLivre: prev.mercadoLivre < metrics.mercadoLivre ? prev.mercadoLivre + 1 : metrics.mercadoLivre,
          avulsos: prev.avulsos < metrics.avulsos ? prev.avulsos + 1 : metrics.avulsos,
        }));
      }, 50);

      return () => clearInterval(interval);
    };

    startAnimations();
  }, [metrics, hasDivergence]);

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
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      
      {/* Header Premium com Gradiente */}
      <LinearGradient
        colors={hasDivergence ? ['#ff6b35', '#f7931e'] : ['#00b4d8', '#0077b6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 20,
          paddingBottom: 24,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: "rgba(255, 255, 255, 0.8)",
                  fontSize: 11,
                  fontWeight: "600",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                  marginBottom: 4,
                }}
              >
                Relatório de Conformidade
              </Text>
              <Text style={{ color: "#ffffff", fontSize: 24, fontWeight: "900", letterSpacing: -0.5 }}>
                Sessão Concluída
              </Text>
            </View>
            <Animated.View
              style={{
                transform: [{ scale: pulseAnim }],
              }}
            >
              <View
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.3)",
                  backdropFilter: "blur(10px)",
                }}
              >
                <Text
                  style={{ 
                    color: "#ffffff", 
                    fontSize: 12, 
                    fontWeight: "700",
                    textAlign: "center"
                  }}
                >
                  {hasDivergence ? "⚠️ DIVERGÊNCIA" : "✅ CONFORME"}
                </Text>
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Card de Informações Premium */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            marginBottom: 20,
          }}
        >
          <LinearGradient
            colors={[colors.surface, colors.surface2]}
            style={{
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 16, color: colors.secondary }}>📋</Text>
              </View>
              <Text
                style={{
                  color: colors.textSubtle,
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                Informações da Sessão
              </Text>
            </View>
            
            <PremiumInfoRow label="Data" value={formatDate(session.startedAt)} icon="📅" />
            <PremiumInfoRow label="Início" value={formatTimestamp(session.startedAt)} icon="⏰" />
            {session.completedAt && (
              <PremiumInfoRow label="Fim" value={formatTimestamp(session.completedAt)} icon="🏁" />
            )}
            <PremiumInfoRow label="Operador" value={session.operatorName} icon="👤" />
            <PremiumInfoRow label="Motorista" value={session.driverName} icon="🚛" />
          </LinearGradient>
        </Animated.View>

        {/* Card de Status Interativo */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            marginBottom: 20,
          }}
        >
          <LinearGradient
            colors={hasDivergence 
              ? ['rgba(255, 107, 53, 0.1)', 'rgba(247, 147, 30, 0.05)']
              : ['rgba(34, 197, 94, 0.1)', 'rgba(16, 185, 129, 0.05)']
            }
            style={{
              borderRadius: 24,
              borderWidth: 2,
              borderColor: hasDivergence ? colors.warning : colors.success,
              padding: 24,
              shadowColor: hasDivergence ? '#ff6b35' : '#22c55e',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <Text
                style={{
                  color: colors.textSubtle,
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  marginBottom: 16,
                  textAlign: "center",
                }}
              >
                Status de Conformidade
              </Text>
              
              {/* Visual de Progresso Circular */}
              <View style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: hasDivergence ? 'rgba(255, 107, 53, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
                borderWidth: 3,
                borderColor: hasDivergence ? colors.warning : colors.success,
              }}>
                <Animated.View
                  style={{
                    transform: [{ scale: pulseAnim }],
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 32, marginBottom: 4 }}>
                    {hasDivergence ? "⚠️" : "✅"}
                  </Text>
                  <Text
                    style={{
                      color: hasDivergence ? colors.warning : colors.success,
                      fontSize: 14,
                      fontWeight: "800",
                      textAlign: "center",
                    }}
                  >
                    {hasDivergence ? "DIVERGÊNCIA" : "CONFORME"}
                  </Text>
                </Animated.View>
              </View>
            </View>

            {/* Métricas Visuais */}
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 20 }}>
              <AnimatedMetricCard
                icon="🟠"
                label="Shopee"
                value={animatedMetrics.shopee}
                color="#ff5722"
                delay={0}
              />
              <AnimatedMetricCard
                icon="🟡"
                label="Mercado Livre"
                value={animatedMetrics.mercadoLivre}
                color="#ffe600"
                delay={200}
              />
              <AnimatedMetricCard
                icon="🟢"
                label="Avulsos"
                value={animatedMetrics.avulsos}
                color="#22c55e"
                delay={400}
              />
            </View>

            {/* Barra de Progresso */}
            <View style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: colors.textSubtle,
                  fontSize: 10,
                  fontWeight: "600",
                  marginBottom: 8,
                  textAlign: "center",
                }}
              >
                Progresso da Conferência
              </Text>
              <View style={{
                height: 8,
                backgroundColor: colors.surface2,
                borderRadius: 4,
                overflow: 'hidden',
              }}>
                <Animated.View
                  style={{
                    height: '100%',
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                    backgroundColor: hasDivergence ? colors.warning : colors.success,
                    borderRadius: 4,
                  }}
                />
              </View>
            </View>

            {/* Status Final */}
            <View style={{ alignItems: "center" }}>
              <Text
                style={{
                  color: hasDivergence ? colors.warning : colors.success,
                  fontSize: 16,
                  fontWeight: "900",
                  letterSpacing: 0.5,
                  textAlign: "center",
                }}
              >
                {hasDivergence 
                  ? `DIVERGÊNCIA DETECTADA\n${metrics.total - session.declaredCount > 0 ? "+" : ""}${metrics.total - session.declaredCount} pacote(s)`
                  : "CONFORMIDADE TOTAL"
                }
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Card Financeiro Premium */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
            marginBottom: 20,
          }}
        >
          <LinearGradient
            colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 193, 7, 0.05)']}
            style={{
              borderRadius: 24,
              borderWidth: 2,
              borderColor: '#ffd700',
              padding: 24,
              shadowColor: '#ffd700',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: '#ffd700',
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 20 }}>💰</Text>
              </View>
              <Text
                style={{
                  color: colors.textSubtle,
                  fontSize: 12,
                  fontWeight: "700",
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                }}
              >
                Resumo Financeiro
              </Text>
            </View>

            {/* Comparação Visual */}
            <View style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
            }}>
              <View style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}>
                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 10,
                      fontWeight: "700",
                      letterSpacing: 1,
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    Total Conferido
                  </Text>
                  <Animated.Text
                    style={{
                      color: colors.primary,
                      fontSize: 36,
                      fontWeight: "900",
                      lineHeight: 40,
                    }}
                  >
                    {animatedMetrics.total}
                  </Animated.Text>
                  <Animated.Text
                    style={{
                      color: colors.primary,
                      fontSize: 16,
                      fontWeight: "700",
                      marginTop: 4,
                    }}
                  >
                    R$ {animatedMetrics.valueTotal.toFixed(2)}
                  </Animated.Text>
                </View>

                <View style={{
                  width: 1,
                  height: 60,
                  backgroundColor: colors.border,
                  marginHorizontal: 20,
                }} />

                <View style={{ flex: 1, alignItems: "center" }}>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 10,
                      fontWeight: "700",
                      letterSpacing: 1,
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    Declarado
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 36,
                      fontWeight: "900",
                      lineHeight: 40,
                    }}
                  >
                    {session.declaredCount}
                  </Text>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 14,
                      fontWeight: "600",
                      marginTop: 4,
                    }}
                  >
                    Pacotes
                  </Text>
                </View>
              </View>

              {/* Barra Comparativa */}
              <View style={{ marginBottom: 12 }}>
                <View style={{
                  height: 12,
                  backgroundColor: colors.surface2,
                  borderRadius: 6,
                  overflow: 'hidden',
                  flexDirection: 'row',
                }}>
                  <Animated.View
                    style={{
                      height: '100%',
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0%', `${(metrics.total / Math.max(metrics.total, session.declaredCount)) * 100}%`],
                      }),
                      backgroundColor: colors.primary,
                      borderRadius: 6,
                    }}
                  />
                  <View
                    style={{
                      height: '100%',
                      width: `${(session.declaredCount / Math.max(metrics.total, session.declaredCount)) * 100}%`,
                      backgroundColor: colors.textMuted,
                      opacity: 0.3,
                      borderRadius: 6,
                    }}
                  />
                </View>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 4,
                }}>
                  <Text style={{ fontSize: 9, color: colors.primary, fontWeight: '600' }}>Conferido</Text>
                  <Text style={{ fontSize: 9, color: colors.textMuted, fontWeight: '600' }}>Declarado</Text>
                </View>
              </View>
            </View>

            {hasDivergence && (
              <Animated.View
                style={{
                  backgroundColor: 'rgba(255, 107, 53, 0.1)',
                  borderRadius: 12,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.warning,
                  transform: [{ scale: pulseAnim }],
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: colors.warning,
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#ffffff" }}>!</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: colors.warning,
                        fontSize: 14,
                        fontWeight: "800",
                        marginBottom: 4,
                      }}
                    >
                      DIVERGÊNCIA FINANCEIRA
                    </Text>
                    <Text
                      style={{
                        color: colors.warning,
                        fontSize: 12,
                        fontWeight: "600",
                        opacity: 0.9,
                      }}
                    >
                      Diferença: {metrics.total - session.declaredCount > 0 ? "+" : ""}
                      {metrics.total - session.declaredCount} pacote(s) ≈ 
                      R$ {Math.abs((metrics.total - session.declaredCount) * (metrics.valueTotal / metrics.total)).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Lista de Pacotes Premium */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            marginBottom: 20,
          }}
        >
          <LinearGradient
            colors={[colors.surface, colors.surface2]}
            style={{
              borderRadius: 20,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <View style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.primary,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}>
                <Text style={{ fontSize: 16, color: colors.secondary }}>📦</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.textSubtle,
                    fontSize: 12,
                    fontWeight: "700",
                    letterSpacing: 1.5,
                    textTransform: "uppercase",
                  }}
                >
                  Lista de Pacotes
                </Text>
                <Text style={{ color: colors.primary, fontSize: 14, fontWeight: "700" }}>
                  {session.packages.length} itens escaneados
                </Text>
              </View>
            </View>

            <ScrollView
              style={{ maxHeight: 300 }}
              showsVerticalScrollIndicator={false}
            >
              {session.packages.slice(0, 10).map((pkg, idx) => {
                const badge = packageTypeBadgeColors(pkg.type);
                return (
                  <AnimatedPackageItem
                    key={pkg.id}
                    pkg={pkg}
                    idx={idx}
                    badge={badge}
                    delay={idx * 100}
                  />
                );
              })}
              {session.packages.length > 10 && (
                <View style={{
                  alignItems: 'center',
                  paddingVertical: 12,
                  borderTopWidth: 1,
                  borderTopColor: colors.border,
                  marginTop: 8,
                }}>
                  <Text style={{
                    color: colors.textMuted,
                    fontSize: 11,
                    fontWeight: '600',
                  }}>
                    +{session.packages.length - 10} pacotes não exibidos
                  </Text>
                </View>
              )}
            </ScrollView>
          </LinearGradient>
        </Animated.View>
      </ScrollView>

      {/* Botão WhatsApp Premium com Feedback */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          padding: 20,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          backgroundColor: colors.bg,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            // O WhatsAppShareButton vai lidar com o compartilhamento
          }}
          activeOpacity={0.8}
          style={{
            shadowColor: '#25D366',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <WhatsAppShareButton
            session={session}
            options={shareOptions}
            size="large"
            variant="primary"
            onShareStart={() => {
              setIsSharing(true);
              if (Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }}
            onShareComplete={(result) => {
              setIsSharing(false);
              handleShareComplete(result);
              if (result.success && Platform.OS !== "web") {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            }}
          />
        </TouchableOpacity>
      </Animated.View>


    </View>
  );
}

// Componente Premium de Informação
function PremiumInfoRow({ label, value, icon }: { label: string; value: string; icon: string }) {
  const { colors } = useAppTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        backgroundColor: colors.bg,
        borderRadius: 8,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ fontSize: 16, marginRight: 8 }}>{icon}</Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600" }}>{label}</Text>
      </View>
      <Text style={{ color: colors.text, fontSize: 13, fontWeight: "700" }}>
        {value}
      </Text>
    </View>
  );
}

// Componente de Métrica Animada
function AnimatedMetricCard({ icon, label, value, color, delay }: {
  icon: string;
  label: string;
  value: number;
  color: string;
  delay: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const { colors } = useAppTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        alignItems: "center",
        minWidth: 80,
      }}
    >
      <View style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: color + '20',
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 8,
        borderWidth: 2,
        borderColor: color,
      }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <Text style={{
        color: colors.text,
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 2,
        textAlign: "center",
      }}>
        {label}
      </Text>
      <Text style={{
        color: color,
        fontSize: 16,
        fontWeight: "900",
      }}>
        {value}
      </Text>
      <Text style={{
        color: colors.textMuted,
        fontSize: 9,
        fontWeight: "600",
      }}>
        unid.
      </Text>
    </Animated.View>
  );
}

// Componente de Pacote Animado
function AnimatedPackageItem({ pkg, idx, badge, delay }: {
  pkg: any;
  idx: number;
  badge: any;
  delay: number;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const { colors } = useAppTheme();

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateX: slideAnim }],
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderTopWidth: idx > 0 ? 1 : 0,
        borderTopColor: colors.border,
      }}
    >
      <View style={{
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: colors.primary + '20',
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
      }}>
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
          #{idx + 1}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.text,
            fontSize: 13,
            fontWeight: "700",
            fontFamily: "SpaceMono-Regular",
          }}
        >
          {pkg.code}
        </Text>
        <Text style={{ color: colors.textSubtle, fontSize: 10, marginTop: 2 }}>
          {formatTimestamp(pkg.scannedAt)}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: badge.bg,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 3,
          marginRight: 8,
        }}
      >
        <Text
          style={{
            color: badge.text,
            fontSize: 10,
            fontWeight: "700",
          }}
        >
          {packageTypeLabel(pkg.type)}
        </Text>
      </View>
      <View
        style={{
          backgroundColor: colors.primary,
          borderRadius: 6,
          paddingHorizontal: 8,
          paddingVertical: 3,
        }}
      >
        <Text
          style={{
            color: colors.secondary,
            fontSize: 10,
            fontWeight: "700",
          }}
        >
          R$ {(pkg.value || 0).toFixed(2)}
        </Text>
      </View>
    </Animated.View>
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

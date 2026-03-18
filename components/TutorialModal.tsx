import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';

interface TutorialModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const slides = [
  {
    id: 'intro',
    title: 'Bem-vindo ao Beep Velozz',
    badge: 'VISÃO GERAL',
    description:
      'Um cockpit de conferência logística para você escanear, analisar e fechar sessões com precisão de nível enterprise.',
    bullets: [
      'Dashboard em tempo real com estatísticas do dia',
      'Fluxo guiado de conferência com limites por tipo de pacote',
      'Relatórios e histórico prontos para auditoria',
    ],
  },
  {
    id: 'session',
    title: '1. Começando uma conferência',
    badge: 'SESSÃO',
    description:
      'Inicie uma nova conferência informando motorista, operador e quantidades declaradas por marketplace.',
    bullets: [
      'Use o botão "Nova Sessão" na tela inicial',
      'Preencha motorista, operador e totais declarados',
      'Confirme para ativar o scanner com limites inteligentes',
    ],
  },
  {
    id: 'scanner',
    title: '2. Escaneando com o scanner industrial',
    badge: 'SCANNER',
    description:
      'Aponte para o código de barras ou QR Code e deixe o Beep Velozz contar, validar e alertar.',
    bullets: [
      'O retângulo no centro guia o enquadramento ideal',
      'Cada leitura atualiza contadores por tipo e valor total',
      'Ao atingir o limite declarado, você é avisado automaticamente',
    ],
  },
  {
    id: 'divergence',
    title: '3. Tratando divergências com segurança',
    badge: 'DIVERGÊNCIA',
    description:
      'Se os números não batem, o app abre um fluxo específico para revisão antes de concluir.',
    bullets: [
      'Ao tentar encerrar com diferença, a tela de divergência é exibida',
      'Revise pacotes, reescane se necessário e registre observações',
      'Você decide se encerra com ou sem divergência marcada',
    ],
  },
  {
    id: 'report-history',
    title: '4. Relatórios, histórico e fotos',
    badge: 'RELATÓRIO',
    description:
      'Depois de cada conferência você tem um resumo executivo, lista detalhada e exportação.',
    bullets: [
      'Veja totais por marketplace, valores e delta da divergência',
      'Acesse fotos de pacotes anexadas à sessão',
      'Exporte e compartilhe via PDF, WhatsApp ou outros canais',
    ],
  },
  {
    id: 'analytics',
    title: '5. Analytics e aprendizado contínuo',
    badge: 'ANALYTICS',
    description:
      'Use a aba de analytics para enxergar produtividade, taxas de erro e operadores em destaque.',
    bullets: [
      'Compare sessões ao longo do tempo',
      'Veja rankings de operadores e anomalias detectadas',
      'Use os insights para ajustar turnos, metas e processos',
    ],
  },
];

export default function TutorialModal({ visible, onClose }: TutorialModalProps) {
  const { colors } = useAppTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(15,23,42,0.92)',
          justifyContent: 'center',
          alignItems: 'center',
          paddingHorizontal: 16,
        }}
      >
        <View
          style={{
            width: '100%',
            maxWidth: 720,
            borderRadius: 20,
            backgroundColor: colors.bg,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 18,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <View>
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 12,
                  fontWeight: '700',
                  letterSpacing: 1.5,
                }}
              >
                TUTORIAL
              </Text>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 18,
                  fontWeight: '800',
                }}
              >
                Como usar o Beep Velozz
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text style={{ fontSize: 18, color: colors.text }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Slides */}
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={{ maxHeight: 360 }}
            contentContainerStyle={{
              alignItems: 'center',
            }}
          >
            {slides.map((slide) => (
              <View
                key={slide.id}
                style={{
                  width: screenWidth > 720 ? 720 : screenWidth - 32,
                  paddingHorizontal: 20,
                  paddingVertical: 18,
                }}
              >
                <View
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    padding: 16,
                    gap: 10,
                  }}
                >
                  <Text
                    style={{
                      alignSelf: 'flex-start',
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderRadius: 999,
                      backgroundColor: colors.surface2,
                      color: colors.textSubtle,
                      fontSize: 10,
                      fontWeight: '700',
                      letterSpacing: 1,
                    }}
                  >
                    {slide.badge}
                  </Text>
                  <Text
                    style={{
                      color: colors.text,
                      fontSize: 18,
                      fontWeight: '800',
                    }}
                  >
                    {slide.title}
                  </Text>
                  <Text
                    style={{
                      color: colors.textMuted,
                      fontSize: 14,
                      lineHeight: 20,
                    }}
                  >
                    {slide.description}
                  </Text>
                  <View style={{ marginTop: 4, gap: 6 }}>
                    {slide.bullets.map((b, bulletIndex) => (
                      <Text
                        key={`${slide.id}-bullet-${bulletIndex}`}
                        style={{
                          color: colors.text,
                          fontSize: 13,
                        }}
                      >
                        • {b}
                      </Text>
                    ))}
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Footer actions */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.textSubtle,
                fontSize: 11,
              }}
            >
              Deslize para o lado para avançar os passos.
            </Text>
            <TouchableOpacity
              onPress={onClose}
              style={{
                backgroundColor: colors.primary,
                borderRadius: 999,
                paddingHorizontal: 18,
                paddingVertical: 10,
              }}
            >
              <Text
                style={{
                  color: colors.secondary,
                  fontSize: 13,
                  fontWeight: '700',
                }}
              >
                Começar a usar agora
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}


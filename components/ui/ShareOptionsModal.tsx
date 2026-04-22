/**
 * Share Options Modal Component
 * Modal profissional para configurar opções de compartilhamento
 */

import React, { useState, useCallback, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { useAppTheme } from "@/utils/useAppTheme";
import { ShareOptions } from "@/services/whatsappShareService";
import WhatsAppShareButton from "./WhatsAppShareButton";
import { ShareResult } from "@/services/whatsappShareService";

interface ShareOptionsModalProps {
  visible: boolean;
  session?: any;
  onClose: () => void;
  onShareComplete?: (result: ShareResult) => void;
}

const ShareOptionsModal = memo<ShareOptionsModalProps>(({
  visible,
  session,
  onClose,
  onShareComplete,
}) => {
  const { colors } = useAppTheme();
  const [options, setOptions] = useState<ShareOptions>({
    includeDetailedList: false,
    includePhotos: false,
    customMessage: "",
  });
  const [isSharing, setIsSharing] = useState(false);

  // Handler para mudar opções
  const updateOption = useCallback((key: keyof ShareOptions, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  // Handler de compartilhamento
  const handleShareComplete = useCallback((result: ShareResult) => {
    setIsSharing(false);
    
    if (result.success) {
      onClose(); // Fecha modal em caso de sucesso
      onShareComplete?.(result);
    } else {
      Alert.alert(
        "Erro ao Compartilhar",
        result.error || "Não foi possível compartilhar. Tente novamente.",
        [{ text: "OK" }]
      );
    }
  }, [onClose, onShareComplete]);

  // Handler para iniciar compartilhamento
  const handleShareStart = useCallback(() => {
    setIsSharing(true);
  }, []);

  // Preview da mensagem
  const getMessagePreview = useCallback(() => {
    if (!session) return "";
    
    const preview = options.customMessage || "Relatório da sessão";
    const maxLength = 60;
    return preview.length > maxLength ? preview.substring(0, maxLength) + "..." : preview;
  }, [session, options.customMessage]);

  const modalStyle = {
    backgroundColor: colors.bg,
    flex: 1,
  };

  const headerStyle = {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  };

  const contentStyle = {
    flex: 1,
    padding: 20,
  };

  const optionRowStyle = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface2,
  };

  const labelStyle = {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: "600" as const,
  };

  const descriptionStyle = {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={modalStyle}>
        {/* Header */}
        <View style={headerStyle}>
          <View>
            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "700" }}>
              COMPARTILHAR
            </Text>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: "800" }}>
              Opções de Envio
            </Text>
          </View>
          
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <Text style={{ color: colors.textMuted, fontSize: 24 }}>×</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <ScrollView style={contentStyle} showsVerticalScrollIndicator={false}>
          {/* Preview */}
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: colors.border,
          }}>
            <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: "600" }}>
              PREVISUALIZAÇÃO
            </Text>
            <Text style={{ color: colors.text, fontSize: 14, marginTop: 4 }}>
              {getMessagePreview()}
            </Text>
          </View>

          {/* Opções */}
          <View style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            marginBottom: 20,
          }}>
            {/* Lista Detalhada */}
            <View style={optionRowStyle}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Lista Detalhada</Text>
                <Text style={descriptionStyle}>
                  Inclui lista completa com códigos e horários de todos os pacotes
                </Text>
              </View>
              <Switch
                value={options.includeDetailedList}
                onValueChange={(value) => updateOption('includeDetailedList', value)}
                trackColor={{ false: colors.surface2, true: "#25D36640" }}
                thumbColor={options.includeDetailedList ? "#25D366" : colors.textMuted}
              />
            </View>

            {/* Fotos */}
            <View style={[optionRowStyle, { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={labelStyle}>Incluir Fotos</Text>
                <Text style={descriptionStyle}>
                  Adiciona nota sobre fotos dos pacotes na mensagem
                </Text>
              </View>
              <Switch
                value={options.includePhotos}
                onValueChange={(value) => updateOption('includePhotos', value)}
                trackColor={{ false: colors.surface2, true: "#25D36640" }}
                thumbColor={options.includePhotos ? "#25D366" : colors.textMuted}
              />
            </View>
          </View>

          {/* Informações */}
          <View style={{
            backgroundColor: "#25D36620",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
            borderLeftWidth: 4,
            borderLeftColor: "#25D366",
          }}>
            <Text style={{ color: colors.text, fontSize: 14, fontWeight: "600" }}>
              Como funciona?
            </Text>
            <Text style={{ color: colors.text, fontSize: 13, marginTop: 8, lineHeight: 20 }}>
              1. O sistema tentará abrir o WhatsApp automaticamente{"\n"}
              2. Se não for possível, usará o compartilhamento padrão{"\n"}
              3. Como último recurso, copia para área de transferência
            </Text>
          </View>

          {/* Botão de Compartilhamento */}
          <WhatsAppShareButton
            session={session}
            options={options}
            size="large"
            variant="primary"
            onShareStart={handleShareStart}
            onShareComplete={handleShareComplete}
            disabled={isSharing}
          />
        </ScrollView>
      </View>
    </Modal>
  );
});

ShareOptionsModal.displayName = "ShareOptionsModal";

export default ShareOptionsModal;

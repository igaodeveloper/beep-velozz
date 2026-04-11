/**
 * Language Selector Component
 * Componente para seleção de idioma com suporte RTL
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { useAppTheme } from "@/utils/useAppTheme";
import { useLocalization } from "@/hooks/useLocalization";
import { Language } from "@/types/localization";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  onLanguageSelected: (languageCode: string) => void;
}

export default function LanguageSelector({
  visible,
  onClose,
  onLanguageSelected,
}: LanguageSelectorProps) {
  const { colors } = useAppTheme();
  const localization = useLocalization();

  const [selectedLanguage, setSelectedLanguage] = useState(
    localization.currentLanguage,
  );

  // Handle language selection
  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language.code);
    localization.changeLanguage(language.code);
    onLanguageSelected(language.code);
    onClose();
  };

  // Render language item
  const renderLanguageItem = ({ item }: { item: Language }) => {
    const isSelected = item.code === selectedLanguage;
    const isRTL = localization.isRTL();

    return (
      <TouchableOpacity
        style={[
          styles.languageItem,
          {
            backgroundColor: isSelected ? colors.primary : colors.card,
            borderColor: isSelected ? colors.primary : colors.border,
            flexDirection: localization.isRTL() ? "row-reverse" : "row",
          },
        ]}
        onPress={() => handleLanguageSelect(item)}
      >
        <Text style={styles.languageFlag}>{item.flag}</Text>

        <View style={styles.languageInfo}>
          <Text
            style={[
              styles.languageName,
              {
                color: isSelected ? "white" : colors.text,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {item.nativeName}
          </Text>
          <Text
            style={[
              styles.languageEnglishName,
              {
                color: isSelected ? "white" : colors.textSecondary,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {item.name}
          </Text>
        </View>

        {isSelected && <Text style={styles.selectedIcon}>✓</Text>}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <BlurView intensity={100} style={styles.modalOverlay}>
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              🌐 Selecionar Idioma
            </Text>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={[styles.closeButtonText, { color: colors.text }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          {/* Language List */}
          <FlatList
            data={localization.availableLanguages}
            keyExtractor={(item) => item.code}
            renderItem={renderLanguageItem}
            contentContainerStyle={styles.languageList}
            showsVerticalScrollIndicator={false}
          />

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              💡 O idioma será aplicado imediatamente em todo o aplicativo
            </Text>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.7,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  languageList: {
    padding: 20,
    paddingBottom: 10,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  languageEnglishName: {
    fontSize: 12,
  },
  selectedIcon: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
  },
});

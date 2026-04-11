import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
  Dimensions,
  Animated,
} from "react-native";
import { useAppTheme } from "@/utils/useAppTheme";
import { ThemeName, themePresets } from "@/utils/theme";
import {
  Check,
  Sun,
  Moon,
  Droplets,
  Trees,
  CloudSun,
  Star,
  Snowflake,
  Flame,
  Heart,
  Gem,
  Zap,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";

const { width: screenWidth } = Dimensions.get("window");

interface ThemeOption {
  name: ThemeName;
  displayName: string;
  description: string;
  icon: any;
  preview: {
    primary: string;
    background: string;
    surface: string;
  };
}

interface ThemeSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function ThemeSelector({
  visible,
  onClose,
}: ThemeSelectorProps) {
  const { themeName, setThemeName } = useAppTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(themeName);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, fadeAnim]);

  const themeOptions: ThemeOption[] = [
    {
      name: "light",
      displayName: "Claro",
      description: "Tema limpo e profissional",
      icon: Sun,
      preview: {
        primary: "#f97316",
        background: "#ffffff",
        surface: "#f9fafb",
      },
    },
    {
      name: "dark",
      displayName: "Escuro",
      description: "Tema escuro com alto contraste",
      icon: Moon,
      preview: {
        primary: "#ff7a1f",
        background: "#000000",
        surface: "#020617",
      },
    },
    {
      name: "ocean",
      displayName: "Oceano",
      description: "Tema azul marinho profissional",
      icon: Droplets,
      preview: {
        primary: "#06b6d4",
        background: "#0f172a",
        surface: "#1e293b",
      },
    },
    {
      name: "forest",
      displayName: "Floresta",
      description: "Tema verde natural",
      icon: Trees,
      preview: {
        primary: "#10b981",
        background: "#052e16",
        surface: "#064e3b",
      },
    },
    {
      name: "sunset",
      displayName: "Pôr do Sol",
      description: "Tema laranja aconchegante",
      icon: CloudSun,
      preview: {
        primary: "#f97316",
        background: "#1c0c0c",
        surface: "#291515",
      },
    },
    {
      name: "midnight",
      displayName: "Meia-Noite",
      description: "Tema roxo escuro elegante",
      icon: Star,
      preview: {
        primary: "#6366f1",
        background: "#0f0f23",
        surface: "#1a1a2e",
      },
    },
    {
      name: "arctic",
      displayName: "Ártico",
      description: "Tema azul gelo limpo",
      icon: Snowflake,
      preview: {
        primary: "#0284c7",
        background: "#f8fafc",
        surface: "#f1f5f9",
      },
    },
    {
      name: "volcano",
      displayName: "Vulcão",
      description: "Tema vermelho intenso",
      icon: Flame,
      preview: {
        primary: "#dc2626",
        background: "#1a0505",
        surface: "#2d0909",
      },
    },
    {
      name: "rose",
      displayName: "Rosa",
      description: "Tema rosa elegante",
      icon: Heart,
      preview: {
        primary: "#e11d48",
        background: "#1f0514",
        surface: "#2f0d1a",
      },
    },
    {
      name: "emerald",
      displayName: "Esmeralda",
      description: "Tema verde esmeralda",
      icon: Gem,
      preview: {
        primary: "#059669",
        background: "#022c22",
        surface: "#042f2e",
      },
    },
    {
      name: "amber",
      displayName: "Âmbar",
      description: "Tema âmbar sofisticado",
      icon: Zap,
      preview: {
        primary: "#d97706",
        background: "#1c1912",
        surface: "#292524",
      },
    },
  ];

  const handleThemeSelect = (theme: ThemeName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTheme(theme);
  };

  const handleApplyTheme = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setThemeName(selectedTheme);
    onClose();
  };

  const ThemeCard = ({ option }: { option: ThemeOption }) => {
    const Icon = option.icon;
    const isSelected = selectedTheme === option.name;

    return (
      <TouchableOpacity
        style={[
          styles.themeCard,
          {
            backgroundColor: option.preview.surface,
            borderColor: isSelected ? option.preview.primary : "#374151",
            borderWidth: isSelected ? 2 : 1,
          },
        ]}
        onPress={() => handleThemeSelect(option.name)}
        activeOpacity={0.8}
      >
        {/* Preview Header */}
        <View
          style={[
            styles.previewHeader,
            { backgroundColor: option.preview.background },
          ]}
        >
          <View
            style={[
              styles.previewDot,
              { backgroundColor: option.preview.primary },
            ]}
          />
          <View
            style={[
              styles.previewBar,
              { backgroundColor: option.preview.surface },
            ]}
          />
        </View>

        {/* Content */}
        <View style={styles.themeContent}>
          <View style={styles.themeHeader}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: option.preview.primary + "20" },
              ]}
            >
              <Icon size={20} color={option.preview.primary} />
            </View>
            <View style={styles.themeInfo}>
              <Text
                style={[
                  styles.themeName,
                  {
                    color:
                      option.preview.background === "#ffffff"
                        ? "#111827"
                        : "#f8fafc",
                  },
                ]}
              >
                {option.displayName}
              </Text>
              <Text
                style={[
                  styles.themeDescription,
                  {
                    color:
                      option.preview.background === "#ffffff"
                        ? "#6b7280"
                        : "#cbd5e1",
                  },
                ]}
              >
                {option.description}
              </Text>
            </View>
            {isSelected && (
              <View
                style={[
                  styles.checkContainer,
                  { backgroundColor: option.preview.primary },
                ]}
              >
                <Check size={16} color="#ffffff" />
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Personalizar Tema</Text>
            <Text style={styles.subtitle}>
              Escolha o tema perfeito para seu ambiente de trabalho
            </Text>
          </View>

          {/* Theme Grid */}
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.themeGrid}>
              {themeOptions.map((option) => (
                <ThemeCard key={option.name} option={option} />
              ))}
            </View>
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.applyButton}
              onPress={handleApplyTheme}
              activeOpacity={0.8}
            >
              <Text style={styles.applyText}>Aplicar Tema</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    width: screenWidth * 0.95,
    maxHeight: "85%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    overflow: "hidden",
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  themeGrid: {
    gap: 12,
  },
  themeCard: {
    borderRadius: 16,
    overflow: "hidden",
  },
  previewHeader: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  themeContent: {
    padding: 16,
  },
  themeHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actions: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  applyButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f97316",
  },
  applyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
  },
});

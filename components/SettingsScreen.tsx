import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAppTheme } from "@/utils/useAppTheme";
import MainLayout from "@/components/MainLayout";
import {
  Moon,
  Sun,
  Bell,
  Shield,
  Database,
  HelpCircle,
  ChevronRight,
  Palette,
} from "lucide-react-native";
import SimpleThemeSelector from "./SimpleThemeSelector";
import ModernCard from "./ModernCard";
import ModernIcon from "./ModernIcon";

interface SettingsScreenProps {
  onOpenThemeSelector?: () => void;
}

function SettingsItem({
  icon: Icon,
  title,
  subtitle,
  onPress,
  rightComponent,
}: any) {
  const { colors } = useAppTheme();

  return (
    <ModernCard
      title={title}
      description={subtitle}
      icon={<Icon />}
      onPress={onPress}
      rightComponent={rightComponent}
      variant="default"
      size="md"
      fullWidth
      style={{ marginBottom: 12 }}
    />
  );
}

export default function SettingsScreen({
  onOpenThemeSelector,
}: SettingsScreenProps) {
  const navigation = useNavigation();
  const { colors, theme, themeName } = useAppTheme();
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [scannerHapticsEnabled, setScannerHapticsEnabled] = useState(true);
  const [scannerSoundEnabled, setScannerSoundEnabled] = useState(true);
  const scrollY = React.useRef(new Animated.Value(0)).current;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Animated.ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 32 }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
        scrollEventThrottle={16}
      >
        <View style={styles.contentContainer}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              Configurações
            </Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Personalize sua experiência
            </Text>
          </View>

          <View style={styles.section}>
            <ModernCard
              title="Personalizar Tema"
              description={`Tema atual: ${theme?.name || "Claro"}`}
              icon={<Palette />}
              onPress={() => setShowThemeSelector(true)}
              rightComponent={
                <ChevronRight size={20} color={colors.textFaint} />
              }
              variant="elevated"
              size="md"
              fullWidth
            />
          </View>

          <View style={styles.section}>
            <ModernCard
              title="Feedback tátil no scanner"
              description={
                scannerHapticsEnabled
                  ? "Vibração ao ler códigos"
                  : "Sem vibração nas leituras"
              }
              icon={<Bell />}
              onPress={() => setScannerHapticsEnabled((prev) => !prev)}
              rightComponent={
                <Switch
                  value={scannerHapticsEnabled}
                  onValueChange={() =>
                    setScannerHapticsEnabled((prev) => !prev)
                  }
                  trackColor={{
                    false: colors.border,
                    true: colors.primary + "40",
                  }}
                  thumbColor={
                    scannerHapticsEnabled ? colors.primary : colors.textFaint
                  }
                />
              }
              variant="default"
              size="md"
              fullWidth
              style={{ marginBottom: 12 }}
            />
            <ModernCard
              title="Som de confirmação"
              description={
                scannerSoundEnabled
                  ? "Bip ao escanear com sucesso"
                  : "Leitura silenciosa"
              }
              icon={<Bell />}
              onPress={() => setScannerSoundEnabled((prev) => !prev)}
              rightComponent={
                <Switch
                  value={scannerSoundEnabled}
                  onValueChange={() => setScannerSoundEnabled((prev) => !prev)}
                  trackColor={{
                    false: colors.border,
                    true: colors.primary + "40",
                  }}
                  thumbColor={
                    scannerSoundEnabled ? colors.primary : colors.textFaint
                  }
                />
              }
              variant="default"
              size="md"
              fullWidth
            />
          </View>

          <View style={styles.section}>
            <ModernCard
              title="Privacidade e Segurança"
              description="Gerencie seus dados e permissões"
              icon={<Shield />}
              rightComponent={
                <ChevronRight size={20} color={colors.textFaint} />
              }
              variant="default"
              size="md"
              fullWidth
              style={{ marginBottom: 12 }}
            />
            <ModernCard
              title="Armazenamento"
              description="Sessões e fotos salvas no dispositivo"
              icon={<Database />}
              rightComponent={
                <ChevronRight size={20} color={colors.textFaint} />
              }
              variant="default"
              size="md"
              fullWidth
            />
          </View>

          <View style={styles.section}>
            <ModernCard
              title="Ajuda e Suporte"
              description="FAQ e contato com o suporte"
              icon={<HelpCircle />}
              rightComponent={
                <ChevronRight size={20} color={colors.textFaint} />
              }
              variant="default"
              size="md"
              fullWidth
            />
          </View>
        </View>
      </Animated.ScrollView>

      <SimpleThemeSelector
        visible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 8,
  },
  header: {
    padding: 24,
    paddingTop: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 24,
  },
});

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import MainLayout from '@/components/MainLayout';
import {
  Moon,
  Sun,
  Bell,
  Shield,
  Database,
  HelpCircle,
  ChevronRight,
  Palette,
} from 'lucide-react-native';
import SimpleThemeSelector from './SimpleThemeSelector';

interface SettingsScreenProps {
  onOpenThemeSelector?: () => void;
}

function SettingsItem({ icon: Icon, title, subtitle, onPress, rightComponent }: any) {
  const { colors } = useAppTheme();

  return (
    <TouchableOpacity
      style={[styles.settingsItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.itemLeft}>
        <Icon size={20} color={colors.textMuted} style={styles.itemIcon} />
        <View style={styles.itemText}>
          <Text style={[styles.itemTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.itemSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightComponent || <ChevronRight size={20} color={colors.textFaint} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen({ onOpenThemeSelector }: SettingsScreenProps) {
  const { colors, theme, themeName } = useAppTheme();
  const [showThemeSelector, setShowThemeSelector] = useState(false);
  const [scannerHapticsEnabled, setScannerHapticsEnabled] = useState(true);
  const [scannerSoundEnabled, setScannerSoundEnabled] = useState(true);

  return (
    <>
      <MainLayout>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Configurações</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Personalize sua experiência
          </Text>
        </View>

        <View style={styles.section}>
          <SettingsItem
            icon={Palette}
            title="Personalizar Tema"
            subtitle={`Tema atual: ${theme?.name || 'Claro'}`}
            onPress={() => setShowThemeSelector(true)}
          />
        </View>

        <View style={styles.section}>
          <SettingsItem
            icon={Bell}
            title="Feedback tátil no scanner"
            subtitle={scannerHapticsEnabled ? 'Vibração ao ler códigos' : 'Sem vibração nas leituras'}
            onPress={() => setScannerHapticsEnabled((prev) => !prev)}
            rightComponent={
              <Switch
                value={scannerHapticsEnabled}
                onValueChange={() => setScannerHapticsEnabled((prev) => !prev)}
                trackColor={{ false: colors.border, true: colors.primary + '40' }}
                thumbColor={scannerHapticsEnabled ? colors.primary : colors.textFaint}
              />
            }
          />
          <SettingsItem
            icon={Bell}
            title="Som de confirmação"
            subtitle={scannerSoundEnabled ? 'Bip ao escanear com sucesso' : 'Leitura silenciosa'}
            onPress={() => setScannerSoundEnabled((prev) => !prev)}
            rightComponent={
              <Switch
                value={scannerSoundEnabled}
                onValueChange={() => setScannerSoundEnabled((prev) => !prev)}
                trackColor={{ false: colors.border, true: colors.primary + '40' }}
                thumbColor={scannerSoundEnabled ? colors.primary : colors.textFaint}
              />
            }
          />
        </View>

        <View style={styles.section}>
          <SettingsItem
            icon={Shield}
            title="Privacidade e Segurança"
            subtitle="Gerencie seus dados e permissões"
          />
          <SettingsItem
            icon={Database}
            title="Armazenamento"
            subtitle="Sessões e fotos salvas no dispositivo"
          />
        </View>

        <View style={styles.section}>
          <SettingsItem
            icon={HelpCircle}
            title="Ajuda e Suporte"
            subtitle="FAQ e contato com o suporte"
          />
        </View>
      </ScrollView>
      </MainLayout>
      
      <SimpleThemeSelector
        visible={showThemeSelector}
        onClose={() => setShowThemeSelector(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
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
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 16,
  },
  itemText: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  itemSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { useTheme } from '@/utils/themeContext';
import {
  Moon,
  Sun,
  Bell,
  Shield,
  Database,
  HelpCircle,
  ChevronRight,
} from 'lucide-react-native';

interface SettingsItemProps {
  icon: any;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightComponent?: React.ReactNode;
}

function SettingsItem({ icon: Icon, title, subtitle, onPress, rightComponent }: SettingsItemProps) {
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

export default function SettingsScreen() {
  const { colors, isDark } = useAppTheme();
  const { setColorScheme, colorScheme } = useTheme();

  const toggleTheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Configurações</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
          Personalize sua experiência
        </Text>
      </View>

      <View style={styles.section}>
        <SettingsItem
          icon={isDark ? Moon : Sun}
          title="Tema Escuro"
          subtitle={isDark ? "Desativar tema escuro" : "Ativar tema escuro"}
          onPress={toggleTheme}
          rightComponent={
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={isDark ? colors.primary : colors.textFaint}
            />
          }
        />
      </View>

      <View style={styles.section}>
        <SettingsItem
          icon={Bell}
          title="Notificações"
          subtitle="Gerenciar alertas e sons"
          onPress={() => {}}
        />
        <SettingsItem
          icon={Shield}
          title="Privacidade e Segurança"
          subtitle="Proteger seus dados"
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
        <SettingsItem
          icon={Database}
          title="Armazenamento"
          subtitle="Gerenciar espaço e backup"
          onPress={() => {}}
        />
        <SettingsItem
          icon={HelpCircle}
          title="Ajuda e Suporte"
          subtitle="Central de ajuda e contato"
          onPress={() => {}}
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.textFaint }]}>
          Beep Velozz v1.0.0
        </Text>
        <Text style={[styles.footerText, { color: colors.textFaint }]}>
          © 2024 - Todos os direitos reservados
        </Text>
      </View>
    </ScrollView>
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
    marginHorizontal: 16,
    marginBottom: 24,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    marginRight: 12,
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
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    marginTop: 'auto',
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
});

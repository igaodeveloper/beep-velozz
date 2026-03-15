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

type SettingsSection = 'root' | 'notifications' | 'privacy' | 'storage' | 'support';

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
  const [scannerHapticsEnabled, setScannerHapticsEnabled] = React.useState(true);
  const [scannerSoundEnabled, setScannerSoundEnabled] = React.useState(true);
  const [autoCloseSessions, setAutoCloseSessions] = React.useState(false);
  const [autoCloseHours, setAutoCloseHours] = React.useState(4);
  const [activeSection, setActiveSection] = React.useState<SettingsSection>('root');

  const toggleTheme = () => {
    setColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
  };

  if (activeSection === 'notifications') {
    return <NotificationSettingsScreen onBack={() => setActiveSection('root')} />;
  }

  if (activeSection === 'privacy') {
    return <PrivacySecuritySettingsScreen onBack={() => setActiveSection('root')} />;
  }

  if (activeSection === 'storage') {
    return <StorageSettingsScreen onBack={() => setActiveSection('root')} />;
  }

  if (activeSection === 'support') {
    return <HelpSupportSettingsScreen onBack={() => setActiveSection('root')} />;
  }

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
          icon={Bell}
          title="Notificações"
          subtitle="Gerenciar alertas e sons"
          onPress={() => setActiveSection('notifications')}
        />
        <SettingsItem
          icon={Shield}
          title="Privacidade e Segurança"
          subtitle="Proteger seus dados"
          onPress={() => setActiveSection('privacy')}
        />
      </View>

      <View style={styles.section}>
        <SettingsItem
          icon={Database}
          title="Armazenamento"
          subtitle="Gerenciar espaço e backup"
          onPress={() => setActiveSection('storage')}
        />
        <SettingsItem
          icon={HelpCircle}
          title="Ajuda e Suporte"
          subtitle="Central de ajuda e contato"
          onPress={() => setActiveSection('support')}
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

interface DetailScreenProps {
  onBack: () => void;
}

function DetailHeader({ title, subtitle, onBack }: { title: string; subtitle: string; onBack: () => void }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack} style={{ marginBottom: 12 }}>
        <Text style={{ color: colors.primary, fontSize: 18 }}>{'← Voltar'}</Text>
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
    </View>
  );
}

function NotificationSettingsScreen({ onBack }: DetailScreenProps) {
  const { colors } = useAppTheme();
  const [sessionAlertsEnabled, setSessionAlertsEnabled] = React.useState(true);
  const [divergenceAlertsEnabled, setDivergenceAlertsEnabled] = React.useState(true);
  const [dailySummaryEnabled, setDailySummaryEnabled] = React.useState(false);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <DetailHeader
        title="Notificações"
        subtitle="Configure como e quando o Beep Velozz deve te avisar."
        onBack={onBack}
      />

      <View style={styles.section}>
        <SettingsItem
          icon={Bell}
          title="Alertas de sessão"
          subtitle="Lembrar de encerrar sessões abertas há muitas horas"
          onPress={() => setSessionAlertsEnabled((prev) => !prev)}
          rightComponent={
            <Switch
              value={sessionAlertsEnabled}
              onValueChange={() => setSessionAlertsEnabled((prev) => !prev)}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={sessionAlertsEnabled ? colors.primary : colors.textFaint}
            />
          }
        />
        <SettingsItem
          icon={Bell}
          title="Alertas de divergência"
          subtitle="Receber aviso forte quando a divergência ficar alta"
          onPress={() => setDivergenceAlertsEnabled((prev) => !prev)}
          rightComponent={
            <Switch
              value={divergenceAlertsEnabled}
              onValueChange={() => setDivergenceAlertsEnabled((prev) => !prev)}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={divergenceAlertsEnabled ? colors.primary : colors.textFaint}
            />
          }
        />
        <SettingsItem
          icon={Bell}
          title="Resumo diário"
          subtitle="Envio de resumo diário com sessões e divergências"
          onPress={() => setDailySummaryEnabled((prev) => !prev)}
          rightComponent={
            <Switch
              value={dailySummaryEnabled}
              onValueChange={() => setDailySummaryEnabled((prev) => !prev)}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={dailySummaryEnabled ? colors.primary : colors.textFaint}
            />
          }
        />
      </View>
    </ScrollView>
  );
}

function PrivacySecuritySettingsScreen({ onBack }: DetailScreenProps) {
  const { colors } = useAppTheme();
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState(true);
  const [anonymizeDrivers, setAnonymizeDrivers] = React.useState(false);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <DetailHeader
        title="Privacidade e Segurança"
        subtitle="Controle como seus dados de operação são tratados."
        onBack={onBack}
      />

      <View style={styles.section}>
        <SettingsItem
          icon={Shield}
          title="Enviar métricas anônimas"
          subtitle="Ajudar a melhorar o produto sem expor dados sensíveis"
          onPress={() => setAnalyticsEnabled((prev) => !prev)}
          rightComponent={
            <Switch
              value={analyticsEnabled}
              onValueChange={() => setAnalyticsEnabled((prev) => !prev)}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={analyticsEnabled ? colors.primary : colors.textFaint}
            />
          }
        />
        <SettingsItem
          icon={Shield}
          title="Anonimizar nomes de motoristas"
          subtitle="Ocultar nomes reais em relatórios e exportações"
          onPress={() => setAnonymizeDrivers((prev) => !prev)}
          rightComponent={
            <Switch
              value={anonymizeDrivers}
              onValueChange={() => setAnonymizeDrivers((prev) => !prev)}
              trackColor={{ false: colors.border, true: colors.primary + '40' }}
              thumbColor={anonymizeDrivers ? colors.primary : colors.textFaint}
            />
          }
        />
      </View>
    </ScrollView>
  );
}

function StorageSettingsScreen({ onBack }: DetailScreenProps) {
  const { colors } = useAppTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <DetailHeader
        title="Armazenamento"
        subtitle="Entenda o que o Beep Velozz guarda no seu dispositivo."
        onBack={onBack}
      />

      <View style={styles.section}>
        <SettingsItem
          icon={Database}
          title="Sessões locais"
          subtitle="Histórico de conferências salvo no dispositivo para acesso offline"
        />
        <SettingsItem
          icon={Database}
          title="Fotos de pacotes"
          subtitle="Imagens associadas às sessões para fins de auditoria"
        />
      </View>
    </ScrollView>
  );
}

function HelpSupportSettingsScreen({ onBack }: DetailScreenProps) {
  const { colors } = useAppTheme();

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]}>
      <DetailHeader
        title="Ajuda e Suporte"
        subtitle="Encontre respostas rápidas e canais de contato."
        onBack={onBack}
      />

      <View style={styles.section}>
        <SettingsItem
          icon={HelpCircle}
          title="Perguntas frequentes"
          subtitle="Como iniciar uma sessão, encerrar com divergência, gerar relatórios..."
        />
        <SettingsItem
          icon={HelpCircle}
          title="Contato com o suporte"
          subtitle="Canal dedicado para times de operação"
        />
      </View>
    </ScrollView>
  );
}


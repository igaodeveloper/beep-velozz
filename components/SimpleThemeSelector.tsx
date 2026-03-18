import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { ThemeName, themePresets } from '@/utils/theme';
import * as Haptics from 'expo-haptics';

const { width: screenWidth } = Dimensions.get('window');

interface SimpleThemeSelectorProps {
  visible: boolean;
  onClose: () => void;
}

export default function SimpleThemeSelector({ visible, onClose }: SimpleThemeSelectorProps) {
  const { themeName, setThemeName } = useAppTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeName>(themeName);

  const themes = [
    { key: 'light', name: 'Claro', color: '#f97316' },
    { key: 'dark', name: 'Escuro', color: '#ff7a1f' },
    { key: 'ocean', name: 'Oceano', color: '#06b6d4' },
    { key: 'ocean-light', name: 'Oceano Claro', color: '#06b6d4' },
    { key: 'forest', name: 'Floresta', color: '#10b981' },
    { key: 'forest-light', name: 'Floresta Claro', color: '#10b981' },
    { key: 'sunset', name: 'Pôr do Sol', color: '#f97316' },
    { key: 'sunset-light', name: 'Pôr do Sol Claro', color: '#f97316' },
    { key: 'midnight', name: 'Meia-Noite', color: '#6366f1' },
    { key: 'midnight-light', name: 'Meia-Noite Claro', color: '#6366f1' },
    { key: 'arctic', name: 'Ártico', color: '#0284c7' },
    { key: 'volcano', name: 'Vulcão', color: '#dc2626' },
    { key: 'volcano-light', name: 'Vulcão Claro', color: '#dc2626' },
    { key: 'rose', name: 'Rosa', color: '#e11d48' },
    { key: 'rose-light', name: 'Rosa Claro', color: '#e11d48' },
    { key: 'emerald', name: 'Esmeralda', color: '#059669' },
    { key: 'emerald-light', name: 'Esmeralda Claro', color: '#059669' },
    { key: 'amber', name: 'Âmbar', color: '#d97706' },
    { key: 'amber-light', name: 'Âmbar Claro', color: '#d97706' },
  ];

  const handleSelectTheme = (themeKey: ThemeName) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedTheme(themeKey);
  };

  const handleApplyTheme = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setThemeName(selectedTheme);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Selecionar Tema</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Theme List */}
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.themeGrid}>
            {themes.map((theme) => (
              <TouchableOpacity
                key={theme.key}
                style={[
                  styles.themeCard,
                  {
                    backgroundColor: themePresets[theme.key as ThemeName].colors.surface,
                    borderColor: selectedTheme === theme.key ? theme.color : 'transparent',
                    borderWidth: selectedTheme === theme.key ? 2 : 1,
                  },
                ]}
                onPress={() => handleSelectTheme(theme.key as ThemeName)}
              >
                <View style={[styles.colorPreview, { backgroundColor: theme.color }]} />
                <Text style={[
                  styles.themeName,
                  { color: themePresets[theme.key as ThemeName].colors.text }
                ]}>
                  {theme.name}
                </Text>
                {selectedTheme === theme.key && (
                  <View style={[styles.checkmark, { backgroundColor: theme.color }]}>
                    <Text style={styles.checkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Apply Button */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.applyButton} onPress={handleApplyTheme}>
            <Text style={styles.applyText}>Aplicar Tema</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    color: '#6b7280',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  themeGrid: {
    paddingTop: 20,
    paddingBottom: 20,
    gap: 15,
  },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    position: 'relative',
  },
  colorPreview: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 15,
  },
  themeName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  applyButton: {
    backgroundColor: '#f97316',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

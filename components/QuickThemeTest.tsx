import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';

export default function QuickThemeTest() {
  const { themeName, setThemeName, colors, theme } = useAppTheme();

  const themes = ['light', 'dark', 'ocean', 'ocean-light', 'forest', 'forest-light', 'sunset', 'sunset-light', 'midnight', 'midnight-light', 'arctic', 'volcano', 'volcano-light', 'rose', 'rose-light', 'emerald', 'emerald-light', 'amber', 'amber-light'];

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        Teste Rápido de Temas
      </Text>
      
      <Text style={[styles.current, { color: colors.textMuted }]}>
        Tema atual: {theme?.name || 'N/A'}
      </Text>

      <View style={styles.buttonGrid}>
        {themes.map((theme) => (
          <TouchableOpacity
            key={theme}
            style={[
              styles.themeButton,
              { 
                backgroundColor: colors.primary,
                opacity: themeName === theme ? 1 : 0.7
              }
            ]}
            onPress={() => setThemeName(theme as any)}
          >
            <Text style={styles.buttonText}>
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.previewText, { color: colors.text }]}>
          Preview do Tema
        </Text>
        <View style={styles.colorRow}>
          <Text style={[styles.colorLabel, { color: colors.text }]}>Primary:</Text>
          <View style={[styles.colorBox, { backgroundColor: colors.primary }]} />
        </View>
        <View style={styles.colorRow}>
          <Text style={[styles.colorLabel, { color: colors.text }]}>Surface:</Text>
          <View style={[styles.colorBox, { backgroundColor: colors.surface }]} />
        </View>
        <View style={styles.colorRow}>
          <Text style={[styles.colorLabel, { color: colors.text }]}>Text:</Text>
          <View style={[styles.colorBox, { backgroundColor: colors.text }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  current: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30,
    gap: 10,
  },
  themeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  preview: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  colorLabel: {
    fontSize: 14,
    flex: 1,
  },
  colorBox: {
    width: 30,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#000',
  },
});

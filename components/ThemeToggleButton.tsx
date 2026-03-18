import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';
import { useAppTheme } from '@/utils/useAppTheme';
import { Palette } from 'lucide-react-native';
import SimpleThemeSelector from './SimpleThemeSelector';
import * as Haptics from 'expo-haptics';

export default function ThemeToggleButton() {
  const { colors, theme, themeName } = useAppTheme();
  const [showSelector, setShowSelector] = useState(false);

  const handleOpenSelector = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowSelector(true);
  };

  return (
    <>
      <TouchableOpacity
        style={[
          styles.floatingButton,
          {
            backgroundColor: colors.primary,
            borderColor: colors.border,
          }
        ]}
        onPress={handleOpenSelector}
      >
        <Palette size={20} color="#ffffff" />
      </TouchableOpacity>

      <SimpleThemeSelector
        visible={showSelector}
        onClose={() => setShowSelector(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

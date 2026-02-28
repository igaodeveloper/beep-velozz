import { useTheme } from './themeContext';
import { getTheme } from './theme';

export function useAppTheme() {
  const { isDark } = useTheme();
  const themeColors = getTheme(isDark);
  return {
    isDark,
    colors: themeColors.colors,
  };
}

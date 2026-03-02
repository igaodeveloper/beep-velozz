import { useTheme } from './themeContext';
import { getTheme } from './theme';

export type ThemeColors = ReturnType<typeof getTheme>['colors'];

export function useAppTheme() {
  const { isDark } = useTheme();
  const themeColors = getTheme(isDark);
  return {
    isDark,
    colors: themeColors.colors,
  };
}

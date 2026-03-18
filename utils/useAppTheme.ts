import { useTheme } from './themeContext';
import { getTheme } from './theme';
import { ThemeName } from './theme';

export type ThemeColors = ReturnType<typeof getTheme>['colors'];

export function useAppTheme() {
  const { themeName, setThemeName, isDark, colors, theme } = useTheme();
  return {
    themeName,
    setThemeName,
    isDark,
    colors,
    theme,
  };
}

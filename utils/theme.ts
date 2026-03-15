export const lightTheme = {
  colors: {
    bg: '#ffffff',
    surface: '#f9fafb',
    surface2: '#f3f4f6',
    border: '#e5e7eb',
    border2: '#d1d5db',
    text: '#111827',
    textMuted: '#6b7280',
    textSubtle: '#9ca3af',
    textFaint: '#d1d5db',
    primary: '#f97316',
    primary2: '#fb923c',
    primaryLight: '#fedba74',
    primaryDark: '#ea580c',
    secondary: '#ffffff',
    secondaryText: '#111827',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
  },
} as const;

export const darkTheme = {
  colors: {
    // Fundo estilo OLED (preto real com superfícies bem escuras)
    bg: '#000000',
    surface: '#020617',
    surface2: '#020617',
    border: '#1e293b',
    border2: '#334155',
    text: '#f8fafc',
    textMuted: '#cbd5e1',
    textSubtle: '#94a3b8',
    textFaint: '#64748b',
    // Laranja vivo em tom neon
    primary: '#ff7a1f',
    primary2: '#ff9140',
    primaryLight: '#ffd1a1',
    primaryDark: '#cc5f14',
    secondary: '#1e293b',
    secondaryText: '#f8fafc',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
  },
} as const;

export const getTheme = (isDark: boolean) => {
  return isDark ? darkTheme : lightTheme;
};

export const theme = lightTheme;

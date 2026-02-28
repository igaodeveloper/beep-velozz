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
    bg: '#0f172a',
    surface: '#1e293b',
    surface2: '#0f172a',
    border: '#334155',
    border2: '#475569',
    text: '#f8fafc',
    textMuted: '#cbd5e1',
    textSubtle: '#94a3b8',
    textFaint: '#64748b',
    primary: '#f97316',
    primary2: '#fb923c',
    primaryLight: '#fed7aa',
    primaryDark: '#ea580c',
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

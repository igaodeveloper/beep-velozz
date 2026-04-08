import { COLORS } from './constants';

export const theme = {
  colors: {
    bg: COLORS.BG,
    surface: COLORS.SURFACE,
    surface2: '#0a0f1e',
    border: COLORS.BORDER,
    border2: COLORS.BORDER2,
    text: COLORS.TEXT,
    textMuted: COLORS.TEXT_SECONDARY,
    textSubtle: '#64748b',
    textFaint: '#334155',
    primary: COLORS.PRIMARY,
    primary2: '#fb923c',
    success: '#10b981',
    danger: '#ef4444',
    warning: '#f59e0b',
  },
} as const;

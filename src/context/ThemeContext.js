import React, { createContext, useContext, useState } from 'react';
import { COLORS } from '../constants/theme';

const DARK_COLORS = {
  ...COLORS,
  // Background
  background: '#0F172A',
  white: '#1E293B',
  // Cards / Surfaces
  card: '#1E293B',
  surface: '#1E293B',
  // Text
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  // Border
  border: '#334155',
  borderLight: '#334155',
  // Extra
  inputBg: '#334155',
  placeholderBg: '#334155',
  deleteButtonBg: 'rgba(239, 68, 68, 0.15)',
  deleteButtonBorder: 'rgba(239, 68, 68, 0.3)',
  menuIconBg1: 'rgba(123, 97, 255, 0.2)',
  menuIconBg2: 'rgba(245, 158, 11, 0.2)',
  menuIconBg3: 'rgba(16, 185, 129, 0.2)',
  shadowColor: '#000',
  statusConfirmedBg: 'rgba(16, 185, 129, 0.2)',
  statusCancelledBg: 'rgba(239, 68, 68, 0.2)',
  statusCompletedBg: 'rgba(99, 102, 241, 0.2)',
  cardIconBg: '#334155',
  personCardGradient: ['#1E293B', '#263348', '#334155'],
  calendarBg: '#1E293B',
};

const LIGHT_COLORS = {
  ...COLORS,
  card: '#FFFFFF',
  surface: '#F8FAFC',
  inputBg: '#FFFFFF',
  placeholderBg: '#F1F5F9',
  deleteButtonBg: '#FEF2F2',
  deleteButtonBorder: '#FECACA',
  menuIconBg1: '#EDE9FE',
  menuIconBg2: '#FEF3C7',
  menuIconBg3: '#DCFCE7',
  shadowColor: '#000',
  statusConfirmedBg: '#DCFCE7',
  statusCancelledBg: '#FEE2E2',
  statusCompletedBg: '#DBEAFE',
  cardIconBg: '#F5F3FF',
  personCardGradient: ['#EDE9FE', '#DDD6FE', '#C4B5FD'],
  calendarBg: '#FFFFFF',
};

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => setIsDark((prev) => !prev);
  const colors = isDark ? DARK_COLORS : LIGHT_COLORS;

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    // Fallback if not wrapped
    return { isDark: false, toggleTheme: () => {}, colors: LIGHT_COLORS };
  }
  return ctx;
}

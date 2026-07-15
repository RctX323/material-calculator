/**
 * Bid Pro Material Calculator — Brand Design Tokens
 * Dark theme with orange accents for contractor professionals
 */

export const brand = {
  // Core brand colors
  orange: '#F97316',       // Primary brand orange
  orangeLight: '#FB923C', // Lighter orange for hover states
  orangeDark: '#EA580C',  // Darker orange for press states
  orangeMuted: '#7C2D12', // Muted orange for backgrounds

  // Dark theme backgrounds
  bg: '#0A0A0A',           // Page background (near black)
  bgCard: '#141414',       // Card background
  bgElevated: '#1C1C1E',   // Elevated card (iOS dark style)
  bgInput: '#1E1E1E',      // Input field background
  bgSection: '#111111',    // Section divider

  // Borders and dividers
  border: '#2C2C2E',       // Subtle border
  borderStrong: '#3A3A3C', // Visible border

  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#A1A1A1',
  textTertiary: '#636366',
  textOrange: '#F97316',

  // Status colors
  success: '#34C759',
  warning: '#FF9F0A',
  error: '#FF453A',

  // Calculator specific
  display: '#F97316',      // Result number color
  keyBg: '#1C1C1E',        // Calculator key background
};

export const sizes = {
  headerHeight: 56,
  tabBarHeight: 60,
  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 999,
  },
};

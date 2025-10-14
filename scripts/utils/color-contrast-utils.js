#!/usr/bin/env node

/**
 * Shared Color Contrast Utilities
 * Used by various color contrast scripts to avoid code duplication
 */

/**
 * Calculate relative luminance of an RGB color
 * @param {number} r - Red component (0-255)
 * @param {number} g - Green component (0-255)
 * @param {number} b - Blue component (0-255)
 * @returns {number} Relative luminance (0-1)
 */
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Convert hex color to RGB components
 * @param {string} hex - Hex color (e.g., "#ff3366")
 * @returns {{r: number, g: number, b: number} | null} RGB object or null if invalid
 */
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate contrast ratio between two colors
 * @param {string} color1 - First color (hex)
 * @param {string} color2 - Second color (hex)
 * @returns {number} Contrast ratio (1-21)
 */
function getContrastRatio(color1, color2) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid color format');
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check WCAG compliance for a color combination
 * @param {string} foreground - Foreground color (hex)
 * @param {string} background - Background color (hex)
 * @param {boolean} isLargeText - Whether text is large (18pt+ or 14pt+ bold)
 * @returns {{ratio: number, passAA: boolean, passAAA: boolean, requiredAA: number}}
 */
function checkCompliance(foreground, background, isLargeText = false) {
  const ratio = getContrastRatio(foreground, background);
  const requiredAA = isLargeText ? 3 : 4.5;
  const requiredAAA = isLargeText ? 4.5 : 7;

  return {
    ratio: Math.round(ratio * 100) / 100,
    passAA: ratio >= requiredAA,
    passAAA: ratio >= requiredAAA,
    requiredAA,
  };
}

/**
 * Common color replacement mappings for design system
 */
const COLOR_REPLACEMENTS = {
  // Text colors
  'text-gray-900': 'text-text',
  'text-gray-800': 'text-text',
  'text-gray-700': 'text-text',
  'text-gray-600': 'text-text-light',
  'text-gray-500': 'text-text-light',
  'text-gray-400': 'text-text-light',
  'text-gray-300': 'text-text-light',
  'text-gray-200': 'text-text-light',
  'text-gray-100': 'text-text-light',

  // Background colors
  'bg-gray-900': 'bg-background',
  'bg-gray-800': 'bg-background',
  'bg-gray-700': 'bg-surface',
  'bg-gray-600': 'bg-surface',
  'bg-gray-500': 'bg-surface',
  'bg-gray-400': 'bg-surface',
  'bg-gray-300': 'bg-surface',
  'bg-gray-200': 'bg-surface',
  'bg-gray-100': 'bg-surface',
  'bg-gray-50': 'bg-surface',

  // Border colors
  'border-gray-900': 'border-border',
  'border-gray-800': 'border-border',
  'border-gray-700': 'border-border',
  'border-gray-600': 'border-border',
  'border-gray-500': 'border-border',
  'border-gray-400': 'border-border',
  'border-gray-300': 'border-border',
  'border-gray-200': 'border-border',
  'border-gray-100': 'border-border',

  // Red colors (error states)
  'text-red-600': 'text-destructive',
  'text-red-500': 'text-destructive',
  'text-red-400': 'text-destructive',
  'bg-red-50': 'bg-destructive/10',
  'bg-red-100': 'bg-destructive/10',
  'bg-red-200': 'bg-destructive/10',
  'bg-red-900': 'bg-destructive/20',
  'border-red-200': 'border-destructive',
  'border-red-300': 'border-destructive',
  'border-red-500': 'border-destructive',
  'border-red-600': 'border-destructive',
  'border-red-800': 'border-destructive',

  // Blue colors (primary states)
  'text-blue-600': 'text-primary',
  'text-blue-500': 'text-primary',
  'text-blue-400': 'text-primary',
  'text-blue-300': 'text-primary',
  'text-blue-700': 'text-primary',
  'bg-blue-50': 'bg-primary/10',
  'bg-blue-100': 'bg-primary/10',
  'bg-blue-200': 'bg-primary/10',
  'bg-blue-900': 'bg-primary/20',
  'border-blue-200': 'border-primary',
  'border-blue-300': 'border-primary',
  'border-blue-500': 'border-primary',
  'border-blue-600': 'border-primary',
  'border-blue-800': 'border-primary',

  // Green colors (success states)
  'text-green-600': 'text-success',
  'text-green-500': 'text-success',
  'text-green-400': 'text-success',
  'bg-green-50': 'bg-success/10',
  'bg-green-100': 'bg-success/10',
  'border-green-300': 'border-success',
  'border-green-500': 'border-success',
  'hover:border-green-300': 'hover:border-success',
  'hover:bg-green-50': 'hover:bg-success/10',

  // Focus states
  'focus:ring-red-500': 'focus:ring-destructive',
  'focus:border-red-500': 'focus:border-destructive',
  'focus:ring-blue-500': 'focus:ring-primary',
  'focus:border-blue-500': 'focus:border-primary',

  // Hover states
  'hover:bg-gray-50': 'hover:bg-surface',
  'hover:bg-gray-100': 'hover:bg-surface',
  'hover:border-gray-300': 'hover:border-border',
  'hover:text-gray-700': 'hover:text-text',
  'hover:bg-red-50': 'hover:bg-destructive/10',
  'hover:bg-blue-50': 'hover:bg-primary/10',
  'hover:bg-blue-100': 'hover:bg-primary/10',
  'hover:bg-blue-900': 'hover:bg-primary/20',

  // Dark mode specific
  'dark:bg-gray-800': 'dark:bg-background',
  'dark:bg-gray-700': 'dark:bg-surface',
  'dark:bg-gray-600': 'dark:bg-surface',
  'dark:text-gray-300': 'dark:text-text-light',
  'dark:text-gray-400': 'dark:text-text-light',
  'dark:border-gray-700': 'dark:border-border',
  'dark:border-gray-600': 'dark:border-border',
  'dark:border-gray-800': 'dark:border-border',
  'dark:hover:bg-gray-700': 'dark:hover:bg-surface',
  'dark:hover:bg-gray-800': 'dark:hover:bg-surface',
  'dark:hover:bg-red-900': 'dark:hover:bg-destructive/20',
  'dark:hover:bg-blue-900': 'dark:hover:bg-primary/20',
  'dark:text-red-400': 'dark:text-destructive',
  'dark:text-blue-300': 'dark:text-primary',
  'dark:border-red-600': 'dark:border-destructive',
  'dark:border-red-800': 'dark:border-destructive',
  'dark:border-blue-600': 'dark:border-primary',
  'dark:border-blue-800': 'dark:border-primary',
};

/**
 * Get design system color replacement for a hardcoded color
 * @param {string} hardcodedColor - Hardcoded Tailwind color class
 * @returns {string} Design system color class or original if no mapping exists
 */
function getDesignSystemColor(hardcodedColor) {
  return COLOR_REPLACEMENTS[hardcodedColor] || hardcodedColor;
}

module.exports = {
  getLuminance,
  hexToRgb,
  getContrastRatio,
  checkCompliance,
  COLOR_REPLACEMENTS,
  getDesignSystemColor,
};

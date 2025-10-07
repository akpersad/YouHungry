/**
 * Accessibility utilities for color contrast, ARIA management, and keyboard navigation
 */

/**
 * Calculate the relative luminance of a color
 * Formula from WCAG 2.0: https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
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
 * Formula from WCAG 2.0: https://www.w3.org/TR/WCAG20/#contrast-ratiodef
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) {
    throw new Error(
      'Invalid color format. Please use hex colors (e.g., #ffffff)'
    );
  }

  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if color contrast meets WCAG AA standards
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @param isLargeText - Whether the text is large (18pt+ or 14pt+ bold)
 * @returns Object with pass/fail status and contrast ratio
 */
export function checkContrastCompliance(
  foreground: string,
  background: string,
  isLargeText = false
): {
  ratio: number;
  passAA: boolean;
  passAAA: boolean;
  requiredRatio: number;
} {
  const ratio = getContrastRatio(foreground, background);
  const requiredRatioAA = isLargeText ? 3 : 4.5;
  const requiredRatioAAA = isLargeText ? 4.5 : 7;

  return {
    ratio: Math.round(ratio * 100) / 100,
    passAA: ratio >= requiredRatioAA,
    passAAA: ratio >= requiredRatioAAA,
    requiredRatio: requiredRatioAA,
  };
}

/**
 * Design system color contrast verification
 * Checks all critical color combinations
 */
export function verifyDesignSystemContrast() {
  const results = {
    lightMode: {
      primaryText: checkContrastCompliance('#1a1a1a', '#fafafa', false),
      secondaryText: checkContrastCompliance('#4a4a4a', '#fafafa', false),
      tertiaryText: checkContrastCompliance('#8a8a8a', '#fafafa', false),
      accentOnWhite: checkContrastCompliance('#ff3366', '#ffffff', false),
      whiteOnAccent: checkContrastCompliance('#ffffff', '#ff3366', false),
      accentOnBackground: checkContrastCompliance('#ff3366', '#fafafa', false),
    },
    darkMode: {
      primaryText: checkContrastCompliance('#ffffff', '#000000', false),
      secondaryText: checkContrastCompliance('#d1d1d1', '#000000', false),
      tertiaryText: checkContrastCompliance('#8a8a8a', '#000000', false),
      accentOnBlack: checkContrastCompliance('#ff3366', '#000000', false),
      accentOnCharcoal: checkContrastCompliance('#ff3366', '#1a1a1a', false),
      whiteOnAccent: checkContrastCompliance('#ffffff', '#ff3366', false),
    },
  };

  return results;
}

/**
 * Get color contrast recommendations
 */
export function getContrastRecommendation(
  ratio: number,
  required: number
): string {
  if (ratio >= required) {
    return '✅ Passes WCAG AA standards';
  }

  const difference = required - ratio;
  if (difference < 0.5) {
    return '⚠️ Close to passing. Consider slight adjustments.';
  } else if (difference < 1) {
    return '⚠️ Below standard. Adjust colors for better readability.';
  } else {
    return '❌ Significantly below standard. Major color adjustments needed.';
  }
}

/**
 * Focus trap utility for modals and overlays
 */
export function createFocusTrap(element: HTMLElement): {
  activate: () => void;
  deactivate: () => void;
} {
  let previousActiveElement: HTMLElement | null = null;

  const getFocusableElements = (): HTMLElement[] => {
    const selector =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(element.querySelectorAll<HTMLElement>(selector));
  };

  const handleTab = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusableElements = getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  };

  return {
    activate: () => {
      previousActiveElement = document.activeElement as HTMLElement;
      const focusableElements = getFocusableElements();
      focusableElements[0]?.focus();
      document.addEventListener('keydown', handleTab);
    },
    deactivate: () => {
      document.removeEventListener('keydown', handleTab);
      previousActiveElement?.focus();
    },
  };
}

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get appropriate animation duration based on user preference
 */
export function getAnimationDuration(normalDuration: number): number {
  return prefersReducedMotion() ? 0.01 : normalDuration;
}

/**
 * Keyboard navigation helper
 * @param items - Array of items to navigate
 * @param currentIndex - Current focused index
 * @param key - Key pressed
 * @returns New index to focus
 */
export function handleArrowKeyNavigation<T>(
  items: T[],
  currentIndex: number,
  key: string
): number {
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
      return (currentIndex + 1) % items.length;
    case 'ArrowUp':
    case 'ArrowLeft':
      return (currentIndex - 1 + items.length) % items.length;
    case 'Home':
      return 0;
    case 'End':
      return items.length - 1;
    default:
      return currentIndex;
  }
}

/**
 * ARIA attribute helpers
 */
export const aria = {
  /**
   * Generate unique ID for ARIA relationships
   */
  generateId: (prefix: string): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Create ARIA description relationship
   */
  describeBy: (elementId: string, descriptionIds: string[]): string => {
    return descriptionIds.join(' ');
  },

  /**
   * Get ARIA expanded state
   */
  expandedState: (isExpanded: boolean): 'true' | 'false' => {
    return isExpanded ? 'true' : 'false';
  },

  /**
   * Get ARIA checked state for checkboxes and switches
   */
  checkedState: (
    isChecked: boolean,
    isMixed?: boolean
  ): 'true' | 'false' | 'mixed' => {
    if (isMixed) return 'mixed';
    return isChecked ? 'true' : 'false';
  },

  /**
   * Get ARIA pressed state for toggle buttons
   */
  pressedState: (isPressed: boolean): 'true' | 'false' => {
    return isPressed ? 'true' : 'false';
  },

  /**
   * Get ARIA invalid state
   */
  invalidState: (hasError: boolean): 'true' | 'false' | undefined => {
    return hasError ? 'true' : undefined;
  },

  /**
   * Get ARIA live region politeness
   */
  liveRegion: (
    type: 'status' | 'alert' | 'log'
  ): {
    role: string;
    'aria-live': 'polite' | 'assertive' | 'off';
    'aria-atomic': 'true' | 'false';
  } => {
    const settings = {
      status: {
        role: 'status',
        'aria-live': 'polite' as const,
        'aria-atomic': 'true' as const,
      },
      alert: {
        role: 'alert',
        'aria-live': 'assertive' as const,
        'aria-atomic': 'true' as const,
      },
      log: {
        role: 'log',
        'aria-live': 'polite' as const,
        'aria-atomic': 'false' as const,
      },
    };
    return settings[type];
  },
};

/**
 * Screen reader only text helper
 * Returns className for screen reader only text
 */
export function getSrOnlyClass(): string {
  return 'sr-only';
}

/**
 * Export color constants for verification
 */
export const DESIGN_SYSTEM_COLORS = {
  lightMode: {
    bgPrimary: '#fafafa',
    bgSecondary: '#ffffff',
    bgTertiary: '#f5f5f5',
    bgQuaternary: '#e5e5e5',
    bgQuinary: '#d1d1d1',
    textPrimary: '#1a1a1a',
    textSecondary: '#4a4a4a',
    textTertiary: '#8a8a8a',
    textInverse: '#ffffff',
    accentPrimary: '#ff3366',
    accentPrimaryLight: '#ff6699',
    accentPrimaryDark: '#cc1144',
  },
  darkMode: {
    bgPrimary: '#000000',
    bgSecondary: '#1a1a1a',
    bgTertiary: '#2d2d2d',
    bgQuaternary: '#404040',
    bgQuinary: '#666666',
    textPrimary: '#ffffff',
    textSecondary: '#d1d1d1',
    textTertiary: '#8a8a8a',
    textInverse: '#1a1a1a',
    accentPrimary: '#ff3366',
    accentPrimaryLight: '#ff6699',
    accentPrimaryDark: '#cc1144',
  },
} as const;

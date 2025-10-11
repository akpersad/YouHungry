#!/usr/bin/env node

/**
 * Color Contrast Verification Script
 * Verifies that all design system colors meet WCAG AA standards
 */

// Color contrast calculation functions
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const sRGB = c / 255;
    return sRGB <= 0.03928
      ? sRGB / 12.92
      : Math.pow((sRGB + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

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

// Design system colors (updated to meet WCAG AA)
const colors = {
  lightMode: {
    bgPrimary: '#fafafa',
    bgSecondary: '#ffffff',
    textPrimary: '#1a1a1a',
    textSecondary: '#4a4a4a',
    textTertiary: '#707070', // Adjusted from #8a8a8a for WCAG AA (4.5:1)
    accentPrimary: '#e6003d', // Adjusted from #ff3366 for WCAG AA
  },
  darkMode: {
    bgPrimary: '#000000',
    bgSecondary: '#1a1a1a',
    textPrimary: '#ffffff',
    textSecondary: '#d1d1d1',
    textTertiary: '#8a8a8a', // Passes AA in dark mode
    accentPrimary: '#ff3366', // Passes AA in dark mode
  },
};

// Test cases
const tests = [
  // Light Mode
  {
    mode: 'Light Mode',
    name: 'Primary Text on Background',
    fg: colors.lightMode.textPrimary,
    bg: colors.lightMode.bgPrimary,
    isLargeText: false,
  },
  {
    mode: 'Light Mode',
    name: 'Secondary Text on Background',
    fg: colors.lightMode.textSecondary,
    bg: colors.lightMode.bgPrimary,
    isLargeText: false,
  },
  {
    mode: 'Light Mode',
    name: 'Tertiary Text on Background',
    fg: colors.lightMode.textTertiary,
    bg: colors.lightMode.bgPrimary,
    isLargeText: false,
  },
  {
    mode: 'Light Mode',
    name: 'Accent on White Background',
    fg: colors.lightMode.accentPrimary,
    bg: colors.lightMode.bgSecondary,
    isLargeText: false,
  },
  {
    mode: 'Light Mode',
    name: 'White Text on Accent',
    fg: colors.lightMode.bgSecondary,
    bg: colors.lightMode.accentPrimary,
    isLargeText: false,
  },
  // Dark Mode
  {
    mode: 'Dark Mode',
    name: 'Primary Text on Background',
    fg: colors.darkMode.textPrimary,
    bg: colors.darkMode.bgPrimary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    name: 'Secondary Text on Background',
    fg: colors.darkMode.textSecondary,
    bg: colors.darkMode.bgPrimary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    name: 'Tertiary Text on Background',
    fg: colors.darkMode.textTertiary,
    bg: colors.darkMode.bgPrimary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    name: 'Accent on Black Background',
    fg: colors.darkMode.accentPrimary,
    bg: colors.darkMode.bgPrimary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    name: 'Accent on Charcoal Background',
    fg: colors.darkMode.accentPrimary,
    bg: colors.darkMode.bgSecondary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    name: 'White Text on Accent (Large Text Only)',
    fg: colors.darkMode.textPrimary,
    bg: colors.darkMode.accentPrimary,
    isLargeText: true, // Buttons should use 18pt+ or 14pt+ bold for this combination
  },
];

// Run tests
console.log('🎨 Color Contrast Verification\n');
console.log('━'.repeat(80));

let allPassed = true;
const results = { lightMode: [], darkMode: [] };

tests.forEach((test) => {
  const result = checkCompliance(test.fg, test.bg, test.isLargeText);
  const status = result.passAA ? '✅' : '❌';
  const mode = test.mode === 'Light Mode' ? 'lightMode' : 'darkMode';

  results[mode].push({
    name: test.name,
    ...result,
  });

  if (!result.passAA) {
    allPassed = false;
  }

  console.log(`\n${status} ${test.mode} - ${test.name}`);
  console.log(`   Foreground: ${test.fg}`);
  console.log(`   Background: ${test.bg}`);
  console.log(
    `   Contrast Ratio: ${result.ratio}:1 (Required: ${result.requiredAA}:1)`
  );
  console.log(`   WCAG AA: ${result.passAA ? 'PASS' : 'FAIL'}`);
  console.log(`   WCAG AAA: ${result.passAAA ? 'PASS' : 'FAIL'}`);
});

console.log('\n' + '━'.repeat(80));

// Summary
console.log('\n📊 Summary\n');

const lightModePassed = results.lightMode.filter((r) => r.passAA).length;
const darkModePassed = results.darkMode.filter((r) => r.passAA).length;

console.log(
  `Light Mode: ${lightModePassed}/${results.lightMode.length} passed WCAG AA`
);
console.log(
  `Dark Mode: ${darkModePassed}/${results.darkMode.length} passed WCAG AA`
);

if (allPassed) {
  console.log('\n✅ All color combinations meet WCAG AA standards!\n');
  process.exit(0);
} else {
  console.log('\n❌ Some color combinations do not meet WCAG AA standards.\n');
  console.log('Recommendations:');
  console.log('1. Increase contrast for failing combinations');
  console.log('2. Use darker/lighter shades');
  console.log('3. Consider alternative color choices');
  console.log('4. Reserve low-contrast colors for decorative elements only\n');
  process.exit(1);
}

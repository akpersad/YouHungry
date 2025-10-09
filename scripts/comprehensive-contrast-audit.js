#!/usr/bin/env node

/**
 * Comprehensive Color Contrast Audit Script
 * Tests ALL color combinations used in the design system
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

// ACTUAL colors from globals.css
const colors = {
  lightMode: {
    bgPrimary: '#fafafa',
    bgSecondary: '#ffffff',
    bgTertiary: '#f5f5f5',
    bgQuaternary: '#e5e5e5',
    bgQuinary: '#d1d1d1',
    textPrimary: '#1a1a1a',
    textSecondary: '#4a4a4a',
    textTertiary: '#6b6b6b', // From globals.css line 29
    textInverse: '#ffffff',
    accentPrimary: '#ff3366',
  },
  darkMode: {
    bgPrimary: '#000000',
    bgSecondary: '#1a1a1a',
    bgTertiary: '#2d2d2d',
    bgQuaternary: '#404040',
    bgQuinary: '#ababab', // FIXED: Changed from #666666 -> #8a8a8a -> #9a9a9a -> #a5a5a5 -> #ababab
    textPrimary: '#ffffff',
    textSecondary: '#d1d1d1',
    textTertiary: '#b8b8b8', // FIXED: Changed from #a0a0a0
    textInverse: '#1a1a1a',
    accentPrimary: '#ff3366',
  },
};

// Comprehensive test cases
const tests = [
  // ===== LIGHT MODE =====
  {
    mode: 'Light Mode',
    category: 'Primary Backgrounds',
    name: 'Primary Text on Primary Background',
    fg: colors.lightMode.textPrimary,
    bg: colors.lightMode.bgPrimary,
    isLargeText: false,
  },
  {
    mode: 'Light Mode',
    category: 'Primary Backgrounds',
    name: 'Secondary Text on Primary Background',
    fg: colors.lightMode.textSecondary,
    bg: colors.lightMode.bgPrimary,
    isLargeText: false,
  },
  {
    mode: 'Light Mode',
    category: 'Primary Backgrounds',
    name: 'Tertiary Text on Primary Background',
    fg: colors.lightMode.textTertiary,
    bg: colors.lightMode.bgPrimary,
    isLargeText: false,
  },
  {
    mode: 'Light Mode',
    category: 'Card Backgrounds',
    name: 'Primary Text on Secondary Background (Cards)',
    fg: colors.lightMode.textPrimary,
    bg: colors.lightMode.bgSecondary,
    isLargeText: false,
  },
  {
    mode: 'Light Mode',
    category: 'Card Backgrounds',
    name: 'Secondary Text on Secondary Background (Cards)',
    fg: colors.lightMode.textSecondary,
    bg: colors.lightMode.bgSecondary,
    isLargeText: false,
  },
  {
    mode: 'Light Mode',
    category: 'Card Backgrounds',
    name: 'Tertiary Text on Secondary Background (Cards)',
    fg: colors.lightMode.textTertiary,
    bg: colors.lightMode.bgSecondary,
    isLargeText: false,
  },

  // ===== DARK MODE - PRIMARY BACKGROUNDS =====
  {
    mode: 'Dark Mode',
    category: 'Primary Backgrounds',
    name: 'Primary Text on Primary Background',
    fg: colors.darkMode.textPrimary,
    bg: colors.darkMode.bgPrimary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    category: 'Primary Backgrounds',
    name: 'Secondary Text on Primary Background',
    fg: colors.darkMode.textSecondary,
    bg: colors.darkMode.bgPrimary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    category: 'Primary Backgrounds',
    name: 'Tertiary Text on Primary Background',
    fg: colors.darkMode.textTertiary,
    bg: colors.darkMode.bgPrimary,
    isLargeText: false,
  },

  // ===== DARK MODE - CARD BACKGROUNDS (bg-secondary) =====
  {
    mode: 'Dark Mode',
    category: 'Card Backgrounds (bg-secondary)',
    name: 'Primary Text on Secondary Background (Cards)',
    fg: colors.darkMode.textPrimary,
    bg: colors.darkMode.bgSecondary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    category: 'Card Backgrounds (bg-secondary)',
    name: 'Secondary Text on Secondary Background (Cards)',
    fg: colors.darkMode.textSecondary,
    bg: colors.darkMode.bgSecondary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    category: 'Card Backgrounds (bg-secondary)',
    name: '⚠️ Tertiary Text on Secondary Background (Cards)',
    fg: colors.darkMode.textTertiary,
    bg: colors.darkMode.bgSecondary,
    isLargeText: false,
  },

  // ===== DARK MODE - TERTIARY BACKGROUNDS =====
  {
    mode: 'Dark Mode',
    category: 'Tertiary Backgrounds (bg-tertiary)',
    name: 'Primary Text on Tertiary Background',
    fg: colors.darkMode.textPrimary,
    bg: colors.darkMode.bgTertiary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    category: 'Tertiary Backgrounds (bg-tertiary)',
    name: 'Secondary Text on Tertiary Background',
    fg: colors.darkMode.textSecondary,
    bg: colors.darkMode.bgTertiary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    category: 'Tertiary Backgrounds (bg-tertiary)',
    name: '🔴 Tertiary Text on Tertiary Background',
    fg: colors.darkMode.textTertiary,
    bg: colors.darkMode.bgTertiary,
    isLargeText: false,
  },

  // ===== DARK MODE - QUATERNARY BACKGROUNDS =====
  {
    mode: 'Dark Mode',
    category: 'Quaternary Backgrounds (bg-quaternary)',
    name: 'Primary Text on Quaternary Background',
    fg: colors.darkMode.textPrimary,
    bg: colors.darkMode.bgQuaternary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    category: 'Quaternary Backgrounds (bg-quaternary)',
    name: '⚠️ Secondary Text on Quaternary Background',
    fg: colors.darkMode.textSecondary,
    bg: colors.darkMode.bgQuaternary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    category: 'Quaternary Backgrounds (bg-quaternary)',
    name: '🔴 Tertiary Text on Quaternary Background',
    fg: colors.darkMode.textTertiary,
    bg: colors.darkMode.bgQuaternary,
    isLargeText: false,
  },

  // ===== DARK MODE - BORDERS (bg-quinary) =====
  {
    mode: 'Dark Mode',
    category: 'Border Visibility (bg-quinary)',
    name: 'Border (Quinary) on Primary Background',
    fg: colors.darkMode.bgQuinary,
    bg: colors.darkMode.bgPrimary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    category: 'Border Visibility (bg-quinary)',
    name: 'Border (Quinary) on Secondary Background',
    fg: colors.darkMode.bgQuinary,
    bg: colors.darkMode.bgSecondary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    category: 'Border Visibility (bg-quinary)',
    name: '⚠️ Border (Quinary) on Tertiary Background',
    fg: colors.darkMode.bgQuinary,
    bg: colors.darkMode.bgTertiary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    category: 'Border Visibility (bg-quinary)',
    name: '🔴 Border (Quinary) on Quaternary Background',
    fg: colors.darkMode.bgQuinary,
    bg: colors.darkMode.bgQuaternary,
    isLargeText: false,
  },

  // ===== DARK MODE - ACCENT COLORS =====
  {
    mode: 'Dark Mode',
    category: 'Accent Colors',
    name: 'Accent on Primary Background',
    fg: colors.darkMode.accentPrimary,
    bg: colors.darkMode.bgPrimary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    category: 'Accent Colors',
    name: 'Accent on Secondary Background',
    fg: colors.darkMode.accentPrimary,
    bg: colors.darkMode.bgSecondary,
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    category: 'Accent Colors',
    name: 'White Text on Accent Background (Buttons)',
    fg: colors.darkMode.textPrimary,
    bg: colors.darkMode.accentPrimary,
    isLargeText: true, // Buttons use larger text
  },
];

// Run tests
console.log('🔍 COMPREHENSIVE COLOR CONTRAST AUDIT\n');
console.log('Testing ALL color combinations from globals.css');
console.log('━'.repeat(80) + '\n');

let allPassed = true;
const failures = [];
const warnings = [];

// Group by category
const testsByCategory = {};
tests.forEach((test) => {
  const key = `${test.mode} - ${test.category}`;
  if (!testsByCategory[key]) {
    testsByCategory[key] = [];
  }
  testsByCategory[key].push(test);
});

// Run tests by category
Object.keys(testsByCategory).forEach((category) => {
  console.log(`\n📋 ${category}`);
  console.log('─'.repeat(80));

  testsByCategory[category].forEach((test) => {
    const result = checkCompliance(test.fg, test.bg, test.isLargeText);
    const status = result.passAA ? '✅' : '❌';

    const testInfo = {
      name: test.name,
      mode: test.mode,
      category: test.category,
      fg: test.fg,
      bg: test.bg,
      ...result,
    };

    if (!result.passAA) {
      allPassed = false;
      failures.push(testInfo);
    } else if (result.ratio < 5.0 && !test.isLargeText) {
      // Warning for ratios between 4.5 and 5.0 (passing but low)
      warnings.push(testInfo);
    }

    console.log(`${status} ${test.name}`);
    console.log(`   ${test.fg} on ${test.bg}`);
    console.log(
      `   Ratio: ${result.ratio}:1 (Required: ${result.requiredAA}:1 for ${test.isLargeText ? 'large' : 'normal'} text)`
    );
    if (!result.passAA || result.ratio < 5.0) {
      console.log(
        `   Status: ${result.passAA ? '⚠️ PASS (but low)' : '🔴 FAIL'}`
      );
    }
  });
});

console.log('\n' + '━'.repeat(80));

// Summary
console.log('\n📊 AUDIT SUMMARY\n');

const totalTests = tests.length;
const passedTests = totalTests - failures.length;

console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failures.length}`);
console.log(`⚠️ Warnings (low contrast): ${warnings.length}`);

if (failures.length > 0) {
  console.log('\n🔴 CRITICAL FAILURES (WCAG AA Not Met):\n');
  failures.forEach((f, i) => {
    console.log(`${i + 1}. ${f.name}`);
    console.log(`   ${f.fg} on ${f.bg}`);
    console.log(`   Ratio: ${f.ratio}:1 (needs ${f.requiredAA}:1)`);
    console.log(`   Gap: ${(f.requiredAA - f.ratio).toFixed(2)}:1 short\n`);
  });
}

if (warnings.length > 0) {
  console.log('⚠️ LOW CONTRAST WARNINGS (Pass AA but < 5.0:1):\n');
  warnings.forEach((w, i) => {
    console.log(`${i + 1}. ${w.name}`);
    console.log(`   ${w.fg} on ${w.bg}`);
    console.log(`   Ratio: ${w.ratio}:1\n`);
  });
}

// Recommendations
if (!allPassed) {
  console.log('━'.repeat(80));
  console.log('\n💡 RECOMMENDED FIXES:\n');

  console.log('For Dark Mode text-tertiary (#a0a0a0):');
  console.log(
    '  • Change to #b3b3b3 (lighter gray) for 4.5:1+ on all backgrounds'
  );
  console.log('  • Or change to #b8b8b8 for safer 5.0:1+ ratios\n');

  console.log('For Dark Mode borders (bg-quinary #666666):');
  console.log('  • On bg-tertiary: Use #8a8a8a or lighter');
  console.log('  • On bg-quaternary: Use #9a9a9a or lighter\n');

  console.log('General recommendations:');
  console.log('  • Aim for 5.0:1 minimum for better readability');
  console.log('  • Use 7.0:1+ for enhanced accessibility (WCAG AAA)');
  console.log('  • Test with actual users in dark environments\n');

  process.exit(1);
} else {
  console.log('\n✅ All critical color combinations meet WCAG AA standards!\n');
  if (warnings.length > 0) {
    console.log(
      '⚠️ Consider improving low-contrast combinations for better UX.\n'
    );
  }
  process.exit(0);
}

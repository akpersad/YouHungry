#!/usr/bin/env node

/**
 * Card-Specific Color Contrast Verification Script
 * Tests actual card text combinations used in the app
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

// Card-specific color combinations
const cardTests = [
  // Light Mode Card Tests
  {
    mode: 'Light Mode',
    name: 'Primary Text on Card Background',
    fg: '#1a1a1a', // text-primary
    bg: '#ffffff', // bg-secondary (card background)
    isLargeText: false,
  },
  {
    mode: 'Light Mode',
    name: 'Secondary Text on Card Background',
    fg: '#4a4a4a', // text-secondary
    bg: '#ffffff', // bg-secondary (card background)
    isLargeText: false,
  },
  {
    mode: 'Light Mode',
    name: 'Tertiary Text on Card Background',
    fg: '#6b6b6b', // text-tertiary (ratings, addresses) - adjusted
    bg: '#ffffff', // bg-secondary (card background)
    isLargeText: false,
  },
  {
    mode: 'Light Mode',
    name: 'Tertiary Text on Card Background (Large)',
    fg: '#6b6b6b', // text-tertiary - adjusted
    bg: '#ffffff', // bg-secondary (card background)
    isLargeText: true,
  },
  {
    mode: 'Light Mode',
    name: 'Accent Text on Card Background',
    fg: '#e6003d', // accent-primary
    bg: '#ffffff', // bg-secondary (card background)
    isLargeText: false,
  },

  // Dark Mode Card Tests
  {
    mode: 'Dark Mode',
    name: 'Primary Text on Card Background',
    fg: '#ffffff', // text-primary
    bg: '#1a1a1a', // bg-secondary (card background)
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    name: 'Secondary Text on Card Background',
    fg: '#d1d1d1', // text-secondary
    bg: '#1a1a1a', // bg-secondary (card background)
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    name: 'Tertiary Text on Card Background',
    fg: '#a0a0a0', // text-tertiary (ratings, addresses) - adjusted
    bg: '#1a1a1a', // bg-secondary (card background)
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    name: 'Tertiary Text on Card Background (Large)',
    fg: '#a0a0a0', // text-tertiary - adjusted
    bg: '#1a1a1a', // bg-secondary (card background)
    isLargeText: true,
  },
  {
    mode: 'Dark Mode',
    name: 'Accent Text on Card Background',
    fg: '#ff3366', // accent-primary
    bg: '#1a1a1a', // bg-secondary (card background)
    isLargeText: false,
  },

  // Additional problematic combinations from screenshots
  {
    mode: 'Light Mode',
    name: 'Rating Numbers on White Card',
    fg: '#6b6b6b', // Adjusted gray ratings
    bg: '#ffffff', // White card
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    name: 'Restaurant Names on Dark Card',
    fg: '#d1d1d1', // Light gray names
    bg: '#2d2d2d', // Dark card background (bg-tertiary)
    isLargeText: false,
  },
  {
    mode: 'Dark Mode',
    name: 'Address Text on Dark Card',
    fg: '#a0a0a0', // Adjusted gray addresses
    bg: '#2d2d2d', // Dark card background
    isLargeText: false,
  },
];

// Run tests
console.log('🎨 Card-Specific Color Contrast Verification\n');
console.log('━'.repeat(80));

let allPassed = true;
const results = { lightMode: [], darkMode: [] };

cardTests.forEach((test) => {
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
  console.log('\n✅ All card color combinations meet WCAG AA standards!\n');
  process.exit(0);
} else {
  console.log(
    '\n❌ Some card color combinations do not meet WCAG AA standards.\n'
  );
  console.log('Recommendations:');
  console.log('1. Darken light gray text for better contrast');
  console.log('2. Lighten dark gray text for better contrast');
  console.log('3. Use different text colors for card backgrounds');
  console.log('4. Consider using different card background colors\n');
  process.exit(1);
}

#!/usr/bin/env node

/**
 * Logo Conversion Script
 * Converts PNG logo to SVG format for PWA icons
 *
 * Usage: node scripts/convert-logo.js
 */

const fs = require('fs');
const path = require('path');

// PWA icon sizes needed
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create SVG template based on the fork logo design
function createLogoSVG(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="Fork In The Road app icon">
  <defs>
    <mask id="fork-cutout-${size}">
      <rect width="100%" height="100%" fill="white"/>
      <g transform="translate(${size * 0.35}, ${size * 0.21})">
        <!-- Fork tines (negative space) -->
        <rect x="0" y="0" width="${size * 0.042}" height="${size * 0.19}" rx="${size * 0.021}" fill="black"/>
        <rect x="${size * 0.073}" y="0" width="${size * 0.042}" height="${size * 0.19}" rx="${size * 0.021}" fill="black"/>
        <rect x="${size * 0.146}" y="0" width="${size * 0.042}" height="${size * 0.19}" rx="${size * 0.021}" fill="black"/>
        <rect x="${size * 0.219}" y="0" width="${size * 0.042}" height="${size * 0.19}" rx="${size * 0.021}" fill="black"/>
        <!-- Fork handle (negative space) -->
        <rect x="${size * 0.036}" y="${size * 0.21}" width="${size * 0.187}" height="${size * 0.042}" rx="${size * 0.021}" fill="black"/>
      </g>
    </mask>
  </defs>
  
  <!-- Main map pin body -->
  <path fill="#e3005a" mask="url(#fork-cutout-${size})"
        d="M${size * 0.5} ${size * 0.083}c-${size * 0.173} 0-${size * 0.313} ${size * 0.136}-${size * 0.313} ${size * 0.304} 0 ${size * 0.092} ${size * 0.043} ${size * 0.165} ${size * 0.097} ${size * 0.235} ${size * 0.047} ${size * 0.063} ${size * 0.102} ${size * 0.122} ${size * 0.153} ${size * 0.196} ${size * 0.026} ${size * 0.037} ${size * 0.049} ${size * 0.079} ${size * 0.062} ${size * 0.119} ${size * 0.013}-${size * 0.04} ${size * 0.031}-${size * 0.081} ${size * 0.062}-${size * 0.119} ${size * 0.05}-${size * 0.073} ${size * 0.105}-${size * 0.133} ${size * 0.153}-${size * 0.196} ${size * 0.054}-${size * 0.072} ${size * 0.097}-${size * 0.144} ${size * 0.097}-${size * 0.235}C${size * 0.813} ${size * 0.199} ${size * 0.673} ${size * 0.083} ${size * 0.5} ${size * 0.083}z"/>
  
  <!-- Diverging roads at the base -->
  <path fill="#e3005a" stroke="none"
        d="M${size * 0.313} ${size * 0.792} Q${size * 0.469} ${size * 0.729} ${size * 0.646} ${size * 0.792} Q${size * 0.469} ${size * 0.75} ${size * 0.313} ${size * 0.792}"/>
  <path fill="#e3005a" stroke="none"
        d="M${size * 0.313} ${size * 0.896} Q${size * 0.469} ${size * 0.833} ${size * 0.646} ${size * 0.896} Q${size * 0.469} ${size * 0.854} ${size * 0.313} ${size * 0.896}"/>
</svg>`;
}

// Create all PWA icon files
function generatePWAIcons() {
  console.log('🎨 Generating PWA icons from fork logo design...\n');

  iconSizes.forEach((size) => {
    const svgContent = createLogoSVG(size);
    const filename = `icon-${size}x${size}.svg`;
    const filepath = path.join(__dirname, '..', 'public', 'icons', filename);

    fs.writeFileSync(filepath, svgContent);
    console.log(`✅ Created ${filename}`);
  });

  // Also create app icon variants
  const appIconLight = createAppIcon('#FFFFFF', '#111827');
  const appIconDark = createAppIcon('#0B1220', '#F9FAFB');

  fs.writeFileSync(
    path.join(__dirname, '..', 'public', 'icons', 'app-icon-base.svg'),
    appIconLight
  );
  fs.writeFileSync(
    path.join(__dirname, '..', 'public', 'icons', 'app-icon-dark.svg'),
    appIconDark
  );

  console.log(`✅ Created app-icon-base.svg`);
  console.log(`✅ Created app-icon-dark.svg`);
  console.log(`\n🎉 All PWA icons generated successfully!`);
}

// Create app icon with background
function createAppIcon(bgColor, iconColor) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="YouHungry app icon">
  <rect x="64" y="64" width="896" height="896" rx="200" fill="${bgColor}"/>
  
  <g transform="translate(192,160)">
    <g transform="scale(8.8)">
      <defs>
        <mask id="app-fork-cutout">
          <rect width="100%" height="100%" fill="white"/>
          <g transform="translate(34,20)">
            <rect x="0" y="0" width="4" height="18" rx="2" fill="black"/>
            <rect x="7" y="0" width="4" height="18" rx="2" fill="black"/>
            <rect x="14" y="0" width="4" height="18" rx="2" fill="black"/>
            <rect x="21" y="0" width="4" height="18" rx="2" fill="black"/>
            <rect x="3.5" y="20" width="18" height="4" rx="2" fill="black"/>
          </g>
        </mask>
      </defs>
      <path fill="${iconColor}" mask="url(#app-fork-cutout)"
            d="M48 8c-16.6 0-30 13.1-30 29.2 0 8.8 4.1 15.8 9.3 22.6 4.5 6 9.8 11.7 14.7 18.8 2.5 3.6 4.7 7.6 6 11.4 1.3-3.8 3.5-7.8 6-11.4 4.8-7.1 10.1-12.8 14.7-18.8 5.2-6.9 9.3-13.8 9.3-22.6C78 19.1 64.6 8 48 8z"/>
      <path fill="${iconColor}" stroke="none"
            d="M30 76 Q45 70 62 76 Q45 72 30 76"/>
      <path fill="${iconColor}" stroke="none"
            d="M30 86 Q45 80 62 86 Q45 82 30 86"/>
    </g>
  </g>
</svg>`;
}

// Run the script
if (require.main === module) {
  generatePWAIcons();
}

module.exports = { generatePWAIcons, createLogoSVG };

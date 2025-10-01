// PWA Icon Generation Script
// This script generates PWA icons in various sizes

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate SVG icon content
function generateIconSVG(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#ff6b6b;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ff8e8e;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="50%" y="50%" text-anchor="middle" dy="0.35em" fill="white" font-family="Arial, sans-serif" font-size="${size * 0.4}" font-weight="bold">🍽️</text>
</svg>`;
}

// Generate shortcut icons
function generateShortcutIcon(name, size = 96) {
  const icons = {
    search: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#ff6b6b"/>
  <circle cx="${size * 0.4}" cy="${size * 0.4}" r="${size * 0.15}" fill="none" stroke="white" stroke-width="${size * 0.05}"/>
  <line x1="${size * 0.5}" y1="${size * 0.5}" x2="${size * 0.7}" y2="${size * 0.7}" stroke="white" stroke-width="${size * 0.05}" stroke-linecap="round"/>
</svg>`,
    collections: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#ff6b6b"/>
  <rect x="${size * 0.2}" y="${size * 0.3}" width="${size * 0.6}" height="${size * 0.4}" rx="${size * 0.05}" fill="white"/>
  <rect x="${size * 0.25}" y="${size * 0.35}" width="${size * 0.5}" height="${size * 0.1}" rx="${size * 0.02}" fill="#ff6b6b"/>
  <rect x="${size * 0.25}" y="${size * 0.5}" width="${size * 0.3}" height="${size * 0.1}" rx="${size * 0.02}" fill="#ff6b6b"/>
</svg>`,
    groups: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#ff6b6b"/>
  <circle cx="${size * 0.3}" cy="${size * 0.4}" r="${size * 0.15}" fill="white"/>
  <circle cx="${size * 0.7}" cy="${size * 0.4}" r="${size * 0.15}" fill="white"/>
  <circle cx="${size * 0.5}" cy="${size * 0.7}" r="${size * 0.12}" fill="white"/>
</svg>`,
  };

  return icons[name] || icons.search;
}

// Generate all icons
console.log('Generating PWA icons...');

// Generate main app icons
iconSizes.forEach((size) => {
  const svgContent = generateIconSVG(size);
  // const filename = `icon-${size}x${size}.png`;
  // const filepath = path.join(iconsDir, filename);

  // For now, save as SVG (in production, you'd convert to PNG)
  const svgFilename = `icon-${size}x${size}.svg`;
  const svgFilepath = path.join(iconsDir, svgFilename);

  fs.writeFileSync(svgFilepath, svgContent);
  console.log(`Generated ${svgFilename}`);
});

// Generate shortcut icons
const shortcuts = ['search', 'collections', 'groups'];
shortcuts.forEach((name) => {
  const svgContent = generateShortcutIcon(name);
  const filename = `${name}-96x96.svg`;
  const filepath = path.join(iconsDir, filename);

  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename}`);
});

// Generate action icons for notifications
const actionIcons = {
  explore: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" fill="#ff6b6b"/>
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="white"/>
</svg>`,
  close: `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10" fill="#ff6b6b"/>
  <path d="M15 9l-6 6M9 9l6 6" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>`,
};

Object.entries(actionIcons).forEach(([name, svgContent]) => {
  const filename = `${name}.svg`;
  const filepath = path.join(iconsDir, filename);

  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename}`);
});

console.log('PWA icon generation complete!');
console.log(
  'Note: In production, convert SVG files to PNG format for better compatibility.'
);

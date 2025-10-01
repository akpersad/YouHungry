// Screenshot Placeholder Generation Script
// Generates placeholder screenshots for PWA manifest

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

// Create screenshots directory if it doesn't exist
const screenshotsDir = path.join(__dirname, '../public/screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Generate placeholder SVG screenshots
const screenshots = [
  { name: 'mobile-home', width: 390, height: 844, label: 'Home Screen' },
  {
    name: 'mobile-restaurant',
    width: 390,
    height: 844,
    label: 'Restaurant Discovery',
  },
  {
    name: 'mobile-decision',
    width: 390,
    height: 844,
    label: 'Decision Making',
  },
];

screenshots.forEach(({ name, width, height, label }) => {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#f3f4f6"/>
  <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="white" rx="12"/>
  <circle cx="${width / 2}" cy="${height / 3}" r="40" fill="#ff6b6b"/>
  <text x="${width / 2}" y="${height / 2}" text-anchor="middle" font-family="Arial" font-size="24" fill="#374151">
    You Hungry?
  </text>
  <text x="${width / 2}" y="${height / 2 + 40}" text-anchor="middle" font-family="Arial" font-size="16" fill="#6b7280">
    ${label}
  </text>
  <text x="${width / 2}" y="${height - 60}" text-anchor="middle" font-family="Arial" font-size="12" fill="#9ca3af">
    Screenshot Placeholder
  </text>
</svg>`;

  // Save as PNG filename (but with SVG content for now)
  const filename = `${name}.png`;
  const filepath = path.join(screenshotsDir, filename);

  // For development, save as SVG with PNG extension
  // In production, you'd convert these to actual PNG images
  fs.writeFileSync(filepath, svg);
  console.log(`Generated ${filename}`);
});

console.log('Screenshot placeholders generated!');
console.log(
  'Note: These are SVG placeholders. For production, replace with actual screenshots.'
);

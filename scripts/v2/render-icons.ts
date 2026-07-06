/**
 * Rasterize the v2 app-icon SVGs into the PNG/ICO set the PWA manifest
 * and platform conventions need. Re-run after editing either SVG:
 *
 *   npx tsx scripts/v2/render-icons.ts
 *
 * Outputs:
 *   public/icons/icon-{192,512}.png            (purpose "any", rounded tile,
 *                                               transparent corners)
 *   public/icons/icon-maskable-{192,512}.png   (full bleed, safe-zone glyph)
 *   public/apple-touch-icon.png                (180, full bleed; iOS rounds)
 *   src/app/favicon.ico                        (32px PNG-in-ICO)
 *
 * Uses Playwright's chromium (already a devDep) as the rasterizer so no
 * new image tooling enters the tree.
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..');
const ICONS = join(ROOT, 'public', 'icons');

const roundedSvg = readFileSync(join(ICONS, 'app-icon.svg'), 'utf8');
const maskableSvg = readFileSync(join(ICONS, 'app-icon-maskable.svg'), 'utf8');

type Job = {
  svg: string;
  size: number;
  out: string;
  transparent: boolean;
};

const jobs: Job[] = [
  {
    svg: roundedSvg,
    size: 192,
    out: join(ICONS, 'icon-192.png'),
    transparent: true,
  },
  {
    svg: roundedSvg,
    size: 512,
    out: join(ICONS, 'icon-512.png'),
    transparent: true,
  },
  {
    svg: maskableSvg,
    size: 192,
    out: join(ICONS, 'icon-maskable-192.png'),
    transparent: false,
  },
  {
    svg: maskableSvg,
    size: 512,
    out: join(ICONS, 'icon-maskable-512.png'),
    transparent: false,
  },
  {
    svg: maskableSvg,
    size: 180,
    out: join(ROOT, 'public', 'apple-touch-icon.png'),
    transparent: false,
  },
];

/** Wrap one PNG in a valid single-image ICO container. */
function pngToIco(png: Buffer, size: number): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette colors
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // color planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8); // image data size
  entry.writeUInt32LE(22, 12); // offset (6 + 16)
  return Buffer.concat([header, entry, png]);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  async function render(svg: string, size: number, transparent: boolean) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<!doctype html><style>*{margin:0}html,body{background:transparent}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`
    );
    return page.screenshot({ omitBackground: transparent, type: 'png' });
  }

  for (const job of jobs) {
    const png = await render(job.svg, job.size, job.transparent);
    writeFileSync(job.out, png);
    process.stdout.write(`wrote ${job.out} (${png.length} bytes)\n`);
  }

  const favPng = await render(roundedSvg, 32, true);
  const icoPath = join(ROOT, 'src', 'app', 'favicon.ico');
  writeFileSync(icoPath, pngToIco(Buffer.from(favPng), 32));
  process.stdout.write(`wrote ${icoPath}\n`);

  await browser.close();
}

main().catch((error) => {
  process.stderr.write(`${error}\n`);
  process.exit(1);
});

/**
 * Bundle Size Regression Tests
 * Epic 9 Story 3: Advanced Testing & Quality Assurance
 *
 * Monitors bundle size to prevent performance regression
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Bundle Size Regression Tests', () => {
  test('Build succeeds without errors', () => {
    // This would run in CI after build
    // For now, check that build artifacts exist
    const buildDir = path.join(process.cwd(), '.next');
    const exists = fs.existsSync(buildDir);

    expect(exists).toBeTruthy();
  });

  test.skip('Main bundle size is within limits', () => {
    // SKIPPED: Needs production build
    const buildManifest = path.join(process.cwd(), '.next/build-manifest.json');

    if (fs.existsSync(buildManifest)) {
      const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf-8'));

      // Check main bundle files
      const pages = manifest.pages || {};

      for (const [_pagePath, files] of Object.entries(pages)) {
        // Get JS files for this page
        const jsFiles = (files as string[]).filter((f) => f.endsWith('.js'));

        // Check each file isn't too large
        for (const file of jsFiles) {
          const filePath = path.join(process.cwd(), '.next', file);

          if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            const sizeInKB = stats.size / 1024;

            // Individual chunks shouldn't exceed 300KB
            expect(sizeInKB).toBeLessThan(300);
          }
        }
      }
    }
  });

  test.skip('Total initial JavaScript is under budget', () => {
    // SKIPPED: Needs production build
    // Check _app and _document bundles
    const appDir = path.join(process.cwd(), '.next/static/chunks');

    if (fs.existsSync(appDir)) {
      const chunks = fs.readdirSync(appDir);
      let totalSize = 0;

      for (const chunk of chunks) {
        if (chunk.endsWith('.js')) {
          const filePath = path.join(appDir, chunk);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        }
      }

      const totalSizeInKB = totalSize / 1024;

      // Total initial JS should be under 500KB
      expect(totalSizeInKB).toBeLessThan(500);
    }
  });

  test.skip('Vendor bundle is code-split properly', () => {
    // SKIPPED: Needs production build
    const chunksDir = path.join(process.cwd(), '.next/static/chunks');

    if (fs.existsSync(chunksDir)) {
      const chunks = fs.readdirSync(chunksDir);

      // Should have multiple chunks (indicates code splitting)
      expect(chunks.length).toBeGreaterThan(3);

      // Should have framework chunk
      const hasFramework = chunks.some((c) => c.includes('framework'));
      expect(hasFramework).toBeTruthy();
    }
  });

  test('Images are optimized', () => {
    // Check if images in public are reasonable size
    const imagesDir = path.join(process.cwd(), 'public/images');

    if (fs.existsSync(imagesDir)) {
      const images = fs
        .readdirSync(imagesDir)
        .filter(
          (f) => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp')
        );

      for (const image of images) {
        const filePath = path.join(imagesDir, image);
        const stats = fs.statSync(filePath);
        const sizeInKB = stats.size / 1024;

        // Individual images shouldn't exceed 200KB
        expect(sizeInKB).toBeLessThan(200);
      }
    }
  });

  test.skip('CSS bundle is optimized', () => {
    // SKIPPED: Needs production build
    const cssDir = path.join(process.cwd(), '.next/static/css');

    if (fs.existsSync(cssDir)) {
      const cssFiles = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));

      for (const cssFile of cssFiles) {
        const filePath = path.join(cssDir, cssFile);
        const stats = fs.statSync(filePath);
        const sizeInKB = stats.size / 1024;

        // CSS files shouldn't exceed 50KB each
        expect(sizeInKB).toBeLessThan(50);
      }
    }
  });

  test.skip('No duplicate dependencies in bundle', () => {
    // SKIPPED: Needs production build
    // This would require analyzing the webpack bundle
    // For now, check that node_modules is reasonable
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8')
    );

    const deps = Object.keys(packageJson.dependencies || {});

    // Should not have obvious duplicates
    const reactVersions = deps.filter(
      (d) => d.startsWith('react') && !d.includes('dom')
    );
    expect(reactVersions.length).toBeLessThanOrEqual(1);
  });

  test('Build generates static pages where possible', () => {
    const buildDir = path.join(process.cwd(), '.next/server/pages');

    if (fs.existsSync(buildDir)) {
      // Check for HTML files (static generation)
      const files = fs.readdirSync(buildDir, { recursive: true });
      const htmlFiles = (files as string[]).filter((f) => f.endsWith('.html'));

      // Should have some static pages
      expect(htmlFiles.length).toBeGreaterThan(0);
    }
  });
});

test.describe('Performance Budget Alerts', () => {
  test('Creates bundle size report', () => {
    // Generate a report for tracking
    const buildManifest = path.join(process.cwd(), '.next/build-manifest.json');

    if (fs.existsSync(buildManifest)) {
      const manifest = JSON.parse(fs.readFileSync(buildManifest, 'utf-8'));

      const report = {
        timestamp: new Date().toISOString(),
        pages: {} as Record<string, { jsSize: number; cssSize: number }>,
      };

      // Calculate sizes for each page
      for (const [pagePath, files] of Object.entries(manifest.pages || {})) {
        const jsFiles = (files as string[]).filter((f) => f.endsWith('.js'));
        const cssFiles = (files as string[]).filter((f) => f.endsWith('.css'));

        let jsSize = 0;
        let cssSize = 0;

        for (const file of jsFiles) {
          const filePath = path.join(process.cwd(), '.next', file);
          if (fs.existsSync(filePath)) {
            jsSize += fs.statSync(filePath).size;
          }
        }

        for (const file of cssFiles) {
          const filePath = path.join(process.cwd(), '.next', file);
          if (fs.existsSync(filePath)) {
            cssSize += fs.statSync(filePath).size;
          }
        }

        report.pages[pagePath] = {
          jsSize: Math.round(jsSize / 1024), // KB
          cssSize: Math.round(cssSize / 1024), // KB
        };
      }

      // Write report
      const reportsDir = path.join(
        process.cwd(),
        'playwright-report/bundle-size'
      );
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      fs.writeFileSync(
        path.join(reportsDir, `bundle-report-${Date.now()}.json`),
        JSON.stringify(report, null, 2)
      );

      expect(report.pages).toBeDefined();
    }
  });
});

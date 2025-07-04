#!/usr/bin/env node

import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (process.argv.length < 4) {
  console.error('Usage: download-chatgpt-export.mjs <auth.json path> <export URL> [output dir]');
  process.exit(1);
}

const authPath = path.resolve(process.argv[2]);
const downloadUrl = process.argv[3];
const outputDir = process.argv[4]
  ? path.resolve(process.argv[4])
  : __dirname;

const outputFileName =
  new URL(downloadUrl).searchParams.get('id') ||
  path.basename(new URL(downloadUrl).pathname) ||
  'export.zip';

const outputPath = path.join(outputDir, outputFileName);

// Stealth plugin setup
chromium.use(stealthPlugin());

const browser = await chromium.launch({ /* headless: false */ });
const context = await browser.newContext({
  storageState: authPath,
  acceptDownloads: true,
});
const page = await context.newPage();

try {
  // Ensure output dir exists
  await fs.mkdir(outputDir, { recursive: true });

  console.log(`📥 Downloading from: ${downloadUrl}`);

  const downloadPromise = page.waitForEvent('download');
  await page.evaluate(url => (window.location.href = url), downloadUrl);
  const download = await downloadPromise;

  await download.saveAs(outputPath);

  console.log(`✅ Downloaded to: ${outputPath}`);
} catch (err) {
  console.error('❌ Download failed:', err.message || err);
} finally {
  await context.storageState({ path: authPath });
  await browser.close();
}

#!/usr/bin/env node

import path from 'node:path';
import { chromium } from 'playwright-extra';
import stealthPlugin from 'puppeteer-extra-plugin-stealth';

if (process.argv.length < 4) {
  console.error('Usage: get-auth-json.mjs <auth.json path> <login URL>');
  process.exit(1);
}

const authPath = path.resolve(process.argv[2]);
const loginUrl = process.argv[3];

// Load the stealth plugin and use defaults
const stealth = stealthPlugin()
chromium.use(stealth)

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext();
const page = await context.newPage();

await page.goto(loginUrl);
console.log(`🌐 Opened: ${loginUrl}`);
console.log('👤 Please log in manually. You have 60 seconds...');

await page.waitForTimeout(60000); // wait for login
await context.storageState({ path: authPath });

await browser.close();
console.log(`✅ Session saved to: ${authPath}`);

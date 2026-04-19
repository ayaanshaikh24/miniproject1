import { chromium } from 'playwright';
import { randomUA } from './helpers.js';

let browserPromise;
let handlersRegistered = false;

// ─── Concurrency limiter ─────────────────────────────────────
// Allow all scrapers to run their primary page load in parallel.
const MAX_CONCURRENT_PAGES = 7;
let activePages = 0;
const waitQueue = [];

function acquireSlot() {
  if (activePages < MAX_CONCURRENT_PAGES) {
    activePages++;
    return Promise.resolve();
  }
  return new Promise(resolve => waitQueue.push(resolve));
}

function releaseSlot() {
  activePages--;
  if (waitQueue.length > 0 && activePages < MAX_CONCURRENT_PAGES) {
    activePages++;
    waitQueue.shift()();
  }
}

async function getBrowser() {
  if (!browserPromise) {
    browserPromise = chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-sandbox',
      ],
    });
  }

  const browser = await browserPromise;
  // Ensure browser is truly ready (avoids cold-start lag on first request)
  if ((await browser.contexts()).length === 0) {
    const warmCtx = await browser.newContext();
    await warmCtx.close();
  }

  if (!handlersRegistered) {
    const closeBrowser = async () => {
      try {
        const activeBrowser = await browserPromise;
        await activeBrowser?.close();
      } catch {
        // Ignore shutdown errors.
      }
    };

    process.once('SIGINT', closeBrowser);
    process.once('SIGTERM', closeBrowser);
    process.once('exit', () => {
      void closeBrowser();
    });
    handlersRegistered = true;
  }

  return browser;
}

export async function withRetailerPage(url, callback) {
  await acquireSlot();
  const browser = await getBrowser();
  const context = await browser.newContext({
    userAgent: randomUA(),
    viewport: { width: 1440, height: 900 },
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    javaScriptEnabled: true,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Accept-Language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
      'Upgrade-Insecure-Requests': '1',
    },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined,
    });
  });

  const page = await context.newPage();
  page.setDefaultTimeout(6000);

  await page.route('**/*', (route) => {
    const type = route.request().resourceType();
    if (type === 'image' || type === 'media' || type === 'font') {
      route.abort();
      return;
    }
    route.continue();
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 6000 });
    return await callback(page);
  } finally {
    await context.close();
    releaseSlot();
  }
}
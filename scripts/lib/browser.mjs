import { chromium } from 'playwright';

export const VIEWPORT = { width: 1440, height: 900 };

// On Windows the bundled Chromium launches from a user-writable cache directory,
// whose GPU process can be denied by security software — Chrome then crash-loops
// the GPU process and flashes compositor surfaces. The system-installed Chrome
// runs from a trusted location. Try it first, keep the error if it fails, and
// surface it as the cause if the bundled fallback fails too, so the real failure
// is never lost. (Ported from the impeccable skill's browser detector.)
export async function launchBrowser({ headless = true, args = [] } = {}) {
  let channelError;
  if (process.platform === 'win32') {
    try {
      return await chromium.launch({ channel: 'chrome', headless, args });
    } catch (err) {
      channelError = err;
    }
  }
  try {
    return await chromium.launch({ headless, args });
  } catch (err) {
    if (channelError && err.cause === undefined) err.cause = channelError;
    throw err;
  }
}

export async function newPage(browser, {
  reducedMotion = 'no-preference',
  viewport = VIEWPORT,
  recordVideoDir,
} = {}) {
  const context = await browser.newContext({
    viewport,
    reducedMotion,
    ...(recordVideoDir ? { recordVideo: { dir: recordVideoDir, size: viewport } } : {}),
  });
  const page = await context.newPage();
  return { page, context };
}

export async function settle(page, { timeout = 15000, quiet = 1200 } = {}) {
  await page.waitForLoadState('load', { timeout }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(quiet);
}

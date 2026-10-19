// Reading driver for objectui#13068 (throwaway, adapted from objectui#12978's).
// Usage: node driver.cjs <label> <mode fullpage|sheet|dock> <width> [height] [drafts 1|0] [openPill 1|0]
const { chromium } = require('/home/user/objectui-issue-13068/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright');
const [label, mode, width, height = '844', drafts = '1', openPill = '1'] = process.argv.slice(2);
const OUT = '/tmp/claude-0/-home-user/377ccc2d-9ec5-5380-9ccd-e970dc91421b/scratchpad/issue-13068/shots';
const URL_ = `http://localhost:5968/ev13068-harness.html?mode=${mode}&drafts=${drafts}&app=1`;

function reading() {
  const ta = document.querySelector('form textarea');
  if (!ta) return { error: 'no textarea' };
  const box = (r) => r && { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
  const inter = (a, b) => (a && b ? { x: Math.round(Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))), y: Math.round(Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))) } : null);
  const tr = ta.getBoundingClientRect();
  const bar = document.querySelector('[data-testid="pending-drafts-bar"]');
  const br = bar ? bar.getBoundingClientRect() : null;
  const pill = document.querySelector('[data-testid="ai-chat-mobile-preview-open"]');
  const pr = pill ? pill.getBoundingClientRect() : null;
  const log = document.querySelector('[role="log"]');
  const lr = log ? log.getBoundingClientRect() : null;
  const cs = getComputedStyle(ta);
  const padL = parseFloat(cs.paddingLeft) || 0, padR = parseFloat(cs.paddingRight) || 0, padT = parseFloat(cs.paddingTop) || 0;
  const lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 14) * 1.4;
  const y = tr.top + padT + lh / 2;
  const xs = [0.05, 0.25, 0.5, 0.75, 0.95].map((f) => tr.left + padL + f * (tr.width - padL - padR));
  const firstLine = xs.map((x) => {
    const el = document.elementFromPoint(x, y);
    const tagged = el && el.closest('[data-testid]');
    return { x: Math.round(x), y: Math.round(y), onComposer: Boolean(el && (el === ta || ta.contains(el))), top: el ? (tagged ? tagged.getAttribute('data-testid') : el.tagName.toLowerCase()) : null };
  });
  // The pill's own centre: does a tap there reach the pill?
  const pillTap = pr ? (() => { const el = document.elementFromPoint(pr.left + pr.width / 2, pr.top + pr.height / 2); return Boolean(el && (el === pill || pill.contains(el))); })() : null;
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const placeholder = ta.getAttribute('placeholder') || '';
  const span = bar ? bar.querySelector('span') : null;
  return {
    textarea: box(tr),
    pill: box(pr),
    pillText: pill ? pill.innerText : null,
    bar: box(br),
    conversation: box(lr),
    pillVsTextarea: inter(pr, tr),
    barVsTextarea: inter(br, tr),
    pillVsBar: inter(pr, br),
    pillVsConversation: inter(pr, lr),
    barVsConversation: inter(br, lr),
    pillTapReachesPill: pillTap,
    barTextTruncated: span ? span.scrollWidth > span.clientWidth : null,
    barText: span ? span.textContent : null,
    barTextWidths: span ? { scroll: span.scrollWidth, client: span.clientWidth } : null,
    firstLine,
    firstLineClear: firstLine.every((p) => p.onComposer),
    placeholder,
    placeholderWidth: Math.round(ctx.measureText(placeholder).width),
    composerContentWidth: Math.round(tr.width - padL - padR),
    viewport: { w: innerWidth, h: innerHeight },
  };
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
  const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) }, locale: 'zh-CN' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await page.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await page.waitForSelector('form textarea', { timeout: 180000 });
  if (drafts === '1') await page.waitForSelector('[data-testid="pending-drafts-bar"]', { timeout: 60000 });
  else await page.waitForFunction(() => window.__draftReads > 0, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  let pillShownBeforeOpen = null;
  if (openPill === '1') {
    // Preview the built app, then close the preview: the chat comes back with the pill.
    await page.getByRole('button', { name: '预览' }).first().click();
    await page.waitForSelector('[data-testid="live-canvas-close"]', { timeout: 60000 });
    if (Number(width) < 768) await page.waitForSelector('[data-testid="ai-chat-mobile-canvas"]', { timeout: 60000 });
    await page.click('[data-testid="live-canvas-close"]');
    if (Number(width) < 768) await page.waitForSelector('[data-testid="ai-chat-mobile-preview-open"]', { timeout: 60000 });
    await page.waitForTimeout(800);
  }
  const r = await page.evaluate(reading);
  // One tap from the preview: tap the pill and read whether the full-screen preview opened.
  let tapOpensPreview = null;
  if (r.pill) {
    await page.screenshot({ path: `${OUT}/${label}.png` });
    await page.click('[data-testid="ai-chat-mobile-preview-open"]');
    tapOpensPreview = await page.waitForSelector('[data-testid="ai-chat-mobile-canvas"]', { timeout: 15000 }).then(() => true, () => false);
  } else {
    await page.screenshot({ path: `${OUT}/${label}.png` });
  }
  const result = { label, mode, width: Number(width), height: Number(height), drafts: drafts === '1', draftReads: await page.evaluate(() => window.__draftReads), errors, ...r, tapOpensPreview };
  require('fs').mkdirSync(OUT, { recursive: true });
  require('fs').writeFileSync(`${OUT}/${label}.json`, JSON.stringify(result, null, 1));
  console.log(JSON.stringify({ label, textarea: r.textarea, pill: r.pill, bar: r.bar, pillVsTextarea: r.pillVsTextarea, barVsTextarea: r.barVsTextarea, pillVsBar: r.pillVsBar, pillVsConversation: r.pillVsConversation, firstLineClear: r.firstLineClear, placeholderWidth: r.placeholderWidth, composerContentWidth: r.composerContentWidth, barTextTruncated: r.barTextTruncated, barTextWidths: r.barTextWidths, pillTapReachesPill: r.pillTapReachesPill, tapOpensPreview, conversation: r.conversation, errors: errors.length }));
  await browser.close();
})().catch((e) => { console.error('DRIVER FAIL', e); process.exit(1); });

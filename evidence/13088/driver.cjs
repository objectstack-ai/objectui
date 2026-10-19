// Reading driver for objectui#13088 (throwaway, adapted from objectui#13068's).
// Usage: node driver.cjs <label> <mode fullpage|sheet|dock> <width> <height> <lang zh|en> [openPill 1|0]
const { chromium } = require('/home/user/objectui-issue-13088/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright');
const [label, mode, width, height, lang, openPill = '0'] = process.argv.slice(2);
const OUT = '/tmp/claude-0/-home-user/377ccc2d-9ec5-5380-9ccd-e970dc91421b/scratchpad/issue-13088/shots';
const PORT = process.env.EV_PORT || '5988';
const URL_ = `http://localhost:${PORT}/ev13088-harness.html?mode=${mode}&drafts=1&app=1&lang=${lang}`;

function reading() {
  const ta = document.querySelector('form textarea');
  if (!ta) return { error: 'no textarea' };
  const box = (r) => r && { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) };
  const inter = (a, b) => (a && b ? Math.round(Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))) * Math.round(Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))) : null);
  const inside = (inner, outer) => Boolean(inner && outer && inner.left >= outer.left - 0.5 && inner.right <= outer.right + 0.5 && inner.top >= outer.top - 0.5 && inner.bottom <= outer.bottom + 0.5);
  const tr = ta.getBoundingClientRect();
  const bar = document.querySelector('[data-testid="pending-drafts-bar"]');
  const br = bar ? bar.getBoundingClientRect() : null;
  // The sentence: the bar's first span child (the `data-testid` only exists after the fix).
  const span = bar ? (bar.querySelector('[data-testid="pending-drafts-bar-sentence"]') || bar.querySelector(':scope > span')) : null;
  const sr = span ? span.getBoundingClientRect() : null;
  const btn = bar ? bar.querySelector('button') : null;
  const btr = btn ? btn.getBoundingClientRect() : null;
  const pill = document.querySelector('[data-testid="ai-chat-mobile-preview-open"]');
  const pr = pill ? pill.getBoundingClientRect() : null;
  const log = document.querySelector('[role="log"]');
  const lr = log ? log.getBoundingClientRect() : null;
  let lines = null;
  let lineTops = null;
  if (span) {
    const range = document.createRange();
    range.selectNodeContents(span);
    const tops = [...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top));
    lineTops = [...new Set(tops)];
    lines = lineTops.length;
  }
  const scs = span ? getComputedStyle(span) : null;
  const vw = innerWidth, vh = innerHeight;
  const onScreen = (r) => Boolean(r && r.left >= 0 && r.top >= 0 && r.right <= vw && r.bottom <= vh);
  // A tap on the button's centre reaches the button.
  const btnTap = btr ? (() => { const el = document.elementFromPoint(btr.left + btr.width / 2, btr.top + btr.height / 2); return Boolean(el && (el === btn || btn.contains(el))); })() : null;
  return {
    sentence: span ? span.textContent : null,
    sentenceClass: span ? span.className : null,
    sentenceStyle: scs ? { whiteSpace: scs.whiteSpace, textOverflow: scs.textOverflow, overflow: scs.overflow, lineHeight: scs.lineHeight } : null,
    sentenceWidths: span ? { scroll: span.scrollWidth, client: span.clientWidth } : null,
    sentenceCut: span ? span.scrollWidth > span.clientWidth : null,
    sentenceLines: lines,
    sentenceBox: box(sr),
    bar: box(br),
    button: box(btr),
    buttonInsideBar: inside(btr, br),
    buttonOnScreen: onScreen(btr),
    buttonTapReachesButton: btnTap,
    buttonVsSentence: inter(btr, sr),
    textarea: box(tr),
    barVsTextarea: inter(br, tr),
    pill: box(pr),
    pillVsBar: inter(pr, br),
    conversation: box(lr),
    barVsConversation: inter(br, lr),
    viewport: { w: vw, h: vh },
    docScrollWidth: document.documentElement.scrollWidth,
  };
}

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', headless: true });
  const page = await browser.newPage({ viewport: { width: Number(width), height: Number(height) }, locale: lang === 'en' ? 'en-US' : 'zh-CN' });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)));
  await page.goto(URL_, { waitUntil: 'load', timeout: 180000 });
  await page.waitForSelector('form textarea', { timeout: 180000 });
  await page.waitForSelector('[data-testid="pending-drafts-bar"]', { timeout: 60000 });
  await page.waitForTimeout(1500);
  if (openPill === '1') {
    // Preview the built app, then close the preview: the chat comes back with the pill above the bar.
    await page.getByRole('button', { name: lang === 'en' ? 'Preview' : '预览' }).first().click();
    await page.waitForSelector('[data-testid="live-canvas-close"]', { timeout: 60000 });
    await page.click('[data-testid="live-canvas-close"]');
    if (Number(width) < 768) await page.waitForSelector('[data-testid="ai-chat-mobile-preview-open"]', { timeout: 60000 });
    await page.waitForTimeout(800);
  }
  const r = await page.evaluate(reading);
  require('fs').mkdirSync(OUT, { recursive: true });
  const bar = await page.$('[data-testid="pending-drafts-bar"]');
  await page.screenshot({ path: `${OUT}/${label}.png` });
  if (bar) await bar.screenshot({ path: `${OUT}/${label}-bar.png` });
  const result = { label, mode, width: Number(width), height: Number(height), lang, openPill: openPill === '1', errors, ...r };
  require('fs').writeFileSync(`${OUT}/${label}.json`, JSON.stringify(result, null, 1));
  console.log(JSON.stringify({ label, sentenceWidths: r.sentenceWidths, sentenceCut: r.sentenceCut, sentenceLines: r.sentenceLines, sentenceBox: r.sentenceBox, bar: r.bar, button: r.button, buttonInsideBar: r.buttonInsideBar, buttonOnScreen: r.buttonOnScreen, buttonTap: r.buttonTapReachesButton, buttonVsSentence: r.buttonVsSentence, textarea: r.textarea, barVsTextarea: r.barVsTextarea, pill: r.pill, pillVsBar: r.pillVsBar, ws: r.sentenceStyle && r.sentenceStyle.whiteSpace, to: r.sentenceStyle && r.sentenceStyle.textOverflow, docScrollWidth: r.docScrollWidth, errors: errors.length }));
  await browser.close();
})().catch((e) => { console.error('DRIVER FAIL', e); process.exit(1); });

// Reading driver for objectui#12978. Usage: node driver.cjs <label> <mode fullpage|dock> <width> [height] [drafts 1|0]
const { chromium } = require('/home/user/objectui-issue-12978/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright');
const [label, mode, width, height = '900', drafts = '1'] = process.argv.slice(2);
const OUT = '/tmp/claude-0/-home-user/377ccc2d-9ec5-5380-9ccd-e970dc91421b/scratchpad/issue-12978/shots';
const URL_ = `http://localhost:5978/ev12978-harness.html?mode=${mode}&drafts=${drafts}${process.env.EXTRA ? '&' + process.env.EXTRA : ''}`;

function reading() {
  const ta = document.querySelector('form textarea');
  if (!ta) return { error: 'no textarea' };
  const bar = document.querySelector('[data-testid="pending-drafts-bar"]');
  const box = (r) => r && ({ left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) });
  const tr = ta.getBoundingClientRect();
  const br = bar ? bar.getBoundingClientRect() : null;
  const ix = br ? Math.max(0, Math.min(tr.right, br.right) - Math.max(tr.left, br.left)) : 0;
  const iy = br ? Math.max(0, Math.min(tr.bottom, br.bottom) - Math.max(tr.top, br.top)) : 0;
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
  const canvas = document.createElement('canvas').getContext('2d');
  canvas.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const placeholder = ta.getAttribute('placeholder') || '';
  // The conversation's last message against the bar (bottom of the scroll viewport).
  const log = document.querySelector('[role="log"]');
  const lr = log ? log.getBoundingClientRect() : null;
  const msgs = log ? log.querySelectorAll('.is-assistant, .is-user, [class*="is-assistant"], [class*="is-user"]') : [];
  const last = msgs.length ? msgs[msgs.length - 1].getBoundingClientRect() : null;
  const lastOverlapY = br && last ? Math.max(0, Math.min(last.bottom, br.bottom) - Math.max(last.top, br.top)) : null;
  const pill = document.querySelector('[data-testid="ai-chat-mobile-preview-open"]');
  const pr = pill ? pill.getBoundingClientRect() : null;
  const inter = (a, b) => a && b ? { x: Math.round(Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))), y: Math.round(Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top))) } : null;
  const scrollRow = document.querySelector('[data-conversation-scroll-row]');
  const sr = scrollRow ? scrollRow.getBoundingClientRect() : null;
  return {
    pill: box(pr),
    pillVsTextarea: inter(pr, tr),
    pillVsBar: inter(pr, br),
    barVsConversation: inter(br, lr),
    barVsLastMessage: inter(br, last),
    scrollRow: box(sr),
    barVsScrollRow: inter(br, sr),
    placeholder,
    placeholderWidth: Math.round(canvas.measureText(placeholder).width),
    composerContentWidth: Math.round(tr.width - padL - padR),
    textarea: box(tr),
    barShown: Boolean(bar),
    bar: box(br),
    barText: bar ? bar.innerText : null,
    intersection: br ? { x: Math.round(ix), y: Math.round(iy), area: Math.round(ix * iy) } : null,
    firstLine,
    firstLineClear: firstLine.every((p) => p.onComposer),
    conversation: box(lr),
    lastMessage: box(last),
    lastMessageBarOverlapY: lastOverlapY,
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
  if (process.env.OPEN_PILL === '1') {
    // Preview the built app (opens the full-screen overlay on a phone), then
    // close the overlay: the chat returns with the floating preview pill.
    await page.getByRole('button', { name: '预览' }).first().click();
    await page.waitForSelector('[data-testid="live-canvas-close"]', { timeout: 60000 });
    await page.click('[data-testid="live-canvas-close"]');
    await page.waitForSelector('[data-testid="ai-chat-mobile-preview-open"]', { timeout: 60000 });
    await page.waitForTimeout(800);
  }
  const r = await page.evaluate(reading);
  const result = { label, mode, width: Number(width), height: Number(height), drafts: drafts === '1', draftReads: await page.evaluate(() => window.__draftReads), errors, ...r };
  require('fs').mkdirSync(OUT, { recursive: true });
  require('fs').writeFileSync(`${OUT}/${label}.json`, JSON.stringify(result, null, 1));
  await page.screenshot({ path: `${OUT}/${label}.png` });
  console.log(JSON.stringify({ label, textarea: r.textarea, bar: r.bar, intersection: r.intersection, firstLineClear: r.firstLineClear, placeholderWidth: r.placeholderWidth, composerContentWidth: r.composerContentWidth, lastMessageBarOverlapY: r.lastMessageBarOverlapY, pill: r.pill, pillVsTextarea: r.pillVsTextarea, pillVsBar: r.pillVsBar, barVsConversation: r.barVsConversation, barVsLastMessage: r.barVsLastMessage, errors: errors.length }));
  await browser.close();
})().catch((e) => { console.error('DRIVER FAIL', e); process.exit(1); });

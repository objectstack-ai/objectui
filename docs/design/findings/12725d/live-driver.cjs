// Live reading driver for objectui#12725 phase 4 (a kanban view leaf's card).
// Usage: node live-driver.cjs <label> <port> <width>   (env SHOTS = output dir)
const fs = require('fs');
const { chromium } = require('/home/user/objectui-issue-12725d/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright');
const [label, port, width] = process.argv.slice(2);
const APP = `http://localhost:${port}`;
const API = 'http://localhost:4110';
const OUT = process.env.SHOTS;
const PKG = 'com.example.showcase';
const LEAF_LABEL = '任务看板（看板视图）';
// The one entry the stub adds to the app's navigation: an `object` entry that
// lands on the showcase's own kanban view `board` (task.view.ts).
const ENTRY = { id: 'nav_task_board_view', type: 'object', objectName: 'showcase_task', viewName: 'board', label: LEAF_LABEL, icon: 'kanban' };
function withEntry(nav) {
  if (!Array.isArray(nav)) return nav;
  return nav.map((n) => (n && n.id === 'grp_data' && Array.isArray(n.children)
    ? { ...n, children: n.children.flatMap((c) => (c.id === 'nav_tasks' ? [c, ENTRY] : [c])) }
    : n));
}
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: Number(width), height: 900 }, locale: 'zh-CN', colorScheme: 'light' });
  const r = await ctx.request.post(`${API}/api/v1/auth/sign-in/email`, { data: { email: 'admin@objectos.ai', password: 'admin123' } });
  const token = r.headers()['set-auth-token'];
  await ctx.addInitScript((t) => { try { localStorage.setItem('auth-session-token', t); localStorage.setItem('i18nextLng', 'zh-CN'); } catch {} }, token);
  const page = await ctx.newPage();
  // Stubs, identical for before and after (README): the Studio gate, the
  // package list, one copilot agent, and the one navigation entry above.
  await page.route('**/api/v1/auth/me/permissions', async (route) => {
    const res = await route.fetch(); const body = await res.json();
    body.systemPermissions = [...(body.systemPermissions || []), 'studio.access'];
    await route.fulfill({ response: res, body: JSON.stringify(body) });
  });
  await page.route(/\/api\/v1\/packages(\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ success: true, data: { packages: [{ manifest: { id: PKG, name: 'ObjectStack Showcase', version: '0.0.0' }, writable: false }] } }) }));
  await page.route('**/api/v1/ai/agents**', (route) => route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ success: true, data: { agents: [{ name: 'studio_copilot', label: 'Studio Copilot', role: 'builder' }] } }) }));
  await page.route(/\/api\/v1\/meta\/app\/showcase_app(\/layers)?(\?.*)?$/, async (route) => {
    const res = await route.fetch(); const text = await res.text();
    let body; try { body = JSON.parse(text); } catch { return route.fulfill({ response: res, body: text }); }
    const d = body && body.data ? body.data : body;
    for (const k of ['code', 'effective', 'overlay', 'item']) if (d && d[k] && d[k].navigation) d[k].navigation = withEntry(d[k].navigation);
    await route.fulfill({ response: res, body: JSON.stringify(body) });
  });
  const shot = async (name) => { await page.waitForTimeout(700); await page.screenshot({ path: `${OUT}/${label}-${width}-${name}.png` }); };
  const measure = async () => page.evaluate(() => {
    const slot = document.querySelector('[data-testid="studio-right-slot"]');
    const hint = document.querySelector('[data-testid="if-canvas-hint"]');
    const section = document.querySelector('[data-testid="list-view-kanban-card"]');
    const style = document.querySelector('[data-testid="studio-canvas-cards"] style')?.textContent || null;
    const cards = document.querySelectorAll('[data-testid="if-canvas-main"] [role="listitem"]');
    return { url: location.pathname + location.search, slotMode: slot?.getAttribute('data-mode') ?? null,
      slotWidth: slot ? Math.round(slot.getBoundingClientRect().width) : null, hint: hint?.textContent ?? null,
      section: section ? (section.getAttribute('data-selected') === 'true' ? 'shown, selected' : 'shown') : null,
      sectionText: section ? section.textContent.slice(0, 160) : null,
      outline: style ? (/data-kanban-card="([^"]+)"/.exec(style) || [])[1] : null,
      cards: cards.length, cardKeyed: Array.from(cards).filter((c) => c.hasAttribute('data-kanban-card')).length,
      dialogs: Array.from(document.querySelectorAll('[role="dialog"]')).map((d) => d.textContent.slice(0, 80)) };
  });
  await page.goto(`${APP}/studio/${PKG}/interfaces`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);
  const group = page.locator('button[aria-expanded]', { hasText: '数据模型' }).first();
  for (let k = 0; k < 5 && (await group.getAttribute('aria-expanded')) !== 'true'; k++) { await group.click(); await page.waitForTimeout(700); }
  await page.locator('[title="object · showcase_task"]', { hasText: LEAF_LABEL }).first().click();
  await page.waitForSelector('[data-testid="if-canvas-main"] [role="listitem"]', { timeout: 60000 });
  await page.waitForTimeout(3000);
  const out = { label, width };
  out.open = await measure();
  await shot('open');
  const first = page.locator('[data-testid="if-canvas-main"] [role="listitem"]').first();
  out.cardTitle = await first.getAttribute('aria-label');
  if (process.env.MODE === 'enter') {
    // Keyboard: focus the card's control (objectui#12888 made it a tab stop) and press Enter.
    await page.locator('[data-testid="if-canvas-main"] [data-kanban-card]').first().focus();
    await page.keyboard.press('Enter');
  } else {
    await first.click();
  }
  await page.waitForTimeout(2000);
  out.afterCardClick = await measure();
  await shot(process.env.MODE === 'enter' ? 'card-enter' : 'card-click');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1200);
  out.afterEsc = await measure();
  await shot('esc');
  if (out.afterEsc.dialogs.length === 0 && !/recordId/.test(out.afterEsc.url)) {
    await page.locator('[data-testid="if-canvas-main"] [role="listitem"]').nth(1).click();
    await page.waitForTimeout(1200);
    out.afterSecondCard = await measure();
    const box = await page.locator('[data-testid="if-canvas-main"]').boundingBox();
    await page.mouse.click(box.x + 6, box.y + box.height - 8);
    await page.waitForTimeout(1000);
    out.afterEmptyClick = await measure();
    await shot('empty-click');
  }
  fs.writeFileSync(`${OUT}/${label}-${width}${process.env.MODE === 'enter' ? '-enter' : ''}.json`, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out));
  await browser.close();
})().catch((e) => { console.error('DRIVER FAILED', e.message); process.exit(1); });

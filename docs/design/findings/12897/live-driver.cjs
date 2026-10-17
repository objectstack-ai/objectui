// Live reading driver for objectui#12897: the Interfaces item header on a kanban view leaf.
// Usage: node live-driver.cjs <label> <appPort> <apiPort> <width>   (env SHOTS = output dir)
// Stubs follow the objectui#12725d evidence README, unchanged.
const fs = require('fs');
const { chromium } = require('/home/user/objectui-issue-12897/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright');
const [label, port, apiPort, width] = process.argv.slice(2);
const APP = `http://localhost:${port}`;
const API = `http://localhost:${apiPort}`;
const OUT = process.env.SHOTS;
const PKG = 'com.example.showcase';
const LEAF_LABEL = '任务看板（看板视图）';
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
  await page.goto(`${APP}/studio/${PKG}/interfaces`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);
  const group = page.locator('button[aria-expanded]', { hasText: '数据模型' }).first();
  for (let k = 0; k < 5 && (await group.getAttribute('aria-expanded')) !== 'true'; k++) { await group.click(); await page.waitForTimeout(700); }
  await page.locator('[title="object · showcase_task"]', { hasText: LEAF_LABEL }).first().click();
  await page.waitForSelector('[data-testid="if-canvas-main"] [role="listitem"]', { timeout: 60000 });
  await page.waitForTimeout(3000);
  const out = await page.evaluate(() => {
    const r2 = (n) => Math.round(n * 10) / 10;
    const hdr = document.querySelector('[data-testid="if-item-header"]');
    const title = document.querySelector('[data-testid="if-breadcrumb"]');
    const row = title.parentElement;
    const rowRect = row.getBoundingClientRect();
    const boxes = Array.from(row.children).flatMap((el) => (getComputedStyle(el).display === 'contents' ? Array.from(el.children) : [el]));
    const pieces = boxes.map((el) => {
      const cs = getComputedStyle(el); const b = el.getBoundingClientRect();
      return { tag: el.tagName.toLowerCase(), testid: el.getAttribute('data-testid'), text: (el.textContent || '').trim().slice(0, 40),
        width: r2(b.width), left: r2(b.left - rowRect.left), right: r2(b.right - rowRect.left), display: cs.display,
        minWidth: cs.minWidth, flexShrink: cs.flexShrink, flexBasis: cs.flexBasis, scrollWidth: el.scrollWidth };
    });
    const actions = row.lastElementChild;
    const actionKids = Array.from(actions.children).map((el) => {
      const b = el.getBoundingClientRect();
      return { testid: el.getAttribute('data-testid'), text: (el.textContent || '').trim().slice(0, 30), width: r2(b.width),
        left: r2(b.left - rowRect.left), right: r2(b.right - rowRect.left), folded: el.getAttribute('data-folded'),
        visible: b.width > 0 && b.right <= window.innerWidth };
    });
    const slot = document.querySelector('[data-testid="studio-right-slot"]');
    return { viewport: window.innerWidth, header: r2(hdr.getBoundingClientRect().width), row: r2(rowRect.width), rowScrollWidth: row.scrollWidth,
      slotMode: slot?.getAttribute('data-mode') ?? null, slotWidth: slot ? r2(slot.getBoundingClientRect().width) : null,
      title: { text: title.textContent, width: r2(title.getBoundingClientRect().width), scrollWidth: title.scrollWidth, tooltip: title.getAttribute('title') },
      pieces, actionKids };
  });
  out.label = label;
  await page.screenshot({ path: `${OUT}/${label}-${width}.png` });
  fs.writeFileSync(`${OUT}/${label}-${width}.json`, JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 1));
  await browser.close();
})().catch((e) => { console.error('DRIVER FAILED', e.message); process.exit(1); });

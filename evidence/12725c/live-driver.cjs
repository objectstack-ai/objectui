// Live reading driver for objectui#12725 phase 3. Usage: node live.cjs <label> <port> <width> <copilot:0|1> <mode>
const { chromium } = require('/home/user/objectui-issue-12725c/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright');
const [label, port, width, copilot, mode] = process.argv.slice(2);
const APP = `http://localhost:${port}`;
const API = 'http://localhost:4010';
const OUT = process.env.SHOTS;
const PKG = process.env.PKG || 'com.example.showcase';
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: Number(width), height: 900 } });
  const r = await ctx.request.post(`${API}/api/v1/auth/sign-in/email`, { data: { email: 'admin@objectos.ai', password: 'admin123' } });
  const token = r.headers()['set-auth-token'];
  await ctx.addInitScript((t) => { try { localStorage.setItem('auth-session-token', t); } catch {} }, token);
  const page = await ctx.newPage();
  // The published backend grants `studio.access` to no principal, so the
  // console's Studio gate is answered in the browser (disclosed in the README).
  await page.route('**/api/v1/auth/me/permissions', async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    body.systemPermissions = [...(body.systemPermissions || []), 'studio.access'];
    await route.fulfill({ response: res, body: JSON.stringify(body) });
  });
  await page.route(/\/api\/v1\/packages(\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: 'application/json',
    body: JSON.stringify({ success: true, data: { packages: [{ manifest: { id: PKG, name: 'ObjectStack Showcase', version: '0.0.0' }, writable: false }] } }) }));
  if (copilot === '1') {
    await page.route('**/api/v1/ai/agents**', (route) => route.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { agents: [{ name: 'studio_copilot', label: 'Studio Copilot', role: 'builder' }] } }) }));
  }
  const shot = async (name) => { await page.waitForTimeout(600); await page.screenshot({ path: `${OUT}/${label}-${name}.png` }); };
  const measure = async () => page.evaluate(() => {
    const slot = document.querySelector('[data-testid="studio-right-slot"]');
    const hint = document.querySelector('[data-testid="if-canvas-hint"]');
    const pressed = Array.from(document.querySelectorAll('[data-testid="list-view-columns"] [aria-pressed="true"]')).map((e) => e.textContent.trim());
    const ths = Array.from(document.querySelectorAll('[data-testid="if-canvas-main"] thead th')).map((th) => th.getAttribute('data-column-key') || '-');
    const firstCol = Array.from(document.querySelectorAll('[data-testid="if-canvas-main"] tbody tr')).slice(0, 4).map((tr) => (tr.querySelectorAll('td')[1] || tr.querySelector('td'))?.textContent?.trim().slice(0, 18));
    const style = document.querySelector('[data-testid="studio-canvas-columns"] style')?.textContent || null;
    return { slotMode: slot?.getAttribute('data-mode') ?? null, slotWidth: slot ? Math.round(slot.getBoundingClientRect().width) : null,
      hint: hint?.textContent ?? null, pressed, headerKeys: ths, firstRows: firstCol, outline: style ? (/data-column-key="([^"]+)"/.exec(style) || [])[1] : null };
  });
  await page.goto(`${APP}/studio/${PKG}/interfaces`, { waitUntil: 'domcontentloaded' });
  await page.getByText('Data Model', { exact: false }).first().waitFor({ timeout: 60000 });
  await page.waitForTimeout(5000);
  const expandGroups = async () => {
    for (const name of (process.env.NAVGROUPS || '').split(',').filter(Boolean)) {
      const btn = page.locator('button[aria-expanded]', { hasText: name }).first();
      for (let k = 0; k < 5 && (await btn.getAttribute('aria-expanded')) !== 'true'; k++) { await btn.click(); await page.waitForTimeout(700); }
      await page.waitForTimeout(400);
    }
  };
  await expandGroups();
  if (mode === 'explore') {
    const titles = await page.$$eval('[title]', (els) => els.map((e) => e.getAttribute('title')).filter((t) => / · /.test(t)));
    console.log(JSON.stringify(titles));
    await shot('explore');
    await browser.close();
    return;
  }
  const leaf = process.env.LEAF;
  if (mode === 'kanban') {
    await page.locator(`[title="${leaf}"]`).first().click();
    await page.waitForTimeout(6000);
    await shot('board');
    const before = { url: page.url(), slot: await page.evaluate(() => document.querySelector('[data-testid="studio-right-slot"]')?.getAttribute('data-mode') ?? null),
      inspector: await page.evaluate(() => document.querySelector('[data-testid="if-inspector"]')?.textContent?.slice(0, 160) ?? null),
      cards: await page.evaluate(() => document.querySelectorAll('[data-testid*="kanban-card"], [data-kanban-card], [role="article"]').length) };
    const card = page.locator('[data-testid="if-canvas-main"]').getByText('Evidence collection', { exact: true }).first();
    const n = await card.count();
    let after = null;
    if (n > 0) {
      await card.click();
      await page.waitForTimeout(1500);
      await shot('card-click');
      after = { url: page.url(), slot: await page.evaluate(() => document.querySelector('[data-testid="studio-right-slot"]')?.getAttribute('data-mode') ?? null),
        dialog: await page.evaluate(() => Array.from(document.querySelectorAll('[role="dialog"]')).map((d) => d.textContent.slice(0, 120))),
        inspector: await page.evaluate(() => document.querySelector('[data-testid="if-inspector"]')?.textContent?.slice(0, 160) ?? null),
        hint: await page.evaluate(() => document.querySelector('[data-testid="if-canvas-hint"]')?.textContent ?? null) };
    }
    console.log(JSON.stringify({ label, leaf, before, cardFound: n, after }));
    await browser.close();
    return;
  }
  await page.locator(`[title="${leaf}"]`).first().click();
  await page.waitForSelector('[data-testid="if-canvas-main"] thead th', { timeout: 30000 });
  await page.waitForTimeout(2500);
  const out = { label, leaf };
  out.open = await measure();
  await shot('open');
  const headerLabel = process.env.HEADER;
  await page.locator('[data-testid="if-canvas-main"] thead th', { hasText: headerLabel }).first().click();
  await page.waitForTimeout(1200);
  out.afterHeaderClick = await measure();
  await shot('header-click');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
  out.afterEsc = await measure();
  await shot('esc');
  // Select again, then an empty-canvas click (the gutter of the canvas column).
  await page.locator('[data-testid="if-canvas-main"] thead th', { hasText: headerLabel }).first().click();
  await page.waitForTimeout(800);
  const box = await page.locator('[data-testid="if-canvas-main"]').boundingBox();
  await page.mouse.click(box.x + 6, box.y + box.height - 8);
  await page.waitForTimeout(800);
  out.afterEmptyClick = await measure();
  await shot('empty-click');
  console.log(JSON.stringify(out));
  await browser.close();
})().catch((e) => { console.error('DRIVER FAILED', e.message); process.exit(1); });

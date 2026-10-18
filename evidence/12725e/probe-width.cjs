const { chromium } = require('/home/user/rig-ou12725/objectui-issue-12725e/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright');
const http = require('http');
const [port, width] = process.argv.slice(2);
const API = 'http://localhost:4725';
const PKG = 'com.example.showcase';
const BACKEND = new URL(API);
const server = http.createServer((req, res) => {
  const up = http.request({ hostname: BACKEND.hostname, port: BACKEND.port, path: req.url, method: req.method, headers: { ...req.headers, host: BACKEND.host } }, (u) => { res.writeHead(u.statusCode || 502, u.headers); u.pipe(res); });
  up.on('error', () => { res.writeHead(502); res.end(); });
  req.pipe(up);
});
(async () => {
  await new Promise((r) => server.listen(4798, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: Number(width), height: 900 }, locale: 'zh-CN' });
  const r = await ctx.request.post(`${API}/api/v1/auth/sign-in/email`, { data: { email: 'admin@objectos.ai', password: 'admin123' } });
  const token = r.headers()['set-auth-token'];
  await ctx.addInitScript((t) => { try { localStorage.setItem('auth-session-token', t); } catch {} }, token);
  const page = await ctx.newPage();
  await page.route('**/api/v1/auth/me/permissions', async (route) => { const res = await route.fetch(); const body = await res.json(); body.systemPermissions = [...(body.systemPermissions || []), 'studio.access']; await route.fulfill({ response: res, body: JSON.stringify(body) }); });
  await page.route(/\/api\/v1\/packages(\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { packages: [{ manifest: { id: PKG, name: 'ObjectStack Showcase', version: '0.0.0' }, writable: true }] } }) }));
  await page.route('**/api/v1/ai/agents', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { agents: [{ name: 'studio_copilot', label: 'Studio Copilot', role: 'builder', capabilities: ['build'] }] } }) }));
  await page.route(/\/api\/v1\/ai\/conversations(\/[^?]*)?(\?.*)?$/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(route.request().method() === 'GET' && !/conversations\/[^/?]+/.test(route.request().url()) ? [] : { id: 'conv_probe', messages: [] }) }));
  await page.goto(`http://localhost:${port}/studio/${PKG}/interfaces`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-testid="studio-right-slot"] textarea').first().waitFor({ timeout: 90000 });
  await page.waitForTimeout(3000);
  const m = await page.evaluate(() => {
    const slot = document.querySelector('[data-testid="studio-right-slot"]');
    const r = (el) => (el ? { w: Math.round(el.getBoundingClientRect().width), sw: el.scrollWidth, cw: el.clientWidth, right: Math.round(el.getBoundingClientRect().right) } : null);
    const ta = slot?.querySelector('textarea');
    const chain = [];
    let el = ta;
    while (el && el !== slot) { const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); if (cs.minWidth !== '0px' && cs.minWidth !== 'auto') chain.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 120), minWidth: cs.minWidth, w: Math.round(b.width) }); el = el.parentElement; }
    const over = Array.from(slot.querySelectorAll('*')).filter((e) => e.getBoundingClientRect().right > slot.getBoundingClientRect().right + 1 && e.getBoundingClientRect().width > 0).slice(0, 12).map((e) => ({ tag: e.tagName, testid: e.getAttribute('data-testid'), aria: e.getAttribute('aria-label'), cls: (e.className || '').toString().slice(0, 90), left: Math.round(e.getBoundingClientRect().left), right: Math.round(e.getBoundingClientRect().right), w: Math.round(e.getBoundingClientRect().width) }));
    return { over, viewport: innerWidth, docScroll: document.documentElement.scrollWidth, slot: r(slot), textarea: r(ta), minWidthChain: chain };
  });
  console.log(JSON.stringify(m));
  await page.screenshot({ path: process.env.OUT });
  await browser.close(); server.close(); process.exit(0);
})().catch((e) => { console.error('PROBE FAILED', e.stack); process.exit(1); });

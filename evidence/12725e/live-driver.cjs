// Live reading driver for objectui#12725 phase 5 (the 变更 badge and the item
// header line as a copilot `drafted` result lands).
// Usage: node live-driver.cjs <label> <consolePort> <width>
// Env: SHOTS (output dir), API (backend origin), PKG, LEAF (rail title to open).
const http = require('http');
const { chromium } = require('/home/user/rig-ou12725/objectui-issue-12725e/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright');

const [label, port, width] = process.argv.slice(2);
const APP = `http://localhost:${port}`;
const API = process.env.API || 'http://localhost:4725';
const OUT = process.env.SHOTS;
const PKG = process.env.PKG || 'com.example.showcase';
const LEAF = process.env.LEAF || 'object · showcase_task';
const STREAM_PORT = Number(process.env.STREAM_PORT || 4798);
const NARRATION_MS = Number(process.env.NARRATION_MS || 20000);

// ── The server side of the scenario, in this process ──────────────────────
// The copilot's tool writes two drafts and answers `drafted` (the envelope
// shape of objectstack-ai/cloud#2924, cloud f9e45145); `_drafts` lists them
// from that moment on. The agent then keeps narrating for NARRATION_MS before
// the turn ends.
const state = { drafted: false, toolAnsweredAt: null, turnEndedAt: null, draftReads: [] };
const ROWS = [
  { type: 'object', name: 'showcase_task', label: 'Task', packageId: PKG, updatedAt: null, updatedBy: null },
  { type: 'view', name: 'showcase_task.all_tasks', label: 'All Tasks', packageId: PKG, updatedAt: null, updatedBy: null },
];
const ENVELOPE = {
  status: 'drafted',
  kind: 'edit',
  drafted: ROWS.map(({ type, name }) => ({ type, name })),
  failed: [],
  packageId: PKG,
  summary: 'Add a renew count field to Task and show it on the list',
  posture: { mode: 'draft', liveRecords: 12 },
  draftState: { pending: 2, items: ROWS.map(({ type, name }) => ({ type, name })), others: 0 },
  note: 'SAVED AS A STUDIO DRAFT — NOT LIVE.',
};

const sse = (res, chunk) => res.write(`data: ${JSON.stringify(chunk)}\n\n`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BACKEND = new URL(API);
async function streamChat(req, res) {
  req.resume();
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
    'x-vercel-ai-ui-message-stream': 'v1',
  });
  sse(res, { type: 'start', messageId: `msg-${label}` });
  sse(res, { type: 'start-step' });
  sse(res, { type: 'text-start', id: 't1' });
  sse(res, { type: 'text-delta', id: 't1', delta: 'OK — adding the field. ' });
  sse(res, { type: 'text-end', id: 't1' });
  await sleep(1500);
  sse(res, { type: 'tool-input-available', toolCallId: 'call_apply_edit_1', toolName: 'apply_edit', input: { ops: [] } });
  await sleep(800);
  state.drafted = true;
  state.toolAnsweredAt = Date.now();
  sse(res, { type: 'tool-output-available', toolCallId: 'call_apply_edit_1', output: JSON.stringify(ENVELOPE) });
  sse(res, { type: 'finish-step' });
  sse(res, { type: 'start-step' });
  sse(res, { type: 'text-start', id: 't2' });
  const words = 'Saved as a draft: the app is live with 12 records, so nothing changed for its users yet. Review it in Changes and publish it there.'.split(' ');
  for (const w of words) {
    await sleep(NARRATION_MS / words.length);
    sse(res, { type: 'text-delta', id: 't2', delta: `${w} ` });
  }
  sse(res, { type: 'text-end', id: 't2' });
  sse(res, { type: 'finish-step' });
  sse(res, { type: 'finish' });
  res.write('data: [DONE]\n\n');
  state.turnEndedAt = Date.now();
  res.end();
}
// The console's dev proxy points here: the chat stream and the `_drafts`
// ledger are this scenario's; every other request goes to the real backend.
const server = http.createServer((req, res) => {
  const path = req.url || '/';
  if (req.method === 'POST' && /^\/api\/v1\/ai\/agents\/[^/]+\/chat/.test(path)) return void streamChat(req, res);
  if (path.startsWith('/api/v1/meta/_drafts')) {
    req.resume();
    state.draftReads.push({ at: Date.now(), drafted: state.drafted });
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ drafts: state.drafted ? ROWS : [] }));
    return;
  }
  const upstream = http.request(
    { hostname: BACKEND.hostname, port: BACKEND.port, path, method: req.method, headers: { ...req.headers, host: BACKEND.host } },
    (up) => {
      res.writeHead(up.statusCode || 502, up.headers);
      up.pipe(res);
    },
  );
  upstream.on('error', () => {
    res.writeHead(502);
    res.end();
  });
  req.pipe(upstream);
});

(async () => {
  await new Promise((r) => server.listen(STREAM_PORT, r));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: Number(width), height: 900 }, locale: 'zh-CN' });
  const r = await ctx.request.post(`${API}/api/v1/auth/sign-in/email`, { data: { email: 'admin@objectos.ai', password: 'admin123' } });
  const token = r.headers()['set-auth-token'];
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem('auth-session-token', t);
    } catch {}
  }, token);
  const page = await ctx.newPage();
  const aiCalls = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/v1/ai/')) aiCalls.push(`${req.method()} ${new URL(req.url()).pathname}`);
  });
  // Studio gate, package list and agent catalog: answered in the browser (disclosed in the README).
  await page.route('**/api/v1/auth/me/permissions', async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    body.systemPermissions = [...(body.systemPermissions || []), 'studio.access'];
    await route.fulfill({ response: res, body: JSON.stringify(body) });
  });
  await page.route(/\/api\/v1\/packages(\?.*)?$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { packages: [{ manifest: { id: PKG, name: 'ObjectStack Showcase', version: '0.0.0' }, writable: true }] } }),
    }),
  );
  await page.route('**/api/v1/ai/agents', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { agents: [{ name: 'studio_copilot', label: 'Studio Copilot', role: 'builder', capabilities: ['build'] }] } }),
    }),
  );
  await page.route(/\/api\/v1\/ai\/conversations(\/[^?]*)?(\?.*)?$/, (route) => {
    const method = route.request().method();
    const body = method === 'GET' && !/conversations\/[^/?]+/.test(route.request().url()) ? [] : { id: 'conv_ev12725', messages: [] };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const shot = async (name) => page.screenshot({ path: `${OUT}/${label}-${name}.png` });
  const measure = async () =>
    page.evaluate(() => {
      const badge = document.querySelector('[data-testid="studio-changes-count"]');
      const hdr = document.querySelector('[data-testid="if-item-header"]');
      const status = hdr?.querySelector('[data-testid="studio-item-status"]');
      const slot = document.querySelector('[data-testid="studio-right-slot"]');
      const sr = slot ? slot.getBoundingClientRect().right : 0;
      const over = slot
        ? Array.from(slot.querySelectorAll('*'))
            .filter((e) => e.getBoundingClientRect().width > 0 && e.getBoundingClientRect().right > sr + 1)
            .slice(0, 6)
            .map((e) => ({ tag: e.tagName, testid: e.getAttribute('data-testid'), cls: (e.className || '').toString().slice(0, 80), w: Math.round(e.getBoundingClientRect().width), right: Math.round(e.getBoundingClientRect().right) }))
        : [];
      return {
        slotOverflow: over,
        badge: badge ? badge.textContent.trim() : null,
        headerStatus: status ? status.textContent.trim() : null,
        slotMode: slot?.getAttribute('data-mode') ?? null,
        slotWidth: slot ? Math.round(slot.getBoundingClientRect().width) : null,
      };
    });

  await page.goto(`${APP}/studio/${PKG}/interfaces`, { waitUntil: 'domcontentloaded' });
  if (process.env.EXPLORE) {
    await page.waitForTimeout(Number(process.env.EXPLORE));
    await shot('explore');
    const titles = await page.$$eval('[title]', (els) => els.map((e) => e.getAttribute('title')).filter((t) => / · /.test(t)));
    console.log(JSON.stringify({ url: page.url(), titles, text: (await page.evaluate(() => document.body.innerText)).slice(0, 1500), aiCalls }));
    await browser.close();
    server.close();
    return;
  }
  await page.locator('[title="page · showcase_capability_map"]').first().waitFor({ timeout: 90000 });
  await page.waitForTimeout(3000);
  for (const name of (process.env.NAVGROUPS || '').split(',').filter(Boolean)) {
    const btn = page.locator('button[aria-expanded]', { hasText: name }).first();
    for (let k = 0; k < 5 && (await btn.getAttribute('aria-expanded')) !== 'true'; k++) {
      await btn.click();
      await page.waitForTimeout(700);
    }
  }
  await page.locator(`[title="${LEAF}"]`).first().waitFor({ timeout: 30000 });
  await page.locator(`[title="${LEAF}"]`).first().click();
  await page.waitForTimeout(6000);
  const out = { label, width: Number(width), leaf: LEAF };
  out.before = await measure();
  await shot('1-before');

  const composer = page.locator('[data-testid="studio-right-slot"] textarea').first();
  await composer.waitFor({ timeout: 30000 });
  await composer.fill('Add a renew count field to Task');
  const navBefore = await page.evaluate(() => performance.getEntriesByType('navigation').length + ':' + location.href);
  await composer.press('Enter');

  // The tool answers `drafted`; the agent is still narrating.
  const t0 = Date.now();
  while (!state.toolAnsweredAt && Date.now() - t0 < 30000) await page.waitForTimeout(100);
  await page.waitForTimeout(2500);
  out.landedMsAfterTool = Date.now() - state.toolAnsweredAt;
  out.turnEndedWhenLandedShot = state.turnEndedAt !== null;
  out.landed = await measure();
  await shot('2-landed-turn-running');

  while (!state.turnEndedAt && Date.now() - t0 < 60000) await page.waitForTimeout(200);
  await page.waitForTimeout(2500);
  out.afterTurn = await measure();
  await shot('3-turn-ended');
  out.sameDocument = navBefore === (await page.evaluate(() => performance.getEntriesByType('navigation').length + ':' + location.href));
  out.draftReads = state.draftReads.map((d) => ({
    relToTool: state.toolAnsweredAt ? d.at - state.toolAnsweredAt : null,
    relToTurnEnd: state.turnEndedAt ? d.at - state.turnEndedAt : null,
    drafted: d.drafted,
  }));
  out.aiCalls = [...new Set(aiCalls)];
  console.log(JSON.stringify(out));
  await browser.close();
  server.close();
  process.exit(0);
})().catch((e) => {
  console.error('DRIVER FAILED', e && e.stack ? e.stack : e);
  server.close();
  process.exit(1);
});

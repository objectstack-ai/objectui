// Live reading driver for objectui#12965: does the floating pending-drafts bar
// cover the Studio copilot's composer? Adapted from objectui#12725 phase 6's
// driver (evidence branch `claude/issue-12725f-evidence`, `live-driver.cjs`):
// same forwarding proxy, same two-turn scenario, same browser stubs, the real
// `build` agent name. What is new is the reading: where the bar sits against
// the composer's textarea, and what is on top along the composer's first line.
//
// Usage: node live-driver.cjs <label> <consolePort> <width>
// Env: SHOTS (output dir), API (backend origin), PKG, SURFACE,
//      MODE (studio | fullpage), STREAM_PORT (this process's forwarding proxy;
//      the console's dev proxy points here).
const http = require('http');
const { chromium } = require('/home/user/rig-ou12965/objectui-issue-12965/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright');

const [label, port, width] = process.argv.slice(2);
const APP = `http://localhost:${port}`;
const API = process.env.API || 'http://localhost:4965';
const OUT = process.env.SHOTS;
const PKG = process.env.PKG || 'com.example.showcase';
const SURFACE = process.env.SURFACE || 'object:showcase_task';
const MODE = process.env.MODE || 'studio';
const STREAM_PORT = Number(process.env.STREAM_PORT || 4966);

// ── The server side of the scenario, in this process (phase 6's, unchanged) ──
// Turn 1: `apply_edit` answers `changes_proposed` with the draft posture.
// Turn 2 (the 存为草稿 click): the confirm replay `replay_t2_0` stages one
// draft and answers `drafted`. `_drafts` lists the draft from that moment.
const ROW = { type: 'object', name: 'showcase_task', label: 'Task', packageId: PKG, updatedAt: null, updatedBy: null };
const state = { drafted: false, draftReads: 0, turns: 0 };
const PROPOSED = {
  status: 'changes_proposed',
  applied: false,
  changes: [
    { verb: 'add_field', object: 'showcase_task', field: 'renew_count', type: 'number', details: '续借次数 · 默认 0 · 不必填' },
    { verb: 'update_metadata', type: 'view', name: 'showcase_task.all_tasks' },
  ],
  summary: '这个应用已上线，有 12 条记录在用。改动先存为草稿；画布和右侧属性里能看到效果，你在「变更」里核对后再发布。',
  posture: { mode: 'draft', liveRecords: 12 },
  primaryAction: 'save_draft',
  note: 'NOTHING has changed yet (applied:false) — this is shown to the user as a confirm card.',
};
const DRAFTED = {
  status: 'drafted',
  kind: 'edit',
  drafted: [{ type: 'object', name: 'showcase_task' }],
  packageId: PKG,
  summary: '已起草 2 处改动',
  posture: { mode: 'draft', liveRecords: 12 },
  note: 'SAVED AS A STUDIO DRAFT — NOT LIVE.',
  draftState: { pending: 1, items: [{ type: 'object', name: 'showcase_task' }], others: 0 },
  existingRows: [{ object: 'showcase_task', field: 'renew_count', label: '续借次数', rows: 12 }],
  appliedCard: { title: '已存为草稿 · 1 项未发布', lines: ['已有 12 条记录的续借次数为空', '核对：结构 ✓'] },
};
const sse = (res, chunk) => res.write(`data: ${JSON.stringify(chunk)}\n\n`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BACKEND = new URL(API);
async function streamChat(req, res) {
  req.resume();
  state.turns += 1;
  const turn = state.turns;
  res.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
    'x-vercel-ai-ui-message-stream': 'v1',
  });
  sse(res, { type: 'start', messageId: `msg-${label}-${turn}` });
  sse(res, { type: 'start-step' });
  if (turn === 1) {
    sse(res, { type: 'text-start', id: 't1' });
    sse(res, { type: 'text-delta', id: 't1', delta: '好的，我先列出这次要改的地方，请确认。' });
    sse(res, { type: 'text-end', id: 't1' });
    await sleep(600);
    sse(res, { type: 'tool-input-available', toolCallId: 'call_apply_edit_1', toolName: 'apply_edit', input: { ops: [] } });
    await sleep(400);
    sse(res, { type: 'tool-output-available', toolCallId: 'call_apply_edit_1', output: JSON.stringify(PROPOSED) });
  } else {
    sse(res, { type: 'tool-input-available', toolCallId: 'replay_t2_0', toolName: 'apply_edit', input: { ops: [] } });
    await sleep(600);
    state.drafted = true;
    sse(res, { type: 'tool-output-available', toolCallId: 'replay_t2_0', output: JSON.stringify(DRAFTED) });
    sse(res, { type: 'finish-step' });
    sse(res, { type: 'start-step' });
    sse(res, { type: 'text-start', id: 't2' });
    sse(res, { type: 'text-delta', id: 't2', delta: '已存为草稿：这个应用已上线，改动还没有对用户生效。请在「变更」里核对后发布。' });
    sse(res, { type: 'text-end', id: 't2' });
  }
  sse(res, { type: 'finish-step' });
  sse(res, { type: 'finish' });
  res.write('data: [DONE]\n\n');
  res.end();
}
const server = http.createServer((req, res) => {
  const path = req.url || '/';
  if (req.method === 'POST' && /^\/api\/v1\/ai\/agents\/[^/]+\/chat/.test(path)) return void streamChat(req, res);
  if (path.startsWith('/api/v1/meta/_drafts')) {
    req.resume();
    state.draftReads += 1;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ drafts: state.drafted ? [ROW] : [] }));
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

// The composer against the floating bar: both boxes, their overlap, and what
// is on top at five points along the composer's first text line (the line the
// placeholder is drawn on). `firstLineClear` is true when every point hits the
// textarea itself. The bar's wrapper is `pointer-events-none` and the bar is
// `pointer-events-auto`, so `elementFromPoint` reports the bar where it covers.
function composerReading(scopeSel) {
  const scope = document.querySelector(scopeSel) || document.body;
  const ta = scope.querySelector('textarea');
  if (!ta) return { error: 'no textarea' };
  const bar = scope.querySelector('[data-testid="pending-drafts-bar"]');
  const box = (r) => ({ left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width), height: Math.round(r.height) });
  const tr = ta.getBoundingClientRect();
  const br = bar ? bar.getBoundingClientRect() : null;
  const overlap = br
    ? {
        x: Math.max(0, Math.round(Math.min(tr.right, br.right) - Math.max(tr.left, br.left))),
        y: Math.max(0, Math.round(Math.min(tr.bottom, br.bottom) - Math.max(tr.top, br.top))),
      }
    : null;
  const cs = getComputedStyle(ta);
  const padL = parseFloat(cs.paddingLeft) || 0;
  const padR = parseFloat(cs.paddingRight) || 0;
  const padT = parseFloat(cs.paddingTop) || 0;
  const lh = parseFloat(cs.lineHeight) || (parseFloat(cs.fontSize) || 14) * 1.4;
  const y = tr.top + padT + lh / 2;
  const xs = [0.05, 0.25, 0.5, 0.75, 0.95].map((f) => tr.left + padL + f * (tr.width - padL - padR));
  const firstLine = xs.map((x) => {
    const el = document.elementFromPoint(x, y);
    const tagged = el && el.closest('[data-testid]');
    return {
      x: Math.round(x),
      y: Math.round(y),
      onComposer: Boolean(el && (el === ta || ta.contains(el))),
      top: el ? (tagged ? tagged.getAttribute('data-testid') : el.tagName.toLowerCase()) : null,
    };
  });
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.font = cs.font;
  return {
    placeholder: ta.getAttribute('placeholder'),
    placeholderWidth: Math.round(ctx.measureText(ta.getAttribute('placeholder') || '').width),
    composerContentWidth: Math.round(tr.width - padL - padR),
    textarea: box(tr),
    barShown: Boolean(bar),
    bar: br ? box(br) : null,
    barText: bar ? bar.innerText : null,
    overlap,
    firstLine,
    firstLineClear: firstLine.every((p) => p.onComposer),
  };
}

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
  // Studio gate, package list and agent catalog: answered in the browser, as in phase 6.
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
  // The real build agent's name (cloud `BUILD_AGENT_NAME`), so `isBuildSurface` is true.
  await page.route('**/api/v1/ai/agents', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { agents: [{ name: 'build', label: 'Builder', role: 'Schema Architect', surface: 'build', capabilities: ['build'] }] } }),
    }),
  );
  await page.route(/\/api\/v1\/ai\/conversations(\/[^?]*)?(\?.*)?$/, (route) => {
    const method = route.request().method();
    const body = method === 'GET' && !/conversations\/[^/?]+/.test(route.request().url()) ? [] : { id: 'conv_ev12965', messages: [] };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const shot = async (name) => page.screenshot({ path: `${OUT}/${label}-${name}.png` });
  const out = { label, width: Number(width), mode: MODE, agent: 'build' };

  const scope = MODE === 'fullpage' ? 'body' : '[data-testid="studio-right-slot"]';
  if (MODE === 'fullpage') {
    await page.goto(`${APP}/ai/build?package=${encodeURIComponent(PKG)}`, { waitUntil: 'domcontentloaded' });
  } else {
    await page.goto(`${APP}/studio/${PKG}/interfaces?surface=${encodeURIComponent(SURFACE)}`, { waitUntil: 'domcontentloaded' });
  }
  await page.locator(`${scope} textarea`).first().waitFor({ timeout: 90000 });
  await page.waitForTimeout(6000);
  out.url = page.url();
  out.beforeDraft = await page.evaluate(composerReading, scope);

  // Turn 1, then 存为草稿: one draft pending.
  const composer = page.locator(`${scope} textarea`).first();
  await composer.fill('给任务加一个续借次数字段，默认 0');
  await composer.press('Enter');
  await page.locator(`${scope} [data-testid="proposed-changes-confirm"]`).first().waitFor({ timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.locator(`${scope} [data-testid="proposed-changes-confirm"]`).first().click();
  await page.locator(`${scope} [data-testid="applied-card"]`).first().waitFor({ timeout: 30000 });
  // The bar re-reads `_drafts` when the turn goes idle; give it the time it
  // needs to answer, then read.
  await page.locator(`${scope} [data-testid="pending-drafts-bar"]`).first().waitFor({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(1500);
  out.badge = MODE === 'fullpage' ? null : await page.locator('[data-testid="studio-changes-count"]').first().innerText({ timeout: 1000 }).catch(() => null);
  out.appliedButtons = await page.locator(`${scope} [data-testid="applied-card"] button`).allInnerTexts();
  out.withDraft = await page.evaluate(composerReading, scope);
  out.draftReads = state.draftReads;
  await shot('draft-pending');
  console.log(JSON.stringify(out));
  await browser.close();
  server.close();
  process.exit(0);
})().catch((e) => {
  console.error('DRIVER FAILED', e && e.stack ? e.stack : e);
  server.close();
  process.exit(1);
});

// Live reading driver for objectui#12725 phase 6 + objectui#12894's console wiring.
// Usage: node live-driver.cjs <label> <consolePort> <width>
// Env: SHOTS (output dir), API (backend origin), PKG, SURFACE, MODE (probe | shots | fullpage),
//      STREAM_PORT (this process's forwarding proxy; the console's dev proxy points here),
//      FIX_CSS (probe only: a CSS rule injected into the page, to test a candidate fix).
const http = require('http');
const { chromium } = require('/home/user/rig-ou12725f/objectui-issue-12725f/node_modules/.pnpm/playwright@1.62.1/node_modules/playwright');

const [label, port, width] = process.argv.slice(2);
const APP = `http://localhost:${port}`;
const API = process.env.API || 'http://localhost:4735';
const OUT = process.env.SHOTS;
const PKG = process.env.PKG || 'com.example.showcase';
const SURFACE = process.env.SURFACE || 'object:showcase_task';
const MODE = process.env.MODE || 'shots';
const SCENARIO = process.env.SCENARIO || 'proposal';
const AGENT = process.env.AGENT || 'build';
const STREAM_PORT = Number(process.env.STREAM_PORT || 4799);

// ── The server side of the scenario, in this process ──────────────────────
// Turn 1: `apply_edit` answers `changes_proposed` with the draft posture
// (objectstack-ai/cloud#2924's envelope). Turn 2 (the 存为草稿 click): the
// confirm replay `replay_t2_0` stages one draft and answers `drafted` with
// `draftState`, `existingRows` and `appliedCard`. `_drafts` lists the draft
// from that moment; `discard-drafts` drops it.
const ROW = { type: 'object', name: 'showcase_task', label: 'Task', packageId: PKG, updatedAt: null, updatedBy: null };
const state = { drafted: false, discards: [], draftReads: 0, turns: 0 };
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

const PHASE5_DRAFTED = {
  status: 'drafted',
  kind: 'edit',
  drafted: [{ type: 'object', name: 'showcase_task' }, { type: 'view', name: 'showcase_task.all_tasks' }],
  failed: [],
  packageId: PKG,
  summary: 'Add a renew count field to Task and show it on the list',
  posture: { mode: 'draft', liveRecords: 12 },
  draftState: { pending: 2, items: [{ type: 'object', name: 'showcase_task' }, { type: 'view', name: 'showcase_task.all_tasks' }], others: 0 },
  note: 'SAVED AS A STUDIO DRAFT — NOT LIVE.',
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
  if (turn === 1 && SCENARIO === 'drafted') {
    // Phase 5's scenario, byte for byte in shape: a non-replay `apply_edit`
    // answers `drafted`, then the agent narrates in English.
    sse(res, { type: 'text-start', id: 't1' });
    sse(res, { type: 'text-delta', id: 't1', delta: 'OK — adding the field. ' });
    sse(res, { type: 'text-end', id: 't1' });
    sse(res, { type: 'tool-input-available', toolCallId: 'call_apply_edit_1', toolName: 'apply_edit', input: { ops: [] } });
    await sleep(400);
    state.drafted = true;
    sse(res, { type: 'tool-output-available', toolCallId: 'call_apply_edit_1', output: JSON.stringify(PHASE5_DRAFTED) });
    sse(res, { type: 'finish-step' });
    sse(res, { type: 'start-step' });
    sse(res, { type: 'text-start', id: 't2' });
    sse(res, { type: 'text-delta', id: 't2', delta: 'Saved as a draft: the app is live with 12 records, so nothing changed for its users yet. Review it in Changes and publish it there.' });
    sse(res, { type: 'text-end', id: 't2' });
  } else if (turn === 1) {
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
  const discard = path.match(/^\/api\/v1\/packages\/([^/?]+)\/discard-drafts/);
  if (req.method === 'POST' && discard) {
    req.resume();
    state.discards.push(decodeURIComponent(discard[1]));
    const dropped = state.drafted ? [{ type: ROW.type, name: ROW.name }] : [];
    state.drafted = false;
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ success: true, data: { success: true, discardedCount: dropped.length, failedCount: 0, discarded: dropped, failed: [] } }));
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

// Every element in the right slot whose box runs past the slot's right edge.
function overflowReading() {
  const slot = document.querySelector('[data-testid="studio-right-slot"]');
  if (!slot) return null;
  const sr = slot.getBoundingClientRect();
  const all = Array.from(slot.querySelectorAll('*')).filter((e) => {
    const r = e.getBoundingClientRect();
    return r.width > 0 && r.right > sr.right + 1;
  });
  const leaves = all.filter((e) => !Array.from(e.children).some((c) => all.includes(c)));
  const describe = (e) => {
    const cs = getComputedStyle(e);
    const r = e.getBoundingClientRect();
    return {
      tag: e.tagName,
      testid: e.getAttribute('data-testid'),
      cls: (e.className || '').toString().slice(0, 120),
      w: Math.round(r.width),
      right: Math.round(r.right),
      minWidth: cs.minWidth,
      width: cs.width,
      flex: cs.flex,
      whiteSpace: cs.whiteSpace,
      text: (e.textContent || '').trim().slice(0, 50),
    };
  };
  const panel = slot.querySelector('[data-testid="ai-chat-panel"]');
  const column = slot.querySelector('[data-chat-column]');
  const send = slot.querySelector('button[type="submit"], [data-testid="prompt-input-submit"]');
  return {
    slotWidth: Math.round(sr.width),
    slotRight: Math.round(sr.right),
    panelWidth: panel ? Math.round(panel.getBoundingClientRect().width) : null,
    columnWidth: column ? Math.round(column.getBoundingClientRect().width) : null,
    sendRight: send ? Math.round(send.getBoundingClientRect().right) : null,
    sendWhole: send ? send.getBoundingClientRect().right <= sr.right + 0.5 : null,
    overflowCount: all.length,
    overflow: all.slice(0, 12).map(describe),
    leaves: leaves.slice(0, 12).map(describe),
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
  const aiCalls = [];
  page.on('request', (req) => {
    if (req.url().includes('/api/v1/ai/') || req.url().includes('discard-drafts')) aiCalls.push(`${req.method()} ${new URL(req.url()).pathname}`);
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
  // The real build agent's name (cloud `BUILD_AGENT_NAME`), so the surface resolves it as `build`.
  await page.route('**/api/v1/ai/agents', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { agents: [AGENT === 'build' ? { name: 'build', label: 'Builder', role: 'Schema Architect', surface: 'build', capabilities: ['build'] } : { name: AGENT, label: 'Studio Copilot', role: 'builder', capabilities: ['build'] }] } }),
    }),
  );
  await page.route(/\/api\/v1\/ai\/conversations(\/[^?]*)?(\?.*)?$/, (route) => {
    const method = route.request().method();
    const body = method === 'GET' && !/conversations\/[^/?]+/.test(route.request().url()) ? [] : { id: 'conv_ev12725f', messages: [] };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const shot = async (name) => page.screenshot({ path: `${OUT}/${label}-${name}.png` });
  const out = { label, width: Number(width), surface: SURFACE, mode: MODE, scenario: SCENARIO, agent: AGENT };

  const sendTurnOne = async (scope) => {
    const composer = page.locator(`${scope} textarea`).first();
    await composer.waitFor({ timeout: 30000 });
    out.placeholder = await composer.getAttribute('placeholder');
    await composer.fill(SCENARIO === 'drafted' ? 'Add a renew count field to Task' : '给任务加一个续借次数字段，默认 0');
    await composer.press('Enter');
    if (SCENARIO === 'drafted') await page.waitForTimeout(4000);
    else await page.locator(`${scope} [data-testid="proposed-changes-confirm"]`).first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(1500);
  };
  const confirmDraft = async (scope) => {
    await page.locator(`${scope} [data-testid="proposed-changes-confirm"]`).first().click();
    await page.locator(`${scope} [data-testid="applied-card"]`).first().waitFor({ timeout: 30000 });
    await page.waitForTimeout(2500);
  };

  if (MODE === 'fullpage') {
    // The full-page chat: 查看变更并发布 navigates to the package's Studio with the drawer open.
    await page.goto(`${APP}/ai/build?package=${encodeURIComponent(PKG)}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
    await sendTurnOne('body');
    await confirmDraft('body');
    await shot('fullpage-1-applied-card');
    out.beforeClick = page.url();
    await page.locator('[data-testid="applied-card-review"]').first().click();
    await page.waitForTimeout(5000);
    out.afterClick = page.url();
    out.drawerOpen = (await page.locator('[role="dialog"]').count()) > 0;
    out.drawerTitle = await page.locator('[role="dialog"]').first().innerText().catch(() => null);
    await shot('fullpage-2-studio-drawer');
    out.aiCalls = [...new Set(aiCalls)];
    console.log(JSON.stringify(out));
    await browser.close();
    server.close();
    process.exit(0);
  }

  // The leaf opens through the pillar's own `?surface=` deep link.
  await page.goto(`${APP}/studio/${PKG}/interfaces?surface=${encodeURIComponent(SURFACE)}`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-testid="studio-right-slot"] textarea').first().waitFor({ timeout: 90000 });
  await page.waitForTimeout(6000);
  out.url = page.url();
  out.empty = await page.evaluate(overflowReading);

  const SLOT = '[data-testid="studio-right-slot"]';
  await sendTurnOne(SLOT);
  out.chip = await page.locator(`${SLOT} [data-testid="surface-context-chip"]`).first().innerText().catch(() => null);
  out.withThread = await page.evaluate(overflowReading);
  await shot('1-thread');
  if (MODE === 'probe') {
    // Which element sets the chat column's min-content width? Lay the column
    // out at its min-content width, then hide one element at a time and keep
    // those whose absence brings that width down to the slot's.
    out.culprit = await page.evaluate(() => {
      const slot = document.querySelector('[data-testid="studio-right-slot"]');
      const column = slot.querySelector('[data-chat-column]');
      const limit = slot.getBoundingClientRect().width;
      const saved = column.getAttribute('style');
      column.style.width = 'min-content';
      column.style.flex = 'none';
      const measure = () => column.getBoundingClientRect().width;
      const minContent = measure();
      const hits = [];
      for (const el of Array.from(column.querySelectorAll('*'))) {
        if (getComputedStyle(el).display === 'none') continue;
        const prev = el.style.display;
        el.style.display = 'none';
        const w = measure();
        el.style.display = prev;
        if (w <= limit) hits.push(el);
      }
      const deepest = hits.filter((h) => !hits.some((o) => o !== h && h.contains(o)));
      const describe = (e) => {
        const cs = getComputedStyle(e);
        // The element's own min-content width, measured the same way.
        const pw = e.style.width; const pf = e.style.flex; const pm = e.style.minWidth;
        e.style.width = 'min-content'; e.style.flex = 'none'; e.style.minWidth = '0';
        const own = e.getBoundingClientRect().width;
        e.style.width = pw; e.style.flex = pf; e.style.minWidth = pm;
        return { tag: e.tagName, testid: e.getAttribute('data-testid'), cls: (e.className || '').toString().slice(0, 140), whiteSpace: cs.whiteSpace, overflow: cs.overflow, minWidth: cs.minWidth, ownMinContent: Math.round(own), text: (e.textContent || '').trim().slice(0, 80) };
      };
      const chain = [];
      if (deepest[0]) { let el = deepest[0]; while (el && el !== column) { chain.push(describe(el)); el = el.parentElement; } }
      if (saved === null) column.removeAttribute('style'); else column.setAttribute('style', saved);
      return { slotWidth: Math.round(limit), columnMinContent: Math.round(minContent), hits: hits.length, deepest: deepest.map(describe), chainToColumn: chain };
    });
    if (process.env.FIX_CSS) {
      await page.addStyleTag({ content: process.env.FIX_CSS });
      await page.waitForTimeout(500);
      out.withFixCss = await page.evaluate(overflowReading);
      await shot('1-thread-fixcss');
    }
    out.aiCalls = [...new Set(aiCalls)];
    console.log(JSON.stringify(out));
    await browser.close();
    server.close();
    process.exit(0);
  }

  await confirmDraft(SLOT);
  out.applied = await page.evaluate(overflowReading);
  out.badgeAfterDraft = await page.locator('[data-testid="studio-changes-count"]').first().innerText().catch(() => null);
  out.appliedButtons = await page.locator(`${SLOT} [data-testid="applied-card"] button`).allInnerTexts();
  // Scroll the applied card into view inside the thread before the shot.
  await page.locator(`${SLOT} [data-testid="applied-card"]`).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  await shot('2-applied-card');

  const before = await page.evaluate(() => ({ href: location.href, nav: performance.getEntriesByType('navigation').length }));
  await page.locator(`${SLOT} [data-testid="applied-card-review"]`).first().click();
  await page.waitForTimeout(2500);
  const after = await page.evaluate(() => ({ href: location.href, nav: performance.getEntriesByType('navigation').length }));
  out.review = {
    before,
    after,
    drawerOpen: (await page.locator('[role="dialog"]').count()) > 0,
    drawerText: await page.locator('[role="dialog"]').first().innerText().catch(() => null),
  };
  await shot('3-drawer-from-review');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1500);

  await page.locator(`${SLOT} [data-testid="applied-card-discard"]`).first().click();
  await page.waitForTimeout(3000);
  out.discard = {
    calls: state.discards,
    discardedShown: (await page.locator(`${SLOT} [data-testid="applied-card-discarded"]`).count()) > 0,
    badgeAfter: await page.locator('[data-testid="studio-changes-count"]').first().innerText({ timeout: 1000 }).catch(() => null),
  };
  await page.locator(`${SLOT} [data-testid="applied-card"]`).first().scrollIntoViewIfNeeded();
  await shot('4-after-undo');
  out.draftReads = state.draftReads;
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

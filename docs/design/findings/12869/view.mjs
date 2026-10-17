import { createRequire } from 'node:module';
const require = createRequire('/home/user/objectui-issue-12869/package.json');
const { chromium } = require('@playwright/test');
const [port, tag] = process.argv.slice(2);
const OUT = process.env.OUT;
const base = `http://localhost:${port}`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ locale: 'zh-CN', colorScheme: 'light', viewport: { width: 1280, height: 1300 } });
await ctx.route('**/api/v1/auth/me/permissions', async (route) => {
  const res = await route.fetch();
  const body = await res.json();
  body.systemPermissions = [...new Set([...(body.systemPermissions ?? []), 'studio.access', 'setup.access', 'manage_metadata'])];
  await route.fulfill({ response: res, json: body });
});
// STUBBED list read (the published backend answers this GET 403 for the seeded
// admin): one authored project package, the manifest shape the branch's create
// POST sent plus the scope the server defaults it to.
const row = {
  manifest: { id: 'com.default.scope-probe', name: 'Scope Probe', version: '0.1.0', type: 'app', namespace: 'scope_probe', scope: 'project' },
  status: 'installed', enabled: true, writable: true,
};
await ctx.route((u) => u.pathname === '/api/v1/packages', async (route) => {
  if (route.request().method() !== 'GET') return route.continue();
  await route.fulfill({ status: 200, json: { success: true, data: { packages: [row] } } });
});
const page = await ctx.newPage();
await page.goto(`${base}/login`);
await page.locator('input[type=email], input[name=email]').first().fill('admin@objectos.ai');
await page.locator('input[type=password]').first().fill('admin123');
await page.locator('button[type=submit]').first().click();
await page.waitForURL((u) => !u.pathname.startsWith('/login'));
await page.goto(`${base}/apps/setup/component/developer/packages`);
await page.getByTestId('pkg-row-com.default.scope-probe').waitFor({ timeout: 90000 });
await page.screenshot({ path: `${OUT}/${tag}-packages-list.png` });
await page.getByTestId('pkg-row-details-com.default.scope-probe').click().catch(async () => page.getByTestId('pkg-row-com.default.scope-probe').click());
await page.getByRole('button', { name: /查看信息|软件包信息/ }).first().click({ timeout: 30000 });
const dialog = page.getByRole('dialog', { name: '软件包信息' });
await dialog.waitFor();
await dialog.getByText('高级', { exact: true }).click();
await page.waitForTimeout(500);
const scope = dialog.getByRole('combobox', { name: '范围' });
console.log('view scope count', await scope.count(), 'disabled', await scope.isDisabled(), 'text', await scope.innerText());
await scope.scrollIntoViewIfNeeded();
await dialog.getByText('软件包依赖。', { exact: true }).scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/${tag}-view-advanced.png` });
await browser.close();

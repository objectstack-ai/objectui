import { createRequire } from 'node:module';
const require = createRequire('/home/user/objectui-issue-12869/package.json');
const { chromium } = require('@playwright/test');
const [port, tag] = process.argv.slice(2);
const OUT = process.env.OUT;
const base = `http://localhost:${port}`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await browser.newContext({ locale: 'zh-CN', colorScheme: 'light', viewport: { width: 1280, height: 1300 } });
// objectui#12725 phase-3 recipe: the published 18.0.0-next.2 backend serves the
// seeded admin systemPermissions [], so the console's Studio gate is opened in
// the browser. Only this one read is altered; every other answer is the server's.
await ctx.route('**/api/v1/auth/me/permissions', async (route) => {
  const res = await route.fetch();
  const body = await res.json();
  body.systemPermissions = [...new Set([...(body.systemPermissions ?? []), 'studio.access', 'setup.access', 'manage_metadata'])];
  await route.fulfill({ response: res, json: body });
});
const page = await ctx.newPage();
const posts = [];
page.on('request', (r) => { if (r.method() === 'POST' && r.url().endsWith('/api/v1/packages')) posts.push(r.postData()); });
page.on('response', async (r) => { if (r.request().method() === 'POST' && r.url().endsWith('/api/v1/packages')) console.log('POST answer', r.status(), (await r.text()).slice(0, 400)); });
await page.goto(`${base}/login`);
await page.locator('input[type=email], input[name=email]').first().fill('admin@objectos.ai');
await page.locator('input[type=password]').first().fill('admin123');
await page.locator('button[type=submit]').first().click();
await page.waitForURL((u) => !u.pathname.startsWith('/login'));
await page.goto(`${base}/studio`);
await page.getByRole('button', { name: /新建软件包/ }).waitFor({ timeout: 90000 });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/${tag}-studio-landing.png` });
await page.getByRole('button', { name: /新建软件包/ }).click();
const dialog = page.getByRole('dialog');
await dialog.waitFor();
await dialog.getByText('高级', { exact: true }).click();
await page.waitForTimeout(500);
console.log('scope combobox count', await dialog.getByRole('combobox', { name: '范围' }).count());
console.log('advanced text', (await dialog.innerText()).replace(/\n+/g, ' | ').slice(0, 900));
await dialog.getByText('高级', { exact: true }).scrollIntoViewIfNeeded();
await dialog.getByText('软件包依赖。', { exact: true }).scrollIntoViewIfNeeded();
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/${tag}-create-advanced.png` });
if (await dialog.getByRole('combobox', { name: '范围' }).count()) {
  await dialog.getByRole('combobox', { name: '范围' }).click();
  await page.waitForTimeout(300);
  console.log('scope options', await page.getByRole('option').allInnerTexts());
  await page.screenshot({ path: `${OUT}/${tag}-create-scope-open.png` });
  await page.keyboard.press('Escape');
}
if (process.env.SUBMIT) {
  await dialog.getByLabel('显示名称', { exact: false }).first().fill('Scope Probe');
  await page.waitForTimeout(300);
  await dialog.getByTestId('package-form-submit').click();
  await page.waitForTimeout(2500);
  console.log('POST bodies', posts);
  await dialog.screenshot({ path: `${OUT}/${tag}-create-submitted.png` });
}
await browser.close();

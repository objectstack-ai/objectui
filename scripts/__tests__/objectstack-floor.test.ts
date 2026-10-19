/**
 * objectui#12958 — `scripts/objectstack-floor.mjs`, the `@objectstack/*` floor computed
 * from `.objectstack-sha` at publish. The three pins the card names run through REAL
 * git over a throwaway objectstack-shaped history with annotated release tags; npm is
 * a recorded version list. No network.
 */
import { afterAll, describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { compareVersions, computeFloor, main, releaseTags, withFloorEntry } from '../objectstack-floor.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'objectstack-floor-test-'));
afterAll(() => fs.rmSync(scratch, { recursive: true, force: true }));

const env = { ...process.env, GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t' };
const git = (cwd: string, ...args: string[]) => {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8', env });
  expect(r.status, r.stderr).toBe(0);
  return r.stdout.trim();
};

// c1 - c2 [next.0] - c3 - c4 [next.1] - c5 [next.2, tagged but never on npm] - c6
const upstream = path.join(scratch, 'objectstack');
fs.mkdirSync(upstream);
git(upstream, 'init', '-q');
const sha: Record<string, string> = {};
for (const c of ['c1', 'c2', 'c3', 'c4', 'c5', 'c6']) {
  git(upstream, 'commit', '-q', '--allow-empty', '-m', c);
  sha[c] = git(upstream, 'rev-parse', 'HEAD');
}
for (const [c, v] of [['c2', '1.0.0-next.0'], ['c4', '1.0.0-next.1'], ['c5', '1.0.0-next.2']]) {
  git(upstream, 'tag', '-a', '-m', v, `@objectstack/spec@${v}`, sha[c]);
}
const published = ['0.9.0', '1.0.0-next.0', '1.0.0-next.1'];
const npm = (args: string[]) => (args[2] === 'versions' ? published : published.find((v) => args[1].endsWith(`@${v}`)));

describe('the floor is the earliest published release whose tag contains the pin (objectui#12958)', () => {
  it.each([
    ['inside a release', 'c3', '1.0.0-next.1'],
    ['exactly a release commit', 'c4', '1.0.0-next.1'],
    ['newer than every published release (its tag is not on npm)', 'c5', null],
    ['newer than every tag', 'c6', null],
  ])('pin %s', (_, c, floor) => {
    const tags = releaseTags(fs.mkdtempSync(path.join(scratch, 'fetch-')), upstream, sha[c]);
    expect(computeFloor({ published, ...tags })).toEqual({ floor, newest: '1.0.0-next.1' });
  });

  it('orders by semver precedence, prereleases included', () => {
    const ordered = ['0.9.0', '1.0.0-alpha', '1.0.0-next.2', '1.0.0-next.10', '1.0.0', '1.1.0'];
    expect([...ordered].reverse().sort(compareVersions)).toEqual(ordered);
    expect(() => compareVersions('1.0.0+build', '1.0.0')).toThrow();
  });
});

describe('the step, end to end', () => {
  const changelog = '# @x/a\n\n## 2.0.0\n\n### Minor Changes\n\n- abc123: a change\n';
  function fixture(pin: string, spec = '^1.0.0-next.0') {
    const root = fs.mkdtempSync(path.join(scratch, 'root-'));
    const write = (file: string, text: string) => {
      fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
      fs.writeFileSync(path.join(root, file), text);
    };
    write('.objectstack-sha', `${pin}\n`);
    write('.changeset/config.json', JSON.stringify({ fixed: [['@x/a']] }));
    const manifest = { name: '@x/a', version: '2.0.0', dependencies: { '@objectstack/spec': spec, react: '^19.0.0' }, devDependencies: { '@objectstack/lint': '^1.0.0-next.2' } };
    write('packages/a/package.json', `${JSON.stringify(manifest, null, 2)}\n`);
    write('packages/a/CHANGELOG.md', changelog);
    const read = () => [fs.readFileSync(path.join(root, 'packages/a/package.json'), 'utf8'), fs.readFileSync(path.join(root, 'packages/a/CHANGELOG.md'), 'utf8')];
    return { root, read };
  }
  const run = (root: string, argv: string[] = []) => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const code = main({ root, argv, env: { OBJECTSTACK_REPO_URL: upstream }, npm });
    const out = [...log.mock.calls, ...err.mock.calls].join('\n');
    err.mockRestore();
    log.mockRestore();
    return { code, out };
  };

  it('moves a range below the floor, keeps one at or above it, and records the move in CHANGELOG.md', () => {
    const { root, read } = fixture(sha.c3);
    expect(run(root).code).toBe(0);
    const [manifest, log] = read();
    expect(JSON.parse(manifest).dependencies).toEqual({ '@objectstack/spec': '^1.0.0-next.1', react: '^19.0.0' });
    expect(JSON.parse(manifest).devDependencies).toEqual({ '@objectstack/lint': '^1.0.0-next.2' });
    expect(log).toBe(withFloorEntry(changelog, '2.0.0', [{ name: '@objectstack/spec', field: 'dependencies', from: '^1.0.0-next.0', to: '^1.0.0-next.1' }], '1.0.0-next.1', sha.c3));
    expect(log).toMatch(/^# @x\/a\n\n## 2\.0\.0\n\n### Dependency floors\n\n.*\n\n- `@objectstack\/spec` \(`dependencies`\): `\^1\.0\.0-next\.0` → `\^1\.0\.0-next\.1`\n\n### Minor Changes\n/);
  });

  it('stops with exit 2 when no published release contains the pin, writing nothing', () => {
    const { root, read } = fixture(sha.c6);
    const before = read();
    const { code, out } = run(root);
    expect(code).toBe(2);
    expect(out).toContain(sha.c6);
    expect(out).toContain('the newest published release is 1.0.0-next.1');
    expect(read()).toEqual(before);
  });

  it('refuses a range it cannot read, and --dry-run writes nothing', () => {
    const unreadable = fixture(sha.c3, 'latest');
    const before = unreadable.read();
    expect(run(unreadable.root).code).toBe(1);
    expect(unreadable.read()).toEqual(before);
    const dry = fixture(sha.c4);
    const pristine = dry.read();
    expect(run(dry.root, ['--dry-run'])).toMatchObject({ code: 0, out: expect.stringContaining('^1.0.0-next.0 → ^1.0.0-next.1') });
    expect(dry.read()).toEqual(pristine);
  });

  it('runs first in `pnpm changeset:publish` and before the nightly floor scan', () => {
    const publish = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8')).scripts['changeset:publish'];
    expect(publish).toMatch(/^node scripts\/objectstack-floor\.mjs && .*check-spec-range-floors\.mjs && changeset publish$/);
    const nightly = fs.readFileSync(path.join(repoRoot, '.github/workflows/spec-range-floors.yml'), 'utf8');
    const step = nightly.indexOf('\n          node scripts/objectstack-floor.mjs || code=$?\n');
    expect(step).toBeGreaterThan(nightly.indexOf('turbo run build'));
    expect(step).toBeLessThan(nightly.indexOf('run: pnpm check:spec-floors'));
  });
});

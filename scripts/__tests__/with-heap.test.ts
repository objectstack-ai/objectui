/**
 * `scripts/with-heap.mjs` -- the cross-platform heap raise behind
 * `@object-ui/app-shell`'s and `@object-ui/console`'s `tsc` runs (objectstack
 * ruling D1: both OOM at Node's default old-space limit in the merged tree).
 *
 * Three things are pinned: the flag reaches the child, a caller's own
 * old-space setting is kept rather than overridden, and the child's exit code
 * is the wrapper's. The fourth pin is the wiring itself: the two package
 * manifests the measurement named still run `tsc` through the wrapper, so a
 * refactor that drops it is a red test rather than a slow OOM in CI.
 */
import { describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { HEAP_FLAG, nodeOptionsWithHeap } from '../with-heap.mjs';
import { WRAPPER_SCRIPTS, buildProgramFor } from './helpers/build-program';
import { packagesWithScript, rel } from './helpers/turbo-inputs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../..');
const wrapper = path.join(repoRoot, 'scripts/with-heap.mjs');

const runWrapper = (args: string[], env: Record<string, string | undefined> = {}) =>
  spawnSync(process.execPath, [wrapper, ...args], {
    encoding: 'utf8',
    env: { ...process.env, NODE_OPTIONS: undefined, ...env },
  });

describe('with-heap (objectstack ruling D1: tsc heap for app-shell and console)', () => {
  it('appends the flag to whatever NODE_OPTIONS already carries', () => {
    expect(nodeOptionsWithHeap(undefined)).toBe(HEAP_FLAG);
    expect(nodeOptionsWithHeap('')).toBe(HEAP_FLAG);
    expect(nodeOptionsWithHeap('--use-openssl-ca')).toBe(`--use-openssl-ca ${HEAP_FLAG}`);
  });

  it('keeps an old-space size the caller already set, whatever its value', () => {
    expect(nodeOptionsWithHeap('--max-old-space-size=8192')).toBe('--max-old-space-size=8192');
    expect(nodeOptionsWithHeap('--max-old-space-size=1024 --use-openssl-ca')).toBe('--max-old-space-size=1024 --use-openssl-ca');
    expect(nodeOptionsWithHeap('--max-old-space-size 2048')).toBe('--max-old-space-size 2048');
  });

  it('hands the child the flag through NODE_OPTIONS and returns its exit code', () => {
    const probe = runWrapper([process.execPath, '-e', 'process.stdout.write(process.env.NODE_OPTIONS ?? ""); process.exit(7)']);
    expect(probe.stdout).toContain(HEAP_FLAG);
    expect(probe.status).toBe(7);
  });

  it('fails loudly, not with exit 0, when the command cannot start or no command is given', () => {
    const missing = runWrapper(['a-command-that-does-not-exist-9f3c']);
    expect(missing.status).toBe(1);
    expect(missing.stderr).toContain('could not start');
    const none = runWrapper([]);
    expect(none.status).toBe(2);
    expect(none.stderr).toContain('usage');
  });

  it('is what app-shell and console run tsc through, in build and type-check', () => {
    for (const dir of ['packages/app-shell', 'apps/console']) {
      const manifest = JSON.parse(readFileSync(path.join(repoRoot, dir, 'package.json'), 'utf8')) as { scripts: Record<string, string> };
      for (const script of ['build', 'type-check']) {
        // The FIRST tsc of each chain is the full program; it must run wrapped.
        const first = manifest.scripts[script].split('&&')[0].trim();
        expect(first, `${dir} ${script}`).toMatch(/^node \.\.\/\.\.\/scripts\/with-heap\.mjs tsc(\s|$)/);
      }
    }
  });

  it('is seen through by the turbo build-inputs derivation: the wrapped tsc is still a tsc run', () => {
    // `turbo-build-inputs.test.ts` derives each package's build program from
    // its script. A wrapper it did not understand would make the two wrapped
    // builds look like "node runs a script" and silently drop their tsconfig
    // chain from the sweep; this pins that the wrapper is both recorded AND
    // looked through.
    expect(WRAPPER_SCRIPTS.has('scripts/with-heap.mjs')).toBe(true);
    const wrapped = packagesWithScript('build').filter((pkg) =>
      ['packages/app-shell', 'apps/console'].includes(rel(pkg.dir)),
    );
    expect(wrapped.map((pkg) => rel(pkg.dir)).sort()).toEqual(['apps/console', 'packages/app-shell']);
    for (const pkg of wrapped) {
      const program = buildProgramFor(pkg);
      expect(program.configFiles.map(rel), rel(pkg.dir)).toContain('scripts/with-heap.mjs');
      expect(
        program.tscInvocations.map((inv) => rel(inv.project)),
        `${rel(pkg.dir)} drives its own tsconfig.json through the wrapper`,
      ).toContain(`${rel(pkg.dir)}/tsconfig.json`);
      expect(program.outside, rel(pkg.dir)).toContain('scripts/with-heap.mjs');
    }
  });
});

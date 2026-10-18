/**
 * objectui#12957 — `scripts/objectstack-pin.mjs`, the pinned build of `@objectstack/*`.
 *
 * Three layers:
 *   1. the contract readers and the override-set check, on literals — every
 *      refusal paired with the accepted shape beside it;
 *   2. the REAL tree: the root manifest's overrides cover every `@objectstack/*`
 *      name the workspace declares, so none can resolve from npm;
 *   3. the stand-in path end to end (`OBJECTSTACK_ROOT`), over a throwaway
 *      objectstack-shaped workspace packed by the real `pnpm pack` — the input
 *      objectstack#24306 consumes. No network: nothing is fetched or installed.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  CACHE_DIR,
  OVERRIDE_PREFIX,
  PinRefusal,
  RECIPE,
  STAMP_FILE,
  build,
  checkOverrideSet,
  checkoutPin,
  declaredObjectstackNames,
  dependencyDrift,
  entryTargets,
  hashTree,
  judgeStamp,
  lockfileDependencyNames,
  objectstackEnv,
  annotation,
  tailLines,
  readOverrides,
  readPin,
  readWorkspace,
  runtimeClosure,
  workspaceGlobs,
} from '../objectstack-pin.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SHA = '0123456789abcdef0123456789abcdef01234567';

// Anchored on the OS temp directory at module scope, so no path below can be
// read as relative to the process cwd (`pnpm check:test-path-roots`).
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'objectstack-pin-test-'));
afterAll(() => {
  fs.rmSync(scratch, { recursive: true, force: true });
});

function writeJson(file: string, value: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`);
}

const override = (dir: string) => `${OVERRIDE_PREFIX}${dir}`;

describe('the contract readers (objectui#12957)', () => {
  it('readPin takes one full sha with or without a trailing newline, and refuses anything else', () => {
    const dir = fs.mkdtempSync(path.join(scratch, 'pin-'));
    const pinFile = path.join(dir, '.objectstack-sha');
    fs.writeFileSync(pinFile, `${SHA}\n`);
    expect(readPin(dir)).toBe(SHA);
    fs.writeFileSync(pinFile, SHA);
    expect(readPin(dir)).toBe(SHA);
    for (const bad of [`${SHA.slice(0, 12)}\n`, `${SHA}\n\n`, `${SHA.toUpperCase()}\n`, ` ${SHA}\n`, '']) {
      fs.writeFileSync(pinFile, bad);
      expect(() => readPin(dir), JSON.stringify(bad)).toThrow(PinRefusal);
    }
    fs.rmSync(pinFile);
    expect(() => readPin(dir)).toThrow(/is missing/);
  });

  it('readOverrides accepts only the pinned-build form for @objectstack/* and ignores other overrides', () => {
    const ok = readOverrides({ pnpm: { overrides: { react: '19.2.8', '@objectstack/spec': override('spec') } } });
    expect([...ok]).toEqual([['@objectstack/spec', 'spec']]);
    expect(() => readOverrides({ pnpm: { overrides: { '@objectstack/spec': '^18.0.0-next.3' } } })).toThrow(/must be "file:node_modules\/\.cache\/objectstack\/spec"/);
    expect(() => readOverrides({ pnpm: { overrides: { '@objectstack/spec': override('core') } } })).toThrow(PinRefusal);
    expect(() => readOverrides({ pnpm: { overrides: { '@objectstack/spec@<18': override('spec') } } })).toThrow(/no version selector/);
    expect(() => readOverrides({ pnpm: { overrides: { react: '19.2.8' } } })).toThrow(/no @objectstack\/\* override/);
  });

  it('workspaceGlobs reads the packages list only, through quotes and comments', () => {
    const yaml = "packages:\n  - 'packages/*'\n  - \"apps/*\"   # apps\n  - docs\n\nonlyBuiltDependencies:\n  - esbuild\n";
    expect(workspaceGlobs(yaml)).toEqual(['packages/*', 'apps/*', 'docs']);
  });

  it('declaredObjectstackNames reads every dependency field, and nothing outside the scope', () => {
    const names = declaredObjectstackNames([
      { manifest: { dependencies: { '@objectstack/spec': '^1', react: '1' } } },
      { manifest: { devDependencies: { '@objectstack/lint': '^1' }, peerDependencies: { '@objectstack/client': '^1' } } },
      { manifest: { optionalDependencies: { '@objectstack/formula': '^1' } } },
    ]);
    expect([...names].sort()).toEqual(['@objectstack/client', '@objectstack/formula', '@objectstack/lint', '@objectstack/spec']);
  });

  it('runtimeClosure follows runtime edges and NOT devDependencies', () => {
    const p = (deps: Record<string, string>, dev: Record<string, string> = {}) => ({ dir: 'x', manifest: { dependencies: deps, devDependencies: dev } });
    const byName = new Map<string, ReturnType<typeof p>>([
      ['@objectstack/spec', p({ zod: '^4' })],
      ['@objectstack/types', p({ '@objectstack/spec': 'workspace:*' })],
      ['@objectstack/core', p({ '@objectstack/spec': 'workspace:*', '@objectstack/types': 'workspace:*' }, { '@objectstack/runtime': 'workspace:*' })],
      ['@objectstack/client', p({ '@objectstack/core': 'workspace:*' })],
      ['@objectstack/runtime', p({})],
    ]);
    expect([...runtimeClosure(byName, ['@objectstack/client'])].sort()).toEqual([
      '@objectstack/client',
      '@objectstack/core',
      '@objectstack/spec',
      '@objectstack/types',
    ]);
    expect(() => runtimeClosure(byName, ['@objectstack/nope'])).toThrow(/not a package of the objectstack workspace/);
  });

  it('checkOverrideSet requires the overrides to EQUAL the closure of what objectui declares', () => {
    const byName = new Map([
      ['@objectstack/spec', { dir: 'packages/spec', manifest: {} }],
      ['@objectstack/types', { dir: 'packages/types', manifest: { dependencies: { '@objectstack/spec': 'workspace:*' } } }],
      ['@objectstack/core', { dir: 'packages/core', manifest: { dependencies: { '@objectstack/types': 'workspace:*' } } }],
    ]);
    const all = new Map([['@objectstack/spec', 'spec'], ['@objectstack/types', 'types'], ['@objectstack/core', 'core']]);
    expect(checkOverrideSet({ overrides: all, declared: new Set(['@objectstack/core']), byName })).toEqual([
      '@objectstack/core',
      '@objectstack/spec',
      '@objectstack/types',
    ]);
    // A declared package with no override would resolve from npm.
    expect(() =>
      checkOverrideSet({ overrides: new Map([['@objectstack/spec', 'spec']]), declared: new Set(['@objectstack/core']), byName }),
    ).toThrow(/declares @objectstack\/core but the root package\.json does not override it/);
    // A package the closure needs with no override would resolve from npm.
    expect(() =>
      checkOverrideSet({ overrides: new Map([['@objectstack/core', 'core'], ['@objectstack/spec', 'spec']]), declared: new Set(['@objectstack/core']), byName }),
    ).toThrow(/need @objectstack\/types at this objectstack commit/);
    // An override nothing reaches is refused too.
    expect(() =>
      checkOverrideSet({ overrides: all, declared: new Set(['@objectstack/spec']), byName }),
    ).toThrow(/names @objectstack\/core, @objectstack\/types, which nothing objectui uses reaches/);
  });

  it('entryTargets collects main/module/types and every non-pattern exports leaf', () => {
    expect(
      entryTargets({
        main: './dist/index.cjs',
        types: 'dist/index.d.ts',
        exports: {
          '.': { types: './dist/index.d.ts', import: './dist/index.mjs', require: './dist/index.cjs' },
          './openapi.json': './json-schema/openapi.json',
          './*': './dist/*.mjs',
        },
      }),
    ).toEqual(['dist/index.cjs', 'dist/index.d.ts', 'dist/index.mjs', 'json-schema/openapi.json']);
  });

  it('judgeStamp trusts a cache only when it is the pin, this recipe, and these packages', () => {
    const root = fs.mkdtempSync(path.join(scratch, 'stamp-'));
    writeJson(path.join(root, CACHE_DIR, 'spec/package.json'), { name: '@objectstack/spec' });
    const overrides = new Map([['@objectstack/spec', 'spec']]);
    const good = { recipe: RECIPE, source: 'pin', sha: SHA, packages: { '@objectstack/spec': '1.0.0' } };
    expect(judgeStamp(good, { pin: SHA, overrides, root }).current).toBe(true);
    expect(judgeStamp(null, { pin: SHA, overrides, root }).current).toBe(false);
    expect(judgeStamp({ ...good, sha: 'f'.repeat(40) }, { pin: SHA, overrides, root }).why).toMatch(/the pin is 0123456789ab/);
    expect(judgeStamp({ ...good, recipe: RECIPE + 1 }, { pin: SHA, overrides, root }).current).toBe(false);
    expect(judgeStamp({ ...good, source: 'external', root: '/x' }, { pin: SHA, overrides, root }).why).toMatch(/stand-in/);
    expect(judgeStamp(good, { pin: SHA, overrides: new Map([...overrides, ['@objectstack/core', 'core']]), root }).current).toBe(false);
    fs.rmSync(path.join(root, CACHE_DIR, 'spec'), { recursive: true });
    expect(judgeStamp(good, { pin: SHA, overrides, root }).why).toMatch(/does not hold @objectstack\/spec/);
  });

  it('hashTree moves with any byte and ignores the stamp itself', () => {
    const dir = fs.mkdtempSync(path.join(scratch, 'hash-'));
    fs.mkdirSync(path.join(dir, 'spec/dist'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'spec/dist/index.mjs'), 'a');
    const first = hashTree(dir);
    fs.writeFileSync(path.join(dir, STAMP_FILE), '{}');
    expect(hashTree(dir)).toBe(first);
    fs.writeFileSync(path.join(dir, 'spec/dist/index.mjs'), 'b');
    expect(hashTree(dir)).not.toBe(first);
  });
});

describe('the lockfile must record what the build declares (objectui#12957)', () => {
  // A frozen install links a directory dependency's files but resolves its
  // dependencies from the lockfile alone — measured: a manifest given a dependency
  // the lockfile lacks installed with exit 0 and without it.
  const LOCK = [
    'lockfileVersion: \'9.0\'',
    '',
    'snapshots:',
    '',
    "  '@objectstack/core@file:node_modules/.cache/objectstack/core(ai@7.0.65(zod@4.6.7))':",
    '    dependencies:',
    "      '@objectstack/spec': file:node_modules/.cache/objectstack/spec(ai@7.0.65(zod@4.6.7))",
    '      zod: 4.6.7',
    '    transitivePeerDependencies:',
    '      - ai',
    '',
    "  '@objectstack/spec@file:node_modules/.cache/objectstack/spec(ai@7.0.65(zod@4.6.7))':",
    '    dependencies:',
    '      zod: 4.6.7',
    '    optionalDependencies:',
    '      ai: 7.0.65(zod@4.6.7)',
    '',
    "  '@objectstack/sdui-parser@file:node_modules/.cache/objectstack/sdui-parser': {}",
    '',
    '  zod@4.6.7: {}',
    '',
  ].join('\n');

  it('reads the recorded names per pinned-build package, and nothing else', () => {
    const recorded = lockfileDependencyNames(LOCK);
    expect([...recorded.keys()].sort()).toEqual(['@objectstack/core', '@objectstack/sdui-parser', '@objectstack/spec']);
    expect([...recorded.get('@objectstack/core')!].sort()).toEqual(['@objectstack/spec', 'zod']);
    expect([...recorded.get('@objectstack/spec')!].sort()).toEqual(['ai', 'zod']);
    expect(recorded.get('@objectstack/sdui-parser')!.size).toBe(0);
  });

  it('agrees with manifests that declare what it records — a peer the lockfile installs included', () => {
    const manifests = new Map<string, Record<string, unknown>>([
      ['@objectstack/core', { dependencies: { '@objectstack/spec': '18.0.0', zod: '^4.6.5' } }],
      ['@objectstack/spec', { dependencies: { zod: '^4.6.5' }, peerDependencies: { ai: '^7.0.0' } }],
      ['@objectstack/sdui-parser', {}],
    ]);
    expect(dependencyDrift(lockfileDependencyNames(LOCK), manifests)).toEqual([]);
  });

  it('names a dependency the lockfile lacks, one it records that nothing declares, and a package it has no entry for', () => {
    const manifests = new Map<string, Record<string, unknown>>([
      ['@objectstack/core', { dependencies: { '@objectstack/spec': '18.0.0', zod: '^4.6.5', 'left-pad': '^1.3.0' } }],
      ['@objectstack/spec', { peerDependencies: { ai: '^7.0.0' } }],
      ['@objectstack/types', { dependencies: { '@objectstack/spec': '18.0.0' } }],
    ]);
    expect(dependencyDrift(lockfileDependencyNames(LOCK), manifests)).toEqual([
      { name: '@objectstack/core', missing: ['left-pad'], extra: [], absent: false },
      { name: '@objectstack/spec', missing: [], extra: ['zod'], absent: false },
      { name: '@objectstack/types', missing: ['@objectstack/spec'], extra: [], absent: true },
    ]);
  });
});

describe('the objectstack tree is configured by its own .npmrc (objectui#12957)', () => {
  it('drops this repository\'s npm_config_* settings and keeps the machine\'s network ones', () => {
    const env = objectstackEnv({
      PATH: '/bin',
      npm_config_engine_strict: 'true',
      npm_config_auto_install_peers: 'true',
      npm_config_https_proxy: 'http://proxy',
      npm_config_noproxy: 'localhost',
      npm_config_registry: 'https://registry.npmjs.org/',
      HTTPS_PROXY: 'http://proxy',
    });
    expect(Object.keys(env).sort()).toEqual(['HTTPS_PROXY', 'PATH', 'npm_config_https_proxy', 'npm_config_noproxy', 'npm_config_registry']);
  });
});

describe('a refusal reaches the checks API (objectui#12957)', () => {
  it('encodes a multi-line refusal as one GitHub error annotation', () => {
    expect(annotation('a 100% fail\nline two\r')).toBe('::error title=objectstack-pin::a 100%25 fail%0Aline two%0D');
  });

  it('keeps the last lines of a command\'s output', () => {
    expect(tailLines('1\n2\n3\n4\n', 2)).toBe('3\n4');
  });
});

describe('the pinned checkout is hermetic (objectui#12957)', () => {
  it('fetches exactly the pinned commit and then drops the remote, so no build script can read a moving main', () => {
    const git = (cwd: string, ...args: string[]) => {
      const r = spawnSync('git', args, {
        cwd,
        encoding: 'utf8',
        env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_NOSYSTEM: '1', GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@example.invalid', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@example.invalid' },
      });
      if (r.status !== 0) throw new Error(`git ${args.join(' ')}: ${r.stderr}`);
      return r.stdout.trim();
    };
    const upstream = path.join(scratch, 'hermetic-upstream');
    fs.mkdirSync(upstream, { recursive: true });
    git(upstream, 'init', '-q', '-b', 'main');
    git(upstream, 'config', 'uploadpack.allowAnySHA1InWant', 'true');
    fs.writeFileSync(path.join(upstream, 'a.txt'), 'pinned\n');
    git(upstream, 'add', '.');
    git(upstream, 'commit', '-qm', 'pinned');
    const pinned = git(upstream, 'rev-parse', 'HEAD');
    fs.writeFileSync(path.join(upstream, 'a.txt'), 'later on main\n');
    git(upstream, 'commit', '-qam', 'later');

    const dir = path.join(scratch, 'hermetic-checkout');
    checkoutPin(dir, pinned, `file://${upstream}`, path.join(scratch, 'hermetic-fetch.log'));
    expect(git(dir, 'rev-parse', 'HEAD')).toBe(pinned);
    expect(fs.readFileSync(path.join(dir, 'a.txt'), 'utf8')).toBe('pinned\n');
    expect(git(dir, 'remote')).toBe('');
  });
});

describe('the real tree (objectui#12957)', () => {
  it('overrides every @objectstack/* package the workspace declares, so none resolves from npm', () => {
    const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
    const overrides = readOverrides(manifest);
    const declared = declaredObjectstackNames(readWorkspace(repoRoot));
    expect(declared.size, 'the workspace scan found no @objectstack/* declaration at all').toBeGreaterThan(0);
    expect([...declared].filter((n) => !overrides.has(n))).toEqual([]);
  });

  it('pins one full objectstack sha', () => {
    expect(readPin(repoRoot)).toMatch(/^[0-9a-f]{40}$/);
  });
});

describe('OBJECTSTACK_ROOT stands an existing tree in (objectui#12957, objectstack#24306)', () => {
  /** A minimal objectstack-shaped workspace: spec, and core depending on it by workspace protocol. */
  function makeObjectstack(name: string, { built = true } = {}) {
    const tree = path.join(scratch, name, 'objectstack');
    writeJson(path.join(tree, 'package.json'), { name: 'fake-objectstack-root', private: true });
    fs.writeFileSync(path.join(tree, 'pnpm-workspace.yaml'), "packages:\n  - 'packages/*'\n");
    writeJson(path.join(tree, 'packages/spec/package.json'), {
      name: '@objectstack/spec',
      version: '9.9.9-test.1',
      files: ['dist'],
      exports: { '.': { types: './dist/index.d.ts', import: './dist/index.mjs' } },
      dependencies: { zod: '^4.0.0' },
    });
    writeJson(path.join(tree, 'packages/core/package.json'), {
      name: '@objectstack/core',
      version: '9.9.9-test.1',
      files: ['dist'],
      exports: { '.': { import: './dist/index.mjs' } },
      dependencies: { '@objectstack/spec': 'workspace:*' },
    });
    // What `pnpm install` leaves behind: core's workspace link to spec. `pnpm pack`
    // reads the linked version to rewrite `workspace:*`, so a stand-in tree is an
    // INSTALLED tree (ERR_PNPM_CANNOT_RESOLVE_WORKSPACE_PROTOCOL without it).
    fs.mkdirSync(path.join(tree, 'packages/core/node_modules/@objectstack'), { recursive: true });
    fs.symlinkSync('../../../spec', path.join(tree, 'packages/core/node_modules/@objectstack/spec'));
    if (built) {
      for (const pkg of ['spec', 'core']) {
        fs.mkdirSync(path.join(tree, 'packages', pkg, 'dist'), { recursive: true });
        fs.writeFileSync(path.join(tree, 'packages', pkg, 'dist/index.mjs'), `export const name = '${pkg}';\n`);
      }
      fs.writeFileSync(path.join(tree, 'packages/spec/dist/index.d.ts'), 'export declare const name: string;\n');
    }
    return tree;
  }

  function makeObjectui(name: string) {
    const root = path.join(scratch, name, 'objectui');
    writeJson(path.join(root, 'package.json'), {
      name: 'fake-objectui',
      private: true,
      dependencies: { '@objectstack/core': '^9.0.0' },
      pnpm: { overrides: { '@objectstack/core': override('core'), '@objectstack/spec': override('spec') } },
    });
    fs.writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages: []\n');
    fs.writeFileSync(path.join(root, '.objectstack-sha'), `${SHA}\n`);
    // What `pnpm install` records for the two packages above.
    fs.writeFileSync(
      path.join(root, 'pnpm-lock.yaml'),
      [
        'snapshots:',
        "  '@objectstack/core@file:node_modules/.cache/objectstack/core':",
        '    dependencies:',
        "      '@objectstack/spec': file:node_modules/.cache/objectstack/spec",
        "  '@objectstack/spec@file:node_modules/.cache/objectstack/spec':",
        '    dependencies:',
        '      zod: 4.6.7',
        '',
      ].join('\n'),
    );
    return root;
  }

  it('packs the tree into the pinned-build directories, publish-shaped, and stamps it as a stand-in', () => {
    const tree = makeObjectstack('stand-in');
    const root = makeObjectui('stand-in');
    const result = build({ root, env: { ...process.env, OBJECTSTACK_ROOT: tree } });
    expect(result.skipped).toBe(false);
    const cache = path.join(root, CACHE_DIR);
    const core = JSON.parse(fs.readFileSync(path.join(cache, 'core/package.json'), 'utf8'));
    expect(core.dependencies['@objectstack/spec'], 'pnpm pack rewrote the workspace protocol').toBe('9.9.9-test.1');
    expect(fs.readFileSync(path.join(cache, 'spec/dist/index.mjs'), 'utf8')).toContain("'spec'");
    const stamp = JSON.parse(fs.readFileSync(path.join(cache, STAMP_FILE), 'utf8'));
    expect(stamp).toMatchObject({ recipe: RECIPE, source: 'external', root: tree, packages: { '@objectstack/core': '9.9.9-test.1', '@objectstack/spec': '9.9.9-test.1' } });
    expect(stamp.contentHash).toMatch(/^sha256-[0-9a-f]{64}$/);
    // Nothing was written into the stand-in tree.
    expect(fs.readdirSync(path.join(tree, 'packages/spec')).sort()).toEqual(['dist', 'package.json']);
    expect(fs.readdirSync(path.join(tree, 'packages/core')).sort()).toEqual(['dist', 'node_modules', 'package.json']);
    // A stand-in is never mistaken for the pin.
    expect(judgeStamp(stamp, { pin: SHA, overrides: readOverrides(JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))), root }).current).toBe(false);
  });

  it('REFUSES an unbuilt tree, names the command that builds it, and keeps the previous cache', () => {
    const builtTree = makeObjectstack('unbuilt-control');
    const root = makeObjectui('unbuilt');
    build({ root, env: { ...process.env, OBJECTSTACK_ROOT: builtTree } });
    const before = fs.readFileSync(path.join(root, CACHE_DIR, STAMP_FILE), 'utf8');
    const tree = makeObjectstack('unbuilt', { built: false });
    expect(() => build({ root, env: { ...process.env, OBJECTSTACK_ROOT: tree } })).toThrow(
      /@objectstack\/core is not built in .*dist\/index\.mjs.*pnpm --filter-prod @objectstack\/core\.\.\. --filter-prod @objectstack\/spec\.\.\. run build/s,
    );
    expect(fs.readFileSync(path.join(root, CACHE_DIR, STAMP_FILE), 'utf8')).toBe(before);
    expect(fs.readdirSync(path.dirname(path.join(root, CACHE_DIR))).filter((n) => n.includes('staging'))).toEqual([]);
  });

  it('REFUSES, after the write, a tree whose packages declare dependencies the lockfile does not record', () => {
    const tree = makeObjectstack('drift');
    const specPath = path.join(tree, 'packages/spec/package.json');
    const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    spec.dependencies['left-pad'] = '^1.3.0';
    writeJson(specPath, spec);
    const root = makeObjectui('drift');
    expect(() => build({ root, env: { ...process.env, OBJECTSTACK_ROOT: tree } })).toThrow(
      /@objectstack\/spec: declares left-pad, which the lockfile does not record;.*run `pnpm install`/s,
    );
    // The build stays in place: the remedy reads it.
    expect(JSON.parse(fs.readFileSync(path.join(root, CACHE_DIR, 'spec/package.json'), 'utf8')).dependencies['left-pad']).toBe('^1.3.0');
  });

  it('REFUSES a tree whose packages need an @objectstack/* package with no override', () => {
    const tree = makeObjectstack('needs-more');
    writeJson(path.join(tree, 'packages/types/package.json'), { name: '@objectstack/types', version: '9.9.9-test.1' });
    const corePath = path.join(tree, 'packages/core/package.json');
    const core = JSON.parse(fs.readFileSync(corePath, 'utf8'));
    core.dependencies['@objectstack/types'] = 'workspace:*';
    writeJson(corePath, core);
    const root = makeObjectui('needs-more');
    expect(() => build({ root, env: { ...process.env, OBJECTSTACK_ROOT: tree } })).toThrow(/need @objectstack\/types/);
    expect(fs.existsSync(path.join(root, CACHE_DIR))).toBe(false);
  });

  it('is what `pnpm pack` publishes: the pnpm on PATH answers', () => {
    // The stand-in cases above are only meaningful if they reached the real packer.
    const r = spawnSync('pnpm', ['--version'], { encoding: 'utf8' });
    expect(r.status).toBe(0);
  });
});

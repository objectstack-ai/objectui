#!/usr/bin/env node
/**
 * objectstack-pin -- objectui consumes `@objectstack/*` BY COMMIT, not by npm
 * version (ruling B on objectui#12955, executed by objectui#12957).
 *
 *   node scripts/objectstack-pin.mjs build    # `pnpm objectstack:build`; `pnpm run setup` = this, then a frozen install
 *   node scripts/objectstack-pin.mjs status   # what the cache holds, against the pin (exit 0 = built at the pin)
 *   OBJECTSTACK_ROOT=../objectstack node scripts/objectstack-pin.mjs build   # an existing tree stands in
 *
 * ## The contract
 *
 * `.objectstack-sha` names one objectstack `main` commit (`scripts/bump-objectstack.sh`
 * moves it). The root `package.json` overrides EVERY `@objectstack/*` package the
 * workspace resolves to a directory:
 *
 *     "@objectstack/spec": "file:node_modules/.cache/objectstack/spec"
 *
 * and `build` fills each such directory with that package exactly as `pnpm pack`
 * would publish it -- built from the pinned commit's source. So no `@objectstack/*`
 * package resolves from npm; npm ranges in the manifests matter only when objectui
 * itself publishes (objectui#12958).
 *
 * ## Why `file:` DIRECTORIES -- the resolution form, measured on objectui#12957
 *
 * Three forms were installed against the same pinned build, pnpm 10.31.0:
 *
 *   - `file:<pkg>.tgz` tarballs: the lockfile records each tarball's `integrity`
 *     and `version`, and a frozen install on a clean checkout failed with
 *     ERR_PNPM_TARBALL_INTEGRITY -- for a substituted tree AND for the same tree.
 *     A tarball pins its BYTES into `pnpm-lock.yaml`, so no other tree can stand in.
 *   - `link:<dir>`: the lockfile stays stable, but pnpm installs nothing a linked
 *     package depends on. Importing the packed `@objectstack/spec` failed with
 *     `Cannot find package 'zod'`; linking a source tree instead brings that tree's
 *     own zod, a second physical copy -- the objectstack#21108 split.
 *   - `file:<dir>`: the lockfile records `resolution: {directory: …, type: directory}`
 *     with NO integrity and NO version, and the package's dependencies resolve from
 *     objectui's own lockfile (one zod). A frozen install re-links a directory whose
 *     content changed (a marker written into a rebuilt dir reached `node_modules`).
 *
 * So the lockfile depends only on the packed manifests' dependencies, peers and
 * engines -- which is what lets another tree stand in without a lockfile change.
 *
 * Why under `node_modules/.cache/`: every tool here already ignores `node_modules`
 * (git, ESLint's `**\/node_modules`, vitest, tsc, turbo's inputs), so a packed
 * objectstack tree there is invisible to every gate that walks the checkout. The
 * cost: removing `node_modules` removes the build too, and the next install fails
 * with ENOENT on that directory until `pnpm run setup` runs again.
 *
 * ## OBJECTSTACK_ROOT -- an existing objectstack tree stands in (objectstack#24306)
 *
 * With `OBJECTSTACK_ROOT` set, `build` packs the same packages from THAT tree into
 * the same directories, instead of building the pin. Nothing in it is installed,
 * built or regenerated (`pnpm pack` runs with scripts off): the tree must already be
 * built, and a missing entry point refuses with the command that builds it. The
 * lockfile does not change; a frozen install stays valid as long as that tree's
 * packages declare the dependencies the lockfile records -- when they do not, the
 * frozen install fails and names the mismatch.
 *
 * ## Refusals (exit 1, nothing written)
 *
 *   - `.objectstack-sha` is not one full sha;
 *   - an `@objectstack/*` override is not the `file:node_modules/.cache/objectstack/<name>`
 *     form, or a package objectui declares has no override (it would resolve from npm);
 *   - the packages being packed need an `@objectstack/*` package with no override, or
 *     an override names a package nothing reaches -- the override set must equal the
 *     closure, so a pin that adds a dependency is a loud stop, never an npm fallback;
 *   - a packed package's `main`/`module`/`types`/`exports` target is missing.
 *
 * Every write goes to a staging directory that replaces the cache only once all
 * packages packed, so a failed run leaves the previous build in place.
 *
 * ⛔ Node builtins only: CI runs this BEFORE `pnpm install`
 * (`scripts/check-pre-install-import-graph.mjs` holds that).
 */

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isEntrypoint } from './invoked-as.mjs';

export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const PIN_FILE = '.objectstack-sha';
export const CACHE_DIR = 'node_modules/.cache/objectstack';
export const STAMP_FILE = '.stamp.json';
export const OVERRIDE_PREFIX = `file:${CACHE_DIR}/`;
/** Bump when what `build` writes changes shape, so an older cache is rebuilt rather than trusted. */
export const RECIPE = 1;
export const DEFAULT_REPO_URL = 'https://github.com/objectstack-ai/objectstack.git';

const SCOPE = '@objectstack/';
const SHA_RE = /^[0-9a-f]{40}$/;
const NAME_RE = /^@objectstack\/[a-z0-9][a-z0-9-]*$/;
const PROD_FIELDS = ['dependencies', 'optionalDependencies', 'peerDependencies'];
const ALL_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

/** A refusal: printed as-is, exit 1. Anything else that throws is a crash. */
export class PinRefusal extends Error {}

// ── reading the contract ────────────────────────────────────────────────────

/**
 * The pinned sha. The file holds one full lowercase sha and, optionally, one
 * trailing newline -- nothing else, so a half-written or hand-mangled pin refuses.
 *
 * @param {string} root
 * @returns {string}
 */
export function readPin(root) {
  let text;
  try {
    text = fs.readFileSync(path.join(root, PIN_FILE), 'utf8');
  } catch {
    throw new PinRefusal(`${PIN_FILE} is missing at ${root}. It names the objectstack commit this workspace builds; scripts/bump-objectstack.sh writes it.`);
  }
  const sha = text.endsWith('\n') ? text.slice(0, -1) : text;
  if (!SHA_RE.test(sha)) {
    throw new PinRefusal(`${PIN_FILE} must hold exactly one full 40-character lowercase sha; it holds ${JSON.stringify(text.slice(0, 80))}.`);
  }
  return sha;
}

/**
 * The `@objectstack/*` overrides of the root manifest, as name -> cache directory.
 * Every one must be the pinned-build form; anything else would resolve some
 * `@objectstack/*` package from somewhere other than the pin.
 *
 * @param {{ pnpm?: { overrides?: Record<string, string> } }} manifest
 * @returns {Map<string, string>}
 */
export function readOverrides(manifest) {
  const overrides = manifest?.pnpm?.overrides ?? {};
  const map = new Map();
  for (const [key, value] of Object.entries(overrides)) {
    if (!key.startsWith(SCOPE)) continue;
    if (!NAME_RE.test(key)) {
      throw new PinRefusal(`pnpm.overrides key ${JSON.stringify(key)} is not a bare @objectstack/* package name; under the pin every @objectstack/* package is overridden whole, with no version selector.`);
    }
    const dir = key.slice(SCOPE.length);
    const expected = `${OVERRIDE_PREFIX}${dir}`;
    if (value !== expected) {
      throw new PinRefusal(`pnpm.overrides["${key}"] is ${JSON.stringify(value)}; under the pin it must be "${expected}".`);
    }
    map.set(key, dir);
  }
  if (map.size === 0) {
    throw new PinRefusal(`the root package.json declares no @objectstack/* override, so nothing would resolve to the pinned build.`);
  }
  return map;
}

/**
 * The `packages:` globs of a `pnpm-workspace.yaml`. Deliberately not a YAML
 * parser (this runs before install): it reads the one list it needs and refuses
 * a glob shape it does not understand rather than silently skipping it.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function workspaceGlobs(text) {
  const globs = [];
  let inPackages = false;
  for (const raw of text.split('\n')) {
    const line = raw.replace(/\s+#.*$/, '').replace(/^#.*$/, '');
    if (/^packages:\s*$/.test(line)) {
      inPackages = true;
      continue;
    }
    if (!inPackages || line.trim() === '') continue;
    const item = line.match(/^\s+-\s+(['"]?)(.+?)\1\s*$/);
    if (item) {
      globs.push(item[2]);
      continue;
    }
    if (/^\S/.test(line)) inPackages = false;
  }
  return globs;
}

/**
 * Every workspace project of a pnpm workspace, the root included, as
 * `{ dir, manifest }` with `dir` relative to `root`. Supports the two glob shapes
 * both repositories use -- `a/b` and `a/*` -- and refuses any other.
 *
 * @param {string} root
 * @returns {Array<{ dir: string, manifest: Record<string, any> }>}
 */
export function readWorkspace(root) {
  const yamlPath = path.join(root, 'pnpm-workspace.yaml');
  if (!fs.existsSync(yamlPath)) throw new PinRefusal(`${root} has no pnpm-workspace.yaml, so it is not a pnpm workspace.`);
  const projects = [{ dir: '.', manifest: readJson(path.join(root, 'package.json')) }];
  for (const glob of workspaceGlobs(fs.readFileSync(yamlPath, 'utf8'))) {
    if (glob.startsWith('!')) throw new PinRefusal(`unsupported workspace glob ${JSON.stringify(glob)} in ${yamlPath} (negations are not read here).`);
    const star = glob.endsWith('/*');
    const base = star ? glob.slice(0, -2) : glob;
    if (/[*?[\]{}]/.test(base)) throw new PinRefusal(`unsupported workspace glob ${JSON.stringify(glob)} in ${yamlPath}; only "dir" and "dir/*" are read here.`);
    const dirs = star
      ? safeReaddir(path.join(root, base)).map((name) => path.posix.join(base, name))
      : [base];
    for (const dir of dirs) {
      const manifestPath = path.join(root, dir, 'package.json');
      if (fs.existsSync(manifestPath)) projects.push({ dir, manifest: readJson(manifestPath) });
    }
  }
  return projects;
}

/**
 * Every `@objectstack/*` name the given projects declare, in any dependency field.
 *
 * @param {Array<{ manifest: Record<string, any> }>} projects
 * @returns {Set<string>}
 */
export function declaredObjectstackNames(projects) {
  const names = new Set();
  for (const { manifest } of projects) {
    for (const field of ALL_FIELDS) {
      for (const name of Object.keys(manifest[field] ?? {})) if (name.startsWith(SCOPE)) names.add(name);
    }
  }
  return names;
}

/**
 * The `@objectstack/*` closure of `roots` inside an objectstack workspace, over
 * RUNTIME edges only (dependencies, optional, peer) -- what an installer of the
 * published packages receives. devDependencies are excluded on purpose: they pull
 * in the drivers, runtime and services a package's own tests use (measured at the
 * first pin: 36 projects with them, 7 without).
 *
 * @param {Map<string, { dir: string, manifest: Record<string, any> }>} byName
 * @param {Iterable<string>} roots
 * @returns {Set<string>}
 */
export function runtimeClosure(byName, roots) {
  const seen = new Set();
  const queue = [...roots];
  while (queue.length) {
    const name = queue.shift();
    if (seen.has(name)) continue;
    const project = byName.get(name);
    if (!project) throw new PinRefusal(`${name} is not a package of the objectstack workspace being built, so it cannot come from the pin.`);
    seen.add(name);
    for (const field of PROD_FIELDS) {
      for (const dep of Object.keys(project.manifest[field] ?? {})) if (dep.startsWith(SCOPE)) queue.push(dep);
    }
  }
  return seen;
}

/**
 * The override set must equal what objectui needs from the pin -- exactly.
 *
 * @param {{ overrides: Map<string, string>, declared: Set<string>, byName: Map<string, any> }} input
 * @returns {string[]} the packages to pack, sorted
 */
export function checkOverrideSet({ overrides, declared, byName }) {
  const missing = [...declared].filter((n) => !overrides.has(n)).sort();
  if (missing.length) {
    throw new PinRefusal(
      `objectui declares ${missing.join(', ')} but the root package.json does not override ${missing.length === 1 ? 'it' : 'them'}, ` +
        `so ${missing.length === 1 ? 'it' : 'they'} would resolve from npm. Add ` +
        missing.map((n) => `"${n}": "${OVERRIDE_PREFIX}${n.slice(SCOPE.length)}"`).join(', ') +
        ' to pnpm.overrides.',
    );
  }
  const needed = runtimeClosure(byName, declared);
  const unoverridden = [...needed].filter((n) => !overrides.has(n)).sort();
  if (unoverridden.length) {
    throw new PinRefusal(
      `the packages objectui uses need ${unoverridden.join(', ')} at this objectstack commit, and the root package.json does not override ` +
        `${unoverridden.length === 1 ? 'it' : 'them'} -- ${unoverridden.length === 1 ? 'it' : 'they'} would resolve from npm. Add ` +
        unoverridden.map((n) => `"${n}": "${OVERRIDE_PREFIX}${n.slice(SCOPE.length)}"`).join(', ') +
        ' to pnpm.overrides.',
    );
  }
  const stale = [...overrides.keys()].filter((n) => !needed.has(n)).sort();
  if (stale.length) {
    throw new PinRefusal(
      `pnpm.overrides names ${stale.join(', ')}, which nothing objectui uses reaches at this objectstack commit. Delete ` +
        `${stale.length === 1 ? 'that override' : 'those overrides'}: a declared override nothing resolves through reads as a dependency that is not there.`,
    );
  }
  return [...needed].sort();
}

/**
 * Every file a manifest's entry fields point at: `main`, `module`, `types`,
 * `typings`, and every string leaf of `exports` that is not a pattern.
 *
 * @param {Record<string, any>} manifest
 * @returns {string[]}
 */
export function entryTargets(manifest) {
  const targets = new Set();
  for (const field of ['main', 'module', 'types', 'typings']) {
    if (typeof manifest[field] === 'string') targets.add(manifest[field]);
  }
  const walk = (node) => {
    if (typeof node === 'string') {
      if (!node.includes('*')) targets.add(node);
    } else if (node && typeof node === 'object') {
      for (const value of Object.values(node)) walk(value);
    }
  };
  walk(manifest.exports);
  return [...targets].map((t) => t.replace(/^\.\//, '')).sort();
}

/**
 * @param {string} dir a packed package directory
 * @returns {string[]} entry targets the directory does not contain
 */
export function missingEntryTargets(dir) {
  const manifest = readJson(path.join(dir, 'package.json'));
  return entryTargets(manifest).filter((t) => !fs.existsSync(path.join(dir, t)));
}

// ── the cache ───────────────────────────────────────────────────────────────

/**
 * @param {string} root
 * @returns {Record<string, any> | null}
 */
export function readStamp(root) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, CACHE_DIR, STAMP_FILE), 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Whether the cache already holds the pin's build of exactly these packages.
 *
 * @param {Record<string, any> | null} stamp
 * @param {{ pin: string, overrides: Map<string, string>, root: string }} want
 * @returns {{ current: boolean, why: string }}
 */
export function judgeStamp(stamp, { pin, overrides, root }) {
  if (!stamp) return { current: false, why: 'no build in the cache' };
  if (stamp.recipe !== RECIPE) return { current: false, why: `the cache was written by recipe ${stamp.recipe}, this script is recipe ${RECIPE}` };
  if (stamp.source !== 'pin') return { current: false, why: `the cache holds a stand-in from ${stamp.root ?? 'an external tree'} (${String(stamp.sha).slice(0, 12)}), not the pin` };
  if (stamp.sha !== pin) return { current: false, why: `the cache holds ${String(stamp.sha).slice(0, 12)}, the pin is ${pin.slice(0, 12)}` };
  const want = [...overrides.keys()].sort();
  const have = Object.keys(stamp.packages ?? {}).sort();
  if (want.join() !== have.join()) return { current: false, why: `the cache holds ${have.join(', ') || 'no package'}, the overrides name ${want.join(', ')}` };
  for (const [name, dir] of overrides) {
    const manifest = path.join(root, CACHE_DIR, dir, 'package.json');
    if (!fs.existsSync(manifest) || readJson(manifest).name !== name) return { current: false, why: `${CACHE_DIR}/${dir} does not hold ${name}` };
  }
  return { current: true, why: `built at the pin ${pin.slice(0, 12)}` };
}

/**
 * A content hash over every file of the packed directories, so a stand-in's stamp
 * changes whenever its bytes do (turbo hashes the stamp; see turbo.json).
 *
 * @param {string} dir
 * @returns {string}
 */
export function hashTree(dir) {
  const hash = crypto.createHash('sha256');
  const walk = (rel) => {
    const abs = path.join(dir, rel);
    for (const entry of fs.readdirSync(abs, { withFileTypes: true }).sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const child = path.posix.join(rel, entry.name);
      if (entry.isDirectory()) walk(child);
      else if (entry.isFile() && child !== STAMP_FILE) {
        hash.update(`${child}\0`);
        hash.update(fs.readFileSync(path.join(dir, child)));
        hash.update('\0');
      }
    }
  };
  walk('');
  return `sha256-${hash.digest('hex')}`;
}

// ── running things ──────────────────────────────────────────────────────────

/**
 * Run a command with inherited output; a non-zero exit is a refusal naming it.
 *
 * @param {string} cmd
 * @param {string[]} args
 * @param {{ cwd: string, capture?: boolean, env?: NodeJS.ProcessEnv }} opts
 * @returns {string} captured stdout (empty unless `capture`)
 */
function run(cmd, args, { cwd, capture = false, env = process.env }) {
  const result = spawnSync(cmd, args, {
    cwd,
    env,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    maxBuffer: 256 * 1024 * 1024,
  });
  if (result.error) throw new PinRefusal(`could not run \`${cmd} ${args.join(' ')}\` in ${cwd}: ${result.error.message}`);
  if (result.status !== 0) throw new PinRefusal(`\`${cmd} ${args.join(' ')}\` exited ${result.status} in ${cwd}.`);
  return capture ? result.stdout : '';
}

function step(label, fn) {
  const started = Date.now();
  console.log(`→ ${label}`);
  const value = fn();
  console.log(`  ${label}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
  return value;
}

/**
 * Fetch exactly the pinned commit into an empty directory.
 *
 * @param {string} dir
 * @param {string} sha
 * @param {string} url
 */
function checkoutPin(dir, sha, url) {
  run('git', ['init', '-q', dir], { cwd: os.tmpdir() });
  run('git', ['remote', 'add', 'origin', url], { cwd: dir });
  run('git', ['fetch', '-q', '--depth=1', '--no-tags', 'origin', sha], { cwd: dir });
  run('git', ['checkout', '-q', '--detach', 'FETCH_HEAD'], { cwd: dir });
  const head = run('git', ['rev-parse', 'HEAD'], { cwd: dir, capture: true }).trim();
  if (head !== sha) throw new PinRefusal(`fetched ${head} from ${url}, but the pin is ${sha}.`);
}

/**
 * `pnpm pack` one workspace package (scripts off, so nothing in the tree is
 * regenerated) and unpack it into `dest`.
 *
 * @param {string} projectDir
 * @param {string} tarballs
 * @param {string} dest
 * @returns {{ name: string, version: string }}
 */
function packInto(projectDir, tarballs, dest) {
  const out = run('pnpm', ['pack', '--json', '--pack-destination', tarballs, '--config.ignore-scripts=true'], { cwd: projectDir, capture: true });
  const json = JSON.parse(out.slice(out.indexOf('{')));
  fs.mkdirSync(dest, { recursive: true });
  run('tar', ['-xzf', json.filename, '-C', dest, '--strip-components=1'], { cwd: projectDir });
  fs.rmSync(json.filename, { force: true });
  return { name: json.name, version: json.version };
}

/**
 * @param {string} tree an objectstack workspace
 * @returns {{ sha: string, dirty: boolean | null }}
 */
function describeTree(tree) {
  const head = spawnSync('git', ['-C', tree, 'rev-parse', 'HEAD'], { encoding: 'utf8' });
  if (head.status !== 0) return { sha: 'unknown', dirty: null };
  const status = spawnSync('git', ['-C', tree, 'status', '--porcelain', '--untracked-files=no'], { encoding: 'utf8' });
  return { sha: head.stdout.trim(), dirty: status.status === 0 ? status.stdout.trim() !== '' : null };
}

/**
 * Build (or stand in) and pack every overridden package into the cache.
 *
 * @param {{ root?: string, env?: NodeJS.ProcessEnv }} [opts]
 * @returns {{ skipped: boolean, stamp: Record<string, any> }}
 */
export function build({ root = REPO_ROOT, env = process.env } = {}) {
  const manifest = readJson(path.join(root, 'package.json'));
  const overrides = readOverrides(manifest);
  const declared = declaredObjectstackNames(readWorkspace(root));
  const external = env.OBJECTSTACK_ROOT ? path.resolve(root, env.OBJECTSTACK_ROOT) : null;
  const pin = readPin(root);

  if (!external) {
    const verdict = judgeStamp(readStamp(root), { pin, overrides, root });
    if (verdict.current) {
      console.log(`✓ ${CACHE_DIR} is ${verdict.why} -- nothing to build.`);
      return { skipped: true, stamp: readStamp(root) };
    }
    console.log(`→ ${CACHE_DIR}: ${verdict.why}. Building @objectstack/* at ${pin}.`);
  } else {
    console.log(`→ OBJECTSTACK_ROOT is set: packing @objectstack/* from ${external}, standing in for the pin ${pin.slice(0, 12)}.`);
  }

  const cacheParent = path.dirname(path.join(root, CACHE_DIR));
  fs.mkdirSync(cacheParent, { recursive: true });
  const staging = fs.mkdtempSync(path.join(cacheParent, 'objectstack.staging-'));
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'objectstack-pin-'));
  try {
    let tree = external;
    if (!external) {
      tree = path.join(scratch, 'objectstack');
      step(`fetch objectstack ${pin.slice(0, 12)}`, () => checkoutPin(tree, pin, env.OBJECTSTACK_REPO_URL || DEFAULT_REPO_URL));
    }
    const projects = readWorkspace(tree);
    /** @type {Map<string, { dir: string, manifest: Record<string, any> }>} */
    const byName = new Map(projects.filter((p) => p.manifest.name).map((p) => [p.manifest.name, p]));
    const names = checkOverrideSet({ overrides, declared, byName });
    const filters = names.flatMap((n) => ['--filter-prod', `${n}...`]);

    if (!external) {
      const rootName = projects[0].manifest.name;
      if (!rootName) throw new PinRefusal(`the objectstack root package.json at ${pin.slice(0, 12)} has no name to select it by.`);
      // The workspace root carries the build toolchain (tsup, tsx); the filters
      // carry the packages and their runtime closure.
      step('install the build closure', () => run('pnpm', ['install', '--frozen-lockfile', '--filter', rootName, ...filters], { cwd: tree, env }));
      step(`build ${names.join(', ')}`, () => run('pnpm', [...filters, 'run', 'build'], { cwd: tree, env }));
    }

    const tarballs = path.join(scratch, 'tarballs');
    fs.mkdirSync(tarballs, { recursive: true });
    const packages = {};
    step(`pack ${names.length} package(s)`, () => {
      for (const name of names) {
        const dest = path.join(staging, overrides.get(name));
        const packed = packInto(path.join(tree, byName.get(name).dir), tarballs, dest);
        if (packed.name !== name) throw new PinRefusal(`packing ${byName.get(name).dir} produced ${packed.name}, not ${name}.`);
        const missing = missingEntryTargets(dest);
        if (missing.length) {
          throw new PinRefusal(
            `${name} is not built in ${tree}: its manifest points at ${missing.join(', ')}, which ${missing.length === 1 ? 'is' : 'are'} not there.` +
              (external
                ? ` Build it in that tree first:\n    (cd ${tree} && pnpm ${filters.join(' ')} run build)`
                : ''),
          );
        }
        packages[name] = packed.version;
      }
    });

    const stamp = external
      ? { recipe: RECIPE, source: 'external', root: external, ...describeTree(external), packages, contentHash: hashTree(staging) }
      : { recipe: RECIPE, source: 'pin', sha: pin, packages };
    fs.writeFileSync(path.join(staging, STAMP_FILE), `${JSON.stringify(stamp, null, 2)}\n`);
    const target = path.join(root, CACHE_DIR);
    fs.rmSync(target, { recursive: true, force: true });
    fs.renameSync(staging, target);
    console.log(
      `✓ ${CACHE_DIR} now holds ${names.join(', ')} ` +
        (external ? `from ${external} (${String(stamp.sha).slice(0, 12)}${stamp.dirty ? ', with uncommitted changes' : ''})` : `built at ${pin.slice(0, 12)}`) +
        '. Run `pnpm install` so node_modules links it.',
    );
    return { skipped: false, stamp };
  } finally {
    fs.rmSync(staging, { recursive: true, force: true });
    fs.rmSync(scratch, { recursive: true, force: true });
  }
}

/**
 * @param {{ root?: string }} [opts]
 * @returns {number} exit code
 */
export function status({ root = REPO_ROOT } = {}) {
  const pin = readPin(root);
  const overrides = readOverrides(readJson(path.join(root, 'package.json')));
  const stamp = readStamp(root);
  const verdict = judgeStamp(stamp, { pin, overrides, root });
  console.log(`pin    ${pin}  (${PIN_FILE})`);
  console.log(`cache  ${stamp ? `${stamp.source} ${stamp.sha}${stamp.root ? ` from ${stamp.root}` : ''}` : 'empty'}  (${CACHE_DIR})`);
  console.log(`${verdict.current ? '✓' : '✗'} ${verdict.why}${verdict.current ? '' : ' -- run `pnpm run setup`'}`);
  return verdict.current ? 0 : 1;
}

// ── helpers ─────────────────────────────────────────────────────────────────

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function safeReaddir(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .sort();
  } catch {
    return [];
  }
}

// ── CLI ─────────────────────────────────────────────────────────────────────

if (isEntrypoint(import.meta.url)) {
  const [command] = process.argv.slice(2);
  try {
    if (command === 'build') {
      build();
      process.exit(0);
    } else if (command === 'status') {
      process.exit(status());
    } else {
      console.error('usage: node scripts/objectstack-pin.mjs build | status');
      process.exit(2);
    }
  } catch (error) {
    if (error instanceof PinRefusal) {
      console.error(`✗ objectstack-pin: ${error.message}`);
      process.exit(1);
    }
    throw error;
  }
}

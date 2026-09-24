#!/usr/bin/env node
// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * spec-main-shape-gate -- compile THIS repository against `@objectstack/spec`
 * built from objectstack `main`, and name the objectui file and the objectstack
 * commit when it does not compile.
 *
 *   node scripts/spec-main-shape-gate.mjs inject --tarball <f.tgz> --sha <sha> --upstream-checkout <dir>
 *   node scripts/spec-main-shape-gate.mjs report  --log <f> --sha <sha> --status <n>
 *   node scripts/spec-main-shape-gate.mjs --self-test      # offline, no install needed
 *
 * Exit: 0 = the step did what it says
 *       1 = the typecheck failed (report mode) -- the diagnostics are attributed
 *       2 = the step COULD NOT BE PERFORMED (nothing to inject, a staged package
 *           that is not the spec, a failure that could not be attributed to a
 *           file). ⛔ Never a pass. A gate that cannot take its reading says so.
 *
 * ## What this is, and the ruling it executes (objectui#9860)
 *
 * The maintainer's ruling of 2026-09-18 chose option C: the ONLY shape gate for
 * `@objectstack/spec`'s public surface is a real consumer compiling against
 * objectstack's current `main`. objectui is the first consumer. The declaration-
 * text snapshot that used to carry that job on the platform side is being
 * reverted there; nothing replaces it except this.
 *
 * ⭐ THE ACCEPTANCE CRITERION IS THE MESSAGE, NOT THE VERDICT. A red that says
 * only "typecheck failed" does not satisfy the ruling: option C's entire value is
 * that the objectstack pull request which moved the shape can be identified from
 * objectui's failure. So `report` pairs every diagnostic with the objectstack
 * commit it was compiled against, and a failure it cannot attribute to a file is
 * exit 2 with that said out loud -- never a bare red, and never a pass.
 *
 * ## Why the injection is into the VIRTUAL STORE, and not any of the obvious places
 *
 * This repository consumes a PUBLISHED `@objectstack/spec` (a caret range in 29
 * manifests, resolved by `pnpm-lock.yaml`). The job must typecheck against a
 * BUILT-FROM-SOURCE one WITHOUT changing what a normal build resolves, and the
 * pin-bump question is explicitly still open with the maintainer -- so the pin,
 * the manifests and the lockfile are all off limits.
 *
 * Three mechanisms were considered and two are structurally unable to do it:
 *
 *  - `OBJECTSTACK_SPEC_DIST` (`scripts/vite-objectstack-spec-dist.ts`) already
 *    resolves `@objectstack/spec` at a locally built spec, and it is the right
 *    hook for the console BUILD -- but it emits Vite `resolve.alias` entries.
 *    `tsc` does not read a Vite config, so a typecheck run under it compiles
 *    against the INSTALLED spec while the bundler compiles against the override:
 *    a green that means nothing. That module's own header states its scope; this
 *    one states why it cannot be reused here.
 *  - A `pnpm.overrides` / `file:` / `link:` entry moves `pnpm-workspace.yaml`,
 *    `package.json` or `pnpm-lock.yaml`. Every one of those is the pin.
 *  - Replacing the installed package IN THE VIRTUAL STORE moves no tracked file
 *    at all. It is post-install runner state, discarded with the runner.
 *
 * `tsc` reaches the spec through `<consumer>/node_modules/@objectstack/spec`,
 * which pnpm makes a symlink into `node_modules/.pnpm/@objectstack+spec@<v>/`.
 * Replacing the contents of that one directory moves every consumer at once --
 * which is also why the verification below asks the CONSUMERS where they landed
 * rather than asking this function what it wrote.
 *
 * ⚠️ THE HARDLINK TRAP, measured on this repository's own install: the files in
 * the virtual store are HARDLINKS into pnpm's global content-addressable store
 * (`stat -c %h` on the installed spec's `package.json` reports a link count well
 * above one). Writing INTO them writes through to the global store and corrupts
 * `@objectstack/spec` for every other checkout on the machine -- and in CI, for
 * whatever `actions/setup-node`'s pnpm cache saves afterwards. So the replacement
 * is REMOVE-THEN-COPY, never copy-over: unlinking a hardlink is local, writing
 * through one is not.
 *
 * ## Why the spec's declared DEPENDENCIES are re-pointed too (objectui#10229)
 *
 * The copy above replaces the spec's own files and nothing else. What those
 * files IMPORT -- `zod` above all -- resolves through the SIBLING links of the
 * same virtual-store entry (`.pnpm/@objectstack+spec@<v>/node_modules/zod`), and
 * those siblings were laid down for the PUBLISHED spec this repository pins.
 * When objectstack `main` raises a dependency floor, the source-built
 * declarations are then read against a dependency OLDER than the one they were
 * emitted against -- a topology no real install produces, because an install of
 * a release from that commit resolves the raised floor from the manifest.
 *
 * Measured, not hypothesised: declarations emitted on a newer zod spell a zod
 * type with an arity the older zod does not declare. `skipLibCheck` hides the
 * error that would name it, the type degrades to an error type, and objectui
 * fails to compile for a reason that exists only inside this job -- reported
 * under this gate's name as a shape break objectstack never made. The gate was
 * reading its own injection.
 *
 * So after the copy, every entry of the PACKED manifest's `dependencies` is
 * judged against the sibling the store entry actually holds:
 *
 *  - a sibling that satisfies the declared range is left exactly as installed;
 *  - one that does not (or is absent) is REMOVED and replaced by a symlink to
 *    the copy the spec's own build resolved in the objectstack checkout
 *    (`--upstream-checkout`: the realpath of `packages/spec/node_modules/<dep>`),
 *    i.e. the dependency the declarations were emitted against. Remove-then-
 *    link, for the hardlink reason above: the sibling is a link to replace,
 *    never a directory to write into;
 *  - when no copy satisfying the range is available, that is exit 2 naming the
 *    dependency, decided BEFORE anything is written. Compiling against an
 *    unsatisfied dependency is a reading of this gate, not of the spec.
 *
 * `peerDependencies` are the consumer's to provide and are not touched. The
 * consumer proof below then asks every consumer which copy of each declared
 * dependency the injected spec resolves, and refuses one outside its range.
 *
 * ## ...and why objectui's OWN copies of a re-pointed dependency follow it
 *
 * Re-pointing the spec's sibling alone leaves TWO copies of that package in one
 * program: the spec's declarations read the new one, while every objectui
 * package that declares it still reads the old one. For zod that was measured
 * on this gate's own flow at a commit that raised the floor: hundreds of
 * diagnostics across dozens of files -- non-portable inferred types, one copy's
 * `ZodType` refused where the other's is expected -- and every one of them an
 * artifact of the two copies, with objectui's code correct. With one copy the
 * same compile was clean. (objectui#10229's pull request carries the figures;
 * none are restated here.)
 *
 * One copy is what an install of a release from that commit gives objectui:
 * the new floor falls inside objectui's own declared range, and objectui's
 * `check:lockfile-dedupe` keeps the lockfile deduped, so a pin bump installs
 * the package once. So for every dependency the spec substitution re-pointed
 * to version V -- and only those -- each objectui workspace importer that
 * declares the same package is judged:
 *
 *  - every range it declares admits V: its `node_modules/<dep>` link is removed
 *    and re-linked to the same V copy (remove-then-link, as above);
 *  - a range does NOT admit V: its copy stays, and the log and run summary say
 *    `two copies of <dep> stay: <importer> declares <range>, which does not
 *    admit <V>`. The diagnostics that follow are then genuine readings: a real
 *    install would carry the same two copies.
 *
 * The importers are enumerated from `pnpm-workspace.yaml`, the file pnpm itself
 * reads, never from a hand-kept list. Like everything else here this is runner
 * state and moves no tracked file. The consumer proof is extended to match:
 * every spec consumer and every admitting importer must resolve ONE copy of
 * each re-pointed package, and the log names which.
 *
 * Satisfaction is judged by `satisfiesRange`, a deliberately narrow reader in
 * this file, for the reason `check-spec-range-floors.mjs` gives for its own:
 * `semver` is not a dependency of this repository's root, and importing a
 * hoisted transitive copy is a phantom dependency. It is not imported from that
 * script because that module loads `typescript`, and `--self-test` here needs
 * no install. Any spelling the reader does not know is exit 2, never a guess.
 *
 * ## Why the injected bytes come from `npm pack` and not from the source tree
 *
 * The subject of this gate is the spec's PUBLISHED surface. `npm pack` produces
 * exactly the file set `packages/spec`'s `files` field would ship, so what
 * objectui compiles against here is what a release from that commit would give
 * it -- not a working tree that also carries sources, tooling and an installed
 * `node_modules`. It also makes the failure mode of a half-built spec loud
 * rather than subtle: a build that skipped declarations produces a tarball whose
 * `exports` types targets are absent, and `inject` refuses it by name instead of
 * letting every consumer fail with TS2307 for a reason nobody can see.
 *
 * ## ⛔ The turbo cache is a FALSE GREEN here, and the workflow must bypass it
 *
 * `turbo`'s `type-check` task is cached, and its hash covers this repository's
 * sources, its lockfile and a declared env list -- it does NOT cover the CONTENT
 * of `node_modules`. An injected spec therefore changes nothing turbo hashes:
 * a second run after an injection can replay the verdict recorded BEFORE it, and
 * a run at a new objectstack sha can replay the verdict from the old one. Both
 * are green answers to a question that was never asked. The workflow runs the
 * typecheck with the cache bypassed for exactly this reason, and
 * `scripts/__tests__/spec-main-shape-gate.test.ts` pins that it keeps doing so.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import { isEntrypoint } from './invoked-as.mjs';

export const SPEC_PACKAGE_NAME = '@objectstack/spec';

/** The upstream this gate compiles against. Used only to build human links. */
export const UPSTREAM_REPO = 'objectstack-ai/objectstack';

/** The marker `inject` leaves inside every replaced copy. */
export const MARKER_FILE = '.spec-main-shape-gate.json';

const repoRootDefault = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The virtual-store directories holding an installed `@objectstack/spec`.
 *
 * pnpm encodes the peer-dependency resolution into the directory name
 * (`@objectstack+spec@17.4.0_ai@...._zod@....`), and one install can materialise
 * more than one of them. Enumerating by PREFIX rather than by a computed name is
 * the difference between moving every consumer and moving the ones whose peer
 * set happened to match a guess.
 */
export function findInstalledSpecDirs(repoRoot = repoRootDefault) {
  const virtualStore = path.join(repoRoot, 'node_modules', '.pnpm');
  if (!fs.existsSync(virtualStore)) return [];
  return fs
    .readdirSync(virtualStore)
    .filter((entry) => entry.startsWith('@objectstack+spec@'))
    .map((entry) => path.join(virtualStore, entry, 'node_modules', ...SPEC_PACKAGE_NAME.split('/')))
    .filter((dir) => fs.existsSync(path.join(dir, 'package.json')))
    .sort();
}

/**
 * Every workspace package whose own `node_modules` links to the spec, with the
 * directory that link resolves to.
 *
 * This is the VERIFICATION population, and it is deliberately taken from the
 * consumers rather than from the injection: "I replaced two directories" is a
 * statement about this function's own behaviour, while "every consumer that can
 * see the spec now sees the injected one" is the property the typecheck depends
 * on. A consumer left pointing at an un-injected copy is the silent half-green
 * this gate exists to make impossible.
 */
export function findSpecConsumers(repoRoot = repoRootDefault) {
  const consumers = [];
  for (const group of ['packages', 'apps', 'examples']) {
    const groupDir = path.join(repoRoot, group);
    if (!fs.existsSync(groupDir)) continue;
    for (const pkg of fs.readdirSync(groupDir)) {
      const link = path.join(groupDir, pkg, 'node_modules', ...SPEC_PACKAGE_NAME.split('/'));
      if (!fs.existsSync(link)) continue;
      consumers.push({ workspace: `${group}/${pkg}`, resolved: fs.realpathSync(link) });
    }
  }
  const rootLink = path.join(repoRoot, 'node_modules', ...SPEC_PACKAGE_NAME.split('/'));
  if (fs.existsSync(rootLink)) {
    consumers.push({ workspace: '.', resolved: fs.realpathSync(rootLink) });
  }
  return consumers.sort((a, b) => a.workspace.localeCompare(b.workspace));
}

/**
 * Every file an `exports` map names under a `types` condition, relative to the
 * package root.
 *
 * `tsc` reads exactly these and nothing else, so they are what must exist in the
 * staged package for a typecheck against it to mean anything. A spec built with
 * declarations skipped still packs, still installs, and still resolves at
 * runtime -- and fails every consumer with TS2307, which reads like a hundred
 * broken imports rather than like one missing build step.
 */
export function declaredTypesTargets(exportsMap) {
  const targets = new Set();
  const walk = (node) => {
    if (typeof node === 'string') return;
    if (Array.isArray(node)) return node.forEach(walk);
    if (!node || typeof node !== 'object') return;
    for (const [condition, value] of Object.entries(node)) {
      if (condition === 'types' && typeof value === 'string') targets.add(value);
      else walk(value);
    }
  };
  walk(exportsMap ?? {});
  return [...targets].sort();
}

/** `tar -xzf` into a fresh directory and return the extracted package root. */
function extractTarball(tarball, intoDir) {
  fs.mkdirSync(intoDir, { recursive: true });
  execFileSync('tar', ['-xzf', path.resolve(tarball), '-C', intoDir], { stdio: 'pipe' });
  const staged = path.join(intoDir, 'package');
  if (!fs.existsSync(staged)) {
    fail(
      `the tarball ${tarball} did not extract a \`package/\` directory. npm and pnpm both pack ` +
        `into one; a tarball shaped otherwise is not a packed npm package.`,
    );
  }
  return staged;
}

function fail(message) {
  process.stderr.write(`spec-main-shape-gate: ${message}\n`);
  process.exit(2);
}

/* ── dependency ranges, deliberately narrow ─────────────────────────────────
 * See "Why the spec's declared DEPENDENCIES are re-pointed too" in the header
 * for why this is not the `semver` package.
 */

/** `[major, minor, patch]` of a plain `X.Y.Z` release; anything else throws. */
function parseRelease(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version).trim());
  if (!match) throw new Error(`"${version}" is not a plain X.Y.Z release, and this gate orders nothing else`);
  return [Number(match[1]), Number(match[2]), Number(match[3])];
}

function compareReleases(left, right) {
  for (let i = 0; i < 3; i += 1) {
    if (left[i] !== right[i]) return left[i] < right[i] ? -1 : 1;
  }
  return 0;
}

/** One comparator: an operator (none means `=`) and a full `X.Y.Z` bound. */
const RANGE_COMPARATOR = /^(\^|~|>=|<=|>|<|=)?(\d+\.\d+\.\d+)$/;

function comparatorHolds(version, operator, bound) {
  const order = compareReleases(version, bound);
  if (operator === '=') return order === 0;
  if (operator === '>') return order > 0;
  if (operator === '>=') return order >= 0;
  if (operator === '<') return order < 0;
  if (operator === '<=') return order <= 0;
  // `~` admits patch releases; `^` admits everything up to the next change in
  // the left-most non-zero part -- npm's reading of both.
  const ceiling =
    operator === '~'
      ? [bound[0], bound[1] + 1, 0]
      : bound[0] > 0
        ? [bound[0] + 1, 0, 0]
        : bound[1] > 0
          ? [0, bound[1] + 1, 0]
          : [0, 0, bound[2] + 1];
  return order >= 0 && compareReleases(version, ceiling) < 0;
}

/**
 * Does the plain release `version` satisfy the dependency range `range`?
 *
 * Reads `X.Y.Z`, `=`, `^`, `~`, `>`, `>=`, `<`, `<=` on full `X.Y.Z` bounds,
 * space-separated comparator sets and `||` unions -- the spellings a published
 * manifest's `dependencies` carries. Everything else THROWS (a prerelease, a
 * partial or `x` version, a hyphen range, a `workspace:` or `npm:` protocol),
 * and the caller turns that into exit 2 naming the dependency: the failure
 * direction that matters is an unreadable range read as satisfied, which would
 * leave this gate compiling against the wrong dependency without a word.
 */
export function satisfiesRange(version, range) {
  const release = parseRelease(version);
  const text = String(range ?? '').trim();
  if (text.length === 0) throw new Error('an empty range names nothing this gate can judge');
  // Every comparator is PARSED before any is judged, so an unreadable one
  // throws even when an earlier alternative would already have decided.
  const alternatives = text.split('||').map((alternative) => {
    const comparators = alternative.trim().split(/\s+/).filter(Boolean);
    if (comparators.length === 0) throw new Error(`range "${text}" has an empty alternative`);
    return comparators.map((comparator) => {
      const match = RANGE_COMPARATOR.exec(comparator);
      if (!match) {
        throw new Error(`range "${text}" contains "${comparator}", which this gate does not read`);
      }
      return { operator: match[1] ?? '=', bound: parseRelease(match[2]) };
    });
  });
  return alternatives.some((comparators) =>
    comparators.every(({ operator, bound }) => comparatorHolds(release, operator, bound)),
  );
}

/* ── the spec's declared dependencies ─────────────────────────────────────── */

/** `{ name, version, realpath }` of the package installed at `dir`, or null. */
function installedPackageAt(dir) {
  if (!fs.existsSync(path.join(dir, 'package.json'))) return null;
  const realpath = fs.realpathSync(dir);
  const { name, version } = JSON.parse(fs.readFileSync(path.join(realpath, 'package.json'), 'utf8'));
  return { name, version, realpath };
}

/**
 * The link pnpm lays down for dependency `name` next to the spec, in the same
 * virtual-store entry: `<entry>/node_modules/<name>` beside
 * `<entry>/node_modules/@objectstack/spec`.
 */
function storeSiblingPath(target, name) {
  const entryModules = path.resolve(target, ...SPEC_PACKAGE_NAME.split('/').map(() => '..'));
  return path.join(entryModules, ...name.split('/'));
}

/** The virtual-store entry a spec copy lives in (`@objectstack+spec@<v>_<peers>`). */
function storeEntryName(target) {
  return path.basename(path.resolve(target, ...SPEC_PACKAGE_NAME.split('/').map(() => '..'), '..'));
}

/** Satisfaction with an unreadable range or version turned into exit 2 naming `name`. */
function judged(name, range, version, whose) {
  try {
    return satisfiesRange(version, range);
  } catch (error) {
    return fail(
      `cannot judge ${whose} \`${name}@${version}\` against the injected ${SPEC_PACKAGE_NAME}'s ` +
        `declared \`${name}: ${range}\`: ${error.message}. Refused rather than guessed -- a range read ` +
        `wrongly here decides which dependency the whole compile runs against.`,
    );
  }
}

/**
 * Which store siblings must be re-pointed, and at what. Decided BEFORE anything
 * is written, so a dependency that cannot be satisfied leaves the install as it
 * was and says so.
 */
function planDependencySubstitutions({ dependencies, targets, upstreamCheckout }) {
  const plan = [];
  for (const [name, range] of Object.entries(dependencies ?? {}).sort(([a], [b]) => a.localeCompare(b))) {
    for (const target of targets) {
      const sibling = storeSiblingPath(target, name);
      const held = installedPackageAt(sibling);
      if (held && judged(name, range, held.version, 'the store sibling')) continue;

      const upstreamDir = path.join(upstreamCheckout, 'packages', 'spec', 'node_modules', ...name.split('/'));
      const upstream = installedPackageAt(upstreamDir);
      const heldText = held ? `\`${name}@${held.version}\`` : 'no copy at all';
      if (!upstream || upstream.name !== name || !judged(name, range, upstream.version, 'the objectstack checkout')) {
        fail(
          `the injected ${SPEC_PACKAGE_NAME} declares \`${name}: ${range}\`. The store entry ` +
            `${storeEntryName(target)} holds ${heldText}, which does not satisfy it, ` +
            `and the objectstack checkout has ` +
            (upstream ? `\`${upstream.name}@${upstream.version}\`` : 'no copy') +
            ` at ${upstreamDir}. No copy satisfying the range is available, so nothing was injected: a ` +
            `compile now would read the spec's declarations against a dependency they were not built ` +
            `against, and report this gate's own injection as a shape break.`,
        );
      }
      let linkedFrom = null;
      try {
        linkedFrom = fs.readlinkSync(sibling);
      } catch {
        // Absent, or a directory rather than a link: nothing to print as its target.
      }
      plan.push({ name, range, target, sibling, held, linkedFrom, upstream });
    }
  }
  return plan;
}

/**
 * Re-point one sibling. REMOVE, then link. ⛔ Never write into what is there: a
 * link is replaced, and a directory -- which a pnpm store entry never holds
 * here, but a hand-made one might -- is unlinked file by file, locally. Neither
 * path writes through a hardlink into the global store. See this file's header.
 */
function relinkSibling({ sibling, upstream }) {
  const stat = fs.lstatSync(sibling, { throwIfNoEntry: false });
  if (stat?.isSymbolicLink()) fs.unlinkSync(sibling);
  else if (stat) fs.rmSync(sibling, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(sibling), { recursive: true });
  fs.symlinkSync(upstream.realpath, sibling, 'dir');
}

/** The one line a substitution is reported with, in the log and the run summary. */
function describeSubstitution({ name, range, target, held, linkedFrom, upstream }) {
  const entry = storeEntryName(target);
  const was = held ? `${name}@${held.version} (-> ${linkedFrom ?? held.realpath})` : 'absent';
  return (
    `substituted ${name} for ${SPEC_PACKAGE_NAME} in ${entry}: declared ${range}, the store held ${was}, ` +
    `which does not satisfy it; now -> ${upstream.realpath} (${name}@${upstream.version}, the copy ` +
    `the objectstack checkout's spec build resolved)`
  );
}

/* ── objectui's own copies of a re-pointed dependency ───────────────────── */

/** The manifest fields whose ranges pnpm links into an importer's `node_modules`. */
const IMPORTER_DEPENDENCY_FIELDS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

/**
 * The `packages:` globs of a `pnpm-workspace.yaml`, read narrowly: `- 'dir/*'`
 * and `- 'dir'` entries only. Anything else -- a negation, a `**`, a glob inside
 * a segment -- THROWS, because an importer the reader silently drops is one
 * whose copy is never re-pointed, and the proof below cannot see it either.
 */
export function parseWorkspaceGlobs(text) {
  const globs = [];
  let inPackages = false;
  for (const raw of String(text).split('\n')) {
    const line = raw.replace(/\s+#.*$/, '').replace(/\s+$/, '');
    if (line.length === 0 || /^\s*#/.test(line)) continue;
    if (/^\S/.test(line)) {
      inPackages = /^packages:\s*$/.test(line);
      continue;
    }
    if (!inPackages) continue;
    const entry = /^\s+-\s+(['"]?)([^'"]+)\1$/.exec(line);
    if (!entry || !/^[\w.@-]+(?:\/[\w.@-]+)*(?:\/\*)?$/.test(entry[2])) {
      throw new Error(`pnpm-workspace.yaml line "${raw.trim()}" is not a \`- 'dir'\` or \`- 'dir/*'\` entry`);
    }
    globs.push(entry[2]);
  }
  if (globs.length === 0) throw new Error('pnpm-workspace.yaml declares no `packages:` entries');
  return globs;
}

/** The root and every workspace directory `pnpm-workspace.yaml` names that holds a manifest. */
function workspaceImporterDirs(repoRoot) {
  let globs;
  try {
    globs = parseWorkspaceGlobs(fs.readFileSync(path.join(repoRoot, 'pnpm-workspace.yaml'), 'utf8'));
  } catch (error) {
    return fail(
      `cannot enumerate this repository's workspace importers: ${error.message}. Refused rather than ` +
        `guessed -- an importer left out keeps its own copy of a re-pointed dependency, and the ` +
        `compile reads two copies without a word.`,
    );
  }
  const dirs = new Set(['.']);
  for (const glob of globs) {
    if (glob.endsWith('/*')) {
      const parent = glob.slice(0, -2);
      const parentDir = path.join(repoRoot, parent);
      if (!fs.existsSync(parentDir)) continue;
      for (const child of fs.readdirSync(parentDir)) dirs.add(path.posix.join(parent, child));
    } else {
      dirs.add(glob);
    }
  }
  return [...dirs].filter((dir) => fs.existsSync(path.join(repoRoot, dir, 'package.json'))).sort();
}

/** Does `importer`'s declared `range` for `name` admit `version`? Unreadable is exit 2. */
function importerAdmits(name, range, version, importer) {
  try {
    return satisfiesRange(version, range);
  } catch (error) {
    return fail(
      `cannot judge whether objectui importer ${importer}'s declared \`${name}: ${range}\` admits ` +
        `${name}@${version}, the copy the injected ${SPEC_PACKAGE_NAME} was re-pointed to: ${error.message}. ` +
        `Refused rather than guessed -- the answer decides whether this compile reads one copy or two.`,
    );
  }
}

/**
 * For each package the spec substitution re-pointed, every objectui importer
 * declaring it, judged against the version it was re-pointed to. Decided before
 * the first write, like the spec's own plan.
 */
function planImporterRepoints({ repoRoot, plan }) {
  const repointed = new Map();
  for (const step of plan) repointed.set(step.name, step.upstream);
  if (repointed.size === 0) return { relink: [], twoCopies: [], importers: new Map() };

  const relink = [];
  const twoCopies = [];
  const importers = new Map();
  const dirs = workspaceImporterDirs(repoRoot);
  for (const [name, upstream] of [...repointed].sort(([a], [b]) => a.localeCompare(b))) {
    const declaring = [];
    for (const dir of dirs) {
      const manifest = JSON.parse(fs.readFileSync(path.join(repoRoot, dir, 'package.json'), 'utf8'));
      const ranges = [
        ...new Set(
          IMPORTER_DEPENDENCY_FIELDS.map((field) => manifest[field]?.[name]).filter((range) => typeof range === 'string'),
        ),
      ];
      if (ranges.length === 0) continue;
      const refusing = ranges.filter((range) => !importerAdmits(name, range, upstream.version, dir));
      const link = path.join(repoRoot, dir, 'node_modules', ...name.split('/'));
      let linkedFrom = null;
      try {
        linkedFrom = fs.readlinkSync(link);
      } catch {
        // Absent, or a directory rather than a link: nothing to print as its target.
      }
      const entry = { name, importer: dir, ranges, refusing, link, linkedFrom, held: installedPackageAt(link), upstream };
      declaring.push(entry);
      (refusing.length === 0 ? relink : twoCopies).push(entry);
    }
    importers.set(name, declaring);
  }
  return { relink, twoCopies, importers };
}

function describeImporterRepoint({ name, importer, ranges, held, linkedFrom, upstream }) {
  const was = held ? `${name}@${held.version} (-> ${linkedFrom ?? held.realpath})` : 'absent';
  return (
    `re-pointed ${name} for objectui importer ${importer}: declares ${ranges.join(' and ')}, which admits ` +
    `${upstream.version}; was ${was}, now -> ${upstream.realpath} (${name}@${upstream.version}, the copy the ` +
    `spec substitution linked)`
  );
}

function describeTwoCopies({ name, importer, refusing, upstream }) {
  return `two copies of ${name} stay: ${importer} declares ${refusing.join(' and ')}, which does not admit ${upstream.version}`;
}

/**
 * Which copy of `name` code at `fromDir` resolves: the first
 * `<node_modules>/<name>` along Node's own lookup path for that directory. The
 * package directory is found the way both Node and `tsc` walk `node_modules`,
 * without going through an `exports` map that may not expose `package.json`.
 */
function resolvedDependency(fromDir, name) {
  const lookup = createRequire(path.join(fromDir, 'package.json')).resolve.paths(name) ?? [];
  for (const modulesDir of lookup) {
    const found = installedPackageAt(path.join(modulesDir, ...name.split('/')));
    if (found) return found;
  }
  return null;
}

/**
 * Replace every installed copy of the spec with the staged one, re-point its
 * store siblings at the dependencies it was built against where the installed
 * ones do not satisfy its manifest, and PROVE both took.
 *
 * `upstreamCheckout` is the objectstack checkout the tarball was built and
 * packed in: the spec build's own dependency resolution lives under its
 * `packages/spec/node_modules`.
 *
 * Returns the reading so callers (and the self-test) can assert on it rather
 * than on stdout.
 */
export function inject({ tarball, sha, upstreamCheckout, repoRoot = repoRootDefault, log = () => {} }) {
  const upstreamSpecManifest = upstreamCheckout
    ? path.join(upstreamCheckout, 'packages', 'spec', 'package.json')
    : null;
  let upstreamSpecName = null;
  try {
    upstreamSpecName = JSON.parse(fs.readFileSync(upstreamSpecManifest, 'utf8')).name;
  } catch {
    // Reported below with the path that was tried.
  }
  if (upstreamSpecName !== SPEC_PACKAGE_NAME) {
    fail(
      `--upstream-checkout must be the objectstack checkout the spec was built in, and ` +
        `${upstreamSpecManifest ?? '(none given)'} is not \`${SPEC_PACKAGE_NAME}\`'s manifest. Without it ` +
        `there is no source for the dependencies the spec's declarations were emitted against.`,
    );
  }

  const targets = findInstalledSpecDirs(repoRoot);
  if (targets.length === 0) {
    fail(
      `no installed \`${SPEC_PACKAGE_NAME}\` found under ${path.join(repoRoot, 'node_modules/.pnpm')}. ` +
        `Nothing was injected, so a typecheck run after this point would compile against whatever ` +
        `is installed and report a verdict about the PUBLISHED spec under this gate's name. ` +
        `Run \`pnpm install --frozen-lockfile\` first, or fix the store layout this reader assumes.`,
    );
  }

  const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-main-shape-gate-'));
  const staged = extractTarball(tarball, staging);

  const manifest = JSON.parse(fs.readFileSync(path.join(staged, 'package.json'), 'utf8'));
  if (manifest.name !== SPEC_PACKAGE_NAME) {
    fail(
      `the staged package is \`${manifest.name}\`, not \`${SPEC_PACKAGE_NAME}\`. Refusing to write ` +
        `it over the installed spec -- a mis-aimed tarball would produce a typecheck whose subject ` +
        `is not the one this gate reports on.`,
    );
  }

  const missingTypes = declaredTypesTargets(manifest.exports).filter(
    (target) => !fs.existsSync(path.join(staged, target)),
  );
  if (missingTypes.length > 0) {
    fail(
      `the staged \`${SPEC_PACKAGE_NAME}\` declares ${missingTypes.length} \`types\` target(s) its ` +
        `tarball does not contain:\n` +
        missingTypes.map((t) => `  - ${t}`).join('\n') +
        `\n\nThis is what a spec built with its declaration pass skipped looks like. Injecting it ` +
        `would fail every consumer with TS2307 and this gate would report that as a shape break at ` +
        `${sha}. Build the spec with declarations and pack it again.`,
    );
  }

  // Decided before the first write: a dependency no copy can satisfy is exit 2
  // with the install exactly as it was. See the header.
  const plan = planDependencySubstitutions({
    dependencies: manifest.dependencies,
    targets,
    upstreamCheckout,
  });
  // objectui's own copies of what that plan re-points, judged before any write
  // too. See "...and why objectui's OWN copies" in the header.
  const importerPlan = planImporterRepoints({ repoRoot, plan });

  for (const target of targets) {
    // REMOVE, then copy. ⛔ Never copy over: the files below are hardlinks into
    // pnpm's global store, and writing through one corrupts the store for every
    // other checkout on this machine. See this file's header.
    fs.rmSync(target, { recursive: true, force: true });
    fs.mkdirSync(target, { recursive: true });
    fs.cpSync(staged, target, { recursive: true, dereference: true });
    fs.writeFileSync(
      path.join(target, MARKER_FILE),
      `${JSON.stringify(
        {
          upstream: UPSTREAM_REPO,
          sha,
          version: manifest.version,
          injectedAt: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
  }

  fs.rmSync(staging, { recursive: true, force: true });

  const substitutions = plan.map((step) => {
    relinkSibling(step);
    return describeSubstitution(step);
  });
  for (const entry of importerPlan.relink) {
    relinkSibling({ sibling: entry.link, upstream: entry.upstream });
    substitutions.push(describeImporterRepoint(entry));
  }
  for (const entry of importerPlan.twoCopies) substitutions.push(describeTwoCopies(entry));

  // The verification, asked of the consumers. See `findSpecConsumers`.
  const consumers = findSpecConsumers(repoRoot);
  if (consumers.length === 0) {
    fail(
      `the injection wrote ${targets.length} director(ies), and then no workspace package was ` +
        `found linking to \`${SPEC_PACKAGE_NAME}\`. A reading of zero consumers is a broken reader ` +
        `or an install that never happened -- not evidence that the injection reached everyone.`,
    );
  }
  const stranded = consumers.filter(
    (consumer) => !fs.existsSync(path.join(consumer.resolved, MARKER_FILE)),
  );
  if (stranded.length > 0) {
    fail(
      `these ${stranded.length} consumer(s) still resolve \`${SPEC_PACKAGE_NAME}\` to a copy this ` +
        `run did not inject:\n` +
        stranded.map((c) => `  - ${c.workspace} -> ${c.resolved}`).join('\n') +
        `\n\nA typecheck now would mix the built-from-source spec with the published one, and the ` +
        `green half would be indistinguishable from a real pass.`,
    );
  }

  // Which copy of each declared dependency the injected spec resolves -- asked
  // of every consumer's resolved spec, like the marker check above, and never
  // of the plan: "I re-pointed zod" is this function's claim about itself.
  const resolutions = [];
  for (const consumer of consumers) {
    for (const [name, range] of Object.entries(manifest.dependencies ?? {})) {
      const found = resolvedDependency(consumer.resolved, name);
      resolutions.push({
        workspace: consumer.workspace,
        name,
        range,
        version: found?.version ?? null,
        resolved: found?.realpath ?? null,
        satisfied: found !== null && judged(name, range, found.version, 'the resolved'),
      });
    }
  }
  const unsatisfied = resolutions.filter((resolution) => !resolution.satisfied);
  if (unsatisfied.length > 0) {
    fail(
      `the injected \`${SPEC_PACKAGE_NAME}\` resolves ${unsatisfied.length} declared dependency ` +
        `reading(s) outside the range its manifest declares:\n` +
        unsatisfied
          .map(
            (r) =>
              `  - ${r.workspace}: ${r.name} ${r.range} -> ` +
              (r.version ? `${r.name}@${r.version} (${r.resolved})` : 'nothing'),
          )
          .join('\n') +
        `\n\nA compile now would read the spec's declarations against a dependency they were not ` +
        `built against, and report this gate's own injection as a shape break.`,
    );
  }

  // ONE copy of each re-pointed package: every spec consumer and every objectui
  // importer whose range admits it must resolve the same directory. Asked of
  // each of them, never of the plan.
  const oneCopy = [];
  for (const [name, declaring] of importerPlan.importers) {
    const expected = plan.find((step) => step.name === name).upstream.realpath;
    const readers = [
      ...resolutions
        .filter((r) => r.name === name)
        .map((r) => ({ who: `spec consumer ${r.workspace}`, resolved: r.resolved, version: r.version })),
      ...declaring
        .filter((entry) => entry.refusing.length === 0)
        .map((entry) => {
          const found = resolvedDependency(path.join(repoRoot, entry.importer), name);
          return { who: `objectui importer ${entry.importer}`, resolved: found?.realpath ?? null, version: found?.version ?? null };
        }),
    ];
    const elsewhere = readers.filter((reader) => reader.resolved !== expected);
    if (elsewhere.length > 0) {
      fail(
        `${elsewhere.length} reader(s) of the re-pointed \`${name}\` do not resolve the one copy at ` +
          `${expected}:\n` +
          elsewhere
            .map((r) => `  - ${r.who} -> ` + (r.version ? `${name}@${r.version} (${r.resolved})` : 'nothing'))
            .join('\n') +
          `\n\nA compile now would read two copies of \`${name}\` in one program, and report the ` +
          `artifacts of that as shape breaks.`,
      );
    }
    oneCopy.push({
      name,
      version: readers[0]?.version ?? null,
      resolved: expected,
      consumers: readers.filter((r) => r.who.startsWith('spec consumer')).length,
      importers: readers.length - readers.filter((r) => r.who.startsWith('spec consumer')).length,
      twoCopies: declaring.filter((entry) => entry.refusing.length > 0).map((entry) => entry.importer),
    });
  }

  log(
    `spec-main-shape-gate: injected ${SPEC_PACKAGE_NAME}@${manifest.version} built from ` +
      `${UPSTREAM_REPO}@${sha} into ${targets.length} store copy/copies; ` +
      `${consumers.length} workspace consumer(s) verified on it.`,
  );
  for (const target of targets) log(`  store   ${path.relative(repoRoot, target)}`);
  for (const consumer of consumers) log(`  consumer ${consumer.workspace}`);
  for (const line of substitutions) log(`spec-main-shape-gate: ${line}`);
  if (plan.length === 0) {
    log(
      `spec-main-shape-gate: no dependency substitution -- every declared dependency's store sibling ` +
        `satisfies its range.`,
    );
  }
  const distinct = new Map();
  for (const r of resolutions) {
    const key = JSON.stringify([r.name, r.resolved]);
    distinct.set(key, { ...r, consumers: (distinct.get(key)?.consumers ?? 0) + 1 });
  }
  for (const r of distinct.values()) {
    log(
      `  resolves ${r.name}@${r.version} (declared ${r.range}) for ${r.consumers} consumer(s) -> ${r.resolved}`,
    );
  }
  for (const c of oneCopy) {
    log(
      `  one copy of ${c.name}@${c.version} for ${c.consumers} spec consumer(s) and ${c.importers} objectui ` +
        `importer(s) -> ${c.resolved}` +
        (c.twoCopies.length > 0 ? `; a second copy stays for ${c.twoCopies.join(', ')}` : ''),
    );
  }

  return { targets, consumers, version: manifest.version, sha, substitutions, resolutions, oneCopy };
}

/**
 * The turbo line prefix, and the workspace it names.
 *
 * turbo prefixes every line of a task's output with `<package>:<task>: `, and
 * root tasks with `//:<task>: `. Stripping it is not cosmetic: `tsc` prints
 * paths relative to ITS OWN cwd, which is the package directory, so
 * `src/foo.ts(3,9)` is ambiguous across forty packages until the prefix says
 * which one. The prefix is the only thing that makes the acceptance criterion
 * -- name the objectui FILE -- answerable at all.
 *
 * ⚠️ BUT THE PREFIX IS NOT THERE IN THE ONLY LOG THIS GATE EVER READS. turbo picks
 * its log order from the environment: STREAM locally, where every line carries
 * the prefix above, and GROUPED on a GitHub Actions runner, where each task gets
 * a `##[group]<package>:<task>` header and its output is emitted BARE. The
 * failing task is not even grouped -- it is announced by a colourised header
 * line and then streams unprefixed. Measured on this gate's own runs: both
 * reported `src/hooks/__tests__/...` for a file that lives under
 * `packages/react/`, because the prefix-only reading had nothing to match, and
 * `unmappedPackages` stayed EMPTY so the summary did not even warn. A path no
 * reader can open, handed over as the answer to "which objectui file".
 *
 * So the workspace is tracked from BOTH carriers: the prefix when it is there,
 * and otherwise the header of the task whose output is currently streaming.
 */
const TURBO_PREFIX = /^(?:\x1b\[[0-9;]*m)*([^\s:]+):([^\s:]+(?::[^\s:]+)*):\s?/;

/**
 * A turbo task header standing alone on its line -- `<package>:<task>`, with or
 * without the `##[group]` that GitHub Actions wraps a collapsible section in.
 *
 * Deliberately anchored at BOTH ends: a header is the whole line. Anything with
 * a space in it -- ` Tasks:    27 successful`, `> tsc --noEmit`, a diagnostic --
 * is not one, and the caller additionally refuses any name that is not a real
 * workspace, so a stray `foo:bar` in somebody's output cannot silently become
 * the package a later diagnostic is charged to.
 */
const TURBO_GROUP_HEADER = /^(?:##\[group\])?([^\s:]+):([^\s:]+(?::[^\s:]+)*)$/;

/** GitHub Actions' end-of-section marker: whatever was streaming has stopped. */
const GROUP_END = /^##\[endgroup\]\s*$/;

/** A `tsc` diagnostic line, in the form every package here emits it. */
const DIAGNOSTIC = /^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+(TS\d+):\s+(.*)$/;

/** Strip ANSI so a colourised log parses the same as a plain one. */
const ANSI = /\x1b\[[0-9;]*m/g;

/**
 * Map a turbo package name to its directory, by reading the workspace manifests.
 *
 * Derived, never tabulated: a hand-kept name->directory table is one package
 * rename away from attributing a failure to the wrong file, which is worse than
 * not attributing it at all.
 */
export function workspaceDirsByName(repoRoot = repoRootDefault) {
  const byName = new Map([['//', '.']]);
  for (const group of ['packages', 'apps', 'examples', 'docs']) {
    const groupDir = path.join(repoRoot, group);
    if (!fs.existsSync(groupDir)) continue;
    const entries = fs.statSync(groupDir).isDirectory() ? fs.readdirSync(groupDir) : [];
    for (const pkg of entries) {
      const manifest = path.join(groupDir, pkg, 'package.json');
      if (!fs.existsSync(manifest)) continue;
      try {
        const { name } = JSON.parse(fs.readFileSync(manifest, 'utf8'));
        if (name) byName.set(name, path.posix.join(group, pkg));
      } catch {
        // A manifest that does not parse is not this gate's subject; the file it
        // would have named simply stays unmapped and is reported unmapped.
      }
    }
  }
  return byName;
}

/**
 * Parse a captured `pnpm type-check` log into attributed diagnostics.
 *
 * Every row carries the objectui file as a REPO-RELATIVE path, because that is
 * what a GitHub annotation needs and what a reader can open.
 */
export function parseDiagnostics(logText, repoRoot = repoRootDefault) {
  const dirs = workspaceDirsByName(repoRoot);
  const rows = [];
  const unmappedPackages = new Set();

  // The task whose output is streaming right now, in turbo's GROUPED log order.
  // Null means "nothing is known to be streaming", which is the honest state
  // outside a task's own section -- and an unattributed diagnostic is reported
  // as unattributed rather than charged to whoever ran last.
  let streaming = null;

  for (const rawLine of logText.split('\n')) {
    const line = rawLine.replace(ANSI, '');

    if (GROUP_END.test(line)) {
      streaming = null;
      continue;
    }
    const header = line.match(TURBO_GROUP_HEADER);
    if (header) {
      // Only a name this workspace actually has may become the attribution
      // target; anything else clears it. The alternative -- trusting the shape
      // -- attributes a file to a package that does not exist, which is worse
      // than not attributing it.
      streaming = dirs.has(header[1]) ? header[1] : null;
      continue;
    }

    const prefixed = line.match(TURBO_PREFIX);
    const workspaceName = prefixed ? prefixed[1] : streaming;
    const body = prefixed ? line.slice(prefixed[0].length) : line;

    const diagnostic = body.match(DIAGNOSTIC);
    if (!diagnostic) continue;

    const [, rawFile, lineNo, column, severity, code, message] = diagnostic;
    let file = rawFile.trim();
    if (path.isAbsolute(file)) {
      file = path.relative(repoRoot, file);
    } else if (workspaceName) {
      const dir = dirs.get(workspaceName);
      if (dir) file = dir === '.' ? file : path.posix.join(dir, file);
      else unmappedPackages.add(workspaceName);
    }

    rows.push({
      workspace: workspaceName ?? '(unprefixed)',
      file: file.split(path.sep).join('/'),
      line: Number(lineNo),
      column: Number(column),
      severity,
      code,
      message,
    });
  }

  return { rows, unmappedPackages: [...unmappedPackages].sort() };
}

/** The markdown this gate puts in front of a human when it goes red. */
export function renderSummary({ sha, rows, unmappedPackages, status, commit = null }) {
  const short = sha.slice(0, 12);
  const link = `https://github.com/${UPSTREAM_REPO}/commit/${sha}`;
  const out = [];

  out.push(`### Spec Main Shape Gate — \`${UPSTREAM_REPO}@${short}\``);
  out.push('');
  out.push(`Compiled this repository against \`${SPEC_PACKAGE_NAME}\` built from [${short}](${link}).`);
  if (commit) out.push('', `> ${commit}`);
  out.push('');

  if (status === 0 && rows.length === 0) {
    out.push(`✅ objectui type-checks against \`${SPEC_PACKAGE_NAME}\` at that commit.`);
    return out.join('\n');
  }

  if (rows.length === 0) {
    out.push(
      `⛔ The typecheck failed (exit ${status}) and **no diagnostic could be attributed to a file**.`,
      '',
      `That is not a shape break this gate can hand to anybody: the whole point of compiling a ` +
        `consumer is that the objectstack change which moved the shape is identifiable from the ` +
        `objectui file that stopped compiling. Read the job log — the failure is upstream of the ` +
        `compiler (an install, a build, the spec's own build) or the compiler's output shape moved.`,
    );
    return out.join('\n');
  }

  const files = [...new Set(rows.map((row) => row.file))].sort();
  out.push(
    `⛔ **${rows.length} diagnostic(s) in ${files.length} objectui file(s)** against ` +
      `\`${UPSTREAM_REPO}@${short}\`.`,
    '',
    `The objectstack pull request that moved this shape is the one that answers. Each row below is ` +
      `an objectui file that compiles against the pinned published spec and does not compile ` +
      `against that commit.`,
    '',
    '| objectui file | line | code | message |',
    '| --- | --- | --- | --- |',
  );
  for (const row of rows.slice(0, 50)) {
    out.push(
      `| \`${row.file}\` | ${row.line} | ${row.code} | ${row.message.replace(/\|/g, '\\|')} |`,
    );
  }
  if (rows.length > 50) out.push(`| … | | | ${rows.length - 50} more, in the job log |`);

  out.push('', `**Files:** ${files.map((file) => `\`${file}\``).join(', ')}`);
  out.push(
    '',
    `**Against:** \`${UPSTREAM_REPO}@${sha}\` — ${link}`,
  );

  if (unmappedPackages.length > 0) {
    out.push(
      '',
      `⚠️ ${unmappedPackages.length} turbo package name(s) did not resolve to a directory ` +
        `(${unmappedPackages.join(', ')}), so the paths they contributed are package-relative. ` +
        `That is a reader problem in this gate, not a finding about the spec.`,
    );
  }

  return out.join('\n');
}

/** GitHub annotations: one per diagnostic, each naming the objectstack commit. */
function emitAnnotations(rows, sha) {
  const short = sha.slice(0, 12);
  for (const row of rows) {
    const message =
      `${row.code}: ${row.message} — compiled against ${SPEC_PACKAGE_NAME} built from ` +
      `${UPSTREAM_REPO}@${short}`;
    process.stdout.write(
      `::error file=${row.file},line=${row.line},col=${row.column},` +
        `title=spec@main shape break (${short})::${message.replace(/\r?\n/g, ' ')}\n`,
    );
  }
}

function report({ logPath, sha, status, commit }) {
  const logText = fs.readFileSync(logPath, 'utf8');
  const { rows, unmappedPackages } = parseDiagnostics(logText);
  const summary = renderSummary({ sha, rows, unmappedPackages, status, commit });

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
  }
  process.stdout.write(`${summary}\n`);

  if (status === 0 && rows.length === 0) return 0;
  if (rows.length === 0) return 2;
  emitAnnotations(rows, sha);
  return 1;
}

/* ─────────────────────────── self-test ─────────────────────────────────────
 * Offline, and it exercises BOTH directions of every judgement that decides a
 * verdict. A parser demonstrated only on input it parses is not demonstrated.
 */
function selfTest() {
  /** ESC, built from its code point so no control byte is ever written into this file. */
  const ESC = String.fromCharCode(27);
  const results = [];
  const check = (name, actual, expected) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    results.push({ name, ok, actual, expected });
  };

  const sha = 'a'.repeat(40);
  const fixture = [
    '@object-ui/core:type-check: > tsc --noEmit',
    '@object-ui/core:type-check: src/registry.ts(12,5): error TS2339: Property nope does not exist.',
    // The colour escape is BUILT, never typed: an editor that materialises an
    // escape spelling into a raw control byte puts one in this file, and
    // `pnpm check:control-bytes` is right to refuse it.
    `${ESC}[32m@object-ui/plugin-grid:type-check:${ESC}[0m src/grid.tsx(4,1): error TS2724: no export.`,
    '//:type-check:e2e: e2e/app.spec.ts(9,3): error TS2554: Expected 1 arguments.',
    '@object-ui/core:type-check: this line is prose about (1,2): error TS9999 inside a sentence',
  ].join('\n');

  const parsed = parseDiagnostics(fixture);
  check(
    'attributes a package-relative path to its workspace directory',
    parsed.rows[0]?.file,
    'packages/core/src/registry.ts',
  );
  check('parses a colourised prefix', parsed.rows[1]?.file, 'packages/plugin-grid/src/grid.tsx');
  check('maps the root task to the repo root', parsed.rows[2]?.file, 'e2e/app.spec.ts');
  check('carries the code through', parsed.rows[1]?.code, 'TS2724');

  // The firing control for the "no diagnostics" verdict: the same parser over a
  // green log must find NOTHING, or every assertion above is satisfied by noise.
  const green = [
    '@object-ui/core:type-check: > tsc --noEmit',
    '@object-ui/core:type-check: ',
    ' Tasks:    81 successful, 81 total',
  ].join('\n');
  check('a green log yields zero rows', parseDiagnostics(green).rows.length, 0);

  // The log order turbo ACTUALLY selects on a GitHub Actions runner: a
  // `##[group]` header per task, output emitted BARE under it, and the failing
  // task announced by a colourised header with no group at all. The fixture is
  // the shape this gate's own runs produced.
  const grouped = [
    '##[group]@object-ui/sdui-parser:type-check',
    '> tsc --noEmit && tsc -p tsconfig.test.json',
    '##[endgroup]',
    `${ESC}[;31m@object-ui/react:type-check${ESC}[;0m`,
    '> tsc --noEmit && tsc -p tsconfig.test.json',
    "src/hooks/useNavigationOverlay.ts(76,3): error TS2322: Type 'string' is not assignable.",
  ].join('\n');
  check(
    'attributes a BARE diagnostic to the task whose section it is streaming in',
    parseDiagnostics(grouped).rows[0]?.file,
    'packages/react/src/hooks/useNavigationOverlay.ts',
  );

  // The firing control for the line above. Same diagnostic, same parser, with
  // the header removed: the attribution must fall away, or the assertion above
  // is satisfied by something other than the header it claims to read.
  const headerless = [
    '##[endgroup]',
    "src/hooks/useNavigationOverlay.ts(76,3): error TS2322: Type 'string' is not assignable.",
  ].join('\n');
  check(
    'a diagnostic in no task section is NOT charged to a package',
    parseDiagnostics(headerless).rows[0]?.file,
    'src/hooks/useNavigationOverlay.ts',
  );

  // A name that is not a workspace may not become an attribution target: a
  // `foo:bar` line in somebody's output would otherwise redirect every later
  // diagnostic into a directory that does not exist.
  check(
    'a header-shaped line naming no workspace clears the attribution',
    parseDiagnostics(
      [
        '##[group]@object-ui/react:type-check',
        'totally:unrelated',
        "src/hooks/useNavigationOverlay.ts(76,3): error TS2322: Type 'string' is not assignable.",
      ].join('\n'),
    ).rows[0]?.file,
    'src/hooks/useNavigationOverlay.ts',
  );

  // `renderSummary`, both directions.
  check(
    'a green summary says so',
    renderSummary({ sha, rows: [], unmappedPackages: [], status: 0 }).includes('type-checks against'),
    true,
  );
  check(
    'an unattributable failure refuses to read as a shape break',
    renderSummary({ sha, rows: [], unmappedPackages: [], status: 1 }).includes(
      'no diagnostic could be attributed to a file',
    ),
    true,
  );
  check(
    'a red summary names the file AND the commit',
    (() => {
      const text = renderSummary({ sha, rows: parsed.rows, unmappedPackages: [], status: 1 });
      return text.includes('packages/core/src/registry.ts') && text.includes(sha);
    })(),
    true,
  );

  // `declaredTypesTargets`, both directions.
  check(
    'reads every `types` target out of a conditional exports map',
    declaredTypesTargets({
      '.': { import: { types: './dist/index.d.mts', default: './dist/index.mjs' } },
      './ui': { require: { types: './dist/ui/index.d.ts', default: './dist/ui/index.js' } },
    }),
    ['./dist/index.d.mts', './dist/ui/index.d.ts'],
  );
  check('an exports map with no types target yields none', declaredTypesTargets({ '.': './x.js' }), []);

  // `findInstalledSpecDirs` over a synthetic store, both directions.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-gate-selftest-'));
  const store = path.join(tmp, 'node_modules', '.pnpm');
  const one = path.join(store, '@objectstack+spec@17.4.0_ai@7.0.0_', 'node_modules', '@objectstack', 'spec');
  fs.mkdirSync(one, { recursive: true });
  fs.writeFileSync(path.join(one, 'package.json'), '{"name":"@objectstack/spec"}');
  fs.mkdirSync(path.join(store, '@objectstack+formula@17.4.0', 'node_modules', '@objectstack', 'formula'), {
    recursive: true,
  });
  check('finds a peer-suffixed store copy', findInstalledSpecDirs(tmp).length, 1);
  check('does not claim a sibling @objectstack package', findInstalledSpecDirs(tmp)[0], one);
  check('an empty tree finds none', findInstalledSpecDirs(path.join(tmp, 'nowhere')).length, 0);
  fs.rmSync(tmp, { recursive: true, force: true });

  // `satisfiesRange` decides which dependency the whole compile reads: both
  // directions of every operator it claims, and the refusal of what it does not.
  check('a caret range refuses an older minor', satisfiesRange('4.4.3', '^4.6.1'), false);
  check('a caret range admits its floor and a later minor', [
    satisfiesRange('4.6.1', '^4.6.1'),
    satisfiesRange('4.7.0', '^4.6.1'),
  ], [true, true]);
  check('a caret range refuses the next major', satisfiesRange('5.0.0', '^4.6.1'), false);
  check('a caret range on 0.x stops at the next minor', [
    satisfiesRange('0.3.9', '^0.3.1'),
    satisfiesRange('0.4.0', '^0.3.1'),
  ], [true, false]);
  check('a tilde range stops at the next minor', [
    satisfiesRange('2.14.9', '~2.14.0'),
    satisfiesRange('2.15.0', '~2.14.0'),
  ], [true, false]);
  check('an exact version admits only itself', [
    satisfiesRange('2.14.0', '2.14.0'),
    satisfiesRange('2.14.1', '2.14.0'),
  ], [true, false]);
  check('a comparator set is an AND, a union an OR', [
    satisfiesRange('17.9.0', '>=17.1.0 <18.0.0'),
    satisfiesRange('18.0.0', '>=17.1.0 <18.0.0'),
    satisfiesRange('3.0.0', '^1.0.0 || ^3.0.0'),
    satisfiesRange('2.0.0', '^1.0.0 || ^3.0.0'),
  ], [true, false, true, false]);
  const refuses = (version, range) => {
    try {
      satisfiesRange(version, range);
      return false;
    } catch {
      return true;
    }
  };
  // `parseWorkspaceGlobs` decides which importers the dedupe pass can see.
  check(
    'reads the packages globs of a pnpm-workspace.yaml, and nothing after them',
    parseWorkspaceGlobs("# c\npackages:\n  - 'packages/*'\n  - \"docs\"  # tail\n  - apps/*\nonlyBuiltDependencies:\n  - esbuild\n"),
    ['packages/*', 'docs', 'apps/*'],
  );
  check('a glob the reader does not know throws rather than dropping importers', [
    (() => { try { parseWorkspaceGlobs("packages:\n  - 'packages/**'\n"); return false; } catch { return true; } })(),
    (() => { try { parseWorkspaceGlobs("packages:\n  - '!packages/x'\n"); return false; } catch { return true; } })(),
    (() => { try { parseWorkspaceGlobs('overrides: {}\n'); return false; } catch { return true; } })(),
  ], [true, true, true]);
  check('an unreadable spelling throws rather than guessing', [
    refuses('4.6.1', 'workspace:*'),
    refuses('4.6.1', '4.x'),
    refuses('4.6.1', '^4.6'),
    refuses('4.7.0-beta.1', '^4.6.1'),
    // Parsed before judged: the first alternative holding does not excuse the second.
    refuses('4.6.1', '^4.6.1 || latest'),
  ], [true, true, true, true, true]);

  for (const result of results) {
    process.stdout.write(`${result.ok ? 'ok  ' : 'FAIL'} ${result.name}\n`);
    if (!result.ok) {
      process.stdout.write(`      expected ${JSON.stringify(result.expected)}\n`);
      process.stdout.write(`      actual   ${JSON.stringify(result.actual)}\n`);
    }
  }
  const failed = results.filter((result) => !result.ok).length;
  process.stdout.write(
    `spec-main-shape-gate --self-test: ${results.length - failed}/${results.length} passed\n`,
  );
  return failed === 0 ? 0 : 1;
}

function readFlag(argv, flag) {
  const at = argv.indexOf(flag);
  return at === -1 ? undefined : argv[at + 1];
}

function main(argv) {
  if (argv.includes('--self-test')) return selfTest();

  const mode = argv[0];
  const sha = readFlag(argv, '--sha');

  if (mode === 'inject') {
    const tarball = readFlag(argv, '--tarball');
    const upstreamCheckout = readFlag(argv, '--upstream-checkout');
    if (!tarball || !sha || !upstreamCheckout) {
      fail('usage: inject --tarball <f.tgz> --sha <sha> --upstream-checkout <objectstack checkout>');
    }
    const { substitutions } = inject({
      tarball,
      sha,
      upstreamCheckout,
      log: (line) => process.stdout.write(`${line}\n`),
    });
    if (process.env.GITHUB_STEP_SUMMARY) {
      const lines = substitutions.length > 0
        ? substitutions.map((line) => `- ${line}`)
        : ["- no dependency substitution: every declared dependency's store sibling satisfies its range."];
      fs.appendFileSync(
        process.env.GITHUB_STEP_SUMMARY,
        `### Spec Main Shape Gate — injection\n\n${lines.join('\n')}\n\n`,
      );
    }
    return 0;
  }

  if (mode === 'report') {
    const logPath = readFlag(argv, '--log');
    const status = Number(readFlag(argv, '--status') ?? '0');
    if (!logPath || !sha) fail('usage: report --log <f> --sha <sha> --status <n>');
    if (!fs.existsSync(logPath)) {
      fail(
        `the captured typecheck log ${logPath} does not exist. With no log there is no reading, ` +
          `and an absent reading is never a pass.`,
      );
    }
    return report({ logPath, sha, status, commit: readFlag(argv, '--commit') });
  }

  fail(`unknown mode ${JSON.stringify(mode ?? '')}. Modes: inject, report, --self-test.`);
  return 2;
}

if (isEntrypoint(import.meta.url)) {
  process.exit(main(process.argv.slice(2)));
}

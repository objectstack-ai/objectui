#!/usr/bin/env node
// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * spec-main-shape-gate -- compile THIS repository against `@objectstack/spec`
 * built from objectstack `main`, and name the objectui file and the objectstack
 * commit when it does not compile.
 *
 *   node scripts/spec-main-shape-gate.mjs inject --tarball <f.tgz> --sha <sha>
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

/**
 * Replace every installed copy of the spec with the staged one and PROVE it took.
 *
 * Returns the reading so callers (and the self-test) can assert on it rather
 * than on stdout.
 */
export function inject({ tarball, sha, repoRoot = repoRootDefault, log = () => {} }) {
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

  log(
    `spec-main-shape-gate: injected ${SPEC_PACKAGE_NAME}@${manifest.version} built from ` +
      `${UPSTREAM_REPO}@${sha} into ${targets.length} store copy/copies; ` +
      `${consumers.length} workspace consumer(s) verified on it.`,
  );
  for (const target of targets) log(`  store   ${path.relative(repoRoot, target)}`);
  for (const consumer of consumers) log(`  consumer ${consumer.workspace}`);

  return { targets, consumers, version: manifest.version, sha };
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
 */
const TURBO_PREFIX = /^(?:\x1b\[[0-9;]*m)*([^\s:]+):([^\s:]+(?::[^\s:]+)*):\s?/;

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

  for (const rawLine of logText.split('\n')) {
    const line = rawLine.replace(ANSI, '');
    const prefixed = line.match(TURBO_PREFIX);
    const workspaceName = prefixed ? prefixed[1] : null;
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
    if (!tarball || !sha) fail('usage: inject --tarball <f.tgz> --sha <sha>');
    inject({ tarball, sha, log: (line) => process.stdout.write(`${line}\n`) });
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

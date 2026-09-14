// `OBJECTSTACK_SPEC_DIST` — resolve `@objectstack/spec` at a locally built spec
// package instead of the one the lockfile installed.
//
// ## Why the hook exists (objectui#4854, ruled on objectstack#8134)
//
// The framework's `scripts/build-console.sh` already injects its own
// `@objectstack/client` into the console build, so a framework release never
// ships a console bundled against a stale published client. The same class of
// skew exists for `@objectstack/spec` and is currently SILENT: an authorable key
// added to the framework's `packages/spec` after the last spec publish is
// accepted and round-tripped by the server, while the Studio designer — bundled
// against the published spec — rejects it as an unrecognized key. Nothing asks
// whether the vendored spec carries the surface the framework declares.
//
// ## Why the client hook does not transfer as-is
//
// The client override is one prefix alias to a package directory, which is safe
// because `@objectstack/client`'s exports map has exactly one entry and nothing
// imports a subpath. `@objectstack/spec` is a different shape — measured on the
// installed 17.0.0-rc.6: 18 exports entries, 17 of them reached by this
// repository's own imports, across 29 packages. Every entry redirects into
// `dist/`, so a bare prefix alias rewrites `@objectstack/spec/ui` to
// `SPEC_PKG/ui`, a path that does not exist. A Vite string alias is prefix
// replacement; it never consults the target's exports map.
//
// So this module reads the exports map OF THE OVERRIDE and emits one alias per
// entry. Deriving beats prescribing here, and the map itself says why: the
// obvious rule ("subpath NAME lives at dist/NAME/index.mjs") is wrong for
// `./openapi.json`, which the map redirects to `json-schema/openapi.json` — a
// hand-written table would have shipped a hook that mis-resolves it.
//
// ## Whose precedence wins (objectui#9408)
//
// A conditional exports value expresses precedence ONE way: the ORDER OF ITS
// OWN KEYS. Node and every bundler match by walking that order and taking the
// first key the caller's condition set satisfies. The caller's side of the
// contract is the SET — "these are the conditions I satisfy" — never a ranking
// of its own, because ranking is the package's to declare.
//
// This module used to walk its own `['import', 'module', 'browser', 'default']`
// array instead, so the LAST word on precedence belonged to the consumer. The
// spec's map declares `browser` FIRST on five entries (`.`, `./data`,
// `./system`, `./kernel`, `./cloud` on 17.4.0), so the array's `import`-before-
// `browser` ranking silently overrode a deliberate upstream declaration and the
// `browser` arm became unreachable. Measured on 17.4.0, both sides in one run:
// this module returned `dist/index.mjs` for all five while Vite's own resolver
// — the resolver this hook exists to MODEL — returned `dist/browser/index.mjs`.
//
// That divergence is the bug, and it is the hook's own charter that condemns
// it: an override build is supposed to differ from a normal build in WHICH SPEC
// it bundles, never in WHICH ARM of that spec it picks. Reordering the array
// would have swapped one consumer-side ranking for another and broken any
// caller that genuinely wants the Node arm; honouring the map's key order is
// correct for every caller, because each one then says what it satisfies and
// the package says what it prefers.
//
// ## Three properties this module holds on purpose
//
// - **Loud, never lenient.** Every way the override can be wrong — path absent,
//   not the spec package, an exports entry naming a file the built package does
//   not contain, one of its own declared dependencies unresolvable from where it
//   sits — throws with the offending value named. A tolerant fallback to
//   the installed spec would silently rebuild the exact skew the hook exists to
//   kill, and the framework guard could not tell the difference.
// - **Audible, never silent.** Every entry carries the condition path that
//   chose it (`browser > import > default`), and `formatConditionReport` renders
//   the table the caller prints. A resolver that picks an arm without saying so
//   fails the only way that matters here: the first symptom of a wrong pick is a
//   bundler error at some later pin bump, in a package nobody connects to this
//   file. The report is what makes the pick falsifiable at the moment it happens
//   rather than a build-length later.
// - **Inert when unset.** `resolveSpecDistInjection(undefined, …)` returns
//   `null` and the caller's config keeps every baseline value, identity
//   included.

import fs from 'node:fs';
import path from 'node:path';

/** The package this hook overrides. Also the guard against a mis-aimed path. */
export const SPEC_PACKAGE_NAME = '@objectstack/spec';

/**
 * The conditions a browser/ESM bundler SATISFIES. A set, never a ranking.
 *
 * Membership only: this answers "would the console's bundler match this key",
 * and the exports map answers "which matching key wins" with its own key order.
 * Listing them in a ranked-looking order here is what caused objectui#9408, so
 * the declaration order below carries NO meaning — sorted alphabetically to
 * keep it that way.
 *
 * `types` is deliberately absent, and under key-order resolution that omission
 * became load-bearing rather than incidental: `types` sits FIRST inside every
 * condition object in the spec's map, so a walk in declaration order reaches it
 * before anything else and would alias every subpath at a `.d.mts` file. It is
 * excluded because a bundler emitting JavaScript does not satisfy it — the same
 * reason `require` is absent — which is exactly the shape of question this set
 * is supposed to answer.
 */
const IMPORT_CONDITIONS: ReadonlySet<string> = new Set(['browser', 'default', 'import', 'module']);

/** Character class matching either path separator, for a generated `RegExp`. */
const SEPARATOR_CLASS = '[\\\\/]';

/** What the caller wires into its Vite config when the override is set. */
export interface SpecDistInjection {
  /** Absolute (realpath'd) directory of the overriding spec package. */
  packageDir: string;
  /**
   * `resolve.alias` entries, SUBPATHS FIRST and the bare specifier last.
   *
   * The order is load-bearing. Vite matches a string `find` when the specifier
   * equals it or starts with it plus a slash, first match wins, so a bare
   * `@objectstack/spec` entry placed first would swallow every subpath. Last, it
   * still catches specifiers the override's map does NOT declare and rewrites
   * them to a path that cannot exist — a resolve error naming the specifier,
   * which is the intended outcome: an undeclared subpath must not quietly fall
   * through to the installed spec.
   */
  aliases: Record<string, string>;
  /** Directories the dev server must be allowed to read (out-of-workspace). */
  fsAllow: string[];
  /**
   * Every exports entry with the condition arm that chose it — the audible half
   * of objectui#9408.
   *
   * Carried on the injection rather than logged from inside the resolver so the
   * module stays a pure function, and so the caller decides when and where the
   * table appears. `formatConditionReport` renders it.
   */
  resolutions: SpecExportResolution[];
  /** `advancedChunks` test that keeps the injected spec in the vendor chunk. */
  vendorChunkTest: RegExp;
  /**
   * Module-id test that still RECOGNISES the injected spec as the spec.
   *
   * Distinct from `vendorChunkTest` on purpose. That one answers "which modules
   * belong in the `vendor-objectstack` group" — the whole scope minus the
   * linter — and an eager `@objectstack/client` satisfies it. This one answers
   * "which modules ARE `@objectstack/spec`", which is what the console's
   * build-time counter-probe (`assertLazyLinterStaysLazy`) has to be able to
   * find before it trusts its own graph walk.
   *
   * Publishing it here rather than letting that consumer hardcode its own is the
   * whole lesson of objectui#5388: the injection rewrites all 18 spec specifiers
   * to absolute paths in the overriding tree — ids with no `@objectstack`
   * segment anywhere — so a private `/@objectstack[\\/+]spec/` matched zero
   * modules, the counter-probe correctly refused a verdict, and every build made
   * with the override set died in `generateBundle` (measured from the consumer
   * side in objectstack#10136). Both consumers now read one producer.
   */
  specModuleTest: RegExp;
}

/** Escapes a literal string for embedding in a `RegExp` source. */
export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** One exports-map entry, resolved, with the condition path that chose it. */
export interface SpecExportResolution {
  /** The bare or subpath specifier, e.g. `@objectstack/spec/data`. */
  specifier: string;
  /** The exports-map key it came from, e.g. `./data`. */
  exportKey: string;
  /** Absolute path of the file the specifier resolves to. */
  target: string;
  /**
   * Conditions entered, outermost first — `['browser', 'import', 'default']`.
   *
   * Empty for an entry whose value is a bare string, which names its file with
   * no condition at all (`./package.json` in the real map).
   */
  conditionPath: string[];
  /**
   * Sibling keys this module ALSO satisfies but that the map ranked lower, in
   * the map's order. Non-empty only where the package expressed a real
   * preference — the entries where getting the order wrong is observable, and
   * so the ones worth reading in a build log.
   */
  passedOver: string[];
}

/** A resolved leaf plus how it was reached. */
interface PickedTarget {
  target: string;
  conditionPath: string[];
  passedOver: string[];
}

/**
 * The leaf one exports-map value resolves to for a browser/ESM bundler.
 *
 * Walks the value's OWN key order and takes the first key `IMPORT_CONDITIONS`
 * satisfies — the algorithm Node and every bundler implement, and the reason
 * objectui#9408 was a bug and not a preference. The consumer contributes the
 * SET; the package contributes the ORDER.
 *
 * `Object.keys` is insertion order here, which is the map's declared order:
 * exports keys are condition names and `./`-prefixed subpaths, never the
 * integer-like keys JavaScript would hoist to the front of the enumeration.
 *
 * Returns `null` for an entry that resolves to nothing a bundler could take
 * (e.g. one exported only under `require`), so the caller can name it.
 */
function pickImportTarget(value: unknown, trail: string[] = []): PickedTarget | null {
  if (typeof value === 'string') return { target: value, conditionPath: trail, passedOver: [] };
  if (value === null || typeof value !== 'object') return null;
  if (Array.isArray(value)) {
    // A fallback array is the one place the PACKAGE ranks alternatives itself,
    // so first-that-resolves is its declared order, not ours.
    for (const candidate of value) {
      const hit = pickImportTarget(candidate, trail);
      if (hit) return hit;
    }
    return null;
  }
  const conditions = value as Record<string, unknown>;
  const satisfiable = Object.keys(conditions).filter((key) => IMPORT_CONDITIONS.has(key));
  for (let i = 0; i < satisfiable.length; i += 1) {
    const condition = satisfiable[i];
    const hit = pickImportTarget(conditions[condition], [...trail, condition]);
    if (!hit) continue;
    // Report the OUTERMOST level that had a real choice. That is the level
    // where a precedence mistake is observable — `browser` vs `import` on the
    // entry itself, not `default` vs nothing three levels in — so an outer
    // level with alternatives outranks whatever an inner level recorded.
    const lower = satisfiable.slice(i + 1);
    return { ...hit, passedOver: lower.length > 0 ? lower : hit.passedOver };
  }
  return null;
}

// A function DECLARATION, not a `const` arrow: TypeScript only narrows on a
// never-returning call when the callee is declared this way, and every caller
// below relies on the narrowing to keep its own return type honest.
function fail(message: string): never {
  throw new Error(`OBJECTSTACK_SPEC_DIST: ${message}`);
}

/**
 * The spec package directory a raw override value names.
 *
 * Accepts what the client hook accepts and a little more — the package dir, its
 * `dist/`, or a built entry file inside it — by walking up to the nearest
 * `package.json` and requiring it to BE the spec package. Realpath'd, because a
 * symlinked override would otherwise produce alias targets whose module ids
 * (which Vite realpaths) never match the vendor-chunk test built from them.
 */
function findSpecPackageDir(raw: string): string {
  const start = path.resolve(raw);
  if (!fs.existsSync(start)) {
    fail(`\`${raw}\` does not exist (resolved to \`${start}\`)`);
  }
  let dir = fs.statSync(start).isDirectory() ? start : path.dirname(start);
  const inspected: string[] = [];
  for (;;) {
    const manifestPath = path.join(dir, 'package.json');
    if (fs.existsSync(manifestPath)) {
      inspected.push(manifestPath);
      let name: unknown;
      try {
        name = (JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { name?: unknown }).name;
      } catch (error) {
        fail(`\`${manifestPath}\` is not readable JSON (${(error as Error).message})`);
      }
      if (name === SPEC_PACKAGE_NAME) {
        try {
          return fs.realpathSync(dir);
        } catch {
          return dir;
        }
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return fail(
    `\`${raw}\` is not inside a \`${SPEC_PACKAGE_NAME}\` package — ` +
      `walked up from \`${start}\` and found ${inspected.length ? inspected.join(', ') : 'no package.json'}`
  );
}

/**
 * Every specifier the package's exports map declares, resolved to the absolute
 * file a browser/ESM bundler takes, with the condition path that chose it.
 *
 * Cross-checked in `scripts/__tests__/vite-objectstack-spec-dist.test.ts`
 * against two resolvers, because no single one covers the map: Node's own
 * (`import.meta.resolve`) for the entries it can express, and a REAL Vite
 * build for the `browser`-carrying ones, which Node cannot express at all —
 * Node does not satisfy `browser`, so it answers with the Node arm by
 * construction. Vite is the resolver this hook models, so it is the oracle
 * that counts where the two disagree. Either way this is not a second opinion
 * about the map; it agrees with the algorithm.
 */
export function readSpecExportResolutions(packageDir: string): SpecExportResolution[] {
  const manifestPath = path.join(packageDir, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { exports?: unknown };
  const exportsMap = manifest.exports;
  if (exportsMap === null || typeof exportsMap !== 'object' || Array.isArray(exportsMap)) {
    fail(`\`${manifestPath}\` declares no exports map, so no subpath can be resolved`);
  }

  const resolutions: SpecExportResolution[] = [];
  for (const [key, value] of Object.entries(exportsMap as Record<string, unknown>)) {
    if (!key.startsWith('.')) {
      fail(`\`${manifestPath}\` exports key \`${key}\` is a condition, not a subpath — unsupported`);
    }
    if (key.includes('*')) {
      // A pattern cannot be expressed as one exact alias, and guessing would
      // reintroduce the silent half-injection this hook exists to prevent.
      fail(`\`${manifestPath}\` exports key \`${key}\` is a wildcard pattern — unsupported by this hook`);
    }
    const picked = pickImportTarget(value);
    if (!picked) {
      fail(
        `\`${manifestPath}\` exports key \`${key}\` resolves to nothing under ` +
          `${[...IMPORT_CONDITIONS].join('/')}`
      );
    }
    const absolute = path.resolve(packageDir, picked.target);
    if (!fs.existsSync(absolute)) {
      fail(
        `\`${manifestPath}\` exports key \`${key}\` names \`${picked.target}\`, which the built package does not contain ` +
          `(expected \`${absolute}\`) — build the spec package before injecting it`
      );
    }
    const specifier = key === '.' ? SPEC_PACKAGE_NAME : `${SPEC_PACKAGE_NAME}/${key.slice(2)}`;
    resolutions.push({
      specifier,
      exportKey: key,
      target: absolute,
      conditionPath: picked.conditionPath,
      passedOver: picked.passedOver,
    });
  }
  if (!resolutions.some((r) => r.specifier === SPEC_PACKAGE_NAME)) {
    fail(`\`${manifestPath}\` exports map has no \`.\` entry, so the bare specifier cannot be resolved`);
  }
  return resolutions;
}

/**
 * Every specifier the package's exports map declares, mapped to its file.
 *
 * The shape callers that only need the table want; `readSpecExportResolutions`
 * is the same pass with the condition path each choice took kept.
 */
export function readSpecExportTargets(packageDir: string): Map<string, string> {
  return new Map(readSpecExportResolutions(packageDir).map((r) => [r.specifier, r.target]));
}

/**
 * The build-log table: which condition arm each specifier came from.
 *
 * Lives beside the resolver rather than in the console config for the reason
 * `specModuleTest` does — one producer, so a second consumer cannot drift into
 * reporting something the resolver did not actually do. Entries where the map
 * offered an alternative this module ALSO satisfies are marked, because those
 * are the only ones where precedence was decided rather than forced.
 */
export function formatConditionReport(injection: SpecDistInjection): string[] {
  const width = Math.max(...injection.resolutions.map((r) => r.specifier.length));
  const lines = [
    `OBJECTSTACK_SPEC_DIST: ${injection.packageDir}`,
    `  ${injection.resolutions.length} exports entries aliased; condition arm chosen per entry:`,
  ];
  for (const r of [...injection.resolutions].sort((a, b) => a.specifier.localeCompare(b.specifier))) {
    const arm = r.conditionPath.length > 0 ? r.conditionPath.join(' > ') : '(unconditional)';
    const over = r.passedOver.length > 0 ? `  [ranked above: ${r.passedOver.join(', ')}]` : '';
    const file = path.relative(injection.packageDir, r.target);
    lines.push(`    ${r.specifier.padEnd(width)}  ${arm}  ->  ${file}${over}`);
  }
  return lines;
}

/**
 * Whether an ancestor `node_modules` of `startDir` contains a directory named
 * `name` — the same upward walk `findSpecPackageDir` does for `package.json`,
 * aimed at `node_modules/<name>` instead.
 *
 * Deliberately NOT `require.resolve(name, { paths: [startDir] })`, though that
 * reads as the obvious tool for the job. Measured against this monorepo's own
 * `apps/console/node_modules/.bin/vite` shim: it exports `NODE_PATH` pointing
 * at pnpm's flat `.pnpm/node_modules` hoist directory, and Node's `paths`
 * option does not suppress `NODE_PATH` — `Module.globalPaths` is consulted
 * REGARDLESS of an explicit `paths` list. Every workspace dependency pnpm has
 * ever hoisted lives there, `zod` included, so `require.resolve` reported the
 * override's own missing `zod` as resolved — checked from `packageDir`,
 * skipped straight over the failure this function exists to catch, silently,
 * every time this hook runs through the real `vite` CLI rather than a bare
 * `node` invocation. A plain directory walk consults nothing global.
 */
function packageResolvesFrom(startDir: string, name: string): boolean {
  let dir = startDir;
  for (;;) {
    if (fs.existsSync(path.join(dir, 'node_modules', name))) return true;
    const parent = path.dirname(dir);
    if (parent === dir) return false;
    dir = parent;
  }
}

/**
 * Confirms the override's own `dependencies` resolve from `packageDir` —
 * the check `readSpecExportTargets` does NOT do.
 *
 * That function validates the override's own files: every exports entry
 * names something the built package contains. It says nothing about what
 * those files `import`. A spec dist built without a reachable `node_modules`
 * passes it cleanly and only fails once a consuming bundler tries to resolve
 * a bare specifier deep inside the injected build — a build-length after the
 * override was read, in an error that names the missing package (`zod`,
 * observed) and never `OBJECTSTACK_SPEC_DIST`.
 *
 * Checked with `packageResolvesFrom`'s directory walk, not `require.resolve`
 * — see that function's own comment for why the obvious choice is wrong here.
 * Either way the cost is the same: directory-existence checks, no module
 * evaluation, nowhere near the cost of a bundler resolve pass.
 *
 * Deliberately narrow: only the manifest's own `dependencies` are checked —
 * not transitive dependencies (this is not a dependency-graph validator, and
 * a broken transitive package fails the same way, just one frame further
 * into that package's own resolution — still at build time, still before any
 * bundling), and not `peerDependencies`. A peer dependency is BY DESIGN
 * supplied by the consuming app rather than living inside the override's own
 * tree, so requiring it to resolve from `packageDir` would fail a correctly
 * built override and misreport a non-problem as one.
 */
function assertSpecDependenciesResolve(packageDir: string): void {
  const manifestPath = path.join(packageDir, 'package.json');
  // Already proven to be valid JSON at this exact path by `findSpecPackageDir`
  // (the caller of this function), so — matching `readSpecExportTargets` next
  // to it — this re-read does not repeat that try/catch.
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as { dependencies?: unknown };
  const dependencies = manifest.dependencies;
  if (dependencies === null || typeof dependencies !== 'object' || Array.isArray(dependencies)) return;

  const unresolved = Object.keys(dependencies as Record<string, unknown>).filter(
    (name) => !packageResolvesFrom(packageDir, name)
  );
  if (unresolved.length > 0) {
    const isSingular = unresolved.length === 1;
    fail(
      `\`${manifestPath}\` declares ${isSingular ? 'a dependency' : 'dependencies'} that ` +
        `${isSingular ? 'does' : 'do'} not resolve from \`${packageDir}\`: ${unresolved.join(', ')} — ` +
        `the override points at a spec dist with no reachable \`node_modules\` for ` +
        `${isSingular ? 'it' : 'them'}. Install the override's own dependencies (or point at a build ` +
        `where they are reachable) before setting \`OBJECTSTACK_SPEC_DIST\``
    );
  }
}

/**
 * Resolve the override, or `null` when it is unset.
 *
 * @param raw            the `OBJECTSTACK_SPEC_DIST` value, unset or empty for none
 * @param vendorChunkTest the config's baseline `vendor-objectstack` group test,
 *                        widened (never replaced) with the override's location
 * @param specModuleTest  the config's baseline "this module id is the spec" test,
 *                        widened the same way — see `SpecDistInjection`
 */
export function resolveSpecDistInjection(
  raw: string | undefined,
  { vendorChunkTest, specModuleTest }: { vendorChunkTest: RegExp; specModuleTest: RegExp }
): SpecDistInjection | null {
  if (!raw || !raw.trim()) return null;

  const packageDir = findSpecPackageDir(raw.trim());
  assertSpecDependenciesResolve(packageDir);
  const resolutions = readSpecExportResolutions(packageDir);
  const targets = new Map(resolutions.map((r) => [r.specifier, r.target]));

  // Subpaths first (sorted for a stable, reviewable table), bare specifier last
  // — see `SpecDistInjection.aliases` for why the order decides correctness.
  const aliases: Record<string, string> = {};
  const subpaths = [...targets.keys()].filter((s) => s !== SPEC_PACKAGE_NAME).sort();
  for (const specifier of subpaths) aliases[specifier] = targets.get(specifier)!;
  aliases[SPEC_PACKAGE_NAME] = targets.get(SPEC_PACKAGE_NAME)!;

  const posixDir = packageDir.split(path.sep).join('/');

  // One widening rule, applied to every module-id test the caller hands in: the
  // baseline stays whole and the override's location joins it as an extra
  // alternative. Widened, never replaced — an injected build still resolves
  // plenty of installed `@objectstack/*` through node_modules, and a test that
  // only knew the override would stop seeing those. Keeping it a single local
  // function is deliberate too: two tests widened by two hand-written copies of
  // this expression is how the consumers drift apart in the first place.
  const widen = (baseline: RegExp): RegExp =>
    new RegExp(`${baseline.source}|${escapeRegExp(posixDir)}${SEPARATOR_CLASS}`);

  return {
    packageDir,
    aliases,
    fsAllow: [packageDir],
    resolutions,
    vendorChunkTest: widen(vendorChunkTest),
    specModuleTest: widen(specModuleTest),
  };
}

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { build } from 'vite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import {
  SPEC_PACKAGE_NAME,
  escapeRegExp,
  formatConditionReport,
  readSpecExportTargets,
  resolveSpecDistInjection,
} from '../vite-objectstack-spec-dist';

/**
 * objectui#4854 — `apps/console/vite.config.ts` honours `OBJECTSTACK_SPEC_DIST`,
 * so a framework build can bundle the console against ITS OWN `@objectstack/spec`
 * instead of the last published one (mechanism ruled on objectstack#8134).
 *
 * Two facts are pinned here, and they pull in opposite directions on purpose:
 *
 *   1. **Set → every subpath is mapped.** The client hook this mirrors is one
 *      prefix alias, which is safe only because `@objectstack/client` exports a
 *      single entry. The spec's map has 19 and redirects each into `dist/`, so a
 *      copied client line rewrites `@objectstack/spec/ui` to a path that does not
 *      exist — measured as 214 broken import sites for `/ui` alone. The
 *      reconciliation case below therefore checks the derivation against Node's
 *      OWN resolver, entry by entry, and separately sweeps every spec specifier
 *      this repository actually imports.
 *   2. **Unset → nothing moves.** Each of the four surfaces the hook can touch
 *      (`resolve.alias`, `optimizeDeps.include`, the `vendor-objectstack` chunk
 *      test, `server.fs.allow`) is pinned at its baseline value, read off the
 *      REAL console config rather than off the helper, so a hook that stopped
 *      being conditional turns these red rather than shipping a silently
 *      different production bundle.
 *
 * Reverse verification, direction predicted BEFORE running. Both plain RED — the
 * derivation is the sole input to case 1 and the `null` branch the sole input to
 * case 2, so a mutation in either can only ADD findings; neither has the
 * count-shaped or inverted direction some pins do. Predicted, then measured:
 *
 *   - **Drop one subpath** from the derived table (`… && s !==
 *     '@objectstack/spec/ui'`) → 5 red. Worth recording precisely, because the
 *     obvious expectation is wrong: the dropped specifier does NOT show up as
 *     "no alias". It falls through to the bare entry and is reported as
 *     `@objectstack/spec/ui -> …/dist/index.mjs/ui` — a path that cannot exist
 *     — so the finding lands in the repo sweep's `unresolved` list, while
 *     `missing` stays empty. The reconciliation case fails one step earlier, on
 *     19-vs-18.
 *   - **Make the hook unconditional** (default the env read to the installed
 *     spec dir) → 2 red, both in the console-config block: the alias table gains
 *     19 `@objectstack` keys, and `optimizeDeps.include` drops from 7 to 3.
 *
 * The real-build cases at the bottom carry their own control rather than a
 * mutation: the same bundle is built a second time through the literal
 * client-hook alias, and a green build there would mean this whole derivation is
 * unnecessary. Measured: it fails with 2 resolve errors.
 */

const require_ = createRequire(import.meta.url);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * The baseline `vendor-objectstack` group test, as the console config spells it.
 *
 * Mirror of `VENDOR_OBJECTSTACK_TEST` in `apps/console/vite.config.ts`. When
 * that constant changes this one must change with it — but do NOT treat the two
 * assertions below as a string to re-paste. They pin two different things:
 * `.source` equality pins that the spec-dist override left the baseline INERT,
 * and `startsWith` pins that the override WIDENED the baseline instead of
 * replacing it. The semantic assertions beside them say which modules the
 * grouping is supposed to catch, so a future edit that keeps the shape while
 * changing the membership still fails.
 *
 * The negative lookaheads exclude `@objectstack/lint` from the group: it is
 * imported lazily (app-shell's `capabilityLint.ts`) and a group that claims it
 * overrides that laziness, putting ~89 KiB gzipped on every console page load
 * (objectui#5266). Both alternatives need the guard — under pnpm the module id
 * contains both `/@objectstack+` and `/node_modules/@objectstack/`.
 */
const BASE_VENDOR_TEST =
  /([\\/]node_modules[\\/]@objectstack[\\/](?!lint[\\/])|[\\/]@objectstack\+(?!lint@))/;

/**
 * The baseline "this module id is the spec" test, as the console config spells it.
 *
 * Mirror of `SPEC_MODULE_TEST` in `apps/console/vite.config.ts`. Deliberately
 * NOT the same regex as `BASE_VENDOR_TEST`: that one is the whole vendor scope
 * minus the linter, and the counter-probe it feeds has to be able to distinguish
 * "an eager chunk holds the spec" from "an eager chunk holds some
 * `@objectstack` package". objectui#5388 is what happens when the two are
 * conflated in the other direction — one consumer reading the injection, the
 * other not.
 */
const BASE_SPEC_TEST = /@objectstack[\\/+]spec/;

/** The installed spec package — a real, fully built override target. */
const installedSpecDir = path.dirname(require_.resolve('@objectstack/spec/package.json'));

const inject = (raw: string | undefined) =>
  resolveSpecDistInjection(raw, {
    vendorChunkTest: BASE_VENDOR_TEST,
    specModuleTest: BASE_SPEC_TEST,
  });

/**
 * A fresh evaluation of the console's Vite config, keyed by `query`.
 *
 * The specifier is assembled at runtime on purpose. A literal one would pull
 * `apps/console/vite.config.ts` into THIS program, where it does not belong —
 * `tsconfig.scripts.json` leaves `allowImportingTsExtensions` off, so its own
 * `.ts` imports become TS5097 in a project that never compiled them before.
 * Vitest resolves the runtime specifier relative to this file identically.
 */
async function loadConsoleConfig(query = ''): Promise<any> {
  const specifier = `../../apps/console/vite.config.ts${query}`;
  return (await import(/* @vite-ignore */ specifier)).default;
}

/**
 * Vite's own alias matcher, transcribed from `node_modules/vite` (`matches()` in
 * the alias plugin): exact hit, or the specifier continues past a separator.
 * First match wins, which is why the table's key ORDER decides correctness.
 */
function resolveThroughAliases(aliases: Record<string, string>, specifier: string): string | null {
  for (const [find, replacement] of Object.entries(aliases)) {
    if (specifier === find || specifier.startsWith(`${find}/`)) {
      return specifier.replace(find, replacement);
    }
  }
  return null;
}

/**
 * A package that must resolve, so a run in which the oracle resolved NOTHING is
 * distinguishable from a run in which it agreed with everything.
 */
const VITE_ORACLE_CONTROL = 'react';

/**
 * A throwaway root for the Vite oracle below, made under `node_modules/`.
 *
 * Two constraints decide this path and they pull in opposite directions.
 *
 * 1. It may NOT sit at `os.tmpdir()` like the fixtures elsewhere in this file.
 *    Bare-specifier resolution walks up from the importer looking for
 *    `node_modules`, and from `/tmp` there is none to find. Measured, and worth
 *    recording because it fails in the direction that reads as a result: every
 *    specifier came back `(unresolved)`, which an oracle without
 *    `VITE_ORACLE_CONTROL` would have reported as "no disagreements".
 * 2. It may NOT sit directly in the repo root either (objectui#9468). The i18n
 *    dead-key gate sweeps the whole repo root in one `grep -rFn` pass, and that
 *    grep exits 2 — not 1 — when a directory it has already enumerated is
 *    removed before it descends into it. `textFootprint()` in
 *    `scripts/check-i18n-dead-keys.mjs` rethrows every status but 1 deliberately
 *    and its comment says why, so an oracle run scheduled concurrently with that
 *    gate's test in the same shard took the whole shard down with it. The
 *    occurrences, with their job ids, are recorded on objectui#9468 — including
 *    one that ejected an already-green pull request from the merge queue.
 *
 * `<repoRoot>/node_modules` satisfies both: it is still inside the repository,
 * so the walk-up in (1) finds it, and it is skipped by the repo-wide scanners in
 * `scripts/` — the i18n sweep's own skip set among them — so nothing transient
 * placed here is ever walked. `check-action-ref-convention.test.ts` already puts
 * its throwaway root in the same place.
 *
 * ⚠ The invariant is POSITIONAL, not a name. Teaching one scanner to skip a
 * `.vite-oracle-*` prefix would fix that scanner and leave every other repo-root
 * sweep exposed to the next scratch directory anyone adds; the pin below
 * therefore asserts the position, not the prefix.
 */
function makeOracleScratchRoot(): string {
  return fs.mkdtempSync(path.join(repoRoot, 'node_modules', '.vite-oracle-9408-'));
}

/**
 * What VITE resolves each specifier to, with no alias table in play.
 *
 * The oracle for objectui#9408. Node's `import.meta.resolve` cannot express the
 * `browser` condition — it does not satisfy it — so on the five entries whose
 * map ranks `browser` first it answers with the Node arm no matter what the map
 * says, which is the exact failure this hook shipped for. Vite satisfies it, and
 * Vite is what the console builds with, so it is the resolver the derivation has
 * to agree with.
 *
 * The throwaway root it builds in comes from `makeOracleScratchRoot()`, whose
 * docstring carries the two constraints that decide where such a root may live.
 */
async function viteResolves(specifiers: string[]): Promise<Map<string, string | null>> {
  const resolved = new Map<string, string | null>();
  const dir = makeOracleScratchRoot();
  try {
    const entry = path.join(dir, 'entry.mjs');
    fs.writeFileSync(entry, 'export const probe = 1;\n');
    await build({
      root: dir,
      logLevel: 'silent',
      configFile: false,
      build: { write: false, lib: { entry, formats: ['es'], fileName: 'oracle' } },
      plugins: [
        {
          name: 'objectui-9408-resolve-oracle',
          async buildStart(this: { resolve: (id: string, importer: string, opts: object) => Promise<{ id: string } | null> }) {
            for (const specifier of specifiers) {
              const hit = await this.resolve(specifier, entry, { skipSelf: true });
              resolved.set(specifier, hit ? fs.realpathSync(hit.id) : null);
            }
          },
        },
      ],
    });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  return resolved;
}

describe('objectui#9468: the oracle\'s scratch root is never a repo-root entry', () => {
  it('makes it under node_modules, which the repo-wide sweeps already skip', () => {
    // Asserts the REAL creation rather than a constant: a scratch directory
    // that is a direct child of the repo root is what `grep -r <repoRoot>`
    // enumerates and then trips over when it vanishes mid-walk. Moving it back
    // there would keep every other assertion in this file green, which is why
    // the position needs an assertion of its own.
    const dir = makeOracleScratchRoot();
    try {
      expect(path.relative(repoRoot, dir).split(path.sep)[0]).toBe('node_modules');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('objectui#4854: OBJECTSTACK_SPEC_DIST is subpath-aware', () => {
  it('maps every exports-map entry to the file the BUNDLER resolves', async () => {
    const injection = inject(installedSpecDir);
    expect(injection).not.toBeNull();

    const manifest = JSON.parse(
      fs.readFileSync(path.join(installedSpecDir, 'package.json'), 'utf8')
    ) as { exports: Record<string, unknown> };
    const declared = Object.keys(manifest.exports);

    // Anti-vacuity: the map this is reconciled against is the measured 19-entry
    // one, not an empty object a silently-changed reader would also "cover".
    // 18 -> 19 on the @objectstack/spec 17.2.0 refresh (objectui#5668): the
    // one added subpath, measured by diffing 17.1.0's exports map against
    // 17.2.0's, is `./meta-spelling` — nothing was removed. The pin did its
    // job on that bump: the un-updated 18 turned this red in CI rather than
    // letting the new entry ride through unreconciled.
    expect(declared.length).toBe(19);
    expect(Object.keys(injection!.aliases).length).toBe(declared.length);

    // objectui#9408 — the population splits, and WHICH oracle applies is the
    // whole point. Node's resolver does not satisfy `browser`, so for an entry
    // that declares one it answers with the Node arm BY CONSTRUCTION and cannot
    // be the oracle for a browser bundler. Partitioned off the MANIFEST, never
    // off this module's own output: an oracle chosen by the thing under test
    // agrees with it for free.
    const declaresBrowser = (key: string): boolean => {
      const value = manifest.exports[key];
      return (
        value !== null && typeof value === 'object' && !Array.isArray(value) && Object.hasOwn(value, 'browser')
      );
    };
    const browserKeys = declared.filter(declaresBrowser);
    const nodeOracleKeys = declared.filter((k) => !declaresBrowser(k));

    // Anti-vacuity, both halves. 5 on @objectstack/spec 17.4.0 (`.`, `./data`,
    // `./system`, `./kernel`, `./cloud`) — pinned exactly, like the 19 above,
    // because an unpinned browser set is precisely how this went unnoticed:
    // objectui#9408 was FILED naming `./api` as browser-first, and by the time
    // it was worked `./api` had lost its browser arm upstream with nothing
    // anywhere to notice the move. A bump re-pins this and says what changed.
    expect(browserKeys.sort()).toEqual(['.', './cloud', './data', './kernel', './system']);
    expect(nodeOracleKeys.length).toBe(declared.length - browserKeys.length);
    expect(nodeOracleKeys.length).toBeGreaterThan(0);

    const missing: string[] = [];
    const mismatched: string[] = [];
    const notDiverged: string[] = [];
    for (const key of declared) {
      const specifier = key === '.' ? SPEC_PACKAGE_NAME : `${SPEC_PACKAGE_NAME}/${key.slice(2)}`;
      const aliased = resolveThroughAliases(injection!.aliases, specifier);
      if (!aliased) {
        missing.push(specifier);
        continue;
      }
      // What Node's ESM resolver returns for the same specifier under the
      // `import` condition — the algorithm, not a second reading of the map.
      const node = fs.realpathSync(fileURLToPath(import.meta.resolve(specifier)));
      if (declaresBrowser(key)) {
        // The divergence is the FIX, so it is pinned as such rather than
        // tolerated: the map ranks `browser` first, this module honours that,
        // and Node — which cannot — must therefore land somewhere else. Were
        // these to agree again, the array-order bug would be back.
        if (fs.realpathSync(aliased) === node) {
          notDiverged.push(`${specifier}: both -> ${node}`);
        }
      } else if (fs.realpathSync(aliased) !== node) {
        mismatched.push(`${specifier}: alias -> ${aliased}, node -> ${node}`);
      }
    }
    expect(missing, 'exports-map entries with no alias — these keep resolving to the INSTALLED spec').toEqual([]);
    expect(mismatched, 'aliases disagreeing with Node on entries Node CAN express').toEqual([]);
    expect(
      notDiverged,
      'entries whose map ranks `browser` first but that still resolve to the Node arm — objectui#9408'
    ).toEqual([]);
  });

  it('agrees with a REAL Vite build on every entry, `browser` arm included', async () => {
    // The oracle that actually counts. Vite is the resolver this hook MODELS,
    // and unlike Node it satisfies `browser`, so it can answer for all 19
    // entries where Node can only answer for 14. Run through a real build
    // rather than a transcription, for the same reason the alias-matcher cases
    // below bundle for real: a transcribed algorithm agrees with its own
    // transcription, not with Vite.
    const injection = inject(installedSpecDir)!;
    const specifiers = Object.keys(injection.aliases);
    const resolved = await viteResolves([...specifiers, VITE_ORACLE_CONTROL]);

    // Control with a KNOWN direction, in the SAME run: a package that must
    // resolve. Without it an oracle that silently resolved NOTHING would report
    // every specifier as "no disagreement" and read as a clean pass.
    expect(resolved.get(VITE_ORACLE_CONTROL), 'Vite oracle resolved nothing — broken instrument').toBeTruthy();

    const disagreed: string[] = [];
    for (const specifier of specifiers) {
      const vite = resolved.get(specifier);
      if (!vite) {
        disagreed.push(`${specifier}: vite -> (unresolved)`);
        continue;
      }
      const ours = fs.realpathSync(injection.aliases[specifier]);
      if (ours !== vite) disagreed.push(`${specifier}: hook -> ${ours}, vite -> ${vite}`);
    }
    expect(disagreed, 'entries where the hook and Vite pick different files').toEqual([]);

    // Anti-vacuity: the sweep really did exercise the browser arm, i.e. the
    // agreement above is not agreement about 19 Node-arm files.
    const browserArm = specifiers.filter((s) => resolved.get(s)?.includes(`${path.sep}browser${path.sep}`));
    expect(browserArm.length).toBe(5);
  });

  it('does not assume `dist/<name>/index.mjs` — `./openapi.json` is the counterexample', () => {
    const injection = inject(installedSpecDir)!;
    // The obvious hand-written rule the issue sketched would emit
    // `dist/openapi.json/index.mjs` here. The map says otherwise, and the map wins.
    expect(injection.aliases[`${SPEC_PACKAGE_NAME}/openapi.json`]).toBe(
      path.join(installedSpecDir, 'json-schema/openapi.json')
    );
    expect(injection.aliases[`${SPEC_PACKAGE_NAME}/package.json`]).toBe(
      path.join(installedSpecDir, 'package.json')
    );
    expect(injection.aliases[`${SPEC_PACKAGE_NAME}/ui`]).toBe(
      path.join(installedSpecDir, 'dist/ui/index.mjs')
    );
  });

  it('orders the bare specifier LAST so subpaths win the prefix match', () => {
    const keys = Object.keys(inject(installedSpecDir)!.aliases);
    expect(keys[keys.length - 1]).toBe(SPEC_PACKAGE_NAME);
    expect(keys.filter((k) => k === SPEC_PACKAGE_NAME)).toHaveLength(1);

    // The consequence, stated as behaviour: a subpath resolves to its own entry…
    const injection = inject(installedSpecDir)!;
    expect(resolveThroughAliases(injection.aliases, `${SPEC_PACKAGE_NAME}/ui`)).toBe(
      injection.aliases[`${SPEC_PACKAGE_NAME}/ui`]
    );
    // …and a subpath the override does NOT declare is rewritten to a path that
    // cannot exist, i.e. a loud resolve error naming the specifier, rather than
    // quietly falling through to the installed spec.
    const undeclared = resolveThroughAliases(injection.aliases, `${SPEC_PACKAGE_NAME}/not-a-real-subpath`);
    expect(undeclared).toBe(`${injection.aliases[SPEC_PACKAGE_NAME]}/not-a-real-subpath`);
    expect(fs.existsSync(undeclared!)).toBe(false);
  });

  it('covers every spec specifier this repository imports', () => {
    const injection = inject(installedSpecDir)!;
    const specifiers = collectSpecSpecifiers();

    // Anti-vacuity: the sweep found the measured surface, not an empty scan.
    // 16 distinct specifiers since objectui#8225 removed the repository's only
    // `@objectstack/spec/cloud` literal (the `Cloud` namespace re-export in
    // `packages/types/src/index.ts`; step 2 of the objectstack#16325 chain that
    // deletes the `/cloud` subpath upstream) — 17 before that, `/ui` and `/data`
    // the heaviest. A floor, so a specifier gained does not move it; one lost
    // does, and the commit that loses it re-pins it here and says why.
    expect(specifiers.size).toBeGreaterThanOrEqual(16);
    expect([...specifiers]).toContain(`${SPEC_PACKAGE_NAME}/ui`);
    expect([...specifiers]).toContain(SPEC_PACKAGE_NAME);

    const unresolved: string[] = [];
    for (const specifier of specifiers) {
      const aliased = resolveThroughAliases(injection.aliases, specifier);
      if (!aliased || !fs.existsSync(aliased)) unresolved.push(`${specifier} -> ${aliased ?? '(no alias)'}`);
    }
    expect(unresolved, 'specifiers the injected spec cannot serve').toEqual([]);
  });

  it('allows the dev server to read the injected package', () => {
    const injection = inject(installedSpecDir)!;
    expect(injection.fsAllow).toEqual([fs.realpathSync(installedSpecDir)]);
    expect(injection.packageDir).toBe(fs.realpathSync(installedSpecDir));
  });

  it('keeps the injected spec inside the `vendor-objectstack` chunk', () => {
    const injection = inject(installedSpecDir)!;
    const outOfTree = '/framework/packages/spec';
    const outOfTreeInjection = resolveSpecDistInjection(installedSpecDir, {
      vendorChunkTest: BASE_VENDOR_TEST,
      specModuleTest: BASE_SPEC_TEST,
    })!;

    // The baseline test cannot see an injected package: that is the whole
    // reason the group test is widened rather than left alone.
    expect(BASE_VENDOR_TEST.test(`${outOfTree}/dist/ui/index.mjs`)).toBe(false);
    expect(injection.vendorChunkTest.test(`${injection.packageDir}/dist/ui/index.mjs`)).toBe(true);
    // Widened, never replaced — the installed-package arms still match.
    expect(outOfTreeInjection.vendorChunkTest.test('/repo/node_modules/@objectstack/client/dist/index.mjs')).toBe(true);
    expect(outOfTreeInjection.vendorChunkTest.test('/repo/node_modules/.pnpm/@objectstack+spec@1/x.mjs')).toBe(true);
    // And it stays a spec-shaped test, not a catch-all.
    expect(injection.vendorChunkTest.test('/repo/packages/core/src/index.ts')).toBe(false);
    // The baseline arms' `@objectstack/lint` exclusion survives the widening.
    expect(
      outOfTreeInjection.vendorChunkTest.test(
        '/repo/node_modules/.pnpm/@objectstack+lint@17.0.0/node_modules/@objectstack/lint/dist/index.js'
      )
    ).toBe(false);
  });

  it('keeps the injected spec RECOGNISABLE AS THE SPEC, for the counter-probe', () => {
    // objectui#5388. The chunk grouping was not the only consumer of "where
    // does the spec live" — `assertLazyLinterStaysLazy` asks the same question
    // of the emitted module ids, and answering it from an un-widened private
    // regex failed every build made with the override set.
    const injection = inject(installedSpecDir)!;
    const injectedId = `${injection.packageDir}/dist/ui/index.mjs`;

    // Anti-vacuity: the baseline genuinely cannot see an injected package. If
    // this ever went true the assertion below would pass without the widening
    // doing anything, and the bug would be back with a green test over it.
    expect(BASE_SPEC_TEST.test('/framework/packages/spec/dist/ui/index.mjs')).toBe(false);
    expect(injection.specModuleTest.test(injectedId)).toBe(true);

    // Widened, never replaced — an injected build still resolves plenty of
    // installed packages through node_modules, in both spellings.
    expect(injection.specModuleTest.test('/repo/node_modules/@objectstack/spec/dist/index.js')).toBe(true);
    expect(injection.specModuleTest.test('/repo/node_modules/.pnpm/@objectstack+spec@17.0.0/x.js')).toBe(true);

    // And it stays a SPEC test, not the vendor group's. The counter-probe's job
    // is to prove the walk can see the spec chunk specifically; a test that also
    // matched `@objectstack/client` would keep the build green by lowering the
    // bar rather than by seeing the spec.
    expect(injection.specModuleTest.test('/repo/node_modules/@objectstack/client/dist/index.js')).toBe(false);
    expect(injection.vendorChunkTest.test('/repo/node_modules/@objectstack/client/dist/index.js')).toBe(true);
    expect(injection.specModuleTest.test('/repo/packages/core/src/index.ts')).toBe(false);
  });

  it('accepts a `dist/` or entry-file spelling of the same package', () => {
    const fromDir = inject(installedSpecDir)!;
    const fromDist = inject(path.join(installedSpecDir, 'dist'))!;
    const fromEntry = inject(path.join(installedSpecDir, 'dist/index.mjs'))!;
    expect(fromDist.aliases).toEqual(fromDir.aliases);
    expect(fromEntry.aliases).toEqual(fromDir.aliases);
  });
});

describe('objectui#4854: the override fails loudly, never leniently', () => {
  it('is inert when unset, empty, or blank', () => {
    for (const raw of [undefined, '', '   ']) {
      expect(inject(raw)).toBeNull();
    }
  });

  it('throws when the path does not exist', () => {
    expect(() => inject('/nope/objectstack-spec-4854')).toThrow(/does not exist/);
  });

  it('throws when the path is not the spec package', () => {
    // The repo root has a `package.json`, so this fails on IDENTITY rather than
    // on absence — the case a name-blind walk-up would accept.
    expect(() => inject(repoRoot)).toThrow(/is not inside a `@objectstack\/spec` package/);
  });

  it('throws when the built package is missing a file its exports map names', () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-dist-4854-'));
    try {
      fs.writeFileSync(
        path.join(fixture, 'package.json'),
        JSON.stringify({
          name: SPEC_PACKAGE_NAME,
          exports: {
            '.': { import: { types: './dist/index.d.mts', default: './dist/index.mjs' } },
          },
        })
      );
      // A half-built override is exactly how a silent skew would return: the
      // bundle would keep resolving `@objectstack/spec` from the lockfile while
      // the build reported success.
      expect(() => inject(fixture)).toThrow(/does not contain/);
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

  it('throws on a wildcard exports pattern rather than guessing', () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-dist-4854-'));
    try {
      fs.mkdirSync(path.join(fixture, 'dist'));
      fs.writeFileSync(path.join(fixture, 'dist/index.mjs'), 'export {};\n');
      fs.writeFileSync(
        path.join(fixture, 'package.json'),
        JSON.stringify({
          name: SPEC_PACKAGE_NAME,
          exports: { '.': './dist/index.mjs', './*': './dist/*/index.mjs' },
        })
      );
      expect(() => inject(fixture)).toThrow(/wildcard pattern/);
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

  it('never picks the `types` condition, which sits first in the real map', () => {
    for (const target of readSpecExportTargets(installedSpecDir).values()) {
      expect(target.endsWith('.d.ts') || target.endsWith('.d.mts')).toBe(false);
    }
  });
});

/**
 * objectui#5391 — `readSpecExportTargets` validates the override's own FILES;
 * it says nothing about what those files `import`. A spec dist built without
 * a reachable `node_modules` passed cleanly and only failed once a consuming
 * bundler tried to resolve a bare specifier deep inside the injected build —
 * measured (module header, `assertSpecDependenciesResolve`) as a rolldown
 * `failed to resolve zod` a build-length after the override was read, in an
 * error naming `zod` and never `OBJECTSTACK_SPEC_DIST`.
 */
describe('objectui#5391: the override validates its own dependencies too', () => {
  /** A minimal, legally-shaped spec package with a declared `dependencies` entry. */
  function makeFixtureWithDependency(dependencies: Record<string, string>): string {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-dist-5391-'));
    fs.mkdirSync(path.join(fixture, 'dist'));
    fs.writeFileSync(path.join(fixture, 'dist/index.mjs'), 'export {};\n');
    fs.writeFileSync(
      path.join(fixture, 'package.json'),
      JSON.stringify({
        name: SPEC_PACKAGE_NAME,
        exports: { '.': './dist/index.mjs' },
        dependencies,
      })
    );
    return fixture;
  }

  it('throws, naming the override and the unresolvable dependency, when a declared dependency has no reachable `node_modules`', () => {
    const fixture = makeFixtureWithDependency({ zod: '^4.0.0' });
    try {
      // The override (packageDir/manifest path) AND the missing dependency
      // must both be in the message — a fail-fast that only says "validation
      // failed" reproduces the original diagnosis problem one step earlier.
      expect(() => inject(fixture)).toThrow(/OBJECTSTACK_SPEC_DIST/);
      expect(() => inject(fixture)).toThrow(new RegExp(escapeRegExp(fs.realpathSync(fixture))));
      expect(() => inject(fixture)).toThrow(/does not resolve.*zod/s);
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

  it('names every unresolvable dependency, not just the first', () => {
    const fixture = makeFixtureWithDependency({ zod: '^4.0.0', 'pg-connection-string': '^2.0.0' });
    try {
      expect(() => inject(fixture)).toThrow(/zod, pg-connection-string/);
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

  it('passes once the declared dependency is reachable from the package directory', () => {
    const fixture = makeFixtureWithDependency({ zod: '^4.0.0' });
    try {
      fs.mkdirSync(path.join(fixture, 'node_modules'));
      // A minimal but real package at the expected location — the fixture
      // does not need the REAL zod, only something a directory walk finds.
      fs.mkdirSync(path.join(fixture, 'node_modules/zod'));
      fs.writeFileSync(
        path.join(fixture, 'node_modules/zod/package.json'),
        JSON.stringify({ name: 'zod', version: '0.0.0-fixture' })
      );
      expect(inject(fixture)).not.toBeNull();
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

  it('finds a dependency hoisted to an ANCESTOR `node_modules`, not only the package\'s own', () => {
    // pnpm/npm both routinely hoist a dependency above the package that
    // declares it; the check has to walk up, not just look inside `packageDir`.
    //
    // The whole fixture tree lives under its OWN `mkdtempSync` root — never at
    // `os.tmpdir()` itself — because that directory is shared with every other
    // process on the machine (parallel test runs, other agents' worktrees); a
    // `node_modules` planted directly there would be both a collision risk and
    // stray shared state this suite has no business creating.
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-dist-5391-'));
    try {
      const fixture = path.join(root, 'workspace', SPEC_PACKAGE_NAME.split('/')[1]);
      fs.mkdirSync(path.join(fixture, 'dist'), { recursive: true });
      fs.writeFileSync(path.join(fixture, 'dist/index.mjs'), 'export {};\n');
      fs.writeFileSync(
        path.join(fixture, 'package.json'),
        JSON.stringify({
          name: SPEC_PACKAGE_NAME,
          exports: { '.': './dist/index.mjs' },
          dependencies: { zod: '^4.0.0' },
        })
      );
      // Hoisted to `root/workspace/node_modules` — an ANCESTOR of `fixture`,
      // not `fixture`'s own `node_modules` (which does not exist here at all).
      fs.mkdirSync(path.join(root, 'workspace/node_modules/zod'), { recursive: true });
      fs.writeFileSync(
        path.join(root, 'workspace/node_modules/zod/package.json'),
        JSON.stringify({ name: 'zod', version: '0.0.0-fixture' })
      );
      expect(inject(fixture)).not.toBeNull();
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });

  it('does NOT require `peerDependencies` to resolve from the package directory', () => {
    // A peer dependency is supplied by the CONSUMING app, not the override's
    // own tree — requiring it here would fail a correctly built override.
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-dist-5391-'));
    try {
      fs.mkdirSync(path.join(fixture, 'dist'));
      fs.writeFileSync(path.join(fixture, 'dist/index.mjs'), 'export {};\n');
      fs.writeFileSync(
        path.join(fixture, 'package.json'),
        JSON.stringify({
          name: SPEC_PACKAGE_NAME,
          exports: { '.': './dist/index.mjs' },
          peerDependencies: { ai: '^7.0.0' },
        })
      );
      expect(inject(fixture)).not.toBeNull();
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

  it('is inert when `dependencies` is absent', () => {
    const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-dist-5391-'));
    try {
      fs.mkdirSync(path.join(fixture, 'dist'));
      fs.writeFileSync(path.join(fixture, 'dist/index.mjs'), 'export {};\n');
      fs.writeFileSync(
        path.join(fixture, 'package.json'),
        JSON.stringify({ name: SPEC_PACKAGE_NAME, exports: { '.': './dist/index.mjs' } })
      );
      expect(inject(fixture)).not.toBeNull();
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

  it('the REAL installed spec — measured to declare `zod` and `pg-connection-string` — passes', () => {
    // Anti-vacuity: this only means something if the installed package
    // actually declares dependencies for the check to walk.
    const manifest = JSON.parse(
      fs.readFileSync(path.join(installedSpecDir, 'package.json'), 'utf8')
    ) as { dependencies?: Record<string, string> };
    expect(Object.keys(manifest.dependencies ?? {}).length).toBeGreaterThan(0);
    expect(manifest.dependencies).toHaveProperty('zod');
    expect(inject(installedSpecDir)).not.toBeNull();
  });

  /**
   * The regression this hook exists to catch, in a form that pins the FIX
   * rather than only the symptom.
   *
   * `apps/console/node_modules/.bin/vite` — pnpm's own shim — exports
   * `NODE_PATH` pointing at pnpm's flat `.pnpm/node_modules` hoist directory,
   * which holds a copy of nearly every package the workspace has ever
   * installed. Node's module resolution consults `NODE_PATH`
   * (`Module.globalPaths`) REGARDLESS of an explicit `paths` option, so a
   * dependency check built on `require.resolve(name, { paths: [packageDir] })`
   * silently passed for ANY package name that happens to be hoisted anywhere
   * in the workspace — which, for a real npm package name like `typescript`,
   * is every one of them. Measured: that version of this check never caught
   * anything when run through the real `vite` CLI, only through a bare `node`
   * invocation that never set `NODE_PATH` — the one path this hook actually
   * runs on in production. `typescript` here stands in for that failure mode:
   * a name this repository has installed SOMEWHERE, but not inside this
   * fixture's own tree, which is the only tree that should count.
   */
  it('is not fooled by a dependency name that resolves globally but not from the package directory', () => {
    // Anti-vacuity: `typescript` really is reachable from somewhere ordinary
    // in this repo — the failure mode under test is specifically that
    // reachability elsewhere must NOT count as reachability from `packageDir`.
    expect(() => require_.resolve('typescript')).not.toThrow();
    const fixture = makeFixtureWithDependency({ typescript: '^5.0.0' });
    try {
      expect(() => inject(fixture)).toThrow(/does not resolve.*typescript/s);
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });
});

/* -------------------------------------------------------------------------- */
/* objectui#9408 — whose precedence wins, and saying which arm was taken.       */
/* -------------------------------------------------------------------------- */

/**
 * The resolver used to walk its OWN `['import', 'module', 'browser', 'default']`
 * array, so a consumer-side ranking overrode the precedence the package
 * declared with its key order. Measured on `@objectstack/spec@17.4.0`, both
 * sides in one run: the hook returned `dist/index.mjs` for the five
 * `browser`-first entries while Vite returned `dist/browser/index.mjs`.
 *
 * The cases above pin that against the REAL map, which is the strongest form
 * but also the most perishable — the filed card named `./api` as browser-first
 * and upstream had already dropped that arm by the time it was worked. These
 * cases pin the ALGORITHM instead, on fixtures that cannot move under us, so
 * the rule survives any shape the published map takes next.
 *
 * Reverse verification, direction predicted before running: plain RED, and the
 * mutation is the bug itself. Restoring the array walk
 * (`for (const condition of ['import','module','browser','default'])` against
 * `Object.hasOwn`) → the `browser`-first case below fails with
 * `dist/node.mjs`, and the `import`-first case stays GREEN. That asymmetry is
 * the point: it is why reordering the array was never the fix, and why a
 * one-direction fixture would have ratified the bug.
 */
describe('objectui#9408: the exports map declares precedence, not this module', () => {
  /**
   * A legal spec package whose one subpath declares `browser` and `import` in a
   * caller-chosen ORDER, with a distinct file behind each arm.
   */
  function makeOrderedFixture(order: ('browser' | 'import')[]): string {
    const fixture = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-dist-9408-')));
    fs.mkdirSync(path.join(fixture, 'dist'), { recursive: true });
    for (const name of ['node', 'browser']) {
      fs.writeFileSync(path.join(fixture, `dist/${name}.mjs`), `export const arm = '${name}';\n`);
    }
    // `types` first inside every arm, exactly as the real map spells it — the
    // condition a key-order walk reaches BEFORE anything it should take.
    const arms: Record<string, unknown> = {
      browser: { types: './dist/browser.d.mts', default: './dist/browser.mjs' },
      import: { types: './dist/node.d.mts', default: './dist/node.mjs' },
    };
    fs.writeFileSync(
      path.join(fixture, 'package.json'),
      JSON.stringify({
        name: SPEC_PACKAGE_NAME,
        // Object key order IS the declaration order for these names: they are
        // not integer-like, so JavaScript preserves insertion order.
        exports: { '.': Object.fromEntries(order.map((c) => [c, arms[c]])) },
      })
    );
    return fixture;
  }

  const armOf = (fixture: string): string =>
    path.basename(inject(fixture)!.aliases[SPEC_PACKAGE_NAME]);

  it('takes `browser` when the map ranks `browser` first', () => {
    const fixture = makeOrderedFixture(['browser', 'import']);
    try {
      expect(armOf(fixture)).toBe('browser.mjs');
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

  it('takes `import` when the SAME two conditions are ranked the other way', () => {
    // The control, and the reason direction (b) on the card — reordering the
    // array to put `browser` first — would have been wrong. A module that
    // simply prefers `browser` passes the case above and fails this one.
    const fixture = makeOrderedFixture(['import', 'browser']);
    try {
      expect(armOf(fixture)).toBe('node.mjs');
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

  it('still never takes `types`, which a key-order walk reaches first of all', () => {
    // Under the old array walk `types` was skipped because it was absent from
    // the preference list. Under a key-order walk it is the FIRST key in every
    // arm, so the omission stopped being incidental and became load-bearing.
    for (const order of [['browser', 'import'], ['import', 'browser']] as const) {
      const fixture = makeOrderedFixture([...order]);
      try {
        const target = inject(fixture)!.aliases[SPEC_PACKAGE_NAME];
        expect(target.endsWith('.d.mts') || target.endsWith('.d.ts')).toBe(false);
      } finally {
        fs.rmSync(fixture, { recursive: true, force: true });
      }
    }
  });

  it('names the conditions it satisfies when an entry offers none of them', () => {
    const fixture = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'spec-dist-9408-')));
    try {
      fs.mkdirSync(path.join(fixture, 'dist'));
      fs.writeFileSync(path.join(fixture, 'dist/index.cjs'), 'module.exports = {};\n');
      fs.writeFileSync(
        path.join(fixture, 'package.json'),
        JSON.stringify({
          name: SPEC_PACKAGE_NAME,
          exports: { '.': { require: './dist/index.cjs' } },
        })
      );
      // A `require`-only entry is unreachable for a browser/ESM bundler, and
      // the message has to say which conditions were on the table — otherwise
      // "resolves to nothing" is unactionable.
      expect(() => inject(fixture)).toThrow(/resolves to nothing under/);
      expect(() => inject(fixture)).toThrow(/browser/);
      expect(() => inject(fixture)).toThrow(/import/);
    } finally {
      fs.rmSync(fixture, { recursive: true, force: true });
    }
  });

  it('reports the condition path for EVERY entry, and marks the ones it outranked', () => {
    // The audible half. The card's hazard is not that the arm was wrong, it is
    // that nothing anywhere said which arm was taken, so the first symptom
    // would surface as a bundler error at a pin bump nobody connects to this
    // file. A report that omitted the decided entries would leave that intact.
    const injection = inject(installedSpecDir)!;
    expect(injection.resolutions).toHaveLength(19);

    const report = formatConditionReport(injection).join('\n');
    expect(report).toContain(injection.packageDir);

    for (const resolution of injection.resolutions) {
      // Every specifier appears, and so does the arm it came from.
      expect(report).toContain(resolution.specifier);
    }
    // The five decided entries name `browser` as the arm TAKEN and `import` as
    // the one it outranked — the exact sentence that was missing.
    const decided = injection.resolutions.filter((r) => r.passedOver.length > 0);
    expect(decided.map((r) => r.specifier).sort()).toEqual([
      SPEC_PACKAGE_NAME,
      `${SPEC_PACKAGE_NAME}/cloud`,
      `${SPEC_PACKAGE_NAME}/data`,
      `${SPEC_PACKAGE_NAME}/kernel`,
      `${SPEC_PACKAGE_NAME}/system`,
    ]);
    for (const resolution of decided) {
      expect(resolution.conditionPath[0]).toBe('browser');
      expect(resolution.passedOver).toContain('import');
    }
    expect(report).toContain('browser > import > default');
    expect(report).toContain('ranked above: import');

    // Anti-vacuity on the other half: entries with no choice to make are still
    // reported, with their arm, rather than silently dropped.
    const forced = injection.resolutions.filter((r) => r.passedOver.length === 0);
    expect(forced.length).toBe(19 - decided.length);
    expect(forced.length).toBeGreaterThan(0);
  });

  it('is carried on the injection, so the console config cannot invent its own', () => {
    // Same lesson as `specModuleTest` (objectui#5388): two consumers reading
    // one producer. A config that formatted its own table could report an arm
    // the resolver did not take.
    const injection = inject(installedSpecDir)!;
    for (const resolution of injection.resolutions) {
      expect(injection.aliases[resolution.specifier]).toBe(resolution.target);
    }
  });
});

describe('objectui#4854: the four flagged surfaces in the console config', () => {
  // Read off the REAL config, not the helper: a correct helper wired into
  // nothing is the failure this repo has paid for before.
  it('leaves all four flagged surfaces at their baseline values', async () => {
    expect(process.env.OBJECTSTACK_SPEC_DIST ?? '').toBe('');
    const config = await loadConsoleConfig();

    // 1. resolve.alias — no `@objectstack` entry at all.
    const aliasKeys = Object.keys(config.resolve.alias);
    expect(aliasKeys.filter((k: string) => k.startsWith('@objectstack'))).toEqual([]);

    // 2. optimizeDeps.include — byte-identical to the baseline list.
    expect(config.optimizeDeps.include).toEqual([
      '@objectstack/spec',
      '@objectstack/spec/data',
      '@objectstack/spec/system',
      '@objectstack/spec/ui',
      'react-map-gl',
      'react-map-gl/maplibre',
      'maplibre-gl',
    ]);

    // 3. the vendor-objectstack chunk test — the literal, unwidened.
    const groups = config.build.rollupOptions.output.advancedChunks.groups as { name: string; test: RegExp }[];
    const vendor = groups.find((g) => g.name === 'vendor-objectstack');
    expect(vendor).toBeDefined();
    expect(vendor!.test.source).toBe(BASE_VENDOR_TEST.source);
    // …and what that literal MEANS, so a future rewrite that keeps the shape
    // but changes the membership cannot pass by pasting a new string in.
    // Reads off the live config's own regex, never the mirror above.
    const LINT_ID =
      '/repo/node_modules/.pnpm/@objectstack+lint@17.0.0/node_modules/@objectstack/lint/dist/index.js';
    expect(vendor!.test.test(LINT_ID)).toBe(false);
    // Counter-probe: the packages that DO belong in the group still match, via
    // both spellings — otherwise the line above would also pass if the group
    // test had been broken into matching nothing at all.
    expect(vendor!.test.test('/repo/node_modules/@objectstack/spec/dist/index.js')).toBe(true);
    expect(vendor!.test.test('/repo/node_modules/.pnpm/@objectstack+spec@17.0.0/x.js')).toBe(true);
    expect(vendor!.test.test('/repo/node_modules/@objectstack/client/dist/index.js')).toBe(true);
    // The exclusion is scoped to the `lint` package, not a `lint*` prefix.
    expect(vendor!.test.test('/repo/node_modules/@objectstack/lint-utils/dist/index.js')).toBe(true);

    // 4. server.fs — absent, so Vite keeps its own default allow-list.
    expect(config.server.fs).toBeUndefined();
  });

  it('moves all four surfaces — and only those — once the override IS set', async () => {
    // A second evaluation of the same config under a distinct module id (the
    // query suffix), so the unset instance above stays intact and the two can be
    // compared. `vi.resetModules()` was rejected: the `unit` project runs
    // `isolate: false`, so resetting the registry reaches other files' modules.
    const baseline = await loadConsoleConfig();
    process.env.OBJECTSTACK_SPEC_DIST = installedSpecDir;
    let injected: any;
    try {
      injected = await loadConsoleConfig('?objectstack-spec-dist=4854');
    } finally {
      delete process.env.OBJECTSTACK_SPEC_DIST;
    }

    // 1. alias — one entry per exports-map entry, subpaths before the bare name.
    const injectedSpecKeys = Object.keys(injected.resolve.alias).filter((k: string) =>
      k === SPEC_PACKAGE_NAME || k.startsWith(`${SPEC_PACKAGE_NAME}/`)
    );
    expect(injectedSpecKeys).toHaveLength(19);
    expect(injectedSpecKeys[injectedSpecKeys.length - 1]).toBe(SPEC_PACKAGE_NAME);
    expect(injected.resolve.alias[`${SPEC_PACKAGE_NAME}/ui`]).toBe(
      path.join(fs.realpathSync(installedSpecDir), 'dist/ui/index.mjs')
    );
    // The `@object-ui/*` workspace aliases are untouched by the injection.
    const objectUiKeys = (alias: Record<string, string>) =>
      Object.keys(alias).filter((k) => k.startsWith('@object-ui/'));
    expect(objectUiKeys(injected.resolve.alias)).toEqual(objectUiKeys(baseline.resolve.alias));

    // 2. optimizeDeps.include — the four spec entries drop out, the rest stay.
    expect(injected.optimizeDeps.include).toEqual(['react-map-gl', 'react-map-gl/maplibre', 'maplibre-gl']);

    // 3. the vendor chunk test — widened with the override, baseline arms kept.
    const vendorOf = (config: any) =>
      (config.build.rollupOptions.output.advancedChunks.groups as { name: string; test: RegExp }[]).find(
        (g) => g.name === 'vendor-objectstack'
      )!.test;
    expect(vendorOf(injected).source.startsWith(BASE_VENDOR_TEST.source)).toBe(true);
    expect(vendorOf(injected).test(`${fs.realpathSync(installedSpecDir)}/dist/ui/index.mjs`)).toBe(true);
    // Widening appends an arm; it must not resurrect the lint exclusion the
    // baseline arms carry, or a spec-dist build would silently re-eagerize the
    // linter while a released build stayed lazy (objectui#5266).
    expect(
      vendorOf(injected).test(
        '/repo/node_modules/.pnpm/@objectstack+lint@17.0.0/node_modules/@objectstack/lint/dist/index.js'
      )
    ).toBe(false);

    // 4. server.fs.allow — the workspace root plus the injected package.
    expect(injected.server.fs.allow).toEqual([repoRoot, fs.realpathSync(installedSpecDir)]);

    // …and nothing else moved: the unset instance is untouched by the second
    // evaluation, which is what makes the laziness case above meaningful.
    expect(baseline.optimizeDeps.include).toHaveLength(7);
    expect(baseline.server.fs).toBeUndefined();
  });

  it('declares the var in turbo.json, which strict env mode would otherwise strip', () => {
    const turbo = JSON.parse(fs.readFileSync(path.join(repoRoot, 'turbo.json'), 'utf8')) as {
      tasks: { build: { env: string[] } };
    };
    // Turbo v2 runs tasks in strict env mode: an undeclared var never reaches
    // the task, so the hook would read `undefined` and stay inert while the
    // caller believed it had injected a spec.
    expect(turbo.tasks.build.env).toContain('OBJECTSTACK_SPEC_DIST');
    expect(turbo.tasks.build.env).toContain('OBJECTSTACK_CLIENT_DIST');
  });
});

/* -------------------------------------------------------------------------- */
/* objectui#5388 — the counter-probe is the FIFTH surface the override moves.  */
/* -------------------------------------------------------------------------- */

/**
 * `apps/console/vite.config.ts` registers `assert-lazy-linter-stays-lazy`, whose
 * counter-probe demands a known-eager `@objectstack/spec` chunk before it will
 * read its own linter verdict (objectui#5323). Under the override every spec
 * module id becomes an absolute path in the overriding tree, with no
 * `@objectstack` segment — so the plugin's private regex matched nothing, the
 * probe refused a verdict, and `scripts/build-console.sh` in the framework could
 * not build ANY objectui pin at or after that commit (objectstack#10136).
 *
 * These cases drive the REAL plugin off the REAL config over a synthetic bundle,
 * rather than asserting on the regex the config hands it. That is the difference
 * between pinning the wiring and pinning a value: the bug was never a wrong
 * regex, it was a correct regex reaching one consumer and not the other.
 *
 * Reverse verification, direction predicted before running: plain RED, and the
 * mutation is the bug itself. Reverting `assertLazyLinterStaysLazy(specModuleTest)`
 * to the no-argument form with its private `SPEC` → the two injected cases below
 * fail on the counter-probe message, and the two baseline cases stay green —
 * which is exactly the asymmetry that let this ship.
 */
interface ProbeChunk {
  type: 'chunk';
  fileName: string;
  isEntry: boolean;
  imports: string[];
  modules: Record<string, unknown>;
}

/** A pnpm-store module id for the linter, the spelling a real bundle carries. */
const LINT_MODULE_ID =
  '/repo/node_modules/.pnpm/@objectstack+lint@17.0.0/node_modules/@objectstack/lint/dist/index.js';
/** The installed spec, i.e. what an un-injected build emits. */
const INSTALLED_SPEC_MODULE_ID = '/repo/node_modules/@objectstack/spec/dist/index.mjs';

const probeChunk = (
  fileName: string,
  modules: string[],
  extra: Partial<ProbeChunk> = {}
): ProbeChunk => ({
  type: 'chunk',
  fileName,
  isEntry: false,
  imports: [],
  modules: Object.fromEntries(modules.map((id) => [id, {}])),
  ...extra,
});

/**
 * A bundle shaped like the console's: one entry, one statically imported vendor
 * chunk holding the spec, and the linter parked behind a dynamic import — which
 * the plugin's walk deliberately does not follow.
 *
 * @param specModuleId  the spec id the vendor chunk carries (installed or injected)
 * @param lintFileName  which chunk holds the linter, or `null` for none at all
 */
function consoleShapedBundle(
  specModuleId: string,
  lintFileName: 'assets/vendor-objectstack.js' | 'assets/lint-lazy.js' | null
): Record<string, ProbeChunk> {
  const vendorModules = [specModuleId];
  if (lintFileName === 'assets/vendor-objectstack.js') vendorModules.push(LINT_MODULE_ID);
  const bundle: Record<string, ProbeChunk> = {
    'assets/index.js': probeChunk('assets/index.js', ['/repo/apps/console/src/main.tsx'], {
      isEntry: true,
      imports: ['assets/vendor-objectstack.js'],
    }),
    'assets/vendor-objectstack.js': probeChunk('assets/vendor-objectstack.js', vendorModules),
  };
  if (lintFileName === 'assets/lint-lazy.js') {
    bundle['assets/lint-lazy.js'] = probeChunk('assets/lint-lazy.js', [LINT_MODULE_ID]);
  }
  return bundle;
}

/**
 * A minimal but REAL `@objectstack/spec` package living outside `node_modules`.
 *
 * `installedSpecDir` cannot stand in for an injected package here, and finding
 * that out is worth writing down: its own path is
 * `…/node_modules/.pnpm/@objectstack+spec@17…/node_modules/@objectstack/spec`,
 * which the BASELINE test already matches. A case built on it goes green under
 * the un-injected config too — measured, before this fixture existed — so it
 * would have pinned nothing at all.
 *
 * The framework tree the override actually points at
 * (`/…/objectstack/packages/spec`, or `/home/runner/work/objectstack/objectstack/
 * packages/spec` on CI) has no `@objectstack` segment anywhere, and that is the
 * one property this fixture has to reproduce. It stays minimal on purpose: the
 * exports-map derivation is covered above against the real 19-entry map, and
 * what these cases need is a legal package at a path of the wrong SHAPE.
 */
function makeOutOfTreeSpecPackage(): string {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'framework-spec-5388-')));
  fs.mkdirSync(path.join(dir, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'dist/index.mjs'), 'export const __probe5388 = true;\n');
  fs.writeFileSync(
    path.join(dir, 'package.json'),
    JSON.stringify(
      {
        name: SPEC_PACKAGE_NAME,
        version: '0.0.0-probe5388',
        type: 'module',
        exports: { '.': { import: './dist/index.mjs' } },
      },
      null,
      2
    )
  );
  return dir;
}

/** Runs the console's own guard over one bundle; returns its error, or `null`. */
function runLazyLinterProbe(config: any, bundle: Record<string, ProbeChunk>): string | null {
  const plugins = (config.plugins as unknown[]).flat(Infinity) as {
    name?: string;
    generateBundle?: (this: unknown, options: unknown, bundle: unknown) => void;
  }[];
  const plugin = plugins.find((p) => p && p.name === 'assert-lazy-linter-stays-lazy');
  expect(plugin, 'the console config registers assert-lazy-linter-stays-lazy').toBeDefined();
  const context = {
    error(message: string): never {
      throw new Error(message);
    },
  };
  try {
    plugin!.generateBundle!.call(context, {}, bundle);
    return null;
  } catch (error) {
    return (error as Error).message;
  }
}

describe('objectui#5388: the lazy-linter counter-probe reads the injection', () => {
  let outOfTreeSpecDir: string;
  /** The module id an injected build emits for the spec. */
  let injectedSpecModuleId: string;

  beforeAll(() => {
    outOfTreeSpecDir = makeOutOfTreeSpecPackage();
    injectedSpecModuleId = `${outOfTreeSpecDir}/dist/index.mjs`;
  });
  afterAll(() => {
    fs.rmSync(outOfTreeSpecDir, { recursive: true, force: true });
  });

  /** Loads the console config with the override pointed at the fixture. */
  async function loadInjectedConsoleConfig(query: string): Promise<any> {
    process.env.OBJECTSTACK_SPEC_DIST = outOfTreeSpecDir;
    try {
      return await loadConsoleConfig(query);
    } finally {
      delete process.env.OBJECTSTACK_SPEC_DIST;
    }
  }

  it('gives the fixture the one shape that matters: no `@objectstack` segment', () => {
    // Anti-vacuity for every case below. If the fixture ever lands somewhere
    // the baseline test already matches, the "blind" case goes green for the
    // wrong reason and the "sees it" case stops proving the widening did
    // anything — which is exactly what happened with `installedSpecDir`.
    expect(injectedSpecModuleId).not.toContain('@objectstack');
    expect(BASE_SPEC_TEST.test(injectedSpecModuleId)).toBe(false);
  });

  it('sees the INSTALLED spec when no override is set', async () => {
    expect(process.env.OBJECTSTACK_SPEC_DIST ?? '').toBe('');
    const config = await loadConsoleConfig();
    expect(
      runLazyLinterProbe(config, consoleShapedBundle(INSTALLED_SPEC_MODULE_ID, 'assets/lint-lazy.js'))
    ).toBeNull();
  });

  it('is BLIND to an injected spec while the config stays un-injected', async () => {
    // The bug's mechanism, isolated: same plugin, same bundle shape, only the
    // spec's module id moved out of node_modules. Without the override the
    // config has no business recognising that path — so this failing is CORRECT
    // here, and it is the control that makes the passing case below mean
    // something rather than being a probe that stopped looking.
    const config = await loadConsoleConfig();
    const message = runLazyLinterProbe(
      config,
      consoleShapedBundle(injectedSpecModuleId, 'assets/lint-lazy.js')
    );
    expect(message).toContain('counter-probe failed');
    expect(message).toContain('no eagerly loaded chunk');
  });

  it('finds the injected spec once the override IS set — the probe, not skipped', async () => {
    const config = await loadInjectedConsoleConfig('?objectstack-spec-dist=5388');

    // It PASSES on the injected id…
    expect(
      runLazyLinterProbe(config, consoleShapedBundle(injectedSpecModuleId, 'assets/lint-lazy.js'))
    ).toBeNull();
    // …and still refuses a verdict when the eager closure really holds no spec,
    // so the fix widened the probe's reach rather than defanging it.
    const noSpec: Record<string, ProbeChunk> = {
      'assets/index.js': probeChunk('assets/index.js', ['/repo/apps/console/src/main.tsx'], {
        isEntry: true,
      }),
      'assets/lint-lazy.js': probeChunk('assets/lint-lazy.js', [LINT_MODULE_ID]),
    };
    expect(runLazyLinterProbe(config, noSpec)).toContain('counter-probe failed');
    // Nor did widening turn the SPEC test into the vendor group's: an eager
    // `@objectstack/client` is not evidence that the walk can see the spec.
    const clientOnly: Record<string, ProbeChunk> = {
      'assets/index.js': probeChunk('assets/index.js', ['/repo/apps/console/src/main.tsx'], {
        isEntry: true,
        imports: ['assets/vendor-objectstack.js'],
      }),
      'assets/vendor-objectstack.js': probeChunk('assets/vendor-objectstack.js', [
        '/repo/node_modules/@objectstack/client/dist/index.mjs',
      ]),
      'assets/lint-lazy.js': probeChunk('assets/lint-lazy.js', [LINT_MODULE_ID]),
    };
    expect(runLazyLinterProbe(config, clientOnly)).toContain('counter-probe failed');
  });

  it('still catches an EAGER linter under the override', async () => {
    // The guard's actual job, asserted in the mode that used to never reach it:
    // before this fix the counter-probe threw first and the linter verdict was
    // never read at all under the override.
    const config = await loadInjectedConsoleConfig('?objectstack-spec-dist=5388-eager');
    const message = runLazyLinterProbe(
      config,
      consoleShapedBundle(injectedSpecModuleId, 'assets/vendor-objectstack.js')
    );
    expect(message).toContain('`@objectstack/lint` is in the EAGER closure');
    expect(message).toContain('assets/vendor-objectstack.js');
  });

  it('refuses a verdict when the LINT test itself has gone blind', async () => {
    // The linter half's failure mode is the silent one: the assertion on it is
    // negative, so a regex that stopped matching the emitted ids is
    // indistinguishable from a clean bundle. objectstack#9659 proposes injecting
    // four more `@objectstack/*` packages the same way; if lint joins them this
    // must fail loudly rather than go permanently green.
    const config = await loadConsoleConfig();
    const message = runLazyLinterProbe(
      config,
      consoleShapedBundle(INSTALLED_SPEC_MODULE_ID, null)
    );
    expect(message).toContain('counter-probe failed');
    expect(message).toContain('no chunk at all');
  });
});

describe('objectui#4854: a real Vite build resolves the injected spec', () => {
  // The transcribed matcher above agrees with Vite's source, but only Vite can
  // answer whether it preserves the alias table's KEY ORDER through
  // `normalizeAlias` — and the order is what makes the bare entry a backstop
  // rather than a swallow-everything. So this bundles for real: ~300ms, because
  // the entry is three modules and the output is never written.
  const ENTRY = [
    "import * as root from '@objectstack/spec';",
    "import * as ui from '@objectstack/spec/ui';",
    "import * as data from '@objectstack/spec/data';",
    "import pkg from '@objectstack/spec/package.json';",
    "globalThis.__probe4854 = [root, ui, data, pkg.name];",
  ].join('\n');

  async function bundle(
    alias: Record<string, string>,
    root: string
  ): Promise<{ code: string; imports: string[] }> {
    const result = (await build({
      root,
      logLevel: 'silent',
      resolve: { alias },
      build: {
        write: false,
        minify: false,
        lib: { entry: path.join(root, 'entry.mjs'), formats: ['es'], fileName: 'probe' },
      },
    })) as { output: { code?: string; imports?: string[] }[] }[];
    const chunk = result[0].output[0];
    return { code: chunk.code ?? '', imports: chunk.imports ?? [] };
  }

  function withEntry<T>(run: (root: string) => Promise<T>): Promise<T> {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spec-build-4854-'));
    fs.writeFileSync(path.join(dir, 'entry.mjs'), ENTRY);
    return run(dir).finally(() => fs.rmSync(dir, { recursive: true, force: true }));
  }

  it('bundles the bare specifier and its subpaths with nothing left unresolved', async () => {
    const injection = inject(installedSpecDir)!;
    const chunk = await withEntry((root) => bundle(injection.aliases, root));

    // Anti-vacuity: the injected package's own schema code is in the output…
    expect(chunk.code.length).toBeGreaterThan(100_000);
    expect(chunk.code).toContain(SPEC_PACKAGE_NAME);
    // …and the chunk imports nothing from outside itself, so no specifier fell
    // back to the installed spec or leaked out as an external. (Asserted on the
    // rollup chunk's import list rather than on the code text: the spec bundles
    // its own name into string literals, which a text scan reads as an import.)
    expect(chunk.imports).toEqual([]);
  });

  it('is what the literal client-hook copy cannot do', async () => {
    // The premise of the card, measured rather than asserted: one prefix alias
    // at the package directory rewrites `@objectstack/spec/ui` to `SPEC_PKG/ui`,
    // which does not exist. A green build here would mean the whole
    // exports-map derivation is unnecessary.
    await expect(
      withEntry((root) => bundle({ [SPEC_PACKAGE_NAME]: installedSpecDir }, root))
    ).rejects.toThrow();
  });
});

/* -------------------------------------------------------------------------- */
/* Repo sweep — the consumption radius, derived rather than listed.            */
/* -------------------------------------------------------------------------- */

const SCAN_ROOTS = ['packages', 'apps', 'examples'];
const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs', '.cjs', '.jsx']);
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.turbo', '.next', 'coverage', '.git']);
const SPEC_SPECIFIER_RE = /['"](@objectstack\/spec(?:\/[a-zA-Z0-9._-]+)?)['"]/g;

/** Every `@objectstack/spec` specifier written in the workspace's source. */
function collectSpecSpecifiers(): Set<string> {
  const found = new Set<string>();
  const stack = SCAN_ROOTS.map((r) => path.join(repoRoot, r)).filter((d) => fs.existsSync(d));
  while (stack.length) {
    const dir = stack.pop()!;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) stack.push(path.join(dir, entry.name));
        continue;
      }
      if (!SCAN_EXTENSIONS.has(path.extname(entry.name))) continue;
      const source = fs.readFileSync(path.join(dir, entry.name), 'utf8');
      if (!source.includes(SPEC_PACKAGE_NAME)) continue;
      for (const match of source.matchAll(SPEC_SPECIFIER_RE)) found.add(match[1]);
    }
  }
  return found;
}

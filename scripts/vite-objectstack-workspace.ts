// The `@objectstack/*` module-id tests the console's Vite config groups and
// guards on, made aware of the objectstack MONOREPO layout (objectstack ruling
// D1: objectui lands there as `ui/`).
//
// Standalone, every `@objectstack/*` module resolves out of `node_modules`, so
// a module id carries one of two spellings — `/node_modules/@objectstack/<pkg>/`
// for a plain install, `/@objectstack+<pkg>@<v>/` for pnpm's store — and the
// baseline tests in `apps/console/vite.config.ts` match those. Inside the
// monorepo the same packages are WORKSPACE LINKS, and Vite resolves a link to
// its real path: `<monorepo root>/packages/<pkg>/dist/...`, which carries
// neither spelling. Measured on the merge spike: the vendor group test, the
// spec counter-probe and the lazy-linter guard all missed, and the console
// build failed on its own guard.
//
// So each test takes ONE more alternative: an id that starts with the
// monorepo's `packages/` directory, located relative to the console
// (`apps/console` → `../../../packages`, i.e. `<ui/>/../packages`). Standalone,
// that directory does not exist beside the objectui checkout, so the
// alternative matches nothing and every reading stays as it was — which
// `scripts/__tests__/vite-objectstack-workspace.test.ts` pins in both
// directions, and which is why these live in a module rather than inline in
// the config: a config file's constants are not importable by a test.
//
// `@objectstack/lint` stays OUT of the vendor group in the workspace spelling
// too (`(?!lint[\\/])`), for the reason the config states on
// `VENDOR_OBJECTSTACK_TEST`: the linter is reached only through a deliberate
// dynamic import, and grouping it would make every console page load parse it.

import path from 'node:path';

/** `s` as a regular-expression literal. */
export const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The monorepo's `packages/` directory as seen from a console directory —
 * `<objectstack root>/packages` when the console sits at `ui/apps/console`,
 * a directory that does not exist when it sits at `<objectui>/apps/console`.
 */
export function frameworkPackagesDir(consoleDir: string): string {
  return path.resolve(consoleDir, '../../../packages');
}

/** The three module-id tests, each widened with the workspace spelling. */
export interface WorkspaceChunkTests {
  /** The `vendor-objectstack` group: every framework package but the linter. */
  vendor: RegExp;
  /** "This module id IS `@objectstack/spec`" — the counter-probe's subject. */
  spec: RegExp;
  /** "This module id IS `@objectstack/lint`" — what the lazy-linter guard looks for. */
  lint: RegExp;
}

/**
 * @param frameworkPackagesDir the monorepo `packages/` directory, from `frameworkPackagesDir()`
 */
export function workspaceChunkTests(frameworkPackagesDir: string): WorkspaceChunkTests {
  // Vite hands out POSIX-style ids on every platform; the config's baseline
  // alternatives accept either separator and so does the prefix here.
  const prefix = escapeRegExp(frameworkPackagesDir.split(path.sep).join('/')) + '[\\\\/]';
  return {
    vendor: new RegExp(
      '(^' + prefix + '(?!lint[\\\\/])' +
        '|[\\\\/]node_modules[\\\\/]@objectstack[\\\\/](?!lint[\\\\/])|[\\\\/]@objectstack\\+(?!lint@))',
    ),
    spec: new RegExp('(@objectstack[\\\\/+]spec|^' + prefix + 'spec[\\\\/])'),
    lint: new RegExp('(@objectstack[\\\\/+]lint|^' + prefix + 'lint[\\\\/])'),
  };
}

#!/usr/bin/env node
// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Regenerate `packages/components/src/lib/lucide-icon-names.ts` — the eager
 * mirror of lucide's DYNAMIC icon vocabulary.
 *
 *   node scripts/gen-lucide-icon-names.mjs      (also `pnpm gen:lucide-icon-names`)
 *
 * ## Why a mirror exists at all (objectui#9204)
 *
 * `iconNames` is `Object.keys(dynamicIconImports)` — lucide derives it FROM the
 * 2,025-entry dynamic-import map, so importing the names imports the map.
 * `getLazyIcon`/`isLucideIconName` need only the membership answer, and they
 * need it SYNCHRONOUSLY (`notificationIcon` picks between the authored icon and
 * the severity glyph during render). So the names ship as data and the map —
 * the part that is only ever CALLED, and only after a name has already been
 * accepted — moves behind an `import()`.
 *
 * ⚠️ Measured on `91facaef6`, and the measurement is why this file is only half
 * a fix: the map costs 8,253 B gzipped of the eager `ui-components` chunk, and
 * this catalogue — the same names, without the map — costs 9,176 B in the same
 * chunk. Deferring the map while keeping the names eager is net +923 B. The
 * names are the cost; lucide's map is a cheaper container for them than a list
 * is. See the PR for the three builds.
 *
 * ## Why it cannot age silently
 *
 * `scripts/check-lucide-icon-record-names.mjs` states the principle this file
 * answers to: "a hand-kept vocabulary is the same defect one level up — it ages
 * the moment lucide retires the next name, and it ages SILENTLY." Nothing here
 * is hand-kept. The names come from the installed lucide, and
 * `packages/components/src/__tests__/lucide-icon-names-mirror-9204.test.ts`
 * re-derives them from that same install on every CI run and fails on any
 * drift, naming this script as the repair.
 *
 * ⛔ The output is generated. Edit lucide's version in `package.json` and rerun
 * this; never hand-edit the catalogue.
 */

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { isEntrypoint } from './invoked-as.mjs';

export const REPO_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/** Where the catalogue lives, repo-relative. */
export const CATALOGUE_PATH = 'packages/components/src/lib/lucide-icon-names.ts';

/**
 * The package that owns the lucide dependency. Resolving through it — rather
 * than from the repo root, where `lucide-react` is not resolvable — is the same
 * choice `check-lucide-icon-record-names.mjs` makes and for the same reason:
 * the generator must read the very copy `lazy-icon.tsx` renders from.
 */
export const LUCIDE_OWNER_PKG = 'packages/components/package.json';

/** `{ names, version }` of the installed lucide's DYNAMIC vocabulary. */
export async function loadInstalledIconNames(root = REPO_ROOT) {
  const lucideRequire = createRequire(join(root, LUCIDE_OWNER_PKG));
  const { iconNames } = await import(pathToFileURL(lucideRequire.resolve('lucide-react/dynamic.mjs')).href);
  const version = JSON.parse(readFileSync(lucideRequire.resolve('lucide-react/package.json'), 'utf8')).version;
  return { names: iconNames, version };
}

/**
 * The catalogue's exact text, from a name list.
 *
 * One name per line inside a single template literal: a diff then shows the
 * names that moved rather than one re-wrapped line, and the emitted module is
 * the names plus one `split` instead of 2,025 quoted-and-comma'd elements.
 *
 * ⛔ The lucide VERSION is deliberately absent from the file. It would make
 * every lucide bump a two-line diff that reads as a real change, and the
 * version is not what the mirror is judged against — the installed vocabulary
 * is, by the test named in the header below.
 */
export function renderCatalogue(names) {
  return `/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * lucide's DYNAMIC icon vocabulary, as data (objectui#9204).
 *
 * ⛔ GENERATED — do not edit by hand. Run \`pnpm gen:lucide-icon-names\`.
 *
 * Every name lucide's \`lucide-react/dynamic.mjs\` can resolve. It is a strict
 * SUPERSET of the runtime \`icons\` record: it still carries retired spellings
 * (\`edit\`, \`smile\`, \`filter\`, \`alert-triangle\`), which is why
 * \`scripts/check-lucide-icon-record-names.mjs\` judges only the record-reading
 * resolver and censuses this surface separately.
 *
 * ## Why this is a mirror and not an import
 *
 * lucide derives \`iconNames\` as \`Object.keys(dynamicIconImports)\`, so
 * \`import { iconNames } from 'lucide-react/dynamic.mjs'\` drags the whole
 * 2,025-entry dynamic-import map into whatever chunk holds the importer —
 * measured at 8,253 B gzipped of the console's eager \`ui-components\` chunk. The
 * membership answer is needed synchronously (\`notificationIcon\` chooses between
 * the authored icon and the severity glyph during render); the map is needed
 * only AFTER a name has been accepted, and \`lazy-icon.tsx\` reaches it through
 * \`import()\` for that.
 *
 * ⚠️ This list is not free: it costs 9,176 B gzipped in that same chunk, MORE
 * than the map whose keys these names were. See \`gen-lucide-icon-names.mjs\`.
 *
 * ## Why it cannot age silently
 *
 * \`../__tests__/lucide-icon-names-mirror-9204.test.ts\` re-derives this list
 * from the installed lucide on every run and fails on any drift. The names are
 * data here, never a second opinion about what lucide ships.
 */
export const LUCIDE_ICON_NAMES: readonly string[] = \`${names.join('\n')}\`.split('\\n');
`;
}

if (isEntrypoint(import.meta.url)) {
  const { names, version } = await loadInstalledIconNames();
  const target = join(REPO_ROOT, CATALOGUE_PATH);
  writeFileSync(target, renderCatalogue(names));
  console.log(`wrote ${CATALOGUE_PATH} — ${names.length} names from lucide-react ${version}`);
}

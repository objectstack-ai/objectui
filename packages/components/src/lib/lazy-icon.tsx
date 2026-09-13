/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Lazy Lucide icon resolver.
 *
 * Replaces the wildcard `import * as LucideIcons from 'lucide-react'` pattern
 * which forced ~1500 icons (~568 KB raw / 140 KB gz) into the vendor bundle.
 * Each icon is fetched as its own micro-chunk on first use via
 * `lucide-react`'s built-in `DynamicIcon`.
 *
 * The exported `getLazyIcon(name)` API stays synchronous and returns a
 * React component, preserving call-sites that do
 * `const Icon = getLazyIcon(name); <Icon className="..." />`.
 *
 * ## ONE vocabulary: the record that actually ships (objectui#9204)
 *
 * Membership — "is this a real icon name?" — is answered by the seam in
 * `../renderers/action/resolve-icon`, which reads lucide's runtime `icons`
 * record. ⛔ It is NOT answered from `iconNames`, and the reason is both
 * behavioural and measured:
 *
 *   - BEHAVIOURAL. lucide publishes two vocabularies. The `icons` RECORD is
 *     what ships and what every other resolver in this repo reads; the DYNAMIC
 *     list is a strict superset that still carries 254 spellings lucide has
 *     retired (`smile`, `sort-desc`, `alarm-check`, `arrow-down-az`, measured
 *     against the installed lucide). Judging membership on the superset blesses
 *     exactly the names `scripts/check-lucide-icon-record-names.mjs` exists to
 *     keep out of authored metadata.
 *   - MEASURED. lucide derives `iconNames` as `Object.keys(dynamicIconImports)`,
 *     so a static import of EITHER name drags the dynamic-import map into
 *     whatever chunk holds this module — the console's eager `ui-components`
 *     chunk, where it cost 8,253 B gzipped. Shipping the names as a generated
 *     list instead costs MORE (9,176 B gz spliced into that same chunk, with a
 *     front-coded encoding probed and rejected at 8,397 B): the map's KEYS are
 *     the names, so a list of them is dearer than lucide's map of the same
 *     names. Sourcing membership from the record costs zero NEW eager bytes,
 *     because `resolve-icon.ts` already pays for that record.
 *
 * The maintainer ruled this on 2026-09-13 (objectui#9204, decision batch #125
 * item 3), with the retirement of the 254 aliases as the stated cost and the
 * loud refusal below as its condition.
 *
 * ## What still loads lazily, and why it is only the MAP
 *
 * `DynamicIcon` and the import map behind it are reached through `import()`.
 * ⛔ Do not restore a static `import ... from 'lucide-react/dynamic.mjs'` here
 * or anywhere else: `scripts/check-lucide-icon-record-names.mjs` fails on one
 * (its `DECLARED_EAGER_DYNAMIC_IMPORTERS` is empty and that emptiness IS the
 * assertion), because it puts the map back on the first payload with nothing
 * else red.
 *
 * While the map is in flight the icon renders its `fallback` — the same frame
 * `DynamicIcon` itself shows while fetching the per-icon chunk, so this adds a
 * loading STATE to nothing that did not already have one.
 *
 * ## ⚠️ One measured seam between membership and rendering
 *
 * Membership reads the RECORD (PascalCase keys); `DynamicIcon` reads the
 * DYNAMIC map (kebab spellings). Measured against the installed lucide, every
 * live record key has a dynamic spelling (0 of 1,781 do not), so nothing that
 * passes membership is unrenderable when it is authored in lucide's own
 * kebab spelling. The 95 record keys that carry a DIGIT are the exception, and
 * only when authored in PascalCase: `Building2` kebabs to `building2` while
 * lucide's spelling is `building-2`. Those 95 spellings answered `false` before
 * this change too — they degraded to the fallback glyph silently, and they
 * degrade to it loudly now (lucide's own "Name in Lucide DynamicIcon not found"
 * on the render leg). ⛔ Not repaired here: a digit-aware tokeniser would change
 * what resolves for names nobody has asked for, and `axis-3d` vs the retired
 * `axis-3-d` shows the two spellings can BOTH exist with only one live.
 */

import React from 'react';
import { Database } from 'lucide-react';
import { describeIconLookup, liveIconNameOf, resolveIcon } from '../renderers/action/resolve-icon';

/** Convert PascalCase / camelCase / mixed names to kebab-case for DynamicIcon. */
export function toKebabIconName(name: string): string {
  if (name.includes('-')) return name.toLowerCase();
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

/**
 * Returns true when `kebab` names a LIVE glyph in lucide's `icons` record.
 *
 * Silent on its own — the refusal is raised by the call sites below, which know
 * whether a `false` is a probe (`isLucideIconName`, whose whole job is to be
 * asked) or an authored name that will not render.
 */
function isLucideIcon(kebab: string): boolean {
  return resolveIcon(kebab) !== null;
}

/* -------------------------------------------------------------------------- */
/* The loud refusal                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Spellings already refused, so one bad name in a render loop says its piece
 * once rather than once per frame.
 */
const refused = new Set<string>();

/**
 * Say, once per spelling, that a name does not resolve — and say what to write
 * instead when lucide renamed it.
 *
 * ## Why a refusal and not the old silent degrade
 *
 * Until objectui#9204 an unresolvable name became the `Database` glyph here and
 * the severity glyph in `../notifications/severity.ts`, with nothing logged.
 * That is survivable for a name from another icon library — the case the old
 * comment was written for — and it is NOT survivable for a spelling lucide
 * retired: the author wrote a name that used to work, the page still renders,
 * and the only signal is a glyph that looks deliberate. Narrowing membership to
 * the record retires 254 such spellings at once, so the maintainer's ruling
 * made ending that silence its condition: "a retired spelling is refused, not
 * silently degraded", with "a diagnostic naming the spelling and its current
 * name, so an author learns at once".
 *
 * ## Why the replacement is DERIVED and why that makes this async
 *
 * The retired export and its live spelling are the same object, so the current
 * name is a reverse lookup in the record — but the retired name only reaches a
 * component through the dynamic map, which this module deliberately does not
 * hold eagerly. So the diagnostic awaits the same `import()` the render path
 * uses (already in flight whenever any icon is on the page) and prints once it
 * can name the replacement. ⛔ The alternative — a retired-to-live table in this
 * file — is the hand-kept vocabulary `scripts/check-lucide-icon-record-names.mjs`
 * refuses in its own header, and it would put ~5 KB gzipped back on the very
 * path this card is emptying.
 *
 * ⚠️ It stays a console diagnostic rather than a thrown error: a single bad
 * icon name in server-driven metadata must not take the page down, and
 * `isLucideIconName` is a predicate callers ask BEFORE choosing what to draw.
 * The refusal is in the volume and in the named replacement, not in a crash.
 */
function refuseIconName(name: string): void {
  if (refused.has(name)) return;
  refused.add(name);
  const kebab = toKebabIconName(name);
  const { key } = describeIconLookup(kebab);
  void currentNameFor(kebab).then((current) => {
    const head = `[@object-ui/components] icon name ${JSON.stringify(name)} does not resolve`
      + ` (looked up as ${JSON.stringify(key)} in lucide's runtime icons record)`;
    console.error(
      current
        ? `${head}. lucide RETIRED that spelling; its current name is ${JSON.stringify(current.key)}`
        + ` — write ${JSON.stringify(current.spelling)} in the metadata.`
        : `${head}. No live lucide icon answers to it.`,
    );
  });
}

/**
 * What a retired kebab spelling is called today, or `null` when the spelling is
 * not lucide's at all. Diagnostics only; never on a render path.
 *
 * Returns BOTH halves because they can differ and only one of them is safe to
 * copy into metadata:
 *
 *   - `key` is lucide's own current name — the live `icons` record key, derived
 *     by identity from the module the retired spelling still loads.
 *   - `spelling` is a name this module can actually RENDER: the record key's
 *     kebab spelling as lucide itself spells it, found in the map rather than
 *     computed from the key. ⚠️ Computing it would be wrong for 16 of the 243
 *     live replacements, all of them digit-bearing — `Grid2x2` kebabs to
 *     `grid2x2` while lucide's spelling is `grid-2x2`, so an author told to
 *     "write Grid2x2" would land on a name that passes membership and then
 *     fails to load.
 */
async function currentNameFor(kebab: string): Promise<{ key: string; spelling: string } | null> {
  try {
    const module = await loadLucideDynamic();
    const map = module.dynamicIconImports as Record<string, () => Promise<unknown>> | undefined;
    const loader = map?.[kebab];
    if (typeof loader !== 'function') return null;
    const icon = (await loader()) as { default?: unknown };
    const key = liveIconNameOf(icon?.default);
    if (!key) return null;
    const spelling = Object.keys(map!).find(
      (candidate) => candidate !== kebab && describeIconLookup(candidate).key === key,
    );
    return { key, spelling: spelling ?? key };
  } catch {
    // A diagnostic that cannot be completed is still not a failure of the
    // render it describes. Say what is known rather than nothing.
    return null;
  }
}

/**
 * Whether `name` (kebab-case or PascalCase) resolves to a live Lucide icon.
 *
 * Exported because `getLazyIcon` degrades an unknown name to the `Database`
 * icon, which is the right default for a data-shaped schema slot but wrong
 * where a caller has a BETTER fallback of its own — a notification, for
 * instance, would rather show its severity icon than a stray database glyph.
 * Ask first, then choose.
 *
 * A non-empty name that answers `false` is REFUSED out loud (see
 * `refuseIconName`): choosing the severity glyph over an authored icon is one
 * of the two silent degrades objectui#9204's ruling ended, and the caller's
 * better fallback is exactly what used to hide it.
 */
export function isLucideIconName(name?: string): boolean {
  if (!name) return false;
  if (isLucideIcon(toKebabIconName(name))) return true;
  refuseIconName(name);
  return false;
}

/* -------------------------------------------------------------------------- */
/* The deferred half: lucide's dynamic-import map                             */
/* -------------------------------------------------------------------------- */

type LucideDynamicModule = typeof import('lucide-react/dynamic.mjs');

/** The loaded module, once it has arrived — read synchronously on later mounts. */
let dynamicModule: LucideDynamicModule | null = null;
/** The in-flight request, so N icons mounting together make ONE import. */
let dynamicRequest: Promise<LucideDynamicModule> | null = null;

function loadLucideDynamic(): Promise<LucideDynamicModule> {
  dynamicRequest ??= import('lucide-react/dynamic.mjs').then((module) => {
    dynamicModule = module;
    return module;
  });
  return dynamicRequest;
}

/**
 * Every icon name this module can RENDER, in lucide's own kebab spelling.
 *
 * Two vocabularies meet here and neither answers alone: the `icons` record says
 * which glyphs are LIVE, and the dynamic map says how each is SPELLED for
 * `DynamicIcon`. The intersection is the answer — the live glyphs, spelled the
 * way `getLazyIcon` can actually load them — and it is derived on demand from
 * the installed lucide rather than kept as a list. ⛔ A generated catalogue was
 * measured and rejected: it costs more gzipped than the map it replaces
 * (objectui#9204).
 *
 * Async because it needs the deferred map, which is the point: a picker asks
 * for it when it opens, so nothing about a name PICKER reaches the eager path.
 */
export async function loadLucideIconNames(): Promise<readonly string[]> {
  const module = await loadLucideDynamic();
  return Object.keys(module.dynamicIconImports).filter((name) => isLucideIcon(name));
}

/**
 * `DynamicIcon` behind an `import()`, with the caller's fallback showing until
 * it lands.
 *
 * A plain `useState` + `useEffect` rather than `React.lazy`, deliberately:
 * `React.lazy` would oblige every one of this package's icon call sites to sit
 * under a `<Suspense>` boundary it does not have today, and would suspend a
 * whole subtree over one glyph. This mirrors what `DynamicIcon` already does
 * internally for the per-icon chunk, one level up.
 */
const DeferredLucideIcon: React.FC<{ name: string; fallback: React.ElementType } & Record<string, any>> = ({
  name,
  fallback,
  ...rest
}) => {
  const [DynamicIcon, setDynamicIcon] = React.useState<React.ElementType | null>(
    () => (dynamicModule?.DynamicIcon as React.ElementType | undefined) ?? null,
  );

  React.useEffect(() => {
    if (DynamicIcon) return undefined;
    let alive = true;
    loadLucideDynamic().then(
      (module) => {
        if (alive) setDynamicIcon(() => module.DynamicIcon as React.ElementType);
      },
      (error) => {
        // Same shape lucide uses for a per-icon chunk that fails to arrive: say
        // so once and keep the fallback glyph, rather than blanking the slot.
        console.error('[@object-ui/components] failed to load lucide-react/dynamic.mjs', error);
      },
    );
    return () => {
      alive = false;
    };
  }, [DynamicIcon]);

  if (!DynamicIcon) return React.createElement(fallback, rest);
  return React.createElement(DynamicIcon, { name, fallback, ...rest });
};

const cache = new Map<string, React.ElementType>();

/**
 * Resolve a Lucide icon by name (kebab-case or PascalCase).
 * Returns a memoised React component that lazily loads the SVG on mount.
 * Falls back to the `Database` icon when no `name` is provided, or when the
 * requested name is not a live Lucide icon — server-driven schemas do reference
 * icons from other libraries, so the slot still renders something, but the name
 * is REFUSED OUT LOUD rather than silently degraded (objectui#9204).
 */
export function getLazyIcon(name?: string): React.ElementType {
  if (!name) return Database;
  const cached = cache.get(name);
  if (cached) return cached;
  const kebab = toKebabIconName(name);
  if (!isLucideIcon(kebab)) {
    refuseIconName(name);
    cache.set(name, Database);
    return Database;
  }
  const Wrapped: React.FC<any> = (props) =>
    React.createElement(DeferredLucideIcon, { name: kebab, fallback: Database, ...props });
  Wrapped.displayName = `LucideIcon(${name})`;
  cache.set(name, Wrapped);
  return Wrapped;
}

/** Direct ready-to-render component. */
export const LazyIcon: React.FC<{ name?: string } & Record<string, any>> = ({ name, ...rest }) => {
  if (!name) return React.createElement(Database, rest);
  const kebab = toKebabIconName(name);
  if (!isLucideIcon(kebab)) {
    refuseIconName(name);
    return React.createElement(Database, rest);
  }
  return React.createElement(DeferredLucideIcon, {
    name: kebab,
    fallback: Database,
    ...rest,
  });
};

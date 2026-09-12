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
 * ## The two halves of `lucide-react/dynamic.mjs`, and why only one is eager
 *
 * That entry hands out two things this file needs, and lucide derives one from
 * the other: `iconNames` is `Object.keys(dynamicIconImports)`. So a static
 * import of EITHER name drags the 1,767-entry dynamic-import map into whatever
 * chunk holds this module — the console's eager `ui-components` chunk, where it
 * was measured at 263,547 B rendered (objectui#9204).
 *
 * The two halves are needed at different times:
 *
 *   - the NAMES answer `isLucideIconName`, which is synchronous by contract:
 *     `notificationIcon` (../notifications/severity.ts) chooses between the
 *     authored icon and the severity glyph DURING RENDER, and an async answer
 *     there would show the wrong glyph and never correct it. They ship as data,
 *     from `./lucide-icon-names` — generated from the installed lucide and
 *     re-derived from it by a test, never hand-kept.
 *   - the MAP is only ever CALLED, and only after a name has already been
 *     accepted. It loads through `import()` on the first icon that renders.
 *
 * ⛔ Do not restore a static `import ... from 'lucide-react/dynamic.mjs'` here
 * or anywhere else: `scripts/check-lucide-icon-record-names.mjs` fails on one,
 * because it puts the map back on the first payload with nothing red.
 *
 * While the map is in flight the icon renders its `fallback` — the same frame
 * `DynamicIcon` itself shows while fetching the per-icon chunk, so this adds a
 * loading STATE to nothing that did not already have one.
 */

import React from 'react';
import { Database } from 'lucide-react';
import { LUCIDE_ICON_NAMES } from './lucide-icon-names';

/** Convert PascalCase / camelCase / mixed names to kebab-case for DynamicIcon. */
export function toKebabIconName(name: string): string {
  if (name.includes('-')) return name.toLowerCase();
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

// Lucide ships ~2000 icon names; storing as a Set keeps lookups O(1).
const VALID_ICON_NAMES: Set<string> = new Set(LUCIDE_ICON_NAMES);

/** Returns true when `kebab` matches a real Lucide icon. */
function isLucideIcon(kebab: string): boolean {
  return VALID_ICON_NAMES.has(kebab);
}

/**
 * Whether `name` (kebab-case or PascalCase) resolves to a real Lucide icon.
 *
 * Exported because `getLazyIcon` degrades an unknown name to the `Database`
 * icon, which is the right default for a data-shaped schema slot but wrong
 * where a caller has a BETTER fallback of its own — a notification, for
 * instance, would rather show its severity icon than a stray database glyph.
 * Ask first, then choose.
 */
export function isLucideIconName(name?: string): boolean {
  return !!name && isLucideIcon(toKebabIconName(name));
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
 * Falls back to the `Database` icon when no `name` is provided or when the
 * requested name is not a valid Lucide icon (server-driven schemas often
 * reference icons from other libraries — we silently degrade rather than
 * letting Lucide log "Name in Lucide DynamicIcon not found").
 */
export function getLazyIcon(name?: string): React.ElementType {
  if (!name) return Database;
  const cached = cache.get(name);
  if (cached) return cached;
  const kebab = toKebabIconName(name);
  if (!isLucideIcon(kebab)) {
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
  if (!isLucideIcon(kebab)) return React.createElement(Database, rest);
  return React.createElement(DeferredLucideIcon, {
    name: kebab,
    fallback: Database,
    ...rest,
  });
};

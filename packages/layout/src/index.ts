/**
 * ObjectUI Layout
 * Copyright (c) 2024-present ObjectStack Inc.
 */

import { ComponentRegistry } from '@object-ui/core';
import { PageCard } from './PageCard';
import { ResponsiveGrid } from './ResponsiveGrid';
import { NavigationRenderer } from './NavigationRenderer';
import { AppSchemaRenderer } from './AppSchemaRenderer';

export * from './PageHeader';
export * from './AppShell';
export * from './PageCard';
export * from './SidebarNav';
export * from './ResponsiveGrid';
export * from './NavigationRenderer';
export * from './AppSchemaRenderer';

export function registerLayout() {
  // ⛔ The `page-header` node type key is RETIRED (objectui#10859 batch 8,
  // phase 2c, the seat's fork ruling on that card, by the objectui#10393 /
  // objectui#8760 route). The page header authors write is `page:header`,
  // which `@object-ui/components` registers and the spec's `PageHeaderProps`
  // declares (its secondary line is `subtitle`). `PageHeader` itself stays a
  // named export of this package.
  //
  // What was here: a registration of `PageHeader` under the kebab key
  // `page-header` in the `layout` namespace, so it stored `layout:page-header`
  // and the bare `page-header` fallback, with `isContainer: true` and five
  // declared inputs (`title`, `subtitle`, `icon`, `actions`, the `children`
  // slot). (Described rather than quoted, for the reason the `app-shell` note
  // below gives: the pins that read this file take a verbatim call in a comment
  // for a live registration.) No `@object-ui/types` arm claims the key, so
  // `objectui validate` refused a `page-header` node at `type` while the
  // registry mounted it.
  //
  // Why unregistering is the whole retirement: no source, doc, example or
  // catalog document in this repository authors the node, and nothing emits
  // it. objectstack's ADR-0087 conversion `page-header-subtitle-alias` renames
  // the KEY `description` → `subtitle` on both header spellings; its own
  // docblock says it does not rewrite the type, and that this registration "is
  // objectui's to retire, on its own schedule". Its fixtures are test data, not
  // producers. The opt-in `PROTOCOL_COMPONENTS` placeholder entry for the same
  // spelling (`@object-ui/components`) went in the same change, so no host can
  // bring the bare key back. The `subtitle ?? description` fallback this alias
  // once carried was already gone (objectui#3789); the conversion-reach pin in
  // `__tests__/page-header-subtitle-conversion-coverage.test.ts` stays, because
  // it guards `page:header`.

  // Page Card — register ONLY as `layout:page:card`. `skipFallback` keeps this
  // thin div from clobbering the bare `page:card` key, which belongs to the
  // record-aware PageCardRenderer in @object-ui/components (it renders
  // title/body/children; this one only renders React children and would
  // otherwise leak schema props onto the DOM). The retired `page-header` alias
  // above made the same choice the other way round, by never claiming
  // `page:header`.
  ComponentRegistry.register('page:card', PageCard, {
    namespace: 'layout',
    skipFallback: true,
    label: 'Page Card',
    category: 'Layout',
    isContainer: true
  });

  // NOTE: `app-shell` is deliberately NOT a component key (objectui#4841,
  // ADR-0049 enforce-or-remove, remove side; maintainer ruling 2026-08-16).
  //
  // It used to be registered here — key `app-shell`, component `AppShell`,
  // `namespace: 'layout'`, `label: 'App Shell'`, `category: 'Layout'`, and no
  // `inputs` — and that registration could never produce an app shell.
  //
  // (The call is described rather than quoted on purpose: the pins that read
  // this file ask it for the registered key list with a regex over
  // `ComponentRegistry` + `.register(`, and a verbatim copy in a comment reads
  // to them as a live registration. Same reason the file's other notes name
  // keys in prose.)
  //
  // Four of `AppShellProps`' seven keys are `React.ReactNode` slots (`sidebar`,
  // `navbar`, `children`, `rightRail`) and a JSON document can fill none of
  // them. Measured on `378dc920b`, a node had exactly two outcomes, neither of
  // them a shell:
  //
  //   - `children` is dropped in SILENCE. `SchemaRenderer` strips `children`
  //     (and `body`) out of a node before spreading the remaining keys as
  //     props, and `AppShell` reads its `children` PROP, never
  //     `schema.children`. The `<main>` element rendered empty, console.error
  //     count 0.
  //   - a schema in `sidebar` / `navbar` / `rightRail` reaches the component as
  //     a plain object and React refuses to render it, so the node became the
  //     renderer's error box ("Objects are not valid as a React child").
  //
  // Only `className` / `defaultOpen` / `branding` — the three plain-data keys —
  // ever survived the JSON path, i.e. the best result JSON could reach was a
  // shell with no navigation, no top bar and an empty content area. With no
  // `inputs` declared, `sdui-parser`'s unknown-prop check had nothing to compare
  // a node against either, so neither outcome was diagnosed (same family as
  // objectui#3972).
  //
  // Removing the key does not remove a capability — it replaces a
  // parse-succeeds-renders-nothing middle state with a NAMED refusal:
  // `{ "type": "app-shell" }` now resolves to nothing, so `SchemaRenderer`
  // renders its OBJUI-001 panel ("Unknown component type: app-shell") and
  // `sdui-parser` reports `unknown-component`. Loud beats silent.
  //
  // The two survivors carry the two real capabilities, and this is the whole
  // point of the split:
  //   - `AppShell` stays EXPORTED (above) as a React composition primitive —
  //     compose the shell in React and render JSON pages inside it.
  //   - `app-schema-renderer` (below) stays the ONE JSON door for "render a
  //     whole shell from a schema": it declares `inputs` and builds branding and
  //     sidebar navigation out of an `AppSchema` document.
  //
  // Re-registering `app-shell` is not a one-line revert: it needs `inputs` AND a
  // rendering adapter that turns the schema values in `sidebar`/`navbar`/
  // `rightRail` into nodes and wires `schema.children` to `children` (option B
  // on objectui#4841), plus an answer to how it then differs from
  // `app-schema-renderer`. `__tests__/app-shell-not-a-component-key.test.tsx`
  // pins the current state and says the same thing where it fails.

  ComponentRegistry.register('responsive-grid', ResponsiveGrid, {
    namespace: 'layout',
    label: 'Responsive Grid',
    category: 'Layout',
    isContainer: true,
    inputs: [
      { name: 'columns', type: 'object' },
      { name: 'gap', type: 'number' },
    ],
  });

  // `items` is `NavigationItem[]` (`NavigationRenderer.tsx:108`) — an ARRAY, and
  // it used to be declared `type: 'object'` (objectui#3972). Those are not two
  // spellings of one check: `sdui-parser`'s `checkType` accepts `'object'` only
  // for `typeof value === 'object' && !Array.isArray(value)` and `'array'` only
  // for `Array.isArray(value)` (`validate.ts:124-129`), so the declaration made
  // the manifest gate report `type-mismatch: <navigation-renderer> prop "items"
  // expected an object` on the ONLY value this renderer can render — and stay
  // silent on the object that would crash it.
  //
  // This is not objectui#3832 (a key whose contract is a UNION, which the
  // declaration could not spell before that card and now spells as an array of
  // arms): `items` has ONE contract type, `ManifestInputType` has `'array'`, so
  // the declaration was simply wrong about a type it could express exactly.
  //
  // `required: true` is the fourth face of the same agreement (objectui#3987).
  // #3972 aligned the key's EXISTENCE and TYPE; optionality was still declared
  // the opposite of what the component enforces. `NavigationRendererProps.items`
  // has no `?` and the renderer supplies no default (`NavigationRenderer.tsx:1204`),
  // so `{ "type": "navigation-renderer" }` — a node the validator passed in
  // silence, because `validate.ts:55-64` only reports `missing-required-prop`
  // when `input.required` is set — crashes on the first thing the render does
  // with the prop: `collectPinnedItems(filteredItems)` at `:1242` does
  // `for (const item of items)` (`:1410`) and throws
  // `TypeError: items is not iterable`. (The `resolveActiveNavItem` memo above
  // it survives, its `visit` guards `if (!nodes) return`; `filteredItems.slice()`
  // at `:1247` would throw too but is never reached.)
  //
  // So this is not a stylistic "document it as required" — it is the one
  // diagnostic that exists precisely to stop a node whose render is a
  // guaranteed crash from shipping. `basePath` below stays optional because the
  // renderer really does default it (`basePath = ''`); the two are declared
  // differently because the component treats them differently.
  ComponentRegistry.register('navigation-renderer', NavigationRenderer, {
    namespace: 'layout',
    label: 'Navigation Renderer',
    category: 'Layout',
    inputs: [
      { name: 'items', type: 'array', required: true },
      { name: 'basePath', type: 'string' },
    ],
  });

  ComponentRegistry.register('app-schema-renderer', AppSchemaRenderer, {
    namespace: 'layout',
    label: 'App Schema Renderer',
    category: 'Layout',
    isContainer: true,
    inputs: [
      { name: 'schema', type: 'object' },
      { name: 'basePath', type: 'string' },
      // Declared as the vocabulary the renderer implements, not as free text
      // (objectui#3985). `type: 'string'` judged only `typeof value ===
      // 'string'`, so a hyphenated misspelling of `bottom_nav` passed every
      // gate and then failed the renderer's one equality check in silence —
      // the author got drawer behaviour and no diagnostic. As an `enum`,
      // `sdui-parser`'s `checkType` raises an error-level `invalid-enum`
      // instead, which is where an AI author finds the typo.
      {
        name: 'mobileNavMode',
        type: 'enum',
        enum: ['drawer', 'bottom_nav'],
        description:
          'Mobile navigation mode. "drawer" (default) puts the sidebar in the mobile sheet overlay; "bottom_nav" additionally renders a fixed bottom bar. These are the only two modes the renderer implements.',
      },
    ],
  });

  // NOTE: 'page' registration is handled by @object-ui/components PageRenderer.
  // That renderer supports page types (record/home/app/utility), named regions,
  // and PageVariablesProvider. Do NOT re-register 'page' here to avoid conflicts.
  //
  // This package used to ALSO export a `page`-node renderer (`PageNodeRenderer`,
  // `./Page`) that this note kept unregistered — so it had no call site and
  // never ran, while still advertising itself from the public API as if
  // `@object-ui/layout` were where page rendering lives. Deleted in
  // objectui#3223 under ADR-0049 (enforce-or-remove): one key, one renderer. If
  // the `page` node needs something layout owns, add it to the components
  // renderer — do not reintroduce a second one here.
}

// Keep backward compatibility for now if called directly
try {
  registerLayout();
} catch (e) {
  // Ignore registration errors during build/test cycles
}

/**
 * The PageHeader docs demo is the CANONICAL `page:header` node (objectui#3906),
 * and it renders the component rather than a hand-rolled header (objectui#3787).
 *
 * `layout-page-header/basic-page-header` is the only runnable example on
 * `content/docs/layout/page-header.mdx`. Until objectui#3906 it was a
 * `page-header` node — the `@object-ui/layout` alias, a different renderer with
 * no `ComponentPropsMap` row — so the page's live demo taught the one spelling
 * the contract does not know. The maintainer's ruling on that card (direction
 * (b)) made the page's author face the canonical key; this file pins the demo to
 * it.
 *
 * ⚠️ The file keeps its old name on purpose. Tests in `packages/layout` cite it
 * BY PATH for the layout-registration and manifest pins at the bottom (the
 * `diagnose()` helper lives here; the `page-header` alias they once pinned is
 * retired, objectui#10859), so renaming it would silently falsify those
 * pointers. The demo it pins was renamed instead: it carries no actions any
 * more, for the reason the render pin below states.
 *
 * Pinned for the demo, each a different fact:
 *
 *  1. SHAPE — the root is `page:header`, its props sit in `properties` (the
 *     page-component spelling, the only place the contract judges them), and the
 *     JSON restates none of the classes the canonical renderer owns. The last
 *     half is the hand-rolled-copy guard of objectui#3787, re-derived against the
 *     canonical renderer's classes.
 *  2. RENDER — through the real `SchemaRenderer`, the node produces the bare
 *     header layout: a `<header>` root, an `<h1>` title, the subtitle, and the
 *     container classes the docs page's Styling section states.
 *  3. CONTRACT — the demo passes the spec's page-component shape and the
 *     `ComponentPropsMap['page:header']` row in FULL (value-level, not only
 *     "no unrecognized key"), and objectui's own schema mirror. Each pass is
 *     paired with a planted mistake the same validator must still refuse.
 *  4. DECLARATION — every key the demo writes is a declared input of the
 *     `page:header` registration, read through the manifest the app builds.
 *
 * Why no actions and no children (measured, objectui#3906): the canonical
 * renderer draws no `children` at all, and its `actions` are action IDS
 * resolved against the object bound to the page. A docs demo is bound to no
 * object, so ids there resolve to nothing (the renderer warns once per id) — a
 * demo "with actions" would render none. The contract refuses the other two
 * shapes the old demo used: `children` on this node (objectui#9256) and an
 * inline action object in `actions` (the spec's `z.array(z.string())`).
 *
 * Module-scope imports, not `beforeAll` (AGENTS.md §测试纪律): the registrations
 * are import-time side effects, and paying that cost at import time keeps it out
 * of every test/hook timeout budget.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@object-ui/components';
import { ComponentRegistry } from '@object-ui/core';
import { SchemaRenderer } from '@object-ui/react';
import { registerLayout } from '@object-ui/layout';
import { manifestFromConfigs, validateTree } from '@object-ui/sdui-parser';
import type { Diagnostic, SchemaElement } from '@object-ui/sdui-parser';
import { safeValidateSchema } from '@object-ui/types/zod';
import { ComponentPropsMap, PageComponentSchema } from '@objectstack/spec/ui';
import { getExample } from '../src/index.js';

const EXAMPLE_ID = 'layout-page-header/basic-page-header';

interface DemoNode {
  type?: string;
  properties?: Record<string, unknown>;
  [key: string]: unknown;
}

const demo = (): DemoNode => getExample(EXAMPLE_ID).schema as DemoNode;

/**
 * Class strings the canonical renderer's bare layout puts on its own elements.
 * Their presence in the example JSON is the signature of a hand-rolled copy —
 * the defect objectui#3787 removed, not a styling choice.
 */
const COMPONENT_OWNED_CLASSES = [
  'border-b',
  'pb-4',
  'font-semibold',
  'tracking-tight',
  'text-2xl',
  'text-muted-foreground',
];

beforeAll(() => {
  registerLayout();
});

/**
 * The manifest the running app validates against, built the way the app builds
 * it — keyed by every KNOWN registry tag (bare and namespaced) rather than by
 * `getAllConfigs()`, whose `.type` is always the namespaced form. Mirrors
 * `getJsxManifest()` in `packages/components/src/renderers/layout/page.tsx`
 * (module-private, hence the four lines here): key it off `getAllConfigs()`
 * instead and the bare `page-header` tag authors write is absent from the
 * manifest, so every alias assertion below would pass on `unknown-component`
 * and never reach the check it names.
 */
const diagnose = (schema: unknown): Diagnostic[] => {
  const configs = ComponentRegistry.getKnownTypes().map((t) => {
    const meta = ComponentRegistry.getMeta(t);
    return { type: t, namespace: meta?.namespace, isContainer: meta?.isContainer, inputs: meta?.inputs };
  });
  const manifest = manifestFromConfigs(configs as unknown as Parameters<typeof manifestFromConfigs>[0]);
  return validateTree(schema as SchemaElement, manifest).diagnostics;
};

/** Every issue as `path: code`, so a red run says what broke rather than `false`. */
const issuesOf = (result: { success: boolean; error?: { issues: Array<{ path: PropertyKey[]; code: string }> } }) =>
  result.success ? [] : (result.error?.issues ?? []).map((i) => `${i.path.map(String).join('.')}: ${i.code}`);

describe('the page-header docs demo is the canonical `page:header` node (objectui#3906)', () => {
  it('is rooted at `page:header` and carries its props in `properties`', () => {
    const schema = demo();
    expect(schema.type).toBe('page:header');
    // Nothing else on the node: a prop written beside `type` is read by the
    // renderer but judged by no validator (see the CONTRACT describe below),
    // which is exactly the unchecked spelling the page tells authors not to use.
    expect(Object.keys(schema).sort()).toEqual(['properties', 'type']);
    expect(schema.properties).toEqual({
      title: 'Users',
      subtitle: 'Manage your team members and permissions',
    });
  });

  it('restates none of the classes the canonical renderer owns (the objectui#3787 guard)', () => {
    const json = JSON.stringify(demo());
    for (const cls of COMPONENT_OWNED_CLASSES) {
      expect(json, `example JSON should not restate \`${cls}\``).not.toContain(cls);
    }
  });

  it('renders the real canonical header: `<header>` root, `<h1>` title, subtitle', () => {
    const { container } = render(<SchemaRenderer schema={demo() as never} />);

    const root = container.querySelector('[data-obj-type="page:header"]');
    // The canonical renderer, not the alias's `<div>` root.
    expect(root?.tagName).toBe('HEADER');

    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toBe('Users');
    expect(screen.getByText('Manage your team members and permissions')).toBeTruthy();

    // No actions authored and none resolvable without a bound object, and the
    // node draws no children: the header renders no button at all.
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('renders the classes the docs Styling section states for the bare layout', () => {
    // Pins the CODE side of the bare-layout bullets in
    // `content/docs/layout/page-header.mdx`. Changing any of them turns this
    // red, which is the prompt to update that section.
    const { container } = render(<SchemaRenderer schema={demo() as never} />);
    const root = container.querySelector('[data-obj-type="page:header"]');
    const cls = root?.className ?? '';
    expect(cls).toContain('gap-2');
    expect(cls).toContain('pb-4');
    expect(cls).toContain('border-b');
    expect(cls).not.toMatch(/\b(sm|md|lg|xl):(pb|gap)-/);

    const h1Cls = container.querySelector('h1')?.className ?? '';
    expect(h1Cls).toContain('text-2xl');
    expect(h1Cls).toContain('font-semibold');
    expect(h1Cls).not.toMatch(/\b(sm|md|lg|xl):text-/);
  });
});

/**
 * The demo satisfies the contract the page teaches — and the same validators
 * still refuse the mistakes the page warns about.
 *
 * Every positive is paired with a control, because "passes" is also what a
 * validator that stopped judging looks like. Controls assert the issue's CODE
 * and PATH, never its wording.
 */
describe('the demo satisfies the `page:header` contract (objectui#3906)', () => {
  const row = ComponentPropsMap['page:header'];

  it('passes the spec page-component shape and the `page:header` props row in full', () => {
    const schema = demo();
    expect(issuesOf(PageComponentSchema.safeParse(schema))).toEqual([]);
    // A FULL parse, not only "no unrecognized key": the row also judges values.
    expect(issuesOf(row.safeParse(schema.properties))).toEqual([]);
  });

  it('passes objectui’s own schema mirror', () => {
    expect(issuesOf(safeValidateSchema(demo()))).toEqual([]);
  });

  it('CONTROL — the row refuses the retired `icon` by name', () => {
    const issues = issuesOf(row.safeParse({ ...demo().properties, icon: 'users' }));
    expect(issues).toEqual(['icon: invalid_type']);
  });

  it('CONTROL — the mirror refuses a misspelled key inside `properties`', () => {
    const result = safeValidateSchema({ ...demo(), properties: { ...demo().properties, subTitle: 'x' } });
    expect(issuesOf(result)).toEqual(['properties: unrecognized_keys']);
  });

  it('CONTROL — the spec refuses a prop written beside `type`, which is why the demo uses `properties`', () => {
    const issues = issuesOf(PageComponentSchema.safeParse({ ...demo(), title: 'Users' }));
    expect(issues).toEqual([': unrecognized_keys']);
  });

  it('CONTROL — the mirror refuses `children` on this node, which is why the demo carries none', () => {
    const result = safeValidateSchema({ ...demo(), children: [{ type: 'button', label: 'Export' }] });
    expect(issuesOf(result)).toEqual(['children: invalid_type']);
  });
});

/**
 * The declaration face: every key the demo writes is a declared input of the
 * `page:header` registration.
 *
 * `validateTree` reads keys on the node itself, the way the JSX tier writes them
 * (as attributes); it has no notion of the `properties` bag. `SchemaRenderer`
 * hoists `properties.*` onto the node before the renderer reads it, so the demo
 * is validated here in that hoisted shape — the shape the registration's
 * `inputs` describe.
 */
describe('the `page:header` registration declares every key the demo writes (objectui#3906)', () => {
  const hoisted = (extra: Record<string, unknown> = {}) => {
    const { properties, ...node } = demo();
    return { ...node, ...properties, ...extra };
  };

  it('draws no diagnostic at all', () => {
    const diagnostics = diagnose(hoisted());
    // Reachability first: an `unknown-component` return never reaches the prop
    // check, and an empty list would then mean nothing.
    expect(diagnostics.filter((d) => d.code === 'unknown-component')).toEqual([]);
    expect(diagnostics.map((d) => d.code)).toEqual([]);
  });

  it('CONTROL — a misspelled key still draws `unknown-prop`', () => {
    expect(diagnose(hoisted({ subTitle: 'x' })).map((d) => d.code)).toContain('unknown-prop');
  });

  it('CONTROL — children under `page:header` draw `not-a-container`', () => {
    // The manifest agrees with the renderer and the mirror: the canonical node
    // takes no child list.
    const codes = diagnose(hoisted({ children: [{ type: 'button', label: 'Export' }] })).map((d) => d.code);
    expect(codes).toContain('not-a-container');
  });
});

/**
 * ── `@object-ui/layout`'s registrations, below this line ──────────────────────
 *
 * Everything from here down is about `@object-ui/layout`'s registrations, not
 * about the docs demo. Until objectui#10859 batch 8 (phase 2c) this section
 * pinned the `page-header` ALIAS: that a children-bearing alias node validated
 * clean of `not-a-container` (#3900), and that its declaration face matched what
 * its renderer read (#3972: `icon`, `actions`, the `description` cost of
 * objectui#11044), read off `ALIAS_FIXTURE`, the former demo JSON. That phase
 * retired the alias, so the alias half is now the retirement pin, and the
 * `navigation-renderer` halves, which never depended on it, stay as they were.
 */
const RETIRED_ALIAS_NODE = {
  type: 'page-header',
  title: 'Users',
  subtitle: 'Manage your team members and permissions',
  children: [{ type: 'button', label: 'Add User' }],
};

describe('the retired `page-header` alias is unknown to the manifest (objectui#10859 batch 8)', () => {
  it('draws `unknown-component`, and the canonical `page:header` does not', () => {
    // Lit control first: the key authors write still resolves in the same manifest.
    expect(
      diagnose({ type: 'page:header', title: 'Users' }).filter((d) => d.code === 'unknown-component'),
    ).toEqual([]);
    expect(diagnose(RETIRED_ALIAS_NODE).map((d) => d.code)).toContain('unknown-component');
  });
});

/**
 * The containment control (#3900), kept without the alias it used to stand
 * beside: `navigation-renderer` (registered in `@object-ui/layout`) is driven
 * entirely by its `items` prop and never reads `schema.children`, so children
 * under it ARE an authoring mistake and the author must still hear about it.
 */
describe('a layout component that takes no child list still reports `not-a-container` (#3900)', () => {
  it('reports `not-a-container` for children under `navigation-renderer`', () => {
    // If this component ever legitimately becomes a container, this assertion
    // goes red — move the control to another childless registration rather than
    // deleting it. `items: []` keeps the planted defect — children under a
    // childless component — the only thing wrong with this node: an
    // array-valued `items` validates clean (#3972) and omitting it draws
    // `missing-required-prop` (#3987), both pinned below.
    const codes = diagnose({
      type: 'navigation-renderer',
      items: [],
      children: [{ type: 'button', label: 'Nope' }],
    }).map((d) => d.code);

    expect(codes).toContain('not-a-container');
  });
});

/**
 * The prop face of the same agreement (#3972), through the same manifest.
 *
 * `registerLayout()`'s `inputs` lists are what `sdui-parser` validates a node's
 * top-level props against, so a key declared with the wrong `type` comes back as
 * `type-mismatch` on CORRECT authoring. `navigation-renderer.items` was declared
 * `object` while the renderer reads `NavigationItem[]`.
 */
describe('the layout declaration face matches what the renderer reads (#3972)', () => {
  const codesFor = (schema: unknown): string[] => diagnose(schema).map((d) => d.code);

  it('accepts an array-valued `navigation-renderer.items`, and reports an object', () => {
    expect(codesFor({ type: 'navigation-renderer', items: [] })).toEqual([]);
    expect(
      codesFor({
        type: 'navigation-renderer',
        items: [{ id: 'home', type: 'object', label: 'Home', objectName: 'home' }],
      }),
    ).toEqual([]);

    // The control, and the direction is inverted rather than absent: this exact
    // object shape was the ONLY one that validated clean before #3972, so the pin
    // is not "a diagnostic disappeared" but "the two shapes swapped verdicts".
    // The message is asserted too — a `type-mismatch` still saying "expected an
    // object" would mean the declaration never moved.
    const objectValued = diagnose({ type: 'navigation-renderer', items: { home: {} } });
    expect(objectValued.map((d) => d.code)).toContain('type-mismatch');
    expect(objectValued.find((d) => d.code === 'type-mismatch')?.message).toContain(
      'expected an array',
    );
  });
});

/**
 * The optionality face of the same key (#3987), through the same manifest.
 *
 * `navigation-renderer.items` is non-optional in TS and has no default, so a node
 * that omits it throws `TypeError: items is not iterable` on the first thing the
 * render does with it (measured in
 * `packages/layout/src/__tests__/navigation-renderer-items-declaration.test.tsx`).
 * The declaration used to leave `required` unset, and `validateTree` reports
 * `missing-required-prop` only when it is set — so the ONE node shape guaranteed
 * to crash was also the one shape the validator had nothing to say about.
 *
 * This is a TIGHTENING, not a false-diagnostic fix like #3900/#3972: it adds an
 * error-level diagnostic to schemas that validated clean before. That is the
 * point — the schemas it newly rejects are exactly the ones that cannot render —
 * but it is also why the control below matters more than usual. "Required" has to
 * stay a per-prop fact read off the component.
 */
describe('the validator reports the node shape that is guaranteed to crash (#3987)', () => {
  const REQUIRED = 'missing-required-prop';

  it('reports `missing-required-prop` for a `navigation-renderer` without `items`', () => {
    const diagnostics = diagnose({ type: 'navigation-renderer' });

    // Reachability before the presence assertion: an `unknown-component` return
    // never reaches the required-prop loop at all, so this would otherwise pass
    // on a manifest that lost the tag.
    expect(diagnostics.filter((d) => d.code === 'unknown-component')).toEqual([]);

    const missing = diagnostics.find((d) => d.code === REQUIRED);
    expect(missing, 'omitting `items` drew no `missing-required-prop`').toBeTruthy();
    // Error, not warning — the render cannot recover, so neither should the gate.
    expect(missing?.severity).toBe('error');
    expect(missing?.message).toContain('"items"');
  });

  it('reports nothing once `items` is supplied', () => {
    expect(diagnose({ type: 'navigation-renderer', items: [] }).map((d) => d.code)).toEqual([]);
    expect(
      diagnose({
        type: 'navigation-renderer',
        items: [{ id: 'home', type: 'object', label: 'Home', objectName: 'home' }],
        basePath: '/apps/crm',
      }).map((d) => d.code),
    ).toEqual([]);
  });

  it('does not report the optional props the renderer defaults', () => {
    // The control that keeps `required` a per-prop fact. `basePath` is omitted
    // here: the renderer defaults it (`basePath = ''`), the declaration leaves
    // `required` unset, and the gate must stay silent about it.
    const codes = diagnose({ type: 'navigation-renderer', items: [] }).map((d) => d.code);
    expect(codes).not.toContain(REQUIRED);

    // …and the same for a second component in the same registration file, so the
    // control is not one prop's accident: `responsive-grid` renders with no
    // props at all, and every key it declares is optional. (This was the
    // `page-header` alias until objectui#10859 batch 8 retired it.)
    const grid = diagnose({ type: 'responsive-grid' }).map((d) => d.code);
    expect(grid).not.toContain('unknown-component');
    expect(grid).not.toContain(REQUIRED);
  });
});

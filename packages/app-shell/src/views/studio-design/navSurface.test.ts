// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * Interfaces-pillar nav-leaf binding (objectui#4019).
 *
 * The gap this pins: an `action` nav item is a LIVE runtime surface — the
 * shipped sidebar renders it and `useNavActionDispatch` executes it
 * (framework#4509) — but the Studio Interfaces rail could not resolve it to a
 * design surface, so the very same entry rendered permanently DISABLED in the
 * designer while it worked in the running app. `action` has had both a
 * registered preview (`ActionPreview`) and a registered default inspector
 * (`ActionDefaultInspector`) all along; only this binding was missing.
 *
 * The fixtures are parsed against the spec's own `NavigationItemSchema` rather
 * than asserted by eye, so this file cannot drift into pinning a shape the
 * schema rejects (the phantom-rule trap): the positive fixture must be
 * spec-VALID for the designer to be required to open it, and the rejected
 * alias spelling must stay unresolvable here because the schema refuses it by
 * name — Commandment #0.1, no second dialect in the consumer.
 */
import { describe, expect, expectTypeOf, it } from 'vitest';
import { NavigationItemSchema, type I18nLabel } from '@objectstack/spec/ui';
import { resolveSurface, findSurfaceInTree, type NavNode } from './navSurface';

/**
 * The designer locale these binding cases run in. The binding never reads it;
 * only the label does, and the map-label cases at the end of the file pin
 * that half (objectui#11158).
 */
const LOCALE = 'en-US';

/** A spec-valid global-action nav item. */
const ACTION_NODE: NavNode = {
  id: 'nav_run_sync',
  type: 'action',
  label: 'Run Sync',
  actionDef: { actionName: 'sync_now' },
};

describe('resolveSurface — action nav items (objectui#4019)', () => {
  it('the fixture is a real authoring surface: the spec accepts it whole', () => {
    const parsed = NavigationItemSchema.safeParse(ACTION_NODE);
    expect(parsed.success).toBe(true);
  });

  it('binds an action nav leaf to the `action` design surface', () => {
    expect(resolveSurface(ACTION_NODE, LOCALE)).toEqual({
      type: 'action',
      name: 'sync_now',
      label: 'Run Sync',
    });
  });

  it('leaves an action item with no actionName unresolved (stays disabled)', () => {
    expect(resolveSurface({ id: 'nav_x', type: 'action', label: 'Nothing' }, LOCALE)).toBeNull();
    expect(resolveSurface({ id: 'nav_x', type: 'action', label: 'Nothing', actionDef: {} }, LOCALE)).toBeNull();
  });

  it('reads the canonical key ONLY — a spelling the schema rejects stays unresolved', () => {
    // `action` / `name` inside `actionDef` are REJECTED aliases carrying a
    // redirect (objectstack#4001), not second spellings. Measured on
    // spec 17.0.0-rc.6: `unrecognized_keys` on `actionDef` plus a missing
    // `actionName`. A tolerant `??` limb here would resurrect exactly the bug
    // #4001 closed — an entry that dispatches an action the author did not
    // declare — so the designer must refuse what the schema refuses.
    const aliasNode = {
      id: 'nav_run_sync',
      type: 'action',
      label: 'Run Sync',
      actionDef: { action: 'sync_now' },
    };
    const parsed = NavigationItemSchema.safeParse(aliasNode);
    expect(parsed.success).toBe(false);
    expect(resolveSurface(aliasNode as NavNode, LOCALE)).toBeNull();
  });

  it('reaches an action leaf nested in a group (the `?surface=` deep-link path)', () => {
    const tree: NavNode[] = [
      { id: 'g1', type: 'group', label: 'Ops', children: [ACTION_NODE] },
    ];
    expect(findSurfaceInTree(tree, { type: 'action', name: 'sync_now' }, LOCALE)).toEqual({
      type: 'action',
      name: 'sync_now',
      label: 'Run Sync',
    });
  });
});

describe('resolveSurface — the variants around the new one are unchanged', () => {
  it('still binds the surface-bearing leaves', () => {
    expect(resolveSurface({ type: 'page', pageName: 'home', label: 'Home' }, LOCALE)?.type).toBe('page');
    expect(resolveSurface({ type: 'object', objectName: 'crm_lead', label: 'Leads' }, LOCALE)?.name).toBe('crm_lead');
    expect(resolveSurface({ type: 'dashboard', dashboardName: 'sales', label: 'Sales' }, LOCALE)?.name).toBe('sales');
    expect(resolveSurface({ type: 'report', reportName: 'pipeline', label: 'Pipeline' }, LOCALE)?.name).toBe('pipeline');
  });

  it('leaves the variants with no authorable target unresolved', () => {
    // Deliberately NOT openable — `url` points out of the product, `separator`
    // is a divider, and `component` names a first-party UI shipped in code, so
    // none of the three has a metadata item to design. Only `action` was a
    // metadata type sitting in this bucket by omission.
    expect(resolveSurface({ id: 'nav_docs', type: 'url', label: 'Docs', url: 'https://example.com' }, LOCALE)).toBeNull();
    expect(resolveSurface({ id: 'nav_sep', type: 'separator' }, LOCALE)).toBeNull();
    expect(
      resolveSurface({ id: 'nav_dir', type: 'component', label: 'Directory', componentRef: 'metadata:directory' }, LOCALE),
    ).toBeNull();
  });
});

/**
 * objectui#4881 — the binding reads the CANONICAL target key only.
 *
 * This card is subtraction, and subtraction has a trap: a pin that only says
 * `resolveSurface(x) === null` is green because NOTHING WAS PRODUCED, not
 * because the logic is right — it would have passed before the deleted legs
 * as well as after, so it proves nothing either way. Each spelling is
 * therefore pinned as a PAIR on the SAME `type`, and the pair is what carries
 * the proof:
 *
 *   a) the canonical fixture PARSES against `NavigationItemSchema` and
 *      RESOLVES to a surface — green only if the surviving branch really
 *      reads that key; and
 *   b) the bare fixture is REJECTED by the spec, with an `unrecognized_keys`
 *      issue naming that exact key (so the shape cannot reach a saved app),
 *      AND stays unresolved here.
 *
 * The null in (b) is only meaningful because (a) is non-null on the same
 * variant with only the key spelling changed: the leaf is unresolvable
 * because of the SPELLING, not because the variant has no surface.
 *
 * Measured against the installed `@objectstack/spec` 17.0.0 (the card was
 * written against 17.0.0-rc.6): all four bare spellings are still unknown
 * keys, and the union still has no `view` member.
 */
interface Variant {
  type: string;
  canonicalKey: 'pageName' | 'objectName' | 'dashboardName' | 'reportName';
  /** The spelling `AppSchema` answers with `unrecognized_keys`. */
  bareKey: string;
  name: string;
  label: string;
}

const VARIANTS: Variant[] = [
  { type: 'page', canonicalKey: 'pageName', bareKey: 'page', name: 'home', label: 'Home' },
  { type: 'object', canonicalKey: 'objectName', bareKey: 'object', name: 'crm_lead', label: 'Leads' },
  { type: 'dashboard', canonicalKey: 'dashboardName', bareKey: 'dashboard', name: 'sales', label: 'Sales' },
  { type: 'report', canonicalKey: 'reportName', bareKey: 'report', name: 'pipeline', label: 'Pipeline' },
];

/** Every `unrecognized_keys` key the spec named, flattened. */
function unrecognizedKeys(value: unknown): string[] {
  const parsed = NavigationItemSchema.safeParse(value);
  if (parsed.success) return [];
  return parsed.error.issues.flatMap((i) => (i.code === 'unrecognized_keys' ? i.keys : []));
}

describe.each(VARIANTS)(
  'resolveSurface — $type binds `$canonicalKey`, never the bare `$bareKey` (objectui#4881)',
  ({ type, canonicalKey, bareKey, name, label }) => {
    it('the canonical fixture is spec-VALID and resolves to its surface', () => {
      const node = { id: `nav_${name}`, type, label, [canonicalKey]: name } as NavNode;
      expect(NavigationItemSchema.safeParse(node).success).toBe(true);
      expect(resolveSurface(node, LOCALE)).toEqual({ type, name, label });
    });

    it('the bare spelling is `unrecognized_keys` in the spec AND unresolved here', () => {
      const node = { id: `nav_${name}`, type, label, [bareKey]: name } as NavNode;
      // Half one: the shape cannot reach production — the schema refuses it by
      // name, so no saved app can carry it.
      expect(NavigationItemSchema.safeParse(node).success).toBe(false);
      expect(unrecognizedKeys(node)).toContain(bareKey);
      // Half two: the consumer does not parse it either. Non-trivial because
      // the sibling test above resolves the SAME type with only the key
      // spelling changed — this null is about the spelling, not the variant.
      expect(resolveSurface(node, LOCALE)).toBeNull();
    });

    it('a draft carrying BOTH keys binds to the canonical one', () => {
      const node = { id: `nav_${name}`, type, label, [canonicalKey]: name, [bareKey]: 'rejected_spelling' } as NavNode;
      // Such a draft is unsaveable — the bare key alone is enough to fail.
      expect(unrecognizedKeys(node)).toContain(bareKey);
      expect(resolveSurface(node, LOCALE)?.name).toBe(name);
    });
  },
);

describe('resolveSurface — there is no `view` nav variant (objectui#4881)', () => {
  const VIEW_LEAF = { id: 'nav_all', type: 'view', label: 'All Leads', viewName: 'all' } as NavNode;

  it('`type: "view"` fails the discriminator — the union has nine members and none is `view`', () => {
    const parsed = NavigationItemSchema.safeParse(VIEW_LEAF);
    expect(parsed.success).toBe(false);
    const issue = parsed.success ? undefined : parsed.error.issues[0];
    expect(issue?.code).toBe('invalid_union');
    expect(issue?.path).toEqual(['type']);
    // The deleted branch could only ever have run on this — i.e. never.
    expect(resolveSurface(VIEW_LEAF, LOCALE)).toBeNull();
  });

  it('`viewName` is an OPTIONAL key ON the object item, so that leaf still binds as `object`', () => {
    // The reason there is no `view` TYPE: "which list view to open" is a
    // property of an object nav item, not a navigation variant of its own.
    const node = { id: 'nav_lead', type: 'object', label: 'Leads', objectName: 'crm_lead', viewName: 'all' } as NavNode;
    expect(NavigationItemSchema.safeParse(node).success).toBe(true);
    expect(resolveSurface(node, LOCALE)).toEqual({ type: 'object', name: 'crm_lead', label: 'Leads' });
  });

  it('the bare `view` key is `unrecognized_keys` even on an otherwise valid object item', () => {
    const node = { id: 'nav_lead', type: 'object', label: 'Leads', objectName: 'crm_lead', view: 'all' } as NavNode;
    expect(unrecognizedKeys(node)).toContain('view');
  });
});

/**
 * objectui#11158 — a nav item's `label` is the spec's `I18nLabel`, and
 * `resolveSurface` resolves it once, in the designer locale.
 *
 * Before this card it read `String(node.label ?? '')`, so a locale map became
 * `[object Object]` in the Surface, and every reader of the Surface (the
 * canvas caption, the breadcrumb, the copilot chip) printed that. The map
 * fixture parses against the spec, so it is an input the designer must handle.
 * The designer locale is `en-US` or `zh-CN` (`useMetadataLocale`).
 */
describe('resolveSurface resolves a locale-map label in the designer locale (objectui#11158)', () => {
  const MAP_NODE: NavNode = { id: 'nav_home', type: 'page', label: { en: 'Home', 'zh-CN': '首页' }, pageName: 'home' };

  it('`NavNode.label` is typed as the spec types it, so the compiler refuses a raw render', () => {
    // Compile-time: `tsc -p tsconfig.test.json` (this package's `type-check`)
    // fails if the type narrows back to `string`, which is what let a map reach
    // JSX unresolved.
    expectTypeOf<NavNode['label']>().toEqualTypeOf<I18nLabel | undefined>();
  });

  it('the map-labelled fixture is spec-VALID', () => {
    expect(NavigationItemSchema.safeParse(MAP_NODE).success).toBe(true);
  });

  it.each([
    ['en-US', 'Home'],
    ['zh-CN', '首页'],
  ])('under %s the Surface carries the text %s, not the map', (locale, text) => {
    expect(resolveSurface(MAP_NODE, locale)).toEqual({ type: 'page', name: 'home', label: text });
  });

  it('a plain-string label is carried as authored in both locales (the control)', () => {
    const node: NavNode = { ...MAP_NODE, label: 'Home' };
    expect(resolveSurface(node, 'en-US')?.label).toBe('Home');
    expect(resolveSurface(node, 'zh-CN')?.label).toBe('Home');
  });

  it('an item with no label carries an empty label, as before', () => {
    const node: NavNode = { id: 'nav_home', type: 'page', pageName: 'home' };
    expect(resolveSurface(node, 'zh-CN')).toEqual({ type: 'page', name: 'home', label: '' });
  });

  it('`findSurfaceInTree` matches on {type,name} alone, so the same leaf is found in both locales', () => {
    const tree: NavNode[] = [{ id: 'nav_main', type: 'group', label: { en: 'Main', 'zh-CN': '主要' }, children: [MAP_NODE] }];
    expect(findSurfaceInTree(tree, { type: 'page', name: 'home' }, 'en-US')).toEqual({ type: 'page', name: 'home', label: 'Home' });
    expect(findSurfaceInTree(tree, { type: 'page', name: 'home' }, 'zh-CN')).toEqual({ type: 'page', name: 'home', label: '首页' });
  });
});

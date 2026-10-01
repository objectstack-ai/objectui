/**
 * objectui#11022 — the strict authoring face admits what the widget slot's
 * REGISTRATIONS declare, measured against the live `ComponentRegistry`.
 *
 * `@object-ui/types` records, on its private widget-slot arm, the input names
 * of each component type in the closed `DASHBOARD_COMPONENT_WIDGET_TYPES`, and
 * the strict walker admits exactly those (see `strict-authoring-face.ts`,
 * "Registered inputs"). That package depends on no registry, so the names are
 * transcribed there — and a transcription is only as good as the check that
 * re-reads its source. The source is here: this package's barrel runs the
 * registration. So this file holds the record to the registration in BOTH
 * directions, and holds no copy of either list:
 *
 *   1. UNDER-admission — every input a widget-slot type's registration
 *      declares parses on `StrictAnyComponentSchema` in the widget slot, with
 *      no `unrecognized_keys` naming it. The population is every member of the
 *      closed set, read from the set, so a member added later is walked too.
 *   2. OVER-admission — every key the strict slot arm admits beyond the
 *      tolerant arm's own members is a key some widget-slot registration
 *      declares. Read off the derived arm's shape, so a name added to the
 *      record that no registration declares turns this red.
 *
 * The instrument's controls: a key no registration declares is refused by
 * name (so walk 1 can fail), and the population is non-empty and holds the
 * card that motivated the repair.
 *
 *   3. THE SLOT'S `layout` (objectui#11070 round 11) — not a registered input
 *      but a widget key, the spec's widget `layout`, which `DashboardGridLayout`'s
 *      Save Layout (`mergeLayoutIntoSchema`) writes onto every `widgets[]`
 *      entry, a component node included. The producer's own output is parsed
 *      here, so the pin measures what Save Layout writes rather than a
 *      hand-copied shape of it. The slot arm declares the spec's member by
 *      reference, so a malformed `layout` is the control: refused, at
 *      `layout`, on both faces.
 */
import { describe, expect, it } from 'vitest';
import { DashboardWidgetSchema as SpecDashboardWidgetSchema } from '@objectstack/spec/ui';
import { ComponentRegistry } from '@object-ui/core';
import {
  DASHBOARD_COMPONENT_WIDGET_TYPES,
  type DashboardComponentSchema as DashboardComponentNode,
  type DashboardWidgetSlotComponentSchema,
} from '@object-ui/types';
import {
  AnyComponentSchema,
  DashboardComponentSchema,
  deriveStrictAuthoringSchema,
  StrictAnyComponentSchema,
} from '@object-ui/types/zod';
// Side-effect import: the package barrel runs the `ComponentRegistry.register`
// calls, `metric-card`'s among them.
import '../index';
import { mergeLayoutIntoSchema } from '../DashboardGridLayout';

type Issue = { code: string; path: PropertyKey[]; keys?: string[]; errors?: Issue[][] };
type Def = {
  type: string;
  shape?: Record<string, unknown>;
  innerType?: unknown;
  element?: unknown;
  options?: unknown[];
};
type Input = { name: string; type?: unknown; enum?: Array<{ value: unknown } | string> };

const defOf = (schema: unknown): Def => (schema as { _zod: { def: Def } })._zod.def;

/** Every key named by an `unrecognized_keys` issue anywhere in the refusal. */
const unrecognized = (issues: readonly Issue[]): string[] =>
  issues.flatMap((issue) => [
    ...(issue.code === 'unrecognized_keys' ? (issue.keys ?? []) : []),
    ...(issue.errors ?? []).flatMap((group) => unrecognized(group)),
  ]);

/** A value of the input's registered kind — the key is what is measured, not the value. */
const sampleFor = (input: Input): unknown => {
  if (input.type === 'enum' && input.enum?.length) {
    const first = input.enum[0];
    return typeof first === 'string' ? first : first.value;
  }
  if (input.type === 'number') return 1;
  if (input.type === 'boolean') return true;
  return 'sample';
};

const dashboard = (widget: Record<string, unknown>) => ({ type: 'dashboard', widgets: [widget] });

const registeredInputs = (type: string): Input[] =>
  (ComponentRegistry.getConfig(type)?.inputs ?? []) as Input[];

/** The widget slot's component-node arm: the union option whose `type` is the closed set. */
const slotArm = (dashboardSchema: unknown): unknown => {
  let widgets = defOf(dashboardSchema).shape?.widgets;
  while (defOf(widgets).innerType) widgets = defOf(widgets).innerType;
  const options = defOf(defOf(widgets).element).options ?? [];
  const arm = options.find((option) => {
    const type = defOf(defOf(option).shape?.type);
    return type.type === 'enum';
  });
  if (!arm) throw new Error('no component-node arm found in the widget slot — the slot moved; re-read it before trusting this file');
  return arm;
};

describe('objectui#11022 — widget-slot registrations vs the strict authoring face', () => {
  it('the population is the closed set, and it is not empty', () => {
    expect(DASHBOARD_COMPONENT_WIDGET_TYPES).toContain('metric-card');
    for (const type of DASHBOARD_COMPONENT_WIDGET_TYPES) {
      expect(registeredInputs(type).length, `\`${type}\` has no registered inputs to walk`).toBeGreaterThan(0);
    }
    // The registration the defect was measured on: `value` is its REQUIRED input.
    expect(registeredInputs('metric-card').find((i) => i.name === 'value')).toMatchObject({ required: true });
  });

  describe.each([...DASHBOARD_COMPONENT_WIDGET_TYPES])('`%s`', (type) => {
    it.each(registeredInputs(type).map((input) => [input.name, input] as const))(
      'UNDER-admission: its registered input `%s` parses in the widget slot on the strict face',
      (name, input) => {
        const result = StrictAnyComponentSchema.safeParse(dashboard({ type, [name]: sampleFor(input) }));
        const issues = result.success ? [] : (result.error.issues as unknown as Issue[]);
        expect(unrecognized(issues), `the strict face refuses the registered input \`${name}\``).not.toContain(name);
        expect(result.success).toBe(true);
      },
    );

    it('CONTROL — a key no registration declares is refused by name', () => {
      const result = StrictAnyComponentSchema.safeParse(dashboard({ type, notARegisteredInput11022: 1 }));
      expect(result.success).toBe(false);
      expect(unrecognized(result.success ? [] : (result.error.issues as unknown as Issue[]))).toContain(
        'notARegisteredInput11022',
      );
    });
  });

  it('OVER-admission: every key the strict slot arm admits beyond the tolerant arm is a registered input', () => {
    const tolerantKeys = new Set(Object.keys(defOf(slotArm(DashboardComponentSchema)).shape ?? {}));
    const strictKeys = Object.keys(defOf(slotArm(deriveStrictAuthoringSchema(DashboardComponentSchema))).shape ?? {});
    const admitted = strictKeys.filter((key) => !tolerantKeys.has(key)).sort();
    const registered = new Set(
      DASHBOARD_COMPONENT_WIDGET_TYPES.flatMap((type) => registeredInputs(type).map((input) => input.name)),
    );
    // Non-vacuity: the derived arm does admit something the tolerant arm does not declare.
    expect(admitted).toContain('value');
    expect(
      admitted.filter((key) => !registered.has(key)),
      'the strict slot arm admits a key no widget-slot registration declares — remove it from '
        + '`DASHBOARD_WIDGET_SLOT_REGISTERED_INPUTS` in `@object-ui/types`, or register it first',
    ).toEqual([]);
    // And the other half, read the same way: nothing registered is left out.
    const missing = [...registered].filter((key) => !tolerantKeys.has(key) && !admitted.includes(key));
    expect(missing).toEqual([]);
  });
});

/** Every issue in the refusal, union arms flattened, each path made absolute to the widget. */
const flatIssues = (issues: readonly Issue[], prefix: PropertyKey[] = []): Issue[] =>
  issues.flatMap((issue) => [
    { ...issue, path: [...prefix, ...issue.path] },
    ...(issue.errors ?? []).flatMap((group) => flatIssues(group, [...prefix, ...issue.path])),
  ]);

/** A node of `type` carrying each REQUIRED registered input, so only `layout` is under test. */
const nodeOf = (type: string): DashboardWidgetSlotComponentSchema => ({
  type: type as DashboardWidgetSlotComponentSchema['type'],
  id: `kpi-${type}`,
  ...Object.fromEntries(
    registeredInputs(type)
      .filter((input) => (input as Input & { required?: boolean }).required)
      .map((input) => [input.name, sampleFor(input)]),
  ),
});

/** What Save Layout persists: the producer's merge of grid coordinates into the dashboard. */
const savedLayout = (node: DashboardWidgetSlotComponentSchema): DashboardComponentNode =>
  mergeLayoutIntoSchema({ type: 'dashboard', widgets: [node] }, [
    { i: node.id ?? '', x: 0, y: 0, w: 3, h: 2 },
  ]);

describe('objectui#11070 round 11 — the slot\'s `layout`, as Save Layout writes it, on the strict face', () => {
  describe.each([...DASHBOARD_COMPONENT_WIDGET_TYPES])('`%s`', (type) => {
    it('the producer writes `layout` onto the component node — the population is real', () => {
      const saved = savedLayout(nodeOf(type));
      expect(saved.widgets[0]).toMatchObject({ type, layout: { x: 0, y: 0, w: 3, h: 2 } });
    });

    it('the saved dashboard parses on the strict face, and `layout` is not named', () => {
      const result = StrictAnyComponentSchema.safeParse(savedLayout(nodeOf(type)));
      const issues = result.success ? [] : (result.error.issues as unknown as Issue[]);
      expect(unrecognized(issues), 'the strict face refuses the `layout` Save Layout wrote').not.toContain('layout');
      expect(result.success).toBe(true);
      // Control: the tolerant face accepts the same document — the two faces agree.
      expect(AnyComponentSchema.safeParse(savedLayout(nodeOf(type))).success).toBe(true);
    });

    it.each([
      ['a non-number coordinate', { x: 'left', y: 0, w: 3, h: 2 }, ['layout', 'x']],
      ['a missing coordinate', { x: 0, y: 0, w: 3 }, ['layout', 'h']],
      ['a key the spec does not declare', { x: 0, y: 0, w: 3, h: 2, z: 1 }, ['layout']],
    ] as const)('CONTROL — %s in `layout` is refused at `layout`, on both faces', (_label, layout, path) => {
      const doc = { type: 'dashboard', widgets: [{ ...nodeOf(type), layout }] };
      for (const face of [StrictAnyComponentSchema, AnyComponentSchema]) {
        const result = face.safeParse(doc);
        expect(result.success).toBe(false);
        const union = (result.success ? [] : (result.error.issues as unknown as Issue[])).find(
          (issue) => issue.code === 'invalid_union' && issue.path.join('.') === 'widgets.0',
        );
        // The COMPONENT arm's own verdict — the union's first arm — not the widget
        // arm's, which has always judged `layout` and would answer for it otherwise.
        const componentArm = flatIssues(union?.errors?.[0] ?? []);
        expect(componentArm.map((issue) => issue.path.join('.'))).toContain(path.join('.'));
      }
    });
  });

  it('both arms carry the spec\'s widget `layout` — one shape, read off the spec, not restated', () => {
    let widgets = defOf(DashboardComponentSchema).shape?.widgets;
    while (defOf(widgets).innerType) widgets = defOf(widgets).innerType;
    const arms = defOf(defOf(widgets).element).options ?? [];
    type Member = { safeParse: (value: unknown) => { success: boolean } };
    // Each probe value, judged by the spec's member and by each arm's: the verdicts must agree.
    const probes: unknown[] = [
      undefined,
      { x: 0, y: 0, w: 3, h: 2 },
      { x: 0, y: 0, w: 3 },
      { x: 'left', y: 0, w: 3, h: 2 },
      { x: 0, y: 0, w: 3, h: 2, z: 1 },
      'top',
    ];
    const verdicts = (member: Member) => probes.map((value) => member.safeParse(value).success);
    const spec = verdicts(SpecDashboardWidgetSchema.shape.layout as unknown as Member);
    // Non-vacuity: the spec's member accepts and refuses something in the probe set.
    expect(spec).toContain(true);
    expect(spec).toContain(false);
    expect(arms).toHaveLength(2);
    for (const arm of arms) {
      const layout = defOf(arm).shape?.layout as Member | undefined;
      expect(layout, 'a widget-slot arm declares no `layout`').toBeDefined();
      expect(verdicts(layout as Member)).toEqual(spec);
    }
  });

  it('the TypeScript face: the arm types `layout` by the spec\'s shape, not the index signature\'s `any`', () => {
    const placed: DashboardWidgetSlotComponentSchema = { type: 'metric-card', layout: { x: 0, y: 0, w: 3, h: 2 } };
    // @ts-expect-error -- `x` is a number in the spec's widget `layout`.
    const misplaced: DashboardWidgetSlotComponentSchema = { type: 'metric-card', layout: { x: 'left', y: 0, w: 3, h: 2 } };
    expect([placed.layout?.w, misplaced.type]).toEqual([3, 'metric-card']);
  });
});

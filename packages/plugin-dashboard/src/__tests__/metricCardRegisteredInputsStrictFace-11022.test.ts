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
 */
import { describe, expect, it } from 'vitest';
import { ComponentRegistry } from '@object-ui/core';
import { DASHBOARD_COMPONENT_WIDGET_TYPES } from '@object-ui/types';
import {
  DashboardComponentSchema,
  deriveStrictAuthoringSchema,
  StrictAnyComponentSchema,
} from '@object-ui/types/zod';
// Side-effect import: the package barrel runs the `ComponentRegistry.register`
// calls, `metric-card`'s among them.
import '../index';

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

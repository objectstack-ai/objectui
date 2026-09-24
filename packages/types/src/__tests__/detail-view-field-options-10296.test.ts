// Copyright (c) 2026 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * `DetailViewFieldSchema.options` is the spec's AUTHORING option schema, by
 * reference (objectui#10296, ruling F1 on objectui#7759).
 *
 * Before this card the mirror carried an inline option shape that admitted a
 * number or boolean `value` the declaration (`SelectOptionMetadata[]`) refuses,
 * and silently STRIPPED every other key. F1 rules that a structural mirror points
 * at the spec's authoring schema, ⛔ never at the declaration: the declaration here
 * is the runtime READ model, which admits `disabled` and `icon` — two keys the
 * spec refuses by name. The remaining difference between the two faces
 * (`visibleWhen`'s envelope) is recorded as an EXPECTED DIVERGENCE in the parity
 * ledgers, not repaired.
 *
 * Every refusal below is asserted on the issue `code` and the `path` it lands on,
 * each beside an accepting control, so a schema that refuses everything cannot
 * pass. On a revert to the inline shape the numeric/boolean `value` and the
 * by-name refusals turn green-to-red.
 */

import { describe, it, expect } from 'vitest';
import { SelectOptionSchema as SpecSelectOptionSchema } from '@objectstack/spec/data';
import { DetailViewFieldSchema } from '../zod/views.zod.js';

const field = (option: Record<string, unknown>) =>
  DetailViewFieldSchema.safeParse({ name: 'status', type: 'select', options: [option] });

const issuesOf = (r: ReturnType<typeof field>) =>
  r.success ? [] : r.error.issues.map((i) => ({ code: i.code, path: i.path.join('.') }));

describe('DetailViewFieldSchema.options is the spec authoring option schema (objectui#10296)', () => {
  it('accepts an authored option carrying every spec key (accepting control)', () => {
    const r = field({
      label: 'Open',
      value: 'open',
      description: 'Not started yet',
      color: '#22c55e',
      default: true,
      visibleWhen: "record.kind == 'task'",
    });
    expect(issuesOf(r)).toEqual([]);
  });

  it.each([
    ['a number', 1],
    ['a boolean', true],
  ])('refuses %s as `value` — the spec value is a machine identifier string', (_label, value) => {
    const r = field({ label: 'One', value });
    expect(r.success).toBe(false);
    expect(issuesOf(r)).toContainEqual({ code: 'invalid_type', path: 'options.0.value' });
  });

  it.each(['icon', 'disabled'])('refuses the read-model-only key `%s` BY NAME', (key) => {
    const r = field({ label: 'Open', value: 'open', [key]: key === 'icon' ? 'circle' : true });
    expect(r.success).toBe(false);
    const issue = r.success ? undefined : r.error.issues.find((i) => i.code === 'unrecognized_keys');
    expect(issue?.path.join('.')).toBe('options.0');
    expect((issue as { keys?: string[] } | undefined)?.keys).toEqual([key]);
  });

  it('gives the same verdict as the spec schema itself, over a spread of options', () => {
    const samples: Record<string, unknown>[] = [
      { label: 'Open', value: 'open' },
      { label: 'Open', value: 'Open' },
      { label: 'Open', value: 'o' },
      { label: 'Open', value: 'in_progress', color: 'blue' },
      { value: 'open' },
      { label: 'Open', value: 'open', stray: 1 },
    ];
    for (const option of samples) {
      expect(field(option).success, JSON.stringify(option))
        .toBe(SpecSelectOptionSchema.safeParse(option).success);
    }
  });
});

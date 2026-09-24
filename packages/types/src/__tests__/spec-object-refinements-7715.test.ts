/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The spec-derived mirrors carry the spec's OBJECT-LEVEL checks (objectui#7715,
 * ruling B1, director seat, decision batch #67, maintainer 「同意」).
 *
 * ## The defect
 *
 * A mirror built as `specFieldsExcept(SpecX.shape, …)` is a fresh `ZodObject`:
 * it takes the spec's FIELDS by reference and leaves behind every check the
 * spec attached to the OBJECT (`superRefine` / `refine`). So objectui's
 * authoring door accepted a document the spec's publish door refuses — the
 * direction that gives an author, human or AI, no signal until publish.
 *
 * ## The tripwire (objectui#7122 item 6, option A — the control this card flips)
 *
 * The measured divergence: `appearance.allowedVisualizations: ['calendar']`
 * with no `calendar:` block. The spec refuses it (its
 * `checkListViewCalendarVisualization`); objectui's `ListViewSchema` accepted
 * it. The pin below asserts PARITY, so it was red on the base this card
 * branched from and turns green only when the mirror re-attaches the spec's
 * own exported check. Both legs are asserted: the spec-side refusal is re-read
 * live on every run, so a spec release that drops the rule turns this red
 * rather than leaving a pin that compares two acceptances.
 */
import { describe, it, expect } from 'vitest';
import { ListViewSchema as SpecListViewSchema } from '@objectstack/spec/ui';
import { ListViewSchema, safeValidateSchema } from '../zod/index.zod';

/** The spec-shaped view: the spec requires `columns`, objectui does not. */
const specView = (extra: Record<string, unknown>) => ({ columns: ['name'], ...extra });
/** The objectui node for the same view: component discriminator + object binding. */
const node = (extra: Record<string, unknown>) => ({ type: 'list-view', objectName: 'accounts', ...extra });

const CALENDAR_OFFERED_NO_BLOCK = { appearance: { allowedVisualizations: ['calendar'] } };

describe('objectui#7715 — tripwire: the ListView calendar-visualization refusal reaches objectui', () => {
  it('the spec refuses the document, at `calendar` (the premise, re-read live)', () => {
    const r = SpecListViewSchema.safeParse(specView(CALENDAR_OFFERED_NO_BLOCK));
    expect(r.success).toBe(false);
    const issue = r.error!.issues.find((i) => i.path.join('.') === 'calendar');
    expect(issue?.code).toBe('custom');
  });

  it('objectui refuses the same document with the spec\'s own issue — mirror and published door', () => {
    const spec = SpecListViewSchema.safeParse(specView(CALENDAR_OFFERED_NO_BLOCK));
    const specIssue = spec.error!.issues.find((i) => i.path.join('.') === 'calendar')!;

    for (const r of [ListViewSchema.safeParse(node(CALENDAR_OFFERED_NO_BLOCK)), safeValidateSchema(node(CALENDAR_OFFERED_NO_BLOCK))]) {
      expect(r.success).toBe(false);
      const issues = r.error!.issues.map((i) => ({ code: i.code, path: i.path.join('.'), message: i.message }));
      // The spec's issue, derived from the spec's own parse — not a restated
      // message — so this proves the spec's check runs here, not a copy of it.
      expect(issues).toContainEqual({ code: 'custom', path: 'calendar', message: specIssue.message });
    }
  });

  it('controls: a declared `calendar` block, and a list that does not offer the calendar, pass on both doors', () => {
    const withBlock = { ...CALENDAR_OFFERED_NO_BLOCK, calendar: { startDateField: 'starts_at' } };
    const noCalendar = { appearance: { allowedVisualizations: ['grid', 'kanban'] } };
    for (const extra of [withBlock, noCalendar]) {
      expect(SpecListViewSchema.safeParse(specView(extra)).success).toBe(true);
      expect(ListViewSchema.safeParse(node(extra)).success).toBe(true);
      expect(safeValidateSchema(node(extra)).success).toBe(true);
    }
  });
});

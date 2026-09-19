/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Field-group helpers for ObjectForm.
 *
 * An object's metadata declares top-level `fieldGroups`, and individual
 * fields opt into a group via `field.group === group.key`. The grouping
 * SEMANTICS (declared order, empty groups dropped, trailing untitled bucket,
 * collapse behaviour incl. legacy alias handling) are single-sourced in
 * `@objectstack/spec` (`deriveFieldGroupLayout`, ADR-0085 §5) — this module
 * is only the adapter from that shared derivation onto the form renderer's
 * `ObjectFormSection` shape and its permission-filtered `FormField` list.
 */

import { deriveFieldGroupLayout } from '@objectstack/spec/data';
import type { FormField, ObjectFormSection } from '@object-ui/types';

/**
 * Derive form sections from an object's declared `fieldGroups` and each
 * rendered field's `group`.
 *
 * Returns `null` when grouping does not apply — no declared groups, or no
 * rendered field opts into a declared group — so callers fall back to a flat
 * form.
 *
 * The derivation runs against the RENDERED field list (post permission /
 * visibility filtering), not the raw object def, so a section never names a
 * field the form isn't showing. Any rendered field the shared derivation
 * excludes from its default buckets (audit/system fields) is re-appended to
 * the trailing bucket: the form was already told to render it, and a layout
 * helper silently dropping a rendered input is exactly the failure mode
 * ADR-0085 exists to kill.
 *
 * Section `fields` are field *names* (strings) so the result plugs straight
 * into ObjectForm's existing section-render path.
 */
export function deriveFieldGroupSections(
  fields: FormField[],
  fieldGroups: unknown,
): ObjectFormSection[] | null {
  const derived = deriveFieldGroupLayout({
    fieldGroups,
    // Pseudo-def over the rendered fields: membership is the only input the
    // derivation needs per field.
    fields: Object.fromEntries(
      fields.map((f) => [f.name, { group: (f as { group?: unknown }).group }]),
    ),
  });
  if (!derived) return null;

  const placed = new Set(derived.flatMap((s) => s.fields));
  const leftover = fields.map((f) => f.name).filter((n) => !placed.has(n));

  const sections: ObjectFormSection[] = derived.map((s) => ({
    ...(s.key !== undefined ? { name: s.key } : {}),
    ...(s.key !== undefined ? { label: s.label ?? s.key } : {}),
    // The other two presentation keys the shared derivation emits and
    // `ObjectFormSection` declares (objectui#7051). This map is a key-by-key
    // rebuild, so a key it does not copy is dropped before any renderer can
    // see it — the failure mode that lost `visibleOn` at the container maps and
    // that objectui#6111 / #6237 fixed there. Both are GROUP-owned presentation
    // per `@objectstack/spec` (its refusal message beside `group` names
    // "the label, icon, description, collapse state and `visibleWhen` a group
    // renders with"), so the reference form cannot inherit them from anywhere
    // else. `icon` is not copied because `ObjectFormSection` declares no such
    // key — nothing on this surface would read it.
    ...(s.description !== undefined ? { description: s.description } : {}),
    ...(s.visibleWhen !== undefined ? { visibleWhen: s.visibleWhen as ObjectFormSection['visibleWhen'] } : {}),
    fields: [...s.fields],
    // Map the shared `collapse` enum onto the renderer's boolean pair.
    ...(s.collapse !== 'none' ? { collapsible: true } : {}),
    ...(s.collapse === 'collapsed' ? { collapsed: true } : {}),
  }));

  if (leftover.length > 0) {
    const trailing = sections[sections.length - 1];
    if (trailing && trailing.name === undefined) {
      trailing.fields = [...(trailing.fields ?? []), ...leftover];
    } else {
      sections.push({ fields: leftover });
    }
  }

  return sections;
}

/**
 * Which divider row(s) a section configuration yields on a given layout arm.
 *
 * ⚠️ This enum is the RESIDUAL of the convergence below, ⛔ not a feature.
 * `projectSectionDivider` is now the one path from a section configuration to a
 * `section-divider` row, so no arm can copy a different set of keys than its
 * siblings — that half needed no ruling and is closed. What the six call sites
 * still disagree about is whether the row exists AT ALL for a member that
 * yields no heading, and every way of collapsing THAT disagreement moves a
 * semantic a maintainer already ruled on:
 *
 *   `heading`            a row only for a member that yields a heading.
 *   `headingOrBlurb`     …plus a BLURB-ONLY row for a headingless member that
 *                        authored a `description` — objectui#9835, maintainer
 *                        ruling 2026-09-18 letter B. That row carries the blurb
 *                        and NOTHING else: no ADR-0089 `visibleWhen`, no
 *                        objectui#6236 membership claim, no collapse pair.
 *   `headingOrBlurbRow`  ONE row gated `title || description`, carrying the
 *                        full key set either way — the letter-A shape that
 *                        ruling REFUSED for the default arm, and which this arm
 *                        has always had.
 *   `always`             a row for every member, heading or not — pinned as a
 *                        reading (⛔ not a ruling) by
 *                        `drawerFormSectionDescription-9834` row 5.
 *
 * ⇒ moving `headingOrBlurbRow` or `always` onto `headingOrBlurb` would REMOVE
 * the ADR-0089 predicate and the objectui#6236 membership claim from the rows a
 * headingless-with-blurb member draws today; moving `headingOrBlurb` the other
 * way is the letter-A widening that ruling refused, with the collapse pair
 * riding along. Both directions are «a ruling about two other keys, made while
 * fixing a blurb» — the sentence objectui#9835 used to refuse exactly this —
 * so the gate is enumerated here, in ONE place, and handed back rather than
 * decided. ⛔ Do not collapse this union without a maintainer ruling that names
 * ADR-0089 `visibleWhen`, objectui#6236's membership claim and the
 * `collapsed` / `collapsible` pair.
 */
export type SectionDividerGate = 'heading' | 'headingOrBlurb' | 'headingOrBlurbRow' | 'always';

/**
 * The section configuration a divider row is projected FROM, already resolved
 * by the arm that owns each resolution.
 *
 * ⚠️ `collapse` arrives RESOLVED, and deliberately: the three arms that emit a
 * collapse pair resolve it three different ways today — `ObjectForm` applies
 * objectui#9780 (`collapsed` implies `collapsible`, read from the DECLARATION
 * and never from the live state), `DrawerForm`'s explicit push reads
 * `section.collapsible` alone, and its derived push gates the collapsed state
 * on `section.collapsible` as well. Resolving it HERE would pick a winner among
 * them, which is the `collapsed` / `collapsible` decision this card is fenced
 * off from. So each arm keeps its own resolution and hands the result over; an
 * arm that emits no collapse pair at all (both `ModalForm` sites) passes
 * nothing and gets no keys.
 */
export interface SectionDividerSource {
  /** Section identity; spells the row's `name`. */
  key: string | number;
  /** The heading, already resolved through `sectionLabel` where the arm does that. */
  title?: string;
  /** The authored blurb (spec `FormSection.description`). */
  description?: string;
  /** ADR-0089 `FormSection.visibleWhen` (#6111), unevaluated. */
  visibleWhen?: unknown;
  /** The objectui#6236 membership claim: RESOLVED (post-FLS) member names. */
  members: string[];
  /** Read by one arm only — see `projectSectionDivider`. */
  className?: string;
  /** Resolved by the arm, ⛔ never here. */
  collapse?: { collapsible?: boolean; collapsed?: boolean; onToggle?: () => void };
}

/**
 * A divider row spans its grid row itself, so this value never reaches a
 * grid-span wrapper: `renderFormField` returns the `SectionDivider` before it.
 * It is spelled once here because four of the five heading rows carried it and
 * the fifth did not, which is precisely the kind of per-arm drift this module
 * now makes impossible.
 */
const DIVIDER_COL_SPAN = 4;

/**
 * Project one section configuration onto the `section-divider` row(s) it draws.
 *
 * ⭐ THIS IS THE ONE PATH (objectui#9849, triage ruling 2026-09-18:
 * 「让 section 配置到 divider 的投影只有一条路径」). Before it, six sites across
 * `ObjectForm.tsx`, `ModalForm.tsx` and `DrawerForm.tsx` each rebuilt the row
 * key by key, and a key one of them forgot was invisible to the author: its
 * siblings on the same section arrived in the same call. That failure mode was
 * carded three times in a row for a single key — objectui#9779 (default arm),
 * objectui#9834 (drawer arm) and objectui#9849 (the modal arm's derived push,
 * the only site still dropping `description` when this landed) — and each fix
 * repaired one push while leaving the shape that produced it. A key added here
 * is added for every arm at once, and a key dropped here is dropped for every
 * arm at once, which is what makes the loss visible instead of silent.
 *
 * The key set, and who owns each member:
 *
 *  - `label` — the heading. The arm resolves i18n before handing it over.
 *  - `description` — the authored blurb (objectui#9779 / #9834 / #9849).
 *  - `visibleWhen` — ADR-0089's section predicate (#6111). The renderer
 *    evaluates it on this pseudo-field with the host predicate scope bound
 *    (#6010), so copying it here is what makes the authored predicate reach an
 *    evaluator at all.
 *  - `fields` — the objectui#6236 membership claim: RESOLVED member names, so
 *    the predicate gates the whole group and not just the heading.
 *  - `colSpan` — see `DIVIDER_COL_SPAN`.
 *  - `collapsible` / `collapsed` / `onToggle` — emitted only when the arm
 *    hands over a resolved `collapse`; see `SectionDividerSource`.
 *  - `className` — emitted only when the arm hands one over. objectstack#13626
 *    ("retire the reads", maintainer ruling 2026-09-01) took this read off
 *    every arm but `ModalForm`'s explicit-sections push, whose residue is
 *    preserved here rather than retired in passing: retiring it is a second
 *    ruling's job, and `sectionStyleKeysRetired-13626` pins the arms that
 *    already dropped it.
 *
 * ⛔ Not read, on any arm: `gridClassName` — a per-section grid needs a
 * per-section form, which the single-form structure these arms share does not
 * have.
 */
export function projectSectionDivider(
  source: SectionDividerSource,
  gate: SectionDividerGate,
): FormField[] {
  const { key, title, description, visibleWhen, members, className, collapse } = source;

  const drawsHeadingRow =
    gate === 'always' ||
    Boolean(title) ||
    (gate === 'headingOrBlurbRow' && Boolean(description));

  if (!drawsHeadingRow) {
    // The blurb-only row (objectui#9835 letter B). ⚠️ The name is deliberately
    // NOT the `__section_` spelling: these two rows are different things and
    // nothing should be able to mistake one for the other by name.
    if (gate === 'headingOrBlurb' && description) {
      return [
        {
          name: `__section_blurb_${key}`,
          type: 'section-divider',
          description,
        } as FormField,
      ];
    }
    return [];
  }

  const row: Record<string, unknown> = {
    name: `__section_${key}`,
    // `always` is the one arm that draws a row for a member with no heading at
    // all, and it has always spelled that row's label as the empty string.
    label: gate === 'always' ? (title ?? '') : title,
    type: 'section-divider',
    description,
    visibleWhen,
    fields: members,
    colSpan: DIVIDER_COL_SPAN,
  };
  if (className !== undefined) row.className = className;
  if (collapse) {
    row.collapsible = collapse.collapsible;
    row.collapsed = collapse.collapsed;
    row.onToggle = collapse.onToggle;
  }
  return [row as FormField];
}

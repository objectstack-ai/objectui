/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * The ONE read point for a `record:*` block's `aria` bag (objectui#9556)
 * ══════════════════════════════════════════════════════════════════════════
 *
 * The protocol declares an `aria` bag on every `record:*` block this package
 * renders a container for, and `@object-ui/types` mirrors it as
 * {@link RecordComponentAriaProps}. Before objectui#9556 the family read it in
 * three different ways at once, which is what made an authored accessible name
 * a coin flip:
 *
 *   - five containers read NOTHING, so a spec-valid `aria` was accepted at
 *     publish and dropped at render — the author got a success receipt for an
 *     accessibility declaration that reached no user;
 *   - `record:path` read ONLY `aria.label`, the one spelling the shared ARIA
 *     shape refuses, so the spec-valid `aria.ariaLabel` was the value it threw
 *     away;
 *   - `record:quick_actions` read `ariaLabel ?? label` (objectui#4663) — the
 *     order this module now applies to all of them.
 *
 * ⛔ This module does not write down which blocks declare the bag, nor which
 * member spellings the shape accepts. Both are re-derived from the installed
 * `@objectstack/spec` artifact on every run by
 * `__tests__/recordComponentAria-9556.test.tsx` (AGENTS.md #9).
 *
 * ## Why an authored name needs a ROLE to go with it
 *
 * `aria-label` on a bare `div` reaches nobody: a `div` is `generic`, and
 * browsers expose no accessible name on a generic element. `record:path`'s own
 * history is the measured case — `aria-label="Alternative terminal stages"` sat
 * on a `div` and was inert rather than merely untranslated
 * (`record-path.containerLabel.test.tsx` pins the removal). So emitting the
 * attribute alone would have been a change CI calls green and a screen-reader
 * user cannot hear. {@link useRecordAriaProps} therefore emits a role whenever
 * it emits a name.
 *
 * `defaultRole` is each caller's CURRENT role, so a block that renders no
 * `aria` today renders byte-identical DOM: the five containers pass none and
 * stay bare `div`s until an author declares something, `record:path` passes
 * `'list'`, `record:quick_actions` passes `'toolbar'`. The author's own
 * `aria.role` wins over both, which is the precedence `@object-ui/plugin-list`
 * already ships (`ListView`'s `role={schema.aria?.role ?? 'region'}`), and
 * `'region'` is the fallback for the same reason it is ListView's.
 *
 * ## The two operators are not interchangeable
 *
 * `??` between the canonical spelling and the legacy alias, `||` for the
 * built-in default. Both halves are objectui#4663's, kept because the repo
 * already handles this key that way at the ListView boundary
 * (`normalizeListViewSchema`'s `ARIA_KEY_ALIASES` fold copies the legacy key
 * across only when the canonical one is `undefined`): a declared
 * `ariaLabel: ''` shadows a stale `label` rather than letting it resurface, and
 * then resolves to no name at all, so the block's built-in default wins.
 *
 * ## ⛔ The legacy alias is OPT-IN, and that is the point
 *
 * `label` is the shared ARIA shape's alias entry — refused on parse, declared
 * on no authoring face, in no registry `inputs` list and not on
 * {@link RecordComponentAriaProps}. It is read ONLY where a stored document
 * could actually carry it, which is the two blocks whose renderers already read
 * it before objectui#9556: `record:path` and `record:quick_actions`. Those two
 * pass `legacyLabelFold: true`; ⛔ nothing else does, and ⛔ nothing else should.
 *
 * ⚠️ This is not tidiness. Making the fold unconditional would give a
 * contract-refused spelling FIVE NEW READERS — details, highlights,
 * related_list, activity and chatter — where no stored document was ever served
 * by it, so the back-compat rationale does not reach them and AGENTS.md #0.1
 * refuses a consumer-side alias with no such document behind it. A first draft
 * of this module did exactly that while its own changeset said the alias was
 * neither introduced nor retired. Pinned in both directions by
 * `__tests__/recordComponentAria-9556.test.tsx`.
 *
 * Whether the fold should be retired on those two as well reverses
 * objectui#4663's pinned decision and is the maintainer's, ⛔ not settled here.
 */

import { useDisplayLocale } from '@object-ui/i18n';
import { resolveI18nLabel as resolveInlineI18nLabel } from '@objectstack/spec/ui';
import type { RecordComponentAriaProps } from '@object-ui/types';

/**
 * The authored `aria` bag as a renderer actually receives it: the declared
 * face, plus the undeclared legacy `label` alias the fold above still honours.
 */
export type AuthoredRecordAria = RecordComponentAriaProps & {
  /**
   * ⛔ Not a member of the contract — the shared ARIA shape's alias entry,
   * refused on parse. Present here only so the back-compat fold has something
   * to read without an `as any` cast at the call site (the cast is how
   * `record:path` came to read this spelling and no other).
   *
   * ⚠️ Declaring it on this type does NOT make it read. It is read only for a
   * caller that passes `legacyLabelFold: true` — see this module's header.
   */
  label?: string;
};

/** What {@link useRecordAriaProps} spreads onto a block's container element. */
export interface RecordAriaDomProps {
  'aria-label'?: string;
  'aria-describedby'?: string;
  role?: string;
}

/**
 * Resolve a block's authored accessible name, canonical spelling first.
 *
 * Returns `undefined` when nothing is authored, and the EMPTY STRING when the
 * author declared an empty canonical name — the caller's `||` turns that into
 * its built-in default, while the alias stays shadowed.
 *
 * @param legacyLabelFold - read the contract-refused `aria.label` alias behind
 *   the canonical spelling. ⛔ Default `false`. Only `record:path` and
 *   `record:quick_actions` pass `true`, because only those two can be handed a
 *   stored document carrying it; see this module's header for why widening it
 *   is a defect rather than a simplification.
 */
export function useRecordAriaName(
  aria: AuthoredRecordAria | undefined,
  { legacyLabelFold = false }: { legacyLabelFold?: boolean } = {},
): string | undefined {
  const locale = useDisplayLocale();
  // `??`, not `||`: see the operator note in this module's header.
  const authored = legacyLabelFold ? aria?.ariaLabel ?? aria?.label : aria?.ariaLabel;
  return resolveInlineI18nLabel(authored, locale);
}

/**
 * The ARIA DOM props for a `record:*` block's own container.
 *
 * @param aria - the authored bag, straight off the node's `aria` key.
 * @param defaultRole - the role this block renders when the author declares
 *   none. Omit it and the container stays role-less until an author declares a
 *   name, a description or a role — at which point `'region'` carries the name,
 *   because an attribute on a `generic` element carries nothing.
 * @param defaultLabel - the block's built-in accessible name, used when the
 *   author declared none (or declared an empty one).
 * @param legacyLabelFold - forwarded to {@link useRecordAriaName}. ⛔ Default
 *   `false`; only the two blocks that already read the alias pass `true`.
 */
export function useRecordAriaProps(
  aria: AuthoredRecordAria | undefined,
  {
    defaultRole,
    defaultLabel,
    legacyLabelFold = false,
  }: { defaultRole?: string; defaultLabel?: string; legacyLabelFold?: boolean } = {},
): RecordAriaDomProps {
  const name = useRecordAriaName(aria, { legacyLabelFold });
  // `||`, not `??`: an authored empty name means "no name", not "this name".
  const label = name || defaultLabel;
  const describedBy = aria?.ariaDescribedBy || undefined;
  const role = aria?.role || defaultRole || (label || describedBy ? 'region' : undefined);
  return {
    ...(label ? { 'aria-label': label } : {}),
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
    ...(role ? { role } : {}),
  };
}

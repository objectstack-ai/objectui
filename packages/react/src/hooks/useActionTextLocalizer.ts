/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * `useActionTextLocalizer` — the ONE place a declared action's authored,
 * user-visible strings are resolved against the active locale's bundle.
 *
 * ## Why this hook exists (objectui#4265)
 *
 * A TranslationBundle entry for an action carries THREE keys, all under the
 * same `_actions.<name>.*` node:
 *
 * ```ts
 * convert_lead: {
 *   label: '...',           // the button
 *   confirmText: '...',     // the confirm dialog BODY
 *   successMessage: '...',  // the success toast
 * }
 * ```
 *
 * `useObjectLabel()` has always exposed a resolver for each of them
 * (`actionLabel` / `actionConfirm` / `actionSuccess`, one `resolve()` and one
 * key convention behind all three). What drifted is the CALL SITES: some
 * render surfaces called all three, others called only `actionLabel`. On those
 * surfaces one bundle entry met two fates — the button rendered the
 * translation while the confirm dialog rendered the authored English literal,
 * which is exactly what objectui#4265 reports.
 *
 * So this is deliberately NOT a new resolution dialect. It is a single
 * application of the existing resolvers over the three keys, so a surface can
 * no longer localize one of them and forget the others: there is one function
 * to call, and it can only do all three.
 *
 * ## Pinned semantics
 *
 * - **Fallback**: no bundle entry, or an entry lacking the key, renders the
 *   AUTHORED text. That is `useObjectLabel`'s own fallback contract; nothing
 *   here overrides it.
 * - **A nameless action is not translatable.** Without `action.name` there is
 *   no `_actions.<name>` key to look up, so the literals pass through.
 * - **The entry is keyed on the action's own object** (objectui#11439): its
 *   declared `objectName`, else the host object the caller draws it on — the
 *   object `translateObject` in `@objectstack/spec` stamps on an embedded
 *   action. Only an action with neither reads `globalActions.<name>`; a bound
 *   action never does (see `actionSuffixes` in `@object-ui/i18n`). The
 *   runtime-side resolvers (`useConsoleActionRuntime`, `RecordDetailView`)
 *   already key the param / description / result-dialog copy the same way, so
 *   one action reads one bundle node on every surface.
 * - **`confirmText` / `successMessage` are resolved only when the action
 *   DECLARES them.** A bundle must not be able to bolt a confirmation gate
 *   onto an action whose metadata never asked for one (nor a success toast).
 *   Translation localizes what exists; it does not add behaviour. This mirrors
 *   what the already-correct call sites (`RecordDetailView`, `ObjectView`,
 *   `DeclaredActionsBar`) each spelled out by hand.
 * - **`outcomeMessages` follows the same rule, entry by entry**
 *   (`@objectstack/spec` 17.6.0, objectui#11344): each outcome the action
 *   declares resolves `_actions.<name>.outcomeMessages.<outcome>`; a bundle
 *   entry for an outcome the action does not declare is never read, so a
 *   bundle cannot add copy for an answer the author never wrote one for.
 * - **`label`, `successMessage` and each `outcomeMessages` entry are reduced
 *   through `pickLocalized` first**, because each is an `I18nLabel` — a string
 *   or an inline per-locale map. The map is collapsed to the active language
 *   BEFORE it is offered to the bundle as the fallback, so a per-locale
 *   literal and a bundle entry cannot disagree about what "the authored text"
 *   is, and the action runner, which has no language, only ever receives a
 *   string.
 * - **The success copy stays a template.** A `${result.*}` token, in a bundle
 *   entry or in the authored text, passes through this hook untouched: the
 *   action has not run yet, so there is no result to read. The runner fills
 *   the token in after the action succeeds, through the same `${result.*}`
 *   scope `onSuccess.navigate` reads — one interpolation, in one place.
 */

import { useMemo } from 'react';
import { useObjectLabel, useObjectTranslation, pickLocalized } from '@object-ui/i18n';
import { isConfigBag } from '../utils/configBag.js';

export interface ActionTextLocalizerOptions {
  /**
   * Last-resort display text, used only when the action declares neither a
   * `label` nor a `name` (e.g. a positional `Action 3` placeholder).
   */
  fallbackLabel?: string;
}

/**
 * Returns a copy of `action` with `label` — plus `confirmText`,
 * `successMessage` and `outcomeMessages` when the action declares them —
 * resolved from the active locale's bundle, falling back to the authored
 * literals. `objectName` is the host object the action is drawn on; the
 * action's own declared `objectName` wins over it when present.
 */
export type ActionTextLocalizer = <T extends Record<string, any>>(
  objectName: string | undefined,
  action: T,
  options?: ActionTextLocalizerOptions,
) => T;

export function useActionTextLocalizer(): ActionTextLocalizer {
  const { actionLabel, actionConfirm, actionSuccess, actionOutcome } = useObjectLabel();
  const { language } = useObjectTranslation();

  return useMemo<ActionTextLocalizer>(() => {
    return (<T extends Record<string, any>>(
      objectName: string | undefined,
      action: T,
      options?: ActionTextLocalizerOptions,
    ): T => {
      if (!action || typeof action !== 'object') return action;

      // An `I18nLabel` map collapses to the active language here, so what the
      // bundle receives as its fallback is always a plain string.
      const authoredLabel = pickLocalized((action as any).label, language);
      const name = typeof (action as any).name === 'string' && (action as any).name
        ? ((action as any).name as string)
        : undefined;
      const displayLabel = authoredLabel || name || options?.fallbackLabel || '';

      // No name, no translation key: the literals are the answer. The label is
      // still normalized (map to string, last-resort placeholder applied) so
      // every caller reads one shape.
      if (!name) {
        return displayLabel === (action as any).label ? action : { ...action, label: displayLabel };
      }

      // The key object: the action's declared `objectName`, else the host the
      // caller passes (objectui#11439). An action declared on `sales_order`
      // drawn where the caller knows no object still reads `sales_order`'s
      // `_actions` node, never `globalActions`.
      const declared: unknown = action.objectName;
      const keyObject = (typeof declared === 'string' && declared) || objectName;

      const out: Record<string, any> = {
        ...action,
        label: actionLabel(keyObject, name, displayLabel),
      };
      if ((action as any).confirmText !== undefined) {
        out.confirmText = actionConfirm(keyObject, name, (action as any).confirmText);
      }
      if ((action as any).successMessage !== undefined) {
        out.successMessage = actionSuccess(
          keyObject,
          name,
          pickLocalized((action as any).successMessage, language),
        );
      }
      // The map is an authored bag (outcome → copy), so the one "is this a
      // real bag?" predicate in this package answers whether to read it.
      const authoredOutcomes: unknown = action.outcomeMessages;
      if (isConfigBag(authoredOutcomes)) {
        const outcomeMessages: Record<string, string> = {};
        for (const [outcome, copy] of Object.entries(authoredOutcomes)) {
          const text = actionOutcome(keyObject, name, outcome, pickLocalized(copy, language));
          if (text !== undefined) outcomeMessages[outcome] = text;
        }
        out.outcomeMessages = outcomeMessages;
      }
      return out as T;
    }) as ActionTextLocalizer;
  }, [actionLabel, actionConfirm, actionSuccess, actionOutcome, language]);
}

/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * useUserLocale — one source of truth for a signed-in user's language
 * (objectui#10059, executing ruling batch #193 item 5 letter C on
 * objectui#10051).
 *
 * ## What was wrong
 *
 * One word 「语言」 named two settings. The profile page's language card writes
 * the server column `sys_user.locale` (the column objectstack#14787 made
 * writable, first written by objectui#7501); the globe menu switched a
 * device-local UI language held in `@object-ui/i18n`'s `localStorage` slot.
 * Neither writer could see the other, so a user who set 日本語 on their profile
 * kept reading an English console and nothing said why.
 *
 * ## What decides now, and why the divergence cannot come back
 *
 * For a signed-in user `sys_user.locale` is the ONLY decider, and that is a
 * property of the wiring rather than of anyone's discipline:
 *
 *   - **One writer path.** Both controls write the same column through the same
 *     adapter — the profile card already did, and {@link useLanguageSelection}
 *     now makes the globe do it too. There is no second place to write.
 *   - **One reader, on the invalidation bus.** {@link useSignedInUserLocale} is
 *     mounted once in the console shell. It reads the column on mount and again
 *     on every `sys_user` mutation the data-invalidation bus reports — which
 *     includes the profile card's own save, because every adapter write reaches
 *     that bus through `useMutationInvalidationBridge`. So changing the
 *     language in either place changes it in both, in the same session, with no
 *     reload.
 *   - **The device slot is demoted to a cache, not removed and not ignored.**
 *     `@object-ui/i18n` still persists the active language per device, and that
 *     value still decides before sign-in and for the first paint of a boot. It
 *     can no longer outlive a signed-in read: the reader above overwrites it
 *     with the column on every mount. A stale device value therefore has a
 *     bounded life (one row read), never a session and never a device.
 *
 * ⚠️ The residue this does NOT close, stated rather than left to be discovered:
 * the first paint of a boot renders from the device cache, because the column
 * can only be read after the adapter exists. A value changed on another device
 * shows for the length of one round trip and is then replaced. That is the same
 * stale-while-revalidate posture the tenant seed already ships with, and it is
 * the reason the cache is kept rather than cleared.
 *
 * ## Signed out
 *
 * Nothing here applies: with no `sys_user` row there is nothing to read and
 * nothing to write. {@link useLanguageSelection} performs the local switch and
 * returns, so language selection for a visitor is exactly what it was.
 *
 * @module
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@object-ui/auth';
import { useObjectTranslation } from '@object-ui/i18n';
import { useAdapter, useDataInvalidation, extractWriteErrorMessage } from '@object-ui/react';

/** The object and column the ruling names as the single source of truth. */
const USER_OBJECT = 'sys_user';
const LOCALE_FIELD = 'locale';

/**
 * The language to actually render for a stored tag, or `null` for "not now".
 *
 * `offerable` is the i18n provider's own answer (the deployment's published
 * locales ∩ what this renderer can resolve) — the same list the globe menu and
 * the profile card render, deliberately not a second opinion about what ships.
 *
 * Exact tag first, then the base language: a column holding `zh-CN` must reach
 * the `zh` pack, while a real `pt-BR` pack still beats `pt`. That order is the
 * one `@object-ui/i18n` already documents for a seed and for `pickLocalized`,
 * so this is the existing convention rather than a new rule.
 *
 * `null` while the list is still in flight (`offerable === null`), and `null`
 * for a tag nothing can render: switching to a locale this renderer cannot
 * produce would paint the `en` fallback and call it the user's language.
 */
export function pickRenderableLocale(
  tag: string,
  offerable: readonly string[] | null,
): string | null {
  if (!offerable) return null;
  if (offerable.includes(tag)) return tag;
  const base = tag.split('-')[0];
  if (base && base !== tag && offerable.includes(base)) return base;
  return null;
}

/**
 * Apply the signed-in user's `sys_user.locale` to the UI language, and keep
 * applying it for as long as the session lasts.
 *
 * Mount ONCE, in the shell (the console does it in `AppContent`, beside the
 * mutation-invalidation bridge it depends on). Mounting it twice would only
 * duplicate a read, never contradict one — but there is no reason to.
 *
 * A column that is unset says nothing about this user, so nothing is applied
 * and the device value keeps deciding; the first switch through
 * {@link useLanguageSelection} sets the column and ends that state for good. A
 * failed read leaves the cache standing, which is what a cache is for.
 */
export function useSignedInUserLocale(): void {
  const { user } = useAuth();
  const adapter = useAdapter();
  const { language, changeLanguage, offerableLanguages } = useObjectTranslation();

  const userId = user?.id ? String(user.id) : null;
  // Every adapter write reaches this bus, so the profile card's save re-runs
  // the read below without the profile card knowing this hook exists.
  const invalidationNonce = useDataInvalidation(USER_OBJECT, userId ?? undefined);

  // Every SUCCESSFUL read, not every distinct value: the apply below must run
  // again even when the column answers what it answered last time, because
  // "the local switch stands until the next successful read" is the ruling's
  // wording for a write that failed. A fresh object per read is what carries
  // that (a bare string would be deduplicated by React and the column would
  // never re-assert itself).
  const [read, setRead] = useState<{ seq: number; column: string | null }>({
    seq: 0,
    column: null,
  });

  useEffect(() => {
    if (!adapter || !userId) return;
    let cancelled = false;
    void (async () => {
      try {
        const row = await adapter.findOne(USER_OBJECT, userId);
        if (cancelled) return;
        const raw = (row as { locale?: unknown } | null)?.locale;
        const column = typeof raw === 'string' && raw.length > 0 ? raw : null;
        setRead((prev) => ({ seq: prev.seq + 1, column }));
      } catch (err) {
        // Cosmetic and never fail-closed, the same posture the rest of the
        // localization path takes: a deployment that does not expose `sys_user`
        // to this caller, and one that refuses the read, both land here, and
        // both leave the cached device language rendering. The warning is the
        // diagnosable half.
        console.warn('[app-shell] Could not read your language from `sys_user.locale`:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [adapter, userId, invalidationNonce]);

  // ⛔ Keyed on the READ and on a primitive, never on the identity of the
  // context's memoised `changeLanguage` nor on the active `language`
  // (AGENTS.md #5 #10). Both are rebuilt by a language change, so either in the
  // dependency list would make this effect fire on every switch and put the
  // last-read column straight back — turning a user's switch into a flicker
  // for as long as the write took, and undoing it entirely when the write
  // failed.
  const changeLanguageRef = useRef(changeLanguage);
  changeLanguageRef.current = changeLanguage;
  const languageRef = useRef(language);
  languageRef.current = language;
  // A primitive stand-in for the list: a comma cannot occur in a BCP-47 tag,
  // so this changes exactly when the list's contents change.
  const offerableKey = offerableLanguages ? offerableLanguages.join(',') : null;

  useEffect(() => {
    if (!read.column) return;
    const offerable = offerableKey === null ? null : offerableKey.split(',');
    const resolved = pickRenderableLocale(read.column, offerable);
    if (!resolved || resolved === languageRef.current) return;
    void changeLanguageRef.current(resolved);
  }, [read, offerableKey]);
}

/**
 * Switch the UI language the way the ruling says a signed-in switch works: the
 * server column first-class, the device value as its cache.
 *
 * Returns the handler the globe menu calls instead of the i18n context's bare
 * `changeLanguage`.
 *
 * Order matters and is deliberate. The local switch happens FIRST, so the menu
 * answers the click at once and so the switch survives a write that fails —
 * "the local switch stands until the next successful read", which the ruling
 * requires and which {@link useSignedInUserLocale} then enforces. A failed
 * write is reported LOUDLY, because a language that silently fails to persist
 * is the divergence this card exists to end, one layer down.
 *
 * Signed out (or with no adapter): the local switch is the whole operation, no
 * request is attempted and nothing is reported.
 */
export function useLanguageSelection(): (code: string) => Promise<void> {
  const { user } = useAuth();
  const adapter = useAdapter();
  const { t, changeLanguage } = useObjectTranslation();

  const userId = user?.id ? String(user.id) : null;

  // Same reason as above: both of these are rebuilt on a language change, and
  // the callback must not be either (AGENTS.md #5 #10).
  const changeLanguageRef = useRef(changeLanguage);
  changeLanguageRef.current = changeLanguage;
  const tRef = useRef(t);
  tRef.current = t;

  return useCallback(
    async (code: string) => {
      await changeLanguageRef.current(code);
      if (!adapter || !userId) return;
      try {
        await adapter.update(USER_OBJECT, userId, { [LOCALE_FIELD]: code });
      } catch (err) {
        const reason =
          extractWriteErrorMessage(err) ?? (err instanceof Error ? err.message : String(err));
        toast.error(tRef.current('form.saveError', { defaultValue: 'Failed to save' }), {
          description: reason,
        });
        console.warn('[app-shell] Could not save your language to `sys_user.locale`:', err);
      }
    },
    [adapter, userId],
  );
}

// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

/**
 * RecoveryPasswordReminder
 *
 * Dismissible nudge on the environment home to set a local recovery password —
 * shown when the user signed in via SSO and has no local credential yet. We no
 * longer force this before the first session (it walled off the magic moment);
 * this gentle, one-time reminder preserves instance self-sufficiency without the
 * friction.
 *
 * @module
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@object-ui/auth';
import { Button } from '@object-ui/components';
import { ShieldAlert, X } from 'lucide-react';

/** Set once the user dismisses the reminder; it never shows again on this device. */
export const RECOVERY_REMINDER_DISMISSED_KEY = 'os:recovery-pw-dismissed';

/** Epoch milliseconds of the user's first home visit on this device. */
export const RECOVERY_REMINDER_FIRST_SEEN_KEY = 'os:recovery-pw-first-seen';

/**
 * How long after the first home visit the reminder stays quiet: longer than any
 * single sitting, short enough that the next day's visit shows it.
 */
export const FIRST_SESSION_GRACE_MS = 12 * 60 * 60 * 1000;

/**
 * Below this a stored value is not an epoch-milliseconds timestamp (it is
 * 2001-09-09). The legacy flag this key used to hold, `'1'`, sits below it.
 */
const EPOCH_MS_FLOOR = 1_000_000_000_000;

type ReminderStorage = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Is the user past their FIRST SESSION on this device (objectui#11659)?
 *
 * The first call records the time of the first home visit and answers `false`;
 * later calls answer `true` once `FIRST_SESSION_GRACE_MS` has passed since it.
 *
 * Why elapsed time, and not a count of home visits or a per-tab marker:
 *
 * - A visit count is what this replaced, and it is the defect the card
 *   measured. The flag was set on the first home mount and the reminder shown
 *   on the second; a new user lands on home, builds their first app, comes back
 *   to home — the second mount, inside the first sitting — and the reminder sat
 *   on top of 「我的应用」 right after the first app was built.
 * - `sessionStorage` is per tab. A "new session" read from it fires in any
 *   second tab the user opens during that same first sitting.
 * - The client holds no session id to compare: `AuthClientSession` carries the
 *   bearer token, and an SSO re-entry can mint a new one within one sitting.
 *
 * Elapsed time is the one signal that cannot fire inside the first sitting.
 * The ruling allows the reminder from the second session or the second day; a
 * second session on the same day may still find it quiet, which errs on the
 * side the ruling protects.
 *
 * A stored value that is not a timestamp — the legacy `'1'` flag, or anything
 * unreadable — is re-recorded as now, so the grace period starts over rather
 * than reading as "long ago". No storage, or storage that throws (a private
 * window), answers `false`: when it cannot tell, it does not nag.
 */
export function isPastFirstSession(storage: ReminderStorage | undefined, now: number): boolean {
  if (!storage) return false;
  let raw: string | null;
  try {
    raw = storage.getItem(RECOVERY_REMINDER_FIRST_SEEN_KEY);
  } catch {
    return false;
  }
  const firstSeen = raw === null ? NaN : Number(raw);
  if (!Number.isFinite(firstSeen) || firstSeen < EPOCH_MS_FLOOR) {
    try {
      storage.setItem(RECOVERY_REMINDER_FIRST_SEEN_KEY, String(now));
    } catch {
      /* ignore */
    }
    return false;
  }
  return now - firstSeen >= FIRST_SESSION_GRACE_MS;
}

function deviceStorage(): Storage | undefined {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : undefined;
  } catch {
    return undefined;
  }
}

function isDismissed(storage: ReminderStorage | undefined): boolean {
  try {
    return storage?.getItem(RECOVERY_REMINDER_DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function RecoveryPasswordReminder({ t }: { t: (key: string, opts?: any) => string }) {
  const navigate = useNavigate();
  const { hasLocalPassword, getAuthConfig } = useAuth();
  const [show, setShow] = useState(false);
  useEffect(() => {
    const storage = deviceStorage();
    if (isDismissed(storage)) return;
    // Not in the user's first session: let a brand-new SSO user reach their
    // magic moment (build their first app) before asking them to set a
    // recovery password. See `isPastFirstSession` for why "first session" is
    // measured in elapsed time.
    if (!isPastFirstSession(storage, Date.now())) return;
    let cancelled = false;
    Promise.all([
      Promise.resolve(hasLocalPassword?.()),
      Promise.resolve(getAuthConfig?.()).catch(() => null),
    ])
      .then(([has, config]: [unknown, any]) => {
        if (cancelled) return;
        // Skip on SSO-enforced envs: password login is disabled there, so a
        // recovery password can't be used — nudging for one is misleading and
        // gives a false sense of security. Same signal LoginForm uses.
        const passwordUnavailable =
          config?.features?.ssoEnforced === true || config?.emailPassword?.enabled === false;
        if (has === false && !passwordUnavailable) setShow(true);
      })
      .catch(() => { /* unknown → don't nag */ });
    return () => { cancelled = true; };
  }, [hasLocalPassword, getAuthConfig]);
  const dismiss = () => {
    try { localStorage.setItem(RECOVERY_REMINDER_DISMISSED_KEY, '1'); } catch { /* ignore */ }
    setShow(false);
  };
  if (!show) return null;
  return (
    <div className="px-4 sm:px-6 lg:px-8 pt-4">
      <div className="max-w-7xl mx-auto">
        <div
          className="flex items-center gap-3 rounded-xl border border-amber-300/60 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/30 px-4 py-3"
          data-testid="recovery-pw-reminder"
        >
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="flex-1 min-w-0 text-sm text-amber-900 dark:text-amber-200">
            {t('home.recoveryReminder.message', { defaultValue: 'Set a recovery password so you can still sign in if single sign-on is ever unavailable.' })}
          </p>
          <Button size="sm" variant="outline" onClick={() => navigate('/set-password')} data-testid="recovery-pw-set">
            {t('home.recoveryReminder.cta', { defaultValue: 'Set password' })}
          </Button>
          <button
            type="button"
            onClick={dismiss}
            aria-label={t('home.recoveryReminder.dismiss', { defaultValue: 'Dismiss' })}
            className="shrink-0 rounded-md p-1 text-amber-700/70 hover:text-amber-900 dark:text-amber-300/70 dark:hover:text-amber-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

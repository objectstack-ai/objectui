/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Ask before leaving a page that holds unsaved edits (objectui#13163).
 *
 * The settings page keeps its edits in component state, so any way off the
 * page dropped them without a word: a sidebar link, its own "All settings"
 * crumb, a tab close. This hook stands between that state and the three ways
 * out a `BrowserRouter` host lets a page see:
 *
 * - **Tab close / reload** — a `beforeunload` listener, the browser's own
 *   "Leave site?" prompt.
 * - **An in-app link** — a capture-phase `click` listener on the document,
 *   which runs before the router's own handler on the root. `useBlocker` is
 *   not available: it needs a data router, and the console mounts
 *   `BrowserRouter`.
 * - **The page's own navigations** — the returned `confirmLeave(go)` runs
 *   `go` only once the user agrees.
 *
 * The listeners are installed only while `dirty`, and removed the moment the
 * page goes clean (a save, a discard) or unmounts.
 *
 * ## Why the native `confirm`, not an in-app dialog
 *
 * An in-app dialog is asynchronous, so the link guard would have to cancel
 * every click and later re-navigate on the user's behalf. Each way of doing
 * that is fragile here: re-dispatching the click on the stored anchor is the
 * synthetic-trigger shape ADR-0054 C1 bans; `navigate(anchor.href)` has to
 * strip the router basename a host's injected `<base href>` sets (or it
 * doubles the prefix), drops the link's own `onClick`, `replace` and `state`,
 * and turns a plain same-origin anchor's document load into an SPA push. A
 * synchronous `confirm` needs none of it: on OK the click simply continues.
 * It is also what the Setup app's other page-leave guards already show (the
 * metadata editor's `ResourceEditPage` and `StudioDesignSurface`).
 *
 * ## What it does not see
 *
 * Browser Back / Forward (`popstate`): `BrowserRouter` offers no hook to veto
 * it, and the history workarounds are not worth their cost. Nor does it see a
 * navigation another component starts with `navigate()` from a button (not an
 * anchor) — only links and this page's own departures.
 */

import { useCallback, useEffect } from 'react';

/**
 * Whether a click on the document would take the user to another page of this
 * app. Mirrors what the router itself skips: a modified or non-primary click
 * (new tab / window), a link that opens elsewhere or downloads, a link to
 * another origin (the `beforeunload` prompt covers that one), and a link to the
 * page already shown — the view stays mounted and keeps its edits.
 */
function leavesThisPage(e: MouseEvent): boolean {
  if (e.defaultPrevented) return false;
  if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return false;
  const target = e.target instanceof Element ? e.target : null;
  const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
  if (!anchor) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  try {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname) return false;
  } catch {
    return false;
  }
  return true;
}

/**
 * Guard a page's unsaved edits against every departure it can see.
 *
 * @param dirty   whether the page holds edits that leaving would drop
 * @param message the question the prompt asks, already translated
 * @returns `confirmLeave(go)` — for the page's own navigations: runs `go` at
 *          once when clean, and otherwise only after the user confirms
 */
export function useUnsavedLeaveGuard(
  dirty: boolean,
  message: string,
): (go: () => void) => void {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Chrome shows the prompt only when `returnValue` is set as well.
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (!dirty) return;
    const onClick = (e: MouseEvent) => {
      if (!leavesThisPage(e)) return;
      if (window.confirm(message)) return;
      // Kept: the router never sees the click, so the URL and the edits stay.
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, [dirty, message]);

  return useCallback(
    (go: () => void) => {
      if (!dirty || window.confirm(message)) go();
    },
    [dirty, message],
  );
}

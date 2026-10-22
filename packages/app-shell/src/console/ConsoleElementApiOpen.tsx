/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * What one open of a console page is, for the API reads its elements and its
 * navigation share (objectui#13323).
 *
 * `@object-ui/react`'s `ElementApiOpenScope` keeps the API reads asked in one
 * open, so a navigation entry's `visible` and a page element bound to the same
 * `{ provider: 'api', read: { url } }` make one request. The renderer does not
 * know what an open is; the console does: **one open is one history entry.**
 *
 *  - A `PUSH` (following a link, a navigation entry, an in-app redirect that
 *    adds an entry) or a `POP` (Back, Forward) starts a new open, so the page it
 *    shows reads again: no answer outlives the visit it was read in.
 *  - A `REPLACE` stays in the open. The app root's landing replaces
 *    `/apps/:appName` with its first entry once the navigation's reads have
 *    answered (`<Navigate to={landing} replace />`): the page it lands on is
 *    the same visit, and takes the answer the navigation gate already read.
 *    The other replaces stay inside the page they rewrite (a URL-state update,
 *    a legacy-address redirect), so the answer they keep is the one this visit
 *    read, never another page's.
 *
 * Outside a router (an embed that mounts the shell bare) there is no open to
 * name, and nothing is kept beyond the request in flight, as before.
 *
 * Internal module: not re-exported by the package entry.
 */

import { useState, type ReactNode } from 'react';
import { useInRouterContext, useLocation, useNavigationType } from 'react-router-dom';
import { ElementApiOpenScope } from '@object-ui/react';

/** Mount {@link ElementApiOpenScope} named by the console's open; see the module doc. */
export function ConsoleElementApiOpen({ children }: { children?: ReactNode }) {
  if (!useInRouterContext()) return <>{children}</>;
  return <RoutedElementApiOpen>{children}</RoutedElementApiOpen>;
}

function RoutedElementApiOpen({ children }: { children?: ReactNode }) {
  return <ElementApiOpenScope open={useConsoleOpen()}>{children}</ElementApiOpenScope>;
}

/**
 * The name of the open the console is in: the key of the history entry that
 * started it. A `REPLACE` keeps the name; any other navigation takes the new
 * entry's key.
 */
function useConsoleOpen(): string {
  const location = useLocation();
  const navigationType = useNavigationType();
  // Derived from the previous render's entry (React's "adjust state when a
  // prop changes" pattern): set during render, so no reader below ever runs
  // with the previous open's name on the new entry.
  const [state, setState] = useState({ entry: location.key, open: location.key });
  if (state.entry !== location.key) {
    const next = { entry: location.key, open: navigationType === 'REPLACE' ? state.open : location.key };
    setState(next);
    return next.open;
  }
  return state.open;
}

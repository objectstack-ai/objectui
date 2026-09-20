// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getFaviconUrl } from '@object-ui/app-shell';

/**
 * Re-applies the runtime-branded favicon on every route change.
 *
 * ⛔ **It deliberately does not write `document.title`** (objectui#8637). It
 * used to — as `BrandingSync`, it assigned the BARE product name on every
 * `useLocation()` change, while `AppShell`'s `useAppShellBranding` assigns the
 * composed `"App label — Product name"` from an effect keyed on that string.
 * Two writers on one global, keyed on different inputs: navigating between two
 * pages of the same app changed `location` but not the composed title, so only
 * this one fired and the tab reverted to the bare product name until something
 * else changed the composed title. Measured in a real browser, not inferred —
 * the reading is on objectui#8637's pull request.
 *
 * The repair is one writer, not two careful ones: `useAppShellBranding` owns
 * `document.title` while a shell is mounted and restores the previous title
 * when it unmounts, so leaving an app no longer needs a route-keyed reset here.
 * ⛔ Do not re-add a title assignment to this component — that re-creates the
 * race, and `apps/console/src/__tests__/tabTitleAfterNavigation.test.tsx` is
 * the pin that goes red when it comes back.
 *
 * Boot-time title writers are a different lifecycle and are left alone: the
 * inline script in `apps/console/index.html` and `main.tsx` both set the bare
 * product name before React mounts, which is the correct title until a shell
 * with an app label is on screen — and now the string `useAppShellBranding`
 * captures and restores.
 */
export function FaviconSync() {
  const location = useLocation();
  useEffect(() => {
    const faviconUrl = getFaviconUrl();
    if (faviconUrl) {
      const link = document.getElementById('favicon') as HTMLLinkElement | null;
      if (link) {
        link.href = faviconUrl;
        link.type = faviconUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
      }
    }
  }, [location]);
  return null;
}

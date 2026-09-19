// Copyright (c) 2025 ObjectStack. Licensed under the Apache-2.0 license.

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getProductName, getFaviconUrl } from '@object-ui/app-shell';

/** Syncs document title + favicon with runtime branding on every route change. */
export function BrandingSync() {
  const location = useLocation();
  useEffect(() => {
    document.title = getProductName();
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

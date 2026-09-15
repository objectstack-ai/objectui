import { resolveActiveNavTrail, type NavTemplateContext } from '@object-ui/layout';
import type { NavigationArea, NavigationItem } from '@object-ui/types';

export interface AppNavigationContext {
  area: NavigationArea | null;
  trail: NavigationItem[];
}

/** Resolve an app route back to its owning area and navigation trail. */
export function resolveAppNavigationContext(options: {
  areas?: NavigationArea[];
  navigation?: NavigationItem[];
  pathname: string;
  search: string;
  basePath: string;
  templateContext?: NavTemplateContext;
}): AppNavigationContext {
  const { areas = [], navigation = [], pathname, search, basePath, templateContext } = options;

  for (const area of areas) {
    const trail = resolveActiveNavTrail(area.navigation || [], pathname, search, basePath, templateContext);
    if (trail.length > 0) return { area, trail };
  }

  return {
    area: null,
    trail: resolveActiveNavTrail(navigation, pathname, search, basePath, templateContext),
  };
}

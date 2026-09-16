import { describe, expect, it } from 'vitest';
import type { NavigationArea, NavigationItem } from '@object-ui/types';
import { resolveAppNavigationContext } from './navigationContext';

const BASE = '/apps/forge';
const areas: NavigationArea[] = [
  {
    id: 'workspace',
    label: 'Workspace',
    navigation: [{ id: 'home', type: 'page', label: 'Workbench', pageName: 'workbench' }],
  },
  {
    id: 'project',
    label: 'Project',
    navigation: [{
      id: 'project_management',
      type: 'group',
      label: 'Project Management',
      children: [{
        id: 'timesheet',
        type: 'page',
        label: 'Timesheets',
        pageName: 'page_project_timesheet_cost',
        params: { nav: 'timesheet' },
      }],
    }],
  },
];

describe('resolveAppNavigationContext', () => {
  it('recovers an area, group, and page from a direct page route', () => {
    const result = resolveAppNavigationContext({
      areas,
      pathname: `${BASE}/page/page_project_timesheet_cost`,
      search: '?verify=direct-link',
      basePath: BASE,
    });

    expect(result.area?.id).toBe('project');
    expect(result.trail.map((item) => item.id)).toEqual(['project_management', 'timesheet']);
  });

  it('supports apps that use a flat navigation tree', () => {
    const navigation: NavigationItem[] = [
      { id: 'reports', type: 'group', label: 'Reports', children: [
        { id: 'margin', type: 'report', label: 'Margin', reportName: 'margin' },
      ] },
    ];
    const result = resolveAppNavigationContext({
      navigation,
      pathname: `${BASE}/report/margin`,
      search: '',
      basePath: BASE,
    });

    expect(result.area).toBeNull();
    expect(result.trail.map((item) => item.id)).toEqual(['reports', 'margin']);
  });

  it('leaves routes outside the declared navigation unresolved', () => {
    expect(resolveAppNavigationContext({
      areas,
      pathname: `${BASE}/search`,
      search: '',
      basePath: BASE,
    })).toEqual({ area: null, trail: [] });
  });
});

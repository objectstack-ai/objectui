'use client';

import { useEffect, useState } from 'react';

type PluginName = 
  | 'aggrid'
  | 'editor'
  | 'charts'
  | 'dashboard'
  | 'kanban'
  | 'markdown'
  | 'timeline'
  | 'calendar'
  | 'gantt'
  | 'map'
  | 'chatbot'
  | 'form'
  | 'grid'
  | 'view';

interface PluginLoaderProps {
  plugins: PluginName[];
  children: React.ReactNode;
}

const pluginImports: Record<PluginName, () => Promise<any>> = {
  aggrid: () => import('@object-ui/plugin-aggrid'),
  editor: () => import('@object-ui/plugin-editor'),
  charts: () => import('@object-ui/plugin-charts'),
  dashboard: () => import('@object-ui/plugin-dashboard'),
  kanban: () => import('@object-ui/plugin-kanban'),
  markdown: () => import('@object-ui/plugin-markdown'),
  timeline: () => import('@object-ui/plugin-timeline'),
  calendar: () => import('@object-ui/plugin-calendar'),
  gantt: () => import('@object-ui/plugin-gantt'),
  map: () => import('@object-ui/plugin-map'),
  chatbot: () => import('@object-ui/plugin-chatbot'),
  form: () => import('@object-ui/plugin-form'),
  grid: () => import('@object-ui/plugin-grid'),
  view: () => import('@object-ui/plugin-view'),
};

/**
 * PluginLoader component - Loads specific plugins on-demand
 * 
 * Usage in MDX files:
 * ```mdx
 * import { PluginLoader } from '@/app/components/PluginLoader';
 * 
 * <PluginLoader plugins={['aggrid']}>
 *   <InteractiveDemo schema={{...}} />
 * </PluginLoader>
 * ```
 */
export function PluginLoader({ plugins, children }: PluginLoaderProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    Promise.all(plugins.map(plugin => pluginImports[plugin]()))
      .then(() => {
        setLoaded(true);
      })
      .catch((error) => {
        console.error('Failed to load plugins:', error);
        setLoaded(true); // Still render children even if plugin loading fails
      });
  }, [plugins]);

  if (!loaded) {
    return <div className="p-6 text-center text-muted-foreground">Loading plugins...</div>;
  }

  return <>{children}</>;
}

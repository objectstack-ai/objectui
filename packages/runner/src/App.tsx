// Ensure this file is treated as a module
export {}; 

import { SchemaRenderer } from '@object-ui/react';
import '@object-ui/components';
import { PageSchema, AppSchema } from '@object-ui/types';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { LayoutRenderer } from './LayoutRenderer';
import { LocalBundleLoader, NetworkLoader, MetadataLoader } from './lib/MetadataLoader';

export default function App() {
  const [appConfig, setAppConfig] = useState<AppSchema | null>(null);
  const [pageSchema, setPageSchema] = useState<PageSchema | null>(null);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize Loader Strategy
  const loader = useMemo<MetadataLoader>(() => {
    const params = new URLSearchParams(window.location.search);
    const apiUrl = params.get('api');
    
    // IF ?api=... is present, use Network Loader
    if (apiUrl) {
      console.log('🔌 Using Network Loader:', apiUrl);
      return new NetworkLoader(apiUrl);
    }
    
    // ELSE use bundled files (Local Development)
    console.log('📦 Using Local Bundle Loader');
    return new LocalBundleLoader();
  }, []);

  // --- 1. Load Global Config (once) ---
  useEffect(() => {
    const loadApp = async () => {
      try {
        const config = await loader.loadAppConfig();
        if (config) setAppConfig(config);
      } catch (e) {
        console.error("Error loading app config", e);
      }
    };
    loadApp();
  }, [loader]);

  // --- 2. Route Handling ---
  const handleNavigate = useCallback((to: string) => {
    window.history.pushState({}, '', to);
    setCurrentPath(to);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // --- 3. Page Loading Logic ---
  useEffect(() => {
    const loadPage = async () => {
      setLoading(true);
      setError(null);
      try {
        const schema = await loader.loadPage(currentPath);
        if (schema) {
          setPageSchema(schema);
        } else {
          // If 404
          setError(`Page not found: ${currentPath}`);
          if (currentPath === '/') {
             setPageSchema({
               type: 'page',
               title: 'Welcome to Object UI',
               body: [{ type: 'div', className: "p-10 text-center text-muted-foreground", body: 'No index page found.' }]
             } as any);
          } else {
             setPageSchema(null);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load page.");
      } finally {
        setLoading(false);
      }
    };

    loadPage();
  }, [currentPath, loader]);

  // --- Render ---

  if (error && !pageSchema) {
    const errorContent = (
      <div className="flex flex-col items-center justify-center h-full p-12 text-red-600">
        <h1 className="text-2xl font-bold">404</h1>
        <p className="mt-2 text-slate-600">{error}</p>
        <button onClick={() => handleNavigate('/')} className="mt-4 text-blue-600 hover:underline">
          Go Home
        </button>
      </div>
    );

    if (appConfig) {
      return (
        <LayoutRenderer app={appConfig} currentPath={currentPath} onNavigate={handleNavigate}>
          {errorContent}
        </LayoutRenderer>
      );
    }
    return errorContent;
  }

  if (loading || !pageSchema) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
         <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600 mr-2" />
         Loading...
      </div>
    );
  }

  const content = <SchemaRenderer schema={pageSchema} />;

  if (appConfig) {
    return (
      <LayoutRenderer app={appConfig} currentPath={currentPath} onNavigate={handleNavigate}>
        {content}
      </LayoutRenderer>
    );
  }

  return (
    <div className="object-ui-app">
      {content}
    </div>
  );
}

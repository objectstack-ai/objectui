
console.log("DEBUG: objectstack.config.ts LOADED");
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// @ts-ignore
globalThis.require = require;

import { defineConfig } from './src/config';
import { sharedConfig } from './objectstack.shared';

// @ts-ignore
import * as MSWPluginPkg from '@objectstack/plugin-msw';
// @ts-ignore
import * as ObjectQLPluginPkg from '@objectstack/objectql';
// @ts-ignore
import * as HonoServerPluginPkg from '@objectstack/plugin-hono-server';
// @ts-ignore
import * as DriverMemoryPkg from '@objectstack/driver-memory';
// @ts-ignore
import * as RuntimePkg from '@objectstack/runtime';

const MSWPlugin = MSWPluginPkg.MSWPlugin || (MSWPluginPkg as any).default?.MSWPlugin || (MSWPluginPkg as any).default;
const ObjectQLPlugin = ObjectQLPluginPkg.ObjectQLPlugin || (ObjectQLPluginPkg as any).default?.ObjectQLPlugin || (ObjectQLPluginPkg as any).default;
const InMemoryDriver = DriverMemoryPkg.InMemoryDriver || (DriverMemoryPkg as any).default?.InMemoryDriver || (DriverMemoryPkg as any).default;
const DriverPlugin = RuntimePkg.DriverPlugin || (RuntimePkg as any).default?.DriverPlugin || (RuntimePkg as any).default;
// const HonoServerPlugin = HonoServerPluginPkg.HonoServerPlugin || (HonoServerPluginPkg as any).default?.HonoServerPlugin || (HonoServerPluginPkg as any).default;

const memoryDriver = new InMemoryDriver();

import ConsolePluginConfig from './plugin.js';

const FixedConsolePlugin = {
    ...ConsolePluginConfig,
    init: () => {},
    start: async (ctx: any) => {
        console.log('DEBUG: FixedConsolePlugin start called');

        // Official way: Configure the 'default' datasource manually
        try {
            const metadataService = ctx.metadata || ctx.getService('metadata');
            if (metadataService && metadataService.addDatasource) {
                console.log('[Config] Registering default datasource (memory)...');
                await metadataService.addDatasource({
                    name: 'default',
                    driver: 'in-memory-driver', // Using the registered service name from logs
                });
            } else {
                 console.warn('[Config] Metadata service not available for datasource registration');
            }
        } catch (e: any) {
             console.error('[Config] Failed to register default datasource:', e);
        }

        // --- Data Seeding Logic ---
        try {
            console.log('[Seeder] Checking for initial data...');
            
            // Resolve the active driver from the runtime context
            let activeDriver = null;
            
            try {
                // Try getting the service that was explicitly logged as registered
                // "Service 'driver.in-memory-driver' registered"
                const serviceName = 'driver.in-memory-driver';
                const service = ctx.getService(serviceName);
                if (service && typeof service.create === 'function') {
                    activeDriver = service;
                } else if (service && service.driver && typeof service.driver.create === 'function') {
                    activeDriver = service.driver;
                }
            } catch (err: any) {
                console.log(`[Seeder] Driver retrieval error: ${err.message}`);
            }

            if (!activeDriver) {
                 console.log("[Seeder] Driver 'driver.in-memory-driver' not found or invalid.");
                 console.log("[Seeder] Available Services:", ctx.getServiceNames ? ctx.getServiceNames() : 'Unknown');
                 // Last resort fallback
                 activeDriver = memoryDriver;
            } else {
                 console.log("[Seeder] Successfully resolved active driver from Runtime.");
            }

            const manifest = sharedConfig.manifest;
            if (manifest && Array.isArray(manifest.data)) {
                 for (const dataset of manifest.data) {
                     if (dataset.object && Array.isArray(dataset.records)) {
                         console.log(`[Seeder] Seeding ${dataset.records.length} records for ${dataset.object}`);
                         for (const record of dataset.records) {
                              try {
                                  await activeDriver.create(dataset.object, record);
                              } catch (err: any) {
                                  console.warn(`[Seeder] Failed to insert ${dataset.object} record:`, err.message);
                              }
                         }
                     }
                 }
                 console.log('[Seeder] Data seeding complete.');
            } else {
                console.log('[Seeder] No initial data found in manifest.');
            }
        } catch (e: any) {
            console.error('[Seeder] Critical error during data seeding:', e);
        }
        // --------------------------

        let app = null;
        const staticRoot = './dist';
        
        // Wait for app to be available (in case HonoServerPlugin initializes it in start)
        const maxRetries = 50;
        for(let i=0; i<maxRetries; i++) { // 10 seconds timeout
            if (ctx.getService) {
                const httpService = ctx.getService('http-server') || ctx.getService('http.server');
                if (httpService) {
                    if (httpService.getRawApp) app = httpService.getRawApp();
                    else if (httpService.app) app = httpService.app;
                }
            }
            if (app) break;
            await new Promise(r => setTimeout(r, 200));
        }

        const path = require('path');
        const fs = require('fs');
        const absoluteStaticRoot = path.resolve(process.cwd(), staticRoot);
        
        if (app) {
             console.log('DEBUG: Registering SPA routes for ' + absoluteStaticRoot);
             
             // Manual Asset Handler
             app.get('/console/assets/*', async (c: any) => {
                const filePath = path.join(absoluteStaticRoot, c.req.path.replace('/console', ''));
                if (fs.existsSync(filePath)) {
                    const ext = path.extname(filePath);
                    let contentType = 'application/octet-stream';
                    if (ext === '.css') contentType = 'text/css';
                    else if (ext === '.js') contentType = 'application/javascript';
                    else if (ext === '.json') contentType = 'application/json';
                    else if (ext === '.png') contentType = 'image/png';
                    else if (ext === '.svg') contentType = 'image/svg+xml';
                    
                    const content = fs.readFileSync(filePath);
                    return c.body(content, 200, { 'Content-Type': contentType });
                }
                return c.text('Asset Not Found', 404);
            });

            // Redirect Root
            app.get('/', (c: any) => {
                return c.redirect('/console/');
            });

            // SPA Fallback
            app.get('/console/*', async (c: any) => {
                if (c.req.path.startsWith('/api')) {
                    return c.text('Not Found', 404);
                }
                try {
                    const indexPath = path.join(absoluteStaticRoot, 'index.html');
                    if (fs.existsSync(indexPath)) {
                            const indexContent = fs.readFileSync(indexPath, 'utf-8');
                            return c.html(indexContent);
                    }
                    return c.text('SPA Index Not Found at ' + indexPath, 404);
                } catch (e: any) {
                    console.error('DEBUG: Error serving index:', e);
                    return c.text('Server Error: ' + e.message, 500);
                }
            });
            console.log('SPA Fallback route registered');
        } else {
             console.log("DEBUG: Failed to find Hono app service. Routes not registered.");
        }
    }
};

const plugins: any[] = [
    new ObjectQLPlugin(),
    // Driver registration
    new DriverPlugin(memoryDriver, 'in-memory-driver'),
    // new MSWPlugin(), // Disabled in production mode
    // HonoServerPlugin is auto-detected
    FixedConsolePlugin
];

// Re-enable MSW only if explicitly needed
if (process.env.ENABLE_MSW_PLUGIN === 'true') {
    plugins.push(new MSWPlugin());
}

export default defineConfig({
  ...sharedConfig,
  
  build: {
    outDir: './dist',
    sourcemap: true,
    minify: true,
    target: 'node18',
  },
  
  /*
  datasources: {
    default: {
      driver: 'memory', 
    },
  },
  */
  
  plugins,
  
  dev: {
    port: 3000,
    host: '0.0.0.0',
    watch: true,
    hotReload: true,
  },
  
  deploy: {
    target: 'static',
    region: 'us-east-1',
  },
});

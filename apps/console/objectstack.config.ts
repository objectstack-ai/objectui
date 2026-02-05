import { createRequire } from 'module';
const require = createRequire(import.meta.url);
// @ts-ignore
globalThis.require = require;

import { defineConfig } from './src/config';
// @ts-ignore
import * as MSWPluginPkg from '@objectstack/plugin-msw';
// @ts-ignore
import * as ObjectQLPluginPkg from '@objectstack/objectql';
// @ts-ignore
import * as HonoServerPluginPkg from '@objectstack/plugin-hono-server';

const MSWPlugin = MSWPluginPkg.MSWPlugin || (MSWPluginPkg as any).default?.MSWPlugin || (MSWPluginPkg as any).default;
const ObjectQLPlugin = ObjectQLPluginPkg.ObjectQLPlugin || (ObjectQLPluginPkg as any).default?.ObjectQLPlugin || (ObjectQLPluginPkg as any).default;
const HonoServerPlugin = HonoServerPluginPkg.HonoServerPlugin || (HonoServerPluginPkg as any).default?.HonoServerPlugin || (HonoServerPluginPkg as any).default;

// FIX: Ensure init is own property for runtime compatibility
class PatchedMSWPlugin extends MSWPlugin {
    constructor(...args: any[]) {
        super(...args);
        // @ts-ignore
        this.init = this.init.bind(this);
        // @ts-ignore
        this.start = this.start?.bind(this);
    }
}

class PatchedHonoServerPlugin extends HonoServerPlugin {
    constructor(...args: any[]) {
        super(...args);
        // @ts-ignore
        this.init = this.init.bind(this);
        // @ts-ignore
        this.start = this.start?.bind(this);
    }
}

import ConsolePluginConfig from './plugin.js';
import crmConfig from '@object-ui/example-crm/objectstack.config';
import todoConfig from '@object-ui/example-todo/objectstack.config';
import kitchenSinkConfig from '@object-ui/example-kitchen-sink/objectstack.config';

const FixedConsolePlugin = {
    ...ConsolePluginConfig,
    init: () => {}
};

export default defineConfig({
  // ============================================================================
  // Project Metadata
  // ============================================================================
  
  name: '@object-ui/console',
  version: '0.1.0',
  description: 'ObjectStack Console',
  
  // ============================================================================
  // Build Settings
  // ============================================================================
  
  build: {
    outDir: './dist',
    sourcemap: true,
    minify: true,
    target: 'node18',
  },
  
  // ============================================================================
  // Database Configuration
  // ============================================================================
  
  datasources: {
    default: {
      driver: 'memory', // Use memory driver for browser example
    },
  },
  
  // ============================================================================
  // Plugin Configuration
  // ============================================================================
  
  plugins: [
    new ObjectQLPlugin(),
    new PatchedMSWPlugin(),    new PatchedHonoServerPlugin(),    FixedConsolePlugin
  ],

  // ============================================================================
  // Merged Stack Configuration (CRM + Todo + Kitchen Sink + Mock Metadata)
  // ============================================================================
  objects: [
    ...(crmConfig.objects || []),
    ...(todoConfig.objects || []),
    ...(kitchenSinkConfig.objects || [])
  ],
  apps: [
    ...(crmConfig.apps || []),
    ...(todoConfig.apps || []),
    ...(kitchenSinkConfig.apps || [])
  ],
  dashboards: [
    ...(crmConfig.dashboards || []),
    ...(todoConfig.dashboards || []),
    ...(kitchenSinkConfig.dashboards || [])
  ],
  pages: [
    ...(crmConfig.pages || []),
    ...(todoConfig.pages || []),
    ...(kitchenSinkConfig.pages || [])
  ],
  manifest: {
    data: [
      ...(crmConfig.manifest?.data || []),
      ...(todoConfig.manifest?.data || []),
      ...(kitchenSinkConfig.manifest?.data || [])
    ]
  },
  
  // ============================================================================
  // Development Server
  // ============================================================================
  
  dev: {
    port: 3000,
    host: '0.0.0.0',
    watch: true,
    hotReload: true,
  },
  
  // ============================================================================
  // Deployment
  // ============================================================================
  
  deploy: {
    target: 'static', // This is a static SPA
    region: 'us-east-1',
  },
});

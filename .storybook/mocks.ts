// .storybook/mocks.ts
import { http, HttpResponse } from 'msw';

/**
 * MSW Handlers for Storybook
 * 
 * Note: The main MSW runtime with ObjectStack kernel is initialized in msw-browser.ts
 * These handlers are additional story-specific handlers that can be used 
 * via the msw parameter in individual stories.
 * 
 * The ObjectStack kernel handles standard CRUD operations automatically via MSWPlugin.
 */

export const handlers = [
    // Handle ObjectStack client connection endpoint (both absolute and relative URLs)
    http.get('http://localhost:6006/api/v1/index.json', async () => {
        console.log('[MSW Handlers mocks.ts] Intercepted /api/v1/index.json (absolute)');
        return HttpResponse.json({
            version: '1.0',
            objects: ['contact', 'opportunity', 'account'],
            endpoints: {
                data: '/api/v1/data',
                metadata: '/api/v1/metadata'
            }
        });
    }),
    http.get('/api/v1/index.json', async () => {
        console.log('[MSW Handlers mocks.ts] Intercepted /api/v1/index.json (relative)');
        return HttpResponse.json({
            version: '1.0',
            objects: ['contact', 'opportunity', 'account'],
            endpoints: {
                data: '/api/v1/data',
                metadata: '/api/v1/metadata'
            }
        });
    }),
    
    // Additional custom handlers can be added here for specific story needs
    // The ObjectStack MSW runtime already handles:
    // - /api/v1/data/:object (GET, POST)
    // - /api/v1/data/:object/:id (GET, PUT, DELETE)
    // - /api/v1/metadata/*
    // - /api/bootstrap
];

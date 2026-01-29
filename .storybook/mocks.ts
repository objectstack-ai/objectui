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
    // Additional custom handlers can be added here for specific story needs
    // The ObjectStack MSW runtime already handles:
    // - /api/v1/data/:object (GET, POST)
    // - /api/v1/data/:object/:id (GET, PUT, DELETE)
    // - /api/v1/metadata/*
    // - /api/bootstrap
];

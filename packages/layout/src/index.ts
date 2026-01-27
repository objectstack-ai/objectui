/**
 * ObjectUI Layout
 * Copyright (c) 2024-present ObjectStack Inc.
 */

import { ComponentRegistry } from '@object-ui/core';

export * from './PageHeader';
export * from './AppShell';

import { PageHeader } from './PageHeader';
import { AppShell } from './AppShell';

ComponentRegistry.register('page-header', PageHeader, {
    label: 'Page Header',
    category: 'Layout',
    inputs: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' }
    ]
});

ComponentRegistry.register('app-shell', AppShell, {
    label: 'App Shell',
    category: 'Layout',
});

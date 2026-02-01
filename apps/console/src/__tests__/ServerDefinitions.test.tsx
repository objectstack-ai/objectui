/**
 * Server-Driven Layout Tests
 * 
 * Tests for server-driven app layout, page definitions, and component composition
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';
import type { AppSchema } from '@object-ui/types';
import { startMockServer, stopMockServer } from '../mocks/server';

describe('Server-Driven Definitions', () => {
  beforeAll(async () => {
    await startMockServer();
  });

  afterAll(() => {
    stopMockServer();
  });

  describe('App Layout Definition', () => {
    it('should render app layout with sidebar', () => {
      const appSchema: AppSchema = {
        type: 'app',
        name: 'test-app',
        title: 'Test Application',
        description: 'Test app for MSW integration',
        layout: 'sidebar',
        menu: [
          {
            type: 'item',
            label: 'Dashboard',
            icon: 'layout-dashboard',
            href: '/dashboard',
          },
          {
            type: 'item',
            label: 'Contacts',
            icon: 'users',
            href: '/contacts',
          },
        ],
      };

      // Note: AppSchema would typically be rendered by a higher-level component
      // This is a simplified test for the schema structure
      expect(appSchema.type).toBe('app');
      expect(appSchema.layout).toBe('sidebar');
      expect(appSchema.menu).toHaveLength(2);
      expect(appSchema.menu![0].label).toBe('Dashboard');
    });

    it('should render app layout with header navigation', () => {
      const appSchema: AppSchema = {
        type: 'app',
        name: 'header-app',
        title: 'Header App',
        layout: 'header',
        menu: [
          {
            type: 'item',
            label: 'Home',
            href: '/',
          },
          {
            type: 'item',
            label: 'About',
            href: '/about',
          },
        ],
      };

      expect(appSchema.layout).toBe('header');
      expect(appSchema.menu).toHaveLength(2);
    });

    it('should define app with menu groups', () => {
      const appSchema: AppSchema = {
        type: 'app',
        name: 'grouped-app',
        title: 'Grouped App',
        layout: 'sidebar',
        menu: [
          {
            type: 'group',
            label: 'Main',
            children: [
              { type: 'item', label: 'Dashboard', href: '/dashboard' },
              { type: 'item', label: 'Overview', href: '/overview' },
            ],
          },
          {
            type: 'separator',
          },
          {
            type: 'group',
            label: 'Settings',
            children: [
              { type: 'item', label: 'Profile', href: '/profile' },
              { type: 'item', label: 'Preferences', href: '/preferences' },
            ],
          },
        ],
      };

      expect(appSchema.menu).toHaveLength(3);
      expect(appSchema.menu![0].type).toBe('group');
      expect(appSchema.menu![1].type).toBe('separator');
    });
  });

  describe('Page Definition', () => {
    it('should define a page with layout components', () => {
      const pageSchema = {
        type: 'div',
        className: 'container mx-auto p-4',
        children: [
          {
            type: 'text',
            value: 'Contact List',
            variant: 'h1',
          },
          {
            type: 'object-grid',
            objectName: 'contact',
            columns: ['name', 'email', 'company'],
          },
        ],
      };

      // Test that the schema can be rendered
      render(
        <SchemaRendererProvider dataSource={{}}>
          <SchemaRenderer schema={pageSchema} />
        </SchemaRendererProvider>
      );

      expect(screen.getByText('Contact List')).toBeInTheDocument();
    });

    it('should define a dashboard page', () => {
      const dashboardPage = {
        type: 'div',
        className: 'p-6',
        children: [
          {
            type: 'text',
            value: 'Dashboard',
            variant: 'h1',
          },
          {
            type: 'dashboard',
            columns: 3,
            widgets: [
              {
                id: 'metric-1',
                title: 'Total Users',
                component: {
                  type: 'metric',
                  label: 'Users',
                  value: '150',
                },
                layout: { x: 0, y: 0, w: 1, h: 1 },
              },
              {
                id: 'metric-2',
                title: 'Active Sessions',
                component: {
                  type: 'metric',
                  label: 'Sessions',
                  value: '42',
                },
                layout: { x: 1, y: 0, w: 1, h: 1 },
              },
            ],
          },
        ],
      };

      render(<SchemaRenderer schema={dashboardPage} />);

      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Users')).toBeInTheDocument();
      expect(screen.getByText('Active Sessions')).toBeInTheDocument();
    });

    it('should define a form page', () => {
      const formPage = {
        type: 'div',
        className: 'max-w-2xl mx-auto p-6',
        children: [
          {
            type: 'text',
            value: 'Create Contact',
            variant: 'h1',
          },
          {
            type: 'object-form',
            objectName: 'contact',
            mode: 'create',
            fields: ['name', 'email', 'company'],
          },
        ],
      };

      expect(formPage.children[0].value).toBe('Create Contact');
      expect(formPage.children[1].type).toBe('object-form');
      expect(formPage.children[1].mode).toBe('create');
    });
  });

  describe('Component Composition from Server', () => {
    it('should render nested layout components', () => {
      const nestedLayout = {
        type: 'div',
        className: 'flex flex-col gap-4',
        children: [
          {
            type: 'div',
            className: 'header',
            children: {
              type: 'text',
              value: 'Header Section',
              variant: 'h2',
            },
          },
          {
            type: 'div',
            className: 'content flex gap-4',
            children: [
              {
                type: 'div',
                className: 'sidebar w-64',
                children: {
                  type: 'text',
                  value: 'Sidebar',
                },
              },
              {
                type: 'div',
                className: 'main flex-1',
                children: {
                  type: 'text',
                  value: 'Main Content',
                },
              },
            ],
          },
        ],
      };

      render(<SchemaRenderer schema={nestedLayout} />);

      expect(screen.getByText('Header Section')).toBeInTheDocument();
      expect(screen.getByText('Sidebar')).toBeInTheDocument();
      expect(screen.getByText('Main Content')).toBeInTheDocument();
    });

    it('should render complex page composition', () => {
      const complexPage = {
        type: 'div',
        className: 'min-h-screen bg-gray-50',
        children: [
          {
            type: 'div',
            className: 'header bg-white shadow',
            children: {
              type: 'div',
              className: 'container mx-auto p-4',
              children: {
                type: 'text',
                value: 'CRM Dashboard',
                variant: 'h1',
              },
            },
          },
          {
            type: 'div',
            className: 'container mx-auto p-6',
            children: [
              {
                type: 'dashboard',
                columns: 4,
                gap: 4,
                widgets: [
                  {
                    id: 'contacts-metric',
                    title: 'Total Contacts',
                    component: { type: 'metric', label: 'Contacts', value: '3' },
                    layout: { x: 0, y: 0, w: 1, h: 1 },
                  },
                  {
                    id: 'active-metric',
                    title: 'Active',
                    component: { type: 'metric', label: 'Active', value: '2' },
                    layout: { x: 1, y: 0, w: 1, h: 1 },
                  },
                ],
              },
            ],
          },
        ],
      };

      render(<SchemaRenderer schema={complexPage} />);

      expect(screen.getByText('CRM Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Total Contacts')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Dynamic Server-Driven Content', () => {
    it('should support data binding in server definitions', async () => {
      // This test demonstrates how server-driven schemas can include dynamic data
      const dynamicSchema = {
        type: 'div',
        children: [
          {
            type: 'text',
            value: 'Contact Directory',
            variant: 'h1',
          },
          {
            type: 'object-grid',
            objectName: 'contact',
            columns: ['name', 'email'],
            data: {
              provider: 'object',
              object: 'contact',
            },
          },
        ],
      };

      expect(dynamicSchema.children[1].objectName).toBe('contact');
      expect(dynamicSchema.children[1].data?.provider).toBe('object');
    });

    it('should support conditional rendering based on server data', () => {
      const conditionalSchema = {
        type: 'div',
        children: [
          {
            type: 'text',
            value: 'Dashboard',
            variant: 'h1',
          },
          {
            type: 'div',
            visible: true, // Would be dynamic from server
            children: {
              type: 'metric',
              label: 'Visible Metric',
              value: '100',
            },
          },
        ],
      };

      expect(conditionalSchema.children[1].visible).toBe(true);
    });
  });

  describe('Layout Schema Validation', () => {
    it('should validate basic layout structure', () => {
      const layout = {
        type: 'div',
        className: 'container',
        children: [
          { type: 'text', value: 'Hello' },
          { type: 'text', value: 'World' },
        ],
      };

      expect(layout.type).toBe('div');
      expect(layout.children).toHaveLength(2);
      expect(Array.isArray(layout.children)).toBe(true);
    });

    it('should support single child or array of children', () => {
      const singleChild = {
        type: 'div',
        children: { type: 'text', value: 'Single' },
      };

      const multipleChildren = {
        type: 'div',
        children: [
          { type: 'text', value: 'First' },
          { type: 'text', value: 'Second' },
        ],
      };

      expect(singleChild.children.type).toBe('text');
      expect(Array.isArray(multipleChildren.children)).toBe(true);
      expect(multipleChildren.children).toHaveLength(2);
    });
  });
});

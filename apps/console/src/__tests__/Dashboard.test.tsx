/**
 * Dashboard Integration Tests
 * 
 * Tests Dashboard component with MSW server backend
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DashboardRenderer } from '@object-ui/plugin-dashboard';
import type { DashboardSchema } from '@object-ui/types';
import { startMockServer, stopMockServer, getDriver } from '../mocks/server';

describe('Dashboard MSW Integration', () => {
  beforeAll(async () => {
    await startMockServer();
  });

  afterAll(() => {
    stopMockServer();
  });

  describe('Dashboard Layout', () => {
    it('should render dashboard with widgets', async () => {
      const schema: DashboardSchema = {
        type: 'dashboard',
        columns: 3,
        gap: 4,
        widgets: [
          {
            id: 'widget-1',
            title: 'Total Contacts',
            component: {
              type: 'metric',
              label: 'Total Contacts',
              value: '3',
            },
            layout: { x: 0, y: 0, w: 1, h: 1 },
          },
          {
            id: 'widget-2',
            title: 'Active Contacts',
            component: {
              type: 'metric',
              label: 'Active',
              value: '2',
            },
            layout: { x: 1, y: 0, w: 1, h: 1 },
          },
        ],
      };

      render(<DashboardRenderer schema={schema} />);

      // Check that widget titles are rendered
      expect(screen.getAllByText('Total Contacts')).toHaveLength(2);
      expect(screen.getAllByText('Active Contacts')).toHaveLength(1);
    });

    it('should render dashboard with different column configurations', async () => {
      const schema: DashboardSchema = {
        type: 'dashboard',
        columns: 2,
        gap: 2,
        widgets: [
          {
            id: 'widget-1',
            title: 'Widget 1',
            component: {
              type: 'metric',
              label: 'Metric 1',
              value: '100',
            },
            layout: { x: 0, y: 0, w: 1, h: 1 },
          },
          {
            id: 'widget-2',
            title: 'Widget 2',
            component: {
              type: 'metric',
              label: 'Metric 2',
              value: '200',
            },
            layout: { x: 1, y: 0, w: 1, h: 1 },
          },
        ],
      };

      render(<DashboardRenderer schema={schema} />);

      expect(screen.getByText('Widget 1')).toBeInTheDocument();
      expect(screen.getByText('Widget 2')).toBeInTheDocument();
    });

    it('should handle empty widgets array', () => {
      const schema: DashboardSchema = {
        type: 'dashboard',
        columns: 3,
        widgets: [],
      };

      const { container } = render(<DashboardRenderer schema={schema} />);
      
      // Should render empty grid
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });
  });

  describe('Dashboard with Server Data', () => {
    it('should render dashboard with data-driven metrics', async () => {
      const driver = getDriver();
      
      // Get actual data from server
      const contacts = await driver!.find('contact', { object: 'contact' }) as any[];
      const activeContacts = contacts.filter(c => c.is_active);

      const schema: DashboardSchema = {
        type: 'dashboard',
        columns: 3,
        gap: 4,
        widgets: [
          {
            id: 'total-contacts',
            title: 'Total Contacts',
            component: {
              type: 'metric',
              label: 'Total',
              value: String(contacts.length),
            },
            layout: { x: 0, y: 0, w: 1, h: 1 },
          },
          {
            id: 'active-contacts',
            title: 'Active Contacts',
            component: {
              type: 'metric',
              label: 'Active',
              value: String(activeContacts.length),
            },
            layout: { x: 1, y: 0, w: 1, h: 1 },
          },
        ],
      };

      render(<DashboardRenderer schema={schema} />);

      // Verify metrics from actual server data
      await waitFor(() => {
        expect(screen.getByText('Total Contacts')).toBeInTheDocument();
        expect(screen.getByText(String(contacts.length))).toBeInTheDocument();
      });
      
      expect(screen.getByText('Active Contacts')).toBeInTheDocument();
      expect(screen.getByText(String(activeContacts.length))).toBeInTheDocument();
    });
  });

  describe('Widget Layout', () => {
    it('should render widgets with custom layout', () => {
      const schema: DashboardSchema = {
        type: 'dashboard',
        columns: 12,
        gap: 4,
        widgets: [
          {
            id: 'widget-full',
            title: 'Full Width Widget',
            component: {
              type: 'text',
              value: 'This widget spans the full width',
            },
            layout: { x: 0, y: 0, w: 12, h: 1 },
          },
          {
            id: 'widget-half-1',
            title: 'Half Width 1',
            component: {
              type: 'text',
              value: 'Half width',
            },
            layout: { x: 0, y: 1, w: 6, h: 1 },
          },
          {
            id: 'widget-half-2',
            title: 'Half Width 2',
            component: {
              type: 'text',
              value: 'Half width',
            },
            layout: { x: 6, y: 1, w: 6, h: 1 },
          },
        ],
      };

      render(<DashboardRenderer schema={schema} />);

      expect(screen.getByText('Full Width Widget')).toBeInTheDocument();
      expect(screen.getByText('Half Width 1')).toBeInTheDocument();
      expect(screen.getByText('Half Width 2')).toBeInTheDocument();
    });

    it('should render widgets without explicit layout', () => {
      const schema: DashboardSchema = {
        type: 'dashboard',
        columns: 3,
        widgets: [
          {
            id: 'widget-1',
            title: 'Widget Without Layout',
            component: {
              type: 'metric',
              label: 'Test',
              value: '123',
            },
          },
        ],
      };

      render(<DashboardRenderer schema={schema} />);

      expect(screen.getByText('Widget Without Layout')).toBeInTheDocument();
    });
  });

  describe('Nested Components', () => {
    it('should render dashboard with nested text components', () => {
      const schema: DashboardSchema = {
        type: 'dashboard',
        columns: 2,
        widgets: [
          {
            id: 'text-widget',
            title: 'Text Widget',
            component: {
              type: 'text',
              value: 'This is a text component inside a dashboard widget',
            },
            layout: { x: 0, y: 0, w: 2, h: 1 },
          },
        ],
      };

      render(<DashboardRenderer schema={schema} />);

      expect(screen.getByText('Text Widget')).toBeInTheDocument();
      expect(screen.getByText('This is a text component inside a dashboard widget')).toBeInTheDocument();
    });
  });
});

/**
 * Console Issues Regression Tests
 *
 * Tests for the three reported issues:
 * 1. Form loading forever when clicking "New" on list page
 * 2. Example initial data not auto-loading
 * 3. Non-grid view types (kanban, calendar, etc.) not rendering
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ObjectForm } from '@object-ui/plugin-form';
import { ListView } from '@object-ui/plugin-list';
import { SchemaRendererProvider } from '@object-ui/react';
import type { DataSource } from '@object-ui/types';

// Import plugins for side-effects (registration)
import '@object-ui/plugin-grid';
import '@object-ui/plugin-kanban';
import '@object-ui/plugin-calendar';
import '@object-ui/plugin-gantt';
import '@object-ui/plugin-timeline';
import '@object-ui/plugin-map';
import '@object-ui/plugin-charts';

// ─── Mocks ───────────────────────────────────────────────────────────────────

/**
 * Standard mock DataSource that returns valid schema and data
 */
function createMockDataSource(overrides?: Partial<DataSource>): DataSource {
  return {
    async getObjectSchema(_objectName: string) {
      return {
        name: 'contact',
        label: 'Contact',
        fields: {
          name: { name: 'name', label: 'Name', type: 'text', required: true },
          email: { name: 'email', label: 'Email', type: 'email' },
          status: {
            name: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { label: 'New', value: 'new' },
              { label: 'Active', value: 'active' },
              { label: 'Closed', value: 'closed' },
            ],
          },
          due_date: { name: 'due_date', label: 'Due Date', type: 'date' },
          image: { name: 'image', label: 'Image', type: 'text' },
          location: { name: 'location', label: 'Location', type: 'text' },
        },
      };
    },
    async find(_objectName: string) {
      return {
        data: [
          { id: '1', name: 'Alice', email: 'alice@test.com', status: 'active', due_date: '2026-03-01' },
          { id: '2', name: 'Bob', email: 'bob@test.com', status: 'new', due_date: '2026-03-15' },
          { id: '3', name: 'Charlie', email: 'charlie@test.com', status: 'closed', due_date: '2026-02-20' },
        ],
      };
    },
    async findOne(_objectName: string, _id: string | number) {
      return { id: '1', name: 'Alice', email: 'alice@test.com', status: 'active' };
    },
    async create(_objectName: string, data: any) {
      return { ...data, id: 'new-id' };
    },
    async update(_objectName: string, id: string | number, data: any) {
      return { ...data, id };
    },
    async delete() {
      return true;
    },
    ...overrides,
  } as DataSource;
}

// ─── Issue 1: Form loading forever ──────────────────────────────────────────

describe('Issue 1: Form should not stay in loading state forever', () => {
  it('should render create form fields (not loading) when schema is available', async () => {
    const dataSource = createMockDataSource();

    render(
      <ObjectForm
        schema={{
          type: 'object-form',
          objectName: 'contact',
          mode: 'create',
          fields: ['name', 'email'],
          showSubmit: true,
        }}
        dataSource={dataSource}
      />,
    );

    // Form should eventually show fields, not stay in loading
    await waitFor(
      () => {
        expect(screen.getByLabelText(/Name/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
    // Loading indicator should not be present
    expect(screen.queryByText(/Loading form/i)).not.toBeInTheDocument();
  });

  it('should show error (not loading) when getObjectSchema returns null', async () => {
    const dataSource = createMockDataSource({
      async getObjectSchema() {
        return null;
      },
    });

    render(
      <ObjectForm
        schema={{
          type: 'object-form',
          objectName: 'nonexistent',
          mode: 'create',
          fields: ['name'],
        }}
        dataSource={dataSource}
      />,
    );

    // Should show error, NOT stay in loading
    await waitFor(
      () => {
        expect(screen.getByText(/Error loading form/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Loading spinner text should not be present
    expect(screen.queryByText('Loading form...')).not.toBeInTheDocument();
  });

  it('should show error (not loading) when getObjectSchema throws', async () => {
    const dataSource = createMockDataSource({
      async getObjectSchema() {
        throw new Error('Network error');
      },
    });

    render(
      <ObjectForm
        schema={{
          type: 'object-form',
          objectName: 'contact',
          mode: 'create',
          fields: ['name'],
        }}
        dataSource={dataSource}
      />,
    );

    // Should show error, NOT stay in loading
    await waitFor(
      () => {
        expect(screen.getByText(/Error loading form/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it('should not stay in loading when dataSource is missing', async () => {
    render(
      <ObjectForm
        schema={{
          type: 'object-form',
          objectName: 'contact',
          mode: 'create',
          fields: ['name'],
        }}
      />,
    );

    // Should not show loading forever — either shows empty form or no-loading state
    await waitFor(
      () => {
        expect(screen.queryByText(/Loading form/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it('should render edit form with fetched data', async () => {
    const dataSource = createMockDataSource();

    render(
      <ObjectForm
        schema={{
          type: 'object-form',
          objectName: 'contact',
          mode: 'edit',
          recordId: '1',
          fields: ['name', 'email'],
        }}
        dataSource={dataSource}
      />,
    );

    // Should show form fields with data
    await waitFor(
      () => {
        const nameInput = screen.getByLabelText(/Name/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Alice');
      },
      { timeout: 5000 },
    );
  });
});

// ─── Issue 2: Initial data auto-loading ─────────────────────────────────────

describe('Issue 2: Initial data should auto-load from dataSource', () => {
  it('should auto-fetch and display data in ListView', async () => {
    const dataSource = createMockDataSource();

    render(
      <SchemaRendererProvider dataSource={dataSource}>
        <ListView
          schema={{
            type: 'list-view',
            objectName: 'contact',
            viewType: 'grid',
            fields: ['name', 'email', 'status'],
          }}
          dataSource={dataSource}
        />
      </SchemaRendererProvider>,
    );

    // Data should be automatically fetched and rendered
    await waitFor(
      () => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Charlie')).toBeInTheDocument();
  });

  it('should call find() on mount to fetch initial data', async () => {
    const findSpy = vi.fn().mockResolvedValue({
      data: [{ id: '1', name: 'Test', email: 'test@test.com', status: 'new' }],
    });

    const dataSource = createMockDataSource({ find: findSpy });

    render(
      <SchemaRendererProvider dataSource={dataSource}>
        <ListView
          schema={{
            type: 'list-view',
            objectName: 'contact',
            viewType: 'grid',
            fields: ['name'],
          }}
          dataSource={dataSource}
        />
      </SchemaRendererProvider>,
    );

    // find() should be called automatically
    await waitFor(() => {
      expect(findSpy).toHaveBeenCalledWith('contact', expect.any(Object));
    });
  });
});

// ─── Issue 3: Non-grid views should render ──────────────────────────────────

describe('Issue 3: Non-grid view types should load and render', () => {
  it('should render kanban view with data', async () => {
    const dataSource = createMockDataSource();

    render(
      <SchemaRendererProvider dataSource={dataSource}>
        <ListView
          schema={{
            type: 'list-view',
            objectName: 'contact',
            viewType: 'kanban',
            fields: ['name', 'email', 'status'],
            options: {
              kanban: {
                groupField: 'status',
                titleField: 'name',
              },
            },
          }}
          dataSource={dataSource}
        />
      </SchemaRendererProvider>,
    );

    // Should show data items (kanban cards)
    await waitFor(
      () => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('should render gallery view with data', async () => {
    const dataSource = createMockDataSource();

    render(
      <SchemaRendererProvider dataSource={dataSource}>
        <ListView
          schema={{
            type: 'list-view',
            objectName: 'contact',
            viewType: 'gallery',
            fields: ['name', 'email'],
            options: {
              gallery: {
                imageField: 'image',
                titleField: 'name',
              },
            },
          }}
          dataSource={dataSource}
        />
      </SchemaRendererProvider>,
    );

    // Should show gallery items
    await waitFor(
      () => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it('should render timeline view with data', async () => {
    const dataSource = createMockDataSource();

    render(
      <SchemaRendererProvider dataSource={dataSource}>
        <ListView
          schema={{
            type: 'list-view',
            objectName: 'contact',
            viewType: 'timeline',
            fields: ['name', 'email', 'due_date'],
            options: {
              timeline: {
                dateField: 'due_date',
                titleField: 'name',
              },
            },
          }}
          dataSource={dataSource}
        />
      </SchemaRendererProvider>,
    );

    // Should render timeline view content (not show error)
    await waitFor(
      () => {
        // Timeline view should render — check no "Unknown component" error
        expect(screen.queryByText(/Unknown component type/i)).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });

  it('should switch from grid to kanban view via viewType prop', async () => {
    const dataSource = createMockDataSource();

    const { rerender } = render(
      <SchemaRendererProvider dataSource={dataSource}>
        <ListView
          schema={{
            type: 'list-view',
            objectName: 'contact',
            viewType: 'grid',
            fields: ['name', 'email', 'status'],
            options: {
              kanban: { groupField: 'status', titleField: 'name' },
            },
          }}
          dataSource={dataSource}
        />
      </SchemaRendererProvider>,
    );

    // Initial grid view should load data
    await waitFor(
      () => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Rerender with kanban viewType
    rerender(
      <SchemaRendererProvider dataSource={dataSource}>
        <ListView
          schema={{
            type: 'list-view',
            objectName: 'contact',
            viewType: 'kanban',
            fields: ['name', 'email', 'status'],
            options: {
              kanban: { groupField: 'status', titleField: 'name' },
            },
          }}
          dataSource={dataSource}
        />
      </SchemaRendererProvider>,
    );

    // Kanban view should also show data
    await waitFor(
      () => {
        expect(screen.getByText('Alice')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  });
});

/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ObjectGantt } from '../ObjectGantt';
import type { ObjectGridSchema, DataSource } from '@object-ui/types';

describe('ObjectGantt', () => {
  let mockDataSource: DataSource;
  let mockSchema: ObjectGridSchema;

  beforeEach(() => {
    // Mock data source
    mockDataSource = {
      find: vi.fn().mockResolvedValue({
        data: [
          {
            _id: '1',
            title: 'Task 1',
            start_date: '2024-01-01T00:00:00Z',
            end_date: '2024-01-15T00:00:00Z',
            progress: 50,
          },
          {
            _id: '2',
            title: 'Task 2',
            start_date: '2024-01-10T00:00:00Z',
            end_date: '2024-01-25T00:00:00Z',
            progress: 75,
          },
        ],
      }),
      getObjectSchema: vi.fn().mockResolvedValue({
        name: 'tasks',
        label: 'Tasks',
        fields: {
          title: { type: 'text', label: 'Title' },
          start_date: { type: 'date', label: 'Start Date' },
          end_date: { type: 'date', label: 'End Date' },
          progress: { type: 'number', label: 'Progress' },
        },
      }),
    } as any;

    // Mock schema with gantt config
    mockSchema = {
      type: 'object-grid',
      objectName: 'tasks',
      data: {
        provider: 'object',
        object: 'tasks',
      },
      filter: {
        gantt: {
          startDateField: 'start_date',
          endDateField: 'end_date',
          titleField: 'title',
          progressField: 'progress',
        },
      },
    } as any;
  });

  it('should render loading state initially', () => {
    render(<ObjectGantt schema={mockSchema} dataSource={mockDataSource} />);
    expect(screen.getByText(/Loading Gantt chart/i)).toBeInTheDocument();
  });

  it('should fetch and display gantt data', async () => {
    render(<ObjectGantt schema={mockSchema} dataSource={mockDataSource} />);

    await waitFor(() => {
      expect(mockDataSource.find).toHaveBeenCalledWith('tasks', expect.any(Object));
    });

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
      expect(screen.getByText('Task 2')).toBeInTheDocument();
    });
  });

  it('should display task progress', async () => {
    render(<ObjectGantt schema={mockSchema} dataSource={mockDataSource} />);

    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  it('should render with inline data', async () => {
    const schemaWithInlineData = {
      ...mockSchema,
      data: {
        provider: 'value',
        items: [
          {
            id: '1',
            title: 'Project A',
            start_date: '2024-01-01',
            end_date: '2024-01-31',
            progress: 30,
          },
        ],
      },
    } as any;

    render(<ObjectGantt schema={schemaWithInlineData} />);

    await waitFor(() => {
      expect(screen.getByText('Project A')).toBeInTheDocument();
      expect(screen.getByText('30%')).toBeInTheDocument();
    });
  });

  it('should show error when gantt config is missing', async () => {
    const schemaWithoutGantt = {
      ...mockSchema,
      filter: {},
    } as any;

    render(<ObjectGantt schema={schemaWithoutGantt} dataSource={mockDataSource} />);

    await waitFor(() => {
      expect(screen.getByText(/Gantt configuration required/i)).toBeInTheDocument();
    });
  });

  it('should handle task click', async () => {
    const onTaskClick = vi.fn();
    render(
      <ObjectGantt
        schema={mockSchema}
        dataSource={mockDataSource}
        onTaskClick={onTaskClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Task 1')).toBeInTheDocument();
    });

    // Click on task in the list
    const task = screen.getAllByText('Task 1')[0].closest('div');
    if (task) {
      task.click();
      expect(onTaskClick).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Task 1' })
      );
    }
  });

  it('should display task list section', async () => {
    render(<ObjectGantt schema={mockSchema} dataSource={mockDataSource} />);

    await waitFor(() => {
      expect(screen.getByText('Tasks')).toBeInTheDocument();
    });
  });

  it('should display date ranges for tasks', async () => {
    render(<ObjectGantt schema={mockSchema} dataSource={mockDataSource} />);

    await waitFor(() => {
      // Should display formatted dates
      const dateElements = screen.getAllByText(/-/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });
});

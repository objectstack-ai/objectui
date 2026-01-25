/**
 * ObjectUI
 * Copyright (c) 2024-present ObjectStack Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ObjectMap } from '../ObjectMap';
import type { ObjectGridSchema, DataSource } from '@object-ui/types';

describe('ObjectMap', () => {
  let mockDataSource: DataSource;
  let mockSchema: ObjectGridSchema;

  beforeEach(() => {
    // Mock data source
    mockDataSource = {
      find: vi.fn().mockResolvedValue({
        data: [
          {
            _id: '1',
            name: 'Location 1',
            latitude: 40.7128,
            longitude: -74.006,
            description: 'New York',
          },
          {
            _id: '2',
            name: 'Location 2',
            latitude: 34.0522,
            longitude: -118.2437,
            description: 'Los Angeles',
          },
        ],
      }),
      getObjectSchema: vi.fn().mockResolvedValue({
        name: 'locations',
        label: 'Locations',
        fields: {
          name: { type: 'text', label: 'Name' },
          latitude: { type: 'number', label: 'Latitude' },
          longitude: { type: 'number', label: 'Longitude' },
          description: { type: 'text', label: 'Description' },
        },
      }),
    } as any;

    // Mock schema with map config
    mockSchema = {
      type: 'object-grid',
      objectName: 'locations',
      data: {
        provider: 'object',
        object: 'locations',
      },
      filter: {
        map: {
          latitudeField: 'latitude',
          longitudeField: 'longitude',
          titleField: 'name',
          descriptionField: 'description',
        },
      },
    } as any;
  });

  it('should render loading state initially', () => {
    render(<ObjectMap schema={mockSchema} dataSource={mockDataSource} />);
    expect(screen.getByText(/Loading map/i)).toBeInTheDocument();
  });

  it('should fetch and display map data', async () => {
    render(<ObjectMap schema={mockSchema} dataSource={mockDataSource} />);

    await waitFor(() => {
      expect(mockDataSource.find).toHaveBeenCalledWith('locations', expect.any(Object));
    });

    await waitFor(() => {
      expect(screen.getByText('Location 1')).toBeInTheDocument();
      expect(screen.getByText('Location 2')).toBeInTheDocument();
    });
  });

  it('should display marker count', async () => {
    render(<ObjectMap schema={mockSchema} dataSource={mockDataSource} />);

    await waitFor(() => {
      expect(screen.getByText(/Locations \(2\)/i)).toBeInTheDocument();
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
            name: 'Place A',
            latitude: 51.5074,
            longitude: -0.1278,
          },
        ],
      },
    } as any;

    render(<ObjectMap schema={schemaWithInlineData} />);

    await waitFor(() => {
      expect(screen.getByText('Place A')).toBeInTheDocument();
      expect(screen.getByText(/Locations \(1\)/i)).toBeInTheDocument();
    });
  });

  it('should handle location object format', async () => {
    const schemaWithLocationField = {
      ...mockSchema,
      data: {
        provider: 'value',
        items: [
          {
            id: '1',
            name: 'Place B',
            location: { lat: 48.8566, lng: 2.3522 },
          },
        ],
      },
      filter: {
        map: {
          locationField: 'location',
          titleField: 'name',
        },
      },
    } as any;

    render(<ObjectMap schema={schemaWithLocationField} />);

    await waitFor(() => {
      expect(screen.getByText('Place B')).toBeInTheDocument();
    });
  });

  it('should handle string location format', async () => {
    const schemaWithStringLocation = {
      ...mockSchema,
      data: {
        provider: 'value',
        items: [
          {
            id: '1',
            name: 'Place C',
            location: '35.6762, 139.6503',
          },
        ],
      },
      filter: {
        map: {
          locationField: 'location',
          titleField: 'name',
        },
      },
    } as any;

    render(<ObjectMap schema={schemaWithStringLocation} />);

    await waitFor(() => {
      expect(screen.getByText('Place C')).toBeInTheDocument();
    });
  });

  it('should display map placeholder', async () => {
    render(<ObjectMap schema={mockSchema} dataSource={mockDataSource} />);

    await waitFor(() => {
      expect(screen.getByText(/Map Visualization \(Placeholder\)/i)).toBeInTheDocument();
    });
  });

  it('should handle marker click', async () => {
    const onMarkerClick = vi.fn();
    render(
      <ObjectMap
        schema={mockSchema}
        dataSource={mockDataSource}
        onMarkerClick={onMarkerClick}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Location 1')).toBeInTheDocument();
    });

    const marker = screen.getByText('Location 1').closest('div');
    if (marker) {
      marker.click();
      expect(onMarkerClick).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Location 1' })
      );
    }
  });

  it('should show empty state when no valid coordinates', async () => {
    const schemaWithInvalidData = {
      ...mockSchema,
      data: {
        provider: 'value',
        items: [
          { id: '1', name: 'Invalid Location' },
        ],
      },
    } as any;

    render(<ObjectMap schema={schemaWithInvalidData} />);

    await waitFor(() => {
      expect(screen.getByText(/No locations found with valid coordinates/i)).toBeInTheDocument();
    });
  });

  it('should display legend', async () => {
    render(<ObjectMap schema={mockSchema} dataSource={mockDataSource} />);

    await waitFor(() => {
      expect(screen.getByText('Legend')).toBeInTheDocument();
      expect(screen.getByText('Location Marker')).toBeInTheDocument();
    });
  });
});

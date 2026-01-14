import React, { Suspense } from 'react';
import { ComponentRegistry } from '@object-ui/core';
import { Skeleton } from '@object-ui/components';

// Export types for external use
export type { BarChartSchema } from './types';

// 🚀 Lazy load the implementation files
// This ensures Recharts is only loaded when the component is actually rendered
const LazyChart = React.lazy(() => import('./ChartImpl'));
const LazyAdvancedChart = React.lazy(() => import('./AdvancedChartImpl'));

export interface ChartBarRendererProps {
  schema: {
    type: string;
    id?: string;
    className?: string;
    data?: Array<Record<string, any>>;
    dataKey?: string;
    xAxisKey?: string;
    height?: number;
    color?: string;
  };
}

/**
 * ChartBarRenderer - The public API for the bar chart component
 * This wrapper handles lazy loading internally using React.Suspense
 */
export const ChartBarRenderer: React.FC<ChartBarRendererProps> = ({ schema }) => {
  return (
    <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
      <LazyChart
        data={schema.data}
        dataKey={schema.dataKey}
        xAxisKey={schema.xAxisKey}
        height={schema.height}
        className={schema.className}
        color={schema.color}
      />
    </Suspense>
  );
};

// Register the component with the ComponentRegistry
ComponentRegistry.register(
  'chart-bar',
  ChartBarRenderer,
  {
    label: 'Bar Chart',
    category: 'plugin',
    inputs: [
      { name: 'data', type: 'array', label: 'Data', required: true },
      { name: 'dataKey', type: 'string', label: 'Data Key', defaultValue: 'value' },
      { name: 'xAxisKey', type: 'string', label: 'X-Axis Key', defaultValue: 'name' },
      { name: 'height', type: 'number', label: 'Height', defaultValue: 400 },
      { name: 'color', type: 'color', label: 'Color', defaultValue: '#8884d8' },
    ],
    defaultProps: {
      data: [
        { name: 'Jan', value: 400 },
        { name: 'Feb', value: 300 },
        { name: 'Mar', value: 600 },
        { name: 'Apr', value: 800 },
        { name: 'May', value: 500 },
      ],
      dataKey: 'value',
      xAxisKey: 'name',
      height: 400,
      color: '#8884d8',
    },
  }
);

// Advanced Chart Renderer with multiple chart types
export interface ChartRendererProps {
  schema: {
    type: string;
    id?: string;
    className?: string;
    chartType?: 'bar' | 'line' | 'area';
    data?: Array<Record<string, any>>;
    config?: Record<string, any>;
    xAxisKey?: string;
    series?: Array<{ dataKey: string }>;
  };
}

/**
 * ChartRenderer - The public API for the advanced chart component
 * Supports multiple chart types (bar, line, area) with full configuration
 */
export const ChartRenderer: React.FC<ChartRendererProps> = ({ schema }) => {
  return (
    <Suspense fallback={<Skeleton className="w-full h-[400px]" />}>
      <LazyAdvancedChart
        chartType={schema.chartType}
        data={schema.data}
        config={schema.config}
        xAxisKey={schema.xAxisKey}
        series={schema.series}
        className={schema.className}
      />
    </Suspense>
  );
};

// Register the advanced chart component
ComponentRegistry.register(
  'chart',
  ChartRenderer,
  {
    label: 'Chart',
    category: 'plugin',
    inputs: [
      { 
        name: 'chartType', 
        type: 'enum', 
        label: 'Chart Type',
        enum: [
          { label: 'Bar', value: 'bar' },
          { label: 'Line', value: 'line' },
          { label: 'Area', value: 'area' }
        ],
        defaultValue: 'bar'
      },
      { name: 'data', type: 'code', label: 'Data (JSON)', required: true },
      { name: 'config', type: 'code', label: 'Config (JSON)' },
      { name: 'xAxisKey', type: 'string', label: 'X Axis Key', defaultValue: 'name' },
      { name: 'series', type: 'code', label: 'Series (JSON Array)', required: true },
      { name: 'className', type: 'string', label: 'CSS Class' }
    ],
    defaultProps: {
      chartType: 'bar',
      data: [
        { name: 'Jan', sales: 400, revenue: 240 },
        { name: 'Feb', sales: 300, revenue: 139 },
        { name: 'Mar', sales: 600, revenue: 380 },
        { name: 'Apr', sales: 800, revenue: 430 },
        { name: 'May', sales: 500, revenue: 220 },
      ],
      config: {
        sales: { label: 'Sales', color: '#8884d8' },
        revenue: { label: 'Revenue', color: '#82ca9d' }
      },
      xAxisKey: 'name',
      series: [
        { dataKey: 'sales' },
        { dataKey: 'revenue' }
      ]
    }
  }
);

// Standard Export Protocol - for manual integration
export const chartComponents = {
  'chart-bar': ChartBarRenderer,
  'chart': ChartRenderer,
};

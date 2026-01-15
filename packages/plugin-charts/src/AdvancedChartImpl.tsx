import * as React from "react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig
} from './ChartContainerImpl';

// Default color fallback for chart series
const DEFAULT_CHART_COLOR = 'hsl(var(--primary))';

// Simple color map for Tailwind names (Mock - ideal would be computed styles)
const TW_COLORS: Record<string, string> = {
  slate: '#64748b',
  gray: '#6b7280',
  zinc: '#71717a',
  neutral: '#737373',
  stone: '#78716c',
  red: '#ef4444',
  orange: '#f97316',
  amber: '#f59e0b',
  yellow: '#eab308',
  lime: '#84cc16',
  green: '#22c55e',
  emerald: '#10b981',
  teal: '#14b8a6',
  cyan: '#06b6d4',
  sky: '#0ea5e9',
  blue: '#3b82f6',
  indigo: '#6366f1',
  violet: '#8b5cf6',
  purple: '#a855f7',
  fuchsia: '#d946ef',
  pink: '#ec4899',
  rose: '#f43f5e',
};

const resolveColor = (color: string) => TW_COLORS[color] || color;

export interface AdvancedChartImplProps {
  chartType?: 'bar' | 'line' | 'area' | 'pie';
  data?: Array<Record<string, any>>;
  config?: ChartConfig;
  xAxisKey?: string;
  series?: Array<{ dataKey: string }>;
  className?: string;
}

/**
 * AdvancedChartImpl - The heavy implementation that imports Recharts with full features
 * This component is lazy-loaded to avoid including Recharts in the initial bundle
 */
export default function AdvancedChartImpl({
  chartType = 'bar',
  data = [],
  config = {},
  xAxisKey = 'name',
  series = [],
  className = '',
}: AdvancedChartImplProps) {
  const ChartComponent = {
    bar: BarChart,
    line: LineChart,
    area: AreaChart,
    pie: PieChart,
  }[chartType] || BarChart;

  console.log('📈 Rendering Chart:', { chartType, dataLength: data.length, config, series, xAxisKey });

  if (chartType === 'pie') {
    return (
      <ChartContainer config={config} className={className}>
        <PieChart>
          <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
          <Pie
            data={data}
            dataKey={series[0]?.dataKey || 'value'}
            nameKey={xAxisKey || 'name'}
            innerRadius={60}
            strokeWidth={5}
            paddingAngle={2}
            outerRadius={80}
          >
             {data.map((entry, index) => {
                // 1. Try config by nameKey (category)
                let c = config[entry[xAxisKey]]?.color;
                
                // 2. Try series config (if only 1 series defined with color list, logic fails here usually)
                if (!c) {
                   // Fallback: If 'colors' array was passed in schema, my adapter put it in config[seriesKey]?
                   // Actually my adapter logic in index.tsx was: config[seriesKey].color = colors[idx]
                   // But here we are iterating DATA items, not SERIES.
                   // So we need a cycling palette.
                   // Let's assume the user didn't provide per-category config here, so we cycle default colors.
                   const palette = [
                     'hsl(var(--chart-1))', 
                     'hsl(var(--chart-2))', 
                     'hsl(var(--chart-3))', 
                     'hsl(var(--chart-4))',
                     'hsl(var(--chart-5))'
                   ];
                   // Check if we can get colors from the first series config?
                   // No, let's just use the palette or resolveColor from entry if provided in data.
                   c = palette[index % palette.length];
                }
                
                return <Cell key={`cell-${index}`} fill={resolveColor(c)} />;
             })}
          </Pie>
          <ChartLegend content={<ChartLegendContent nameKey={xAxisKey} />} />
        </PieChart>
      </ChartContainer>
    );
  }

  return (
    <ChartContainer config={config} className={className}>
      <ChartComponent data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xAxisKey}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => (value && typeof value === 'string') ? value.slice(0, 3) : value}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {series.map((s: any) => {
          const color = resolveColor(config[s.dataKey]?.color || DEFAULT_CHART_COLOR);
          
          if (chartType === 'bar') {
            return <Bar key={s.dataKey} dataKey={s.dataKey} fill={color} radius={4} />;
          }
          if (chartType === 'line') {
            return <Line key={s.dataKey} type="monotone" dataKey={s.dataKey} stroke={color} strokeWidth={2} dot={false} />;
          }
          if (chartType === 'area') {
            return <Area key={s.dataKey} type="monotone" dataKey={s.dataKey} fill={color} stroke={color} fillOpacity={0.4} />;
          }
          return null;
        })}
      </ChartComponent>
    </ChartContainer>
  );
}

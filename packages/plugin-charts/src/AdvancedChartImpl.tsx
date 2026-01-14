import * as React from "react"
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Area,
  AreaChart,
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
const DEFAULT_CHART_COLOR = 'hsl(var(--chart-1))';

export interface AdvancedChartImplProps {
  chartType?: 'bar' | 'line' | 'area';
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
    area: AreaChart
  }[chartType] || BarChart;

  return (
    <ChartContainer config={config} className={className}>
      <ChartComponent data={data}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey={xAxisKey}
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {series.map((s: any) => {
          const color = config[s.dataKey]?.color || DEFAULT_CHART_COLOR;
          
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

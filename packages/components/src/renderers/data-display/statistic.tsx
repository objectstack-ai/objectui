import { ComponentRegistry } from '@object-ui/core';
import type { StatisticSchema } from '@object-ui/types';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const StatisticRenderer = ({ schema }: { schema: StatisticSchema }) => {
  return (
    <div className={cn("flex flex-col gap-1", schema.className)}>
      {schema.label && (
        <p className="text-sm font-medium text-muted-foreground">
          {schema.label}
        </p>
      )}
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl font-bold tracking-tight">
          {schema.value}
        </h3>
        {schema.trend && (
            <div className={cn(
                "flex items-center text-xs font-medium",
                schema.trend === 'up' && "text-green-600",
                schema.trend === 'down' && "text-red-600",
                schema.trend === 'neutral' && "text-yellow-600"
            )}>
                 {schema.trend === 'up' && <TrendingUp className="mr-1 h-3 w-3" />}
                 {schema.trend === 'down' && <TrendingDown className="mr-1 h-3 w-3" />}
                 {schema.trend === 'neutral' && <Minus className="mr-1 h-3 w-3" />}
            </div>
        )}
      </div>
      {schema.description && (
        <p className="text-xs text-muted-foreground">
          {schema.description}
        </p>
      )}
    </div>
  );
};

ComponentRegistry.register('statistic', StatisticRenderer, {
  label: 'Statistic',
  category: 'data-display',
  icon: 'Activity',
  inputs: [
    { name: 'label', type: 'string', label: 'Label' },
    { name: 'value', type: 'string', label: 'Value' },
    { name: 'description', type: 'string', label: 'Description' },
    { 
      name: 'trend', 
      type: 'enum', 
      enum: [
        { label: 'Up', value: 'up' },
        { label: 'Down', value: 'down' },
        { label: 'Neutral', value: 'neutral' }
      ], 
      label: 'Trend' 
    }
  ],
  defaultProps: {
    label: 'Total Revenue',
    value: '$45,231.89',
    trend: 'up',
    description: '+20.1% from last month'
  }
});

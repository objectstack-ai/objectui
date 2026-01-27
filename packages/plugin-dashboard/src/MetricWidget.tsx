import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@object-ui/components';
import { cn } from '@object-ui/components';
import { ArrowDownIcon, ArrowUpIcon, MinusIcon } from 'lucide-react';

export interface MetricWidgetProps {
  label: string;
  value: string | number;
  trend?: {
    value: number;
    label?: string;
    direction?: 'up' | 'down' | 'neutral';
  };
  icon?: React.ReactNode;
  className?: string;
  description?: string;
}

export const MetricWidget = ({
  label,
  value,
  trend,
  icon,
  className,
  description,
  ...props
}: MetricWidgetProps) => {
  return (
    <Card className={cn("h-full", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {label}
        </CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(trend || description) && (
          <p className="text-xs text-muted-foreground flex items-center mt-1">
            {trend && (
              <span className={cn(
                "flex items-center mr-2",
                trend.direction === 'up' && "text-green-500",
                trend.direction === 'down' && "text-red-500",
                trend.direction === 'neutral' && "text-yellow-500"
              )}>
                {trend.direction === 'up' && <ArrowUpIcon className="h-3 w-3 mr-1" />}
                {trend.direction === 'down' && <ArrowDownIcon className="h-3 w-3 mr-1" />}
                {trend.direction === 'neutral' && <MinusIcon className="h-3 w-3 mr-1" />}
                {trend.value}%
              </span>
            )}
            {description || trend?.label}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

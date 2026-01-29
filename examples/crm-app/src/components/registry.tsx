import React from 'react';
import { registerComponent } from '@object-ui/core';
import { useDataScope } from '@object-ui/react';
import { cn } from '@object-ui/components';

// ... existing code ...

// 4. List View (Simple)
const ListView = ({ schema }: any) => {
    // If 'bind' is present, useDataScope will resolve the data relative to the current scope
    // But useDataScope returns the *entire* scope usually? 
    // Actually, usually SchemaRenderer handles the `bind` resolution and passes `data` prop?
    // Let's assume looking at the architecture: "SchemaRenderer ... Bridges Core and Components."
    // If I use `useDataScope`, I should be able to get the list.
    
    // However, if the protocol says:
    // "Data binding path (e.g., 'user.address.city')"
    // usually the architecture allows the component to access data.
    
    const { scope } = useDataScope();
    let data = schema.data; // direct data

    if (schema.bind) {
        // Simple binding resolution for this demo
        // In a real implementation this would be more robust
         data = scope ? scope[schema.bind] : [];
    }
    
    // Fallback or empty
    if (!data || !Array.isArray(data)) return <div className="p-4 text-muted-foreground">No data</div>;
    
    return (
        <div className="space-y-2">
            {data.slice(0, schema.props?.limit || 10).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded bg-card text-card-foreground">
                    <div className="flex flex-col">
                        <span className="font-medium text-sm">{renderTemplate(schema.props?.render?.title, item) || item.name}</span>
                        <span className="text-xs text-muted-foreground">{renderTemplate(schema.props?.render?.description, item)}</span>
                    </div>
                    {schema.props?.render?.extra && (
                        <div className="text-xs font-semibold px-2 py-1 bg-secondary rounded">
                            {renderTemplate(schema.props?.render?.extra, item)}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

// Simple string template helper: "Hello ${name}" -> "Hello World"
function renderTemplate(template: string, data: any) {
    if (!template) return "";
    return template.replace(/\$\{(.*?)\}/g, (match, key) => {
        return data[key] !== undefined ? data[key] : match;
    });
}

export function registerCustomWidgets() {
    registerComponent("widget:metric", MetricWidget);
    registerComponent("widget:chart", ChartWidget);
    registerComponent("view:timeline", TimelineView);
    registerComponent("view:list", ListView);
}
const MetricWidget = ({ schema }: any) => {
    const { value, label, trend, format } = schema.props || {};
    const isPositive = trend?.startsWith('+');
    
    return (
        <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs text-muted-foreground">
                {trend && (
                    <span className={cn("mr-1 font-medium", isPositive ? "text-green-600" : "text-red-600")}>
                        {trend}
                    </span>
                )}
                {label}
            </div>
        </div>
    );
};

// 2. Simple CSS Bar Chart
const ChartWidget = ({ schema }: any) => {
    const { title, data, height = 200 } = schema.props || {};
    // Extract max value for scaling
    const maxValue = Math.max(...(data?.map((d: any) => d.value) || [100]));
    
    return (
        <div className="flex flex-col h-full w-full">
            {title && <h3 className="text-sm font-medium mb-4">{title}</h3>}
            <div className="flex items-end justify-around w-full" style={{ height: `${height}px` }}>
                {data?.map((item: any, i: number) => {
                    const percent = (item.value / maxValue) * 100;
                    return (
                        <div key={i} className="flex flex-col items-center gap-2 group w-full px-1">
                             <div className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.value}
                            </div>
                            <div 
                                className="w-full rounded-t hover:opacity-80 transition-all"
                                style={{ 
                                    height: `${percent}%`, 
                                    backgroundColor: item.fill || '#3b82f6' 
                                }}
                            />
                            <div className="text-xs text-center text-muted-foreground truncate w-full">
                                {item.name}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// 3. Timeline View
const TimelineView = ({ schema }: any) => {
    const { items } = schema.props || {};
    
    return (
        <div className={cn("space-y-8", schema.className)}>
            {items?.map((item: any, i: number) => (
                <div key={i} className="flex gap-4">
                    <div className="relative mt-1">
                        <div className="absolute top-8 left-1/2 h-full w-px -translate-x-1/2 bg-gray-200" />
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-sm">
                             {/* Simple icon mapping or fallback */}
                             <span className="text-xs">●</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 pb-8">
                        <p className="text-sm font-medium leading-none">{item.title}</p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                        <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// 4. List View (Simple)
const ListView = ({ schema, data }: any) => {
    // If bind is used, the renderer might pass resolved data, but here we assume rudimentary binding access
    // In a real scenario, useDataScope or similar hook would be used.
    // For this simple registry, let's assume the parent resolved it or we just render props.
    // Actually, bind logic is handled by the SchemaRenderer usually?
    // If this component supports binding, it should receive `data` if the parent handles it 
    // OR it should use `useDataScope`.
    
    // Simplification: We will just render what is passed in props for now or handle simple binding manualy if needed.
    // But wait, the schema used `bind: "opportunities"`. 
    // The SchemaRenderer logic should resolve this if wrapped correctly?
    // Let's assume standard prop passing for now.
    
    // For the bound data, we need to access `schema.data` if the engine injects it. 
    // Or we use a hook.
    
    // NOTE: Since I cannot easily import `useDataScope` without checking where it is exported from (likely @object-ui/react),
    // I will try to import it.
    
    return (
        <div className="space-y-4">
            {(schema.data || []).map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <div className="font-medium">{item.name || item.title || "Unknown"}</div>
                        <div className="text-sm text-gray-500">{item.description}</div>
                    </div>
                    <div className="text-sm font-bold">{item.amount || item.status}</div>
                </div>
            ))}
        </div>
    );
}

export function registerCustomWidgets() {
    registerComponent("widget:metric", MetricWidget);
    registerComponent("widget:chart", ChartWidget);
    registerComponent("view:timeline", TimelineView);
    // Note: view:list might already exist or handled by plugin-view. 
    // If I want to override or add it:
    registerComponent("view:list", ListView);
}

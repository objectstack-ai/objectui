import React from 'react';
import { cn } from '@object-ui/components';

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export function PageHeader({ 
    title, 
    description, 
    action,
    className, 
    children, 
    ...props 
}: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col gap-4 pb-4 md:pb-8", className)} {...props}>
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1>
                    {description && <p className="text-sm text-muted-foreground">{description}</p>}
                </div>
                {action && <div className="flex items-center gap-2">{action}</div>}
            </div>
            {children}
        </div>
    );
}

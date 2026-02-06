import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect, useState, useCallback } from 'react';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';
import type { BaseSchema } from '@object-ui/types';
import { createStorybookDataSource } from '@storybook-config/datasource';

const meta: Meta = {
  title: 'Plugins/Data Views/CRM Live Data',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

const dataSource = createStorybookDataSource();

// ==========================================
// Helper: Fetches data from MSW and renders a schema
// ==========================================
const LiveDataView = ({ 
  objectName, 
  schema, 
  title 
}: { 
  objectName: string; 
  schema: (data: any[]) => BaseSchema;
  title: string;
}) => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await dataSource.find(objectName, { $top: 50 });
            setData(result.data as any[]);
        } catch (err: any) {
            console.error(`[CRM Live] Failed to fetch ${objectName}:`, err);
            setError(err?.message || `Failed to fetch ${objectName}`);
        } finally {
            setLoading(false);
        }
    }, [objectName]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) return <div className="p-8 text-muted-foreground">Loading {title} from MSW API...</div>;
    if (error) return (
        <div className="p-8 space-y-2">
            <div className="text-destructive font-medium">API Error: {error}</div>
            <div className="text-sm text-muted-foreground">
                Ensure the ObjectStack MSW runtime is running. Check browser console for logs.
            </div>
        </div>
    );

    return (
        <SchemaRendererProvider dataSource={dataSource}>
            <div className="space-y-4">
                <h2 className="text-lg font-semibold">{title} ({data.length} records)</h2>
                <SchemaRenderer schema={schema(data)} />
            </div>
        </SchemaRendererProvider>
    );
};

// ==========================================
// Contact Grid from MSW
// ==========================================
export const ContactGrid: StoryObj = {
    name: 'Contact Grid (Live)',
    render: () => (
        <LiveDataView
            objectName="contact"
            title="Contacts"
            schema={(data) => ({
                type: 'object-grid',
                objectName: 'contact',
                columns: [
                    { field: 'name', header: 'Name', sortable: true, filterable: true },
                    { field: 'email', header: 'Email', sortable: true },
                    { field: 'title', header: 'Title' },
                    { field: 'department', header: 'Department' },
                    { field: 'status', header: 'Status', sortable: true },
                ],
                data,
                pagination: true,
                pageSize: 10,
                className: 'w-full',
            } as any)}
        />
    ),
};

// ==========================================
// Account Grid from MSW
// ==========================================
export const AccountGrid: StoryObj = {
    name: 'Account Grid (Live)',
    render: () => (
        <LiveDataView
            objectName="account"
            title="Accounts"
            schema={(data) => ({
                type: 'object-grid',
                objectName: 'account',
                columns: [
                    { field: 'name', header: 'Company', sortable: true, filterable: true },
                    { field: 'industry', header: 'Industry', sortable: true },
                    { field: 'type', header: 'Type' },
                    { field: 'employees', header: 'Employees', type: 'number' },
                    { field: 'phone', header: 'Phone' },
                ],
                data,
                pagination: true,
                pageSize: 10,
                className: 'w-full',
            } as any)}
        />
    ),
};

// ==========================================
// Opportunity Grid from MSW
// ==========================================
export const OpportunityGrid: StoryObj = {
    name: 'Opportunity Grid (Live)',
    render: () => (
        <LiveDataView
            objectName="opportunity"
            title="Opportunities"
            schema={(data) => ({
                type: 'object-grid',
                objectName: 'opportunity',
                columns: [
                    { field: 'name', header: 'Opportunity', sortable: true },
                    { field: 'amount', header: 'Amount', type: 'currency', sortable: true },
                    { field: 'stage', header: 'Stage', sortable: true },
                    { field: 'probability', header: 'Probability' },
                    { field: 'close_date', header: 'Close Date', type: 'date' },
                ],
                data,
                pagination: true,
                pageSize: 10,
                className: 'w-full',
            } as any)}
        />
    ),
};

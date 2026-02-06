import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect, useState, useCallback } from 'react';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';
import type { BaseSchema } from '@object-ui/types';
import { createStorybookDataSource } from '@storybook-config/datasource';

// ==========================================
// Story 1: Static Data Binding
// ==========================================
// Demonstrates how JSON schemas can reference data via expressions like ${data.field}

const staticDataSchema: BaseSchema = {
    type: "page",
    props: { title: "Static Data Binding" },
    children: [
        {
            type: "page:header",
            props: {
                title: "Sarah Connors",
                description: "Lead Engineer at Cyberdyne Systems"
            }
        },
        {
            type: "grid",
            props: { cols: 2, gap: 4, className: "mt-4" },
            children: [
                { type: "card", title: "Full Name", children: [{ type: "text", content: "Sarah Connors" }] },
                { type: "card", title: "Email", children: [{ type: "text", content: "sarah@cyberdyne.com" }] },
                { type: "card", title: "Status", children: [{ type: "badge", props: { variant: "default", children: "Active" } }] },
                { type: "card", title: "Department", children: [{ type: "text", content: "Engineering" }] },
            ]
        }
    ]
};

// ==========================================
// Story 2: MSW-Backed Data (Live API)
// ==========================================
// The ObjectStack kernel seeds CRM data via MSW. This story fetches contacts from /api/v1.

const dataSource = createStorybookDataSource();

const ContactListFromAPI = () => {
    const [contacts, setContacts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContacts = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await dataSource.find('contact', { $top: 10 });
            setContacts(result.data as any[]);
        } catch (err: any) {
            console.error('[Data Binding] Failed to fetch contacts:', err);
            setError(err?.message || 'Failed to fetch data from MSW API');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    if (loading) return <div className="p-8 text-muted-foreground">Loading contacts from MSW API...</div>;
    if (error) return (
        <div className="p-8 space-y-2">
            <div className="text-destructive font-medium">API Error: {error}</div>
            <div className="text-sm text-muted-foreground">
                This story requires the ObjectStack MSW runtime to be running.
                Check the browser console for [Storybook MSW] logs.
            </div>
        </div>
    );

    const gridSchema: BaseSchema = {
        type: 'object-grid',
        objectName: 'contact',
        columns: [
            { field: 'name', header: 'Name', sortable: true },
            { field: 'email', header: 'Email', sortable: true },
            { field: 'title', header: 'Title' },
            { field: 'status', header: 'Status' },
        ],
        data: contacts,
        className: 'w-full'
    } as any;

    return (
        <SchemaRendererProvider dataSource={dataSource}>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Contacts from MSW ({contacts.length} records)</h2>
                </div>
                <SchemaRenderer schema={gridSchema} />
            </div>
        </SchemaRendererProvider>
    );
};

// ==========================================
// Meta
// ==========================================

const meta: Meta = {
  title: 'Getting Started/Data Binding',
  parameters: {
      layout: 'padded',
  },
};

export default meta;

export const StaticData: StoryObj = {
    render: () => <SchemaRenderer schema={staticDataSchema} />,
};

export const LiveAPI: StoryObj = {
    render: () => <ContactListFromAPI />,
};

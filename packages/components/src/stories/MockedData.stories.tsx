import type { Meta, StoryObj } from '@storybook/react';
import React, { useEffect, useState } from 'react';
import { SchemaRenderer, SchemaRendererProvider } from '@object-ui/react';
import { PageSchema } from '@object-ui/types';

// Define a schema that binds to fetched data
const contactDetailSchema: PageSchema = {
    type: "page",
    props: { title: "Contact Details (Mocked)" },
    children: [
        {
            type: "page:header",
            props: {
                title: "${data.name}", 
                description: "${data.title} at ${data.company}"
            }
        },
        {
            type: "view:simple", 
            props: { columns: 2, className: "mt-4 border p-4 rounded" },
            children: [
                { type: "field:text", bind: "name", props: { label: "Full Name", readonly: true } },
                { type: "field:email", bind: "email", props: { label: "Email", readonly: true } },
                { type: "field:text", bind: "status", props: { label: "Status", readonly: true } }
            ]
        }
    ]
};

// A wrapper component that fetches data from the MSW mock
const DataFetcher = () => {
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        // Simulate a fetch call locally since MSW might not be configured in this environment
        const mockData = {
            name: "Sarah Connors",
            title: "Lead Engineer",
            company: "Cyberdyne Systems",
            email: "sarah@cyberdyne.com",
            status: "Active"
        };

        const timer = setTimeout(() => {
            setData(mockData);
        }, 800);

        return () => clearTimeout(timer);
    }, []);

    if (!data) return <div className="p-4">Loading data from MSW...</div>;

    return (
        <SchemaRendererProvider dataSource={data}>
            <SchemaRenderer schema={contactDetailSchema} />
        </SchemaRendererProvider>
    );
};

const meta: Meta = {
  title: 'Guide/Mocked Data',
  component: DataFetcher,
  parameters: {
      // We can also override handlers per story here if needed
      // msw: { handlers: [...] }
  }
};

export default meta;

export const Default: StoryObj = {};

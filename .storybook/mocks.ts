// .storybook/mocks.ts
import { http, HttpResponse } from 'msw';
import { ObjectStackServer } from '@objectstack/plugin-msw';

export const protocol = {
  objects: [
    {
      name: "contact",
      fields: {
        name: { type: "text" },
        email: { type: "email" },
        title: { type: "text" },
        company: { type: "text" },
        status: { type: "select", options: ["Active", "Lead", "Customer"] }
      }
    },
    {
      name: "opportunity",
      fields: {
        name: { type: "text" },
        amount: { type: "currency" },
        stage: { type: "select" },
        closeDate: { type: "date" },
        accountId: { type: "lookup", reference_to: "account" }
      }
    },
    {
        name: "account",
        fields: {
            name: { type: "text" },
            industry: { type: "text" }
        }
    }
  ]
};

// Initialize the mock server
// @ts-ignore
ObjectStackServer.init(protocol);

// Seed basic data
(async () => {
    await ObjectStackServer.createData('contact', { id: '1', name: 'John Doe', title: 'Developer', company: 'Tech', status: 'Active' });
    await ObjectStackServer.createData('contact', { id: '2', name: 'Jane Smith', title: 'Manager', company: 'Corp', status: 'Customer' });
    await ObjectStackServer.createData('account', { id: '1', name: 'Big Corp', industry: 'Finance' });
    await ObjectStackServer.createData('opportunity', { id: '1', name: 'Big Deal', amount: 50000, stage: 'Negotiation', accountId: '1' });
})();

export const handlers = [
    // Standard CRUD handlers using ObjectStackServer
    http.get('/api/v1/data/:object', async ({ params }) => {
        const { object } = params;
        const result = await ObjectStackServer.findData(object as string);
        return HttpResponse.json({ value: result.data });
    }),
    
    http.get('/api/v1/data/:object/:id', async ({ params }) => {
        const { object, id } = params;
        const result = await ObjectStackServer.getData(object as string, id as string);
        return HttpResponse.json(result.data);
    }),

    http.post('/api/v1/data/:object', async ({ params, request }) => {
        const { object } = params;
        const body = await request.json();
        const result = await ObjectStackServer.createData(object as string, body);
        return HttpResponse.json(result.data);
    }),

    // Custom bootstrap if needed
    http.get('/api/bootstrap', async () => {
        const contacts = (await ObjectStackServer.findData('contact')).data;
        return HttpResponse.json({ contacts });
    })
];

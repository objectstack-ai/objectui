import { ObjectKernel, DriverPlugin, AppPlugin } from '@objectstack/runtime';
import { ObjectQLPlugin } from '@objectstack/objectql';
import { InMemoryDriver } from '@objectstack/driver-memory';
import { MSWPlugin } from '@objectstack/plugin-msw';
import appConfig from '../objectstack.config'; 
import { mockData } from '../data';
import { http, HttpResponse } from 'msw';

let kernel: ObjectKernel | null = null;

export async function startMockServer() {
  if (kernel) return kernel;

  console.log('[MSW] Starting ObjectStack Runtime (Browser Mode)...');

  const driver = new InMemoryDriver();

  // Create kernel with MiniKernel architecture
  kernel = new ObjectKernel();
  
  kernel
    // Register ObjectQL engine
    .use(new ObjectQLPlugin())
    // Register the driver
    .use(new DriverPlugin(driver, 'memory'))
    // Load app config as a plugin
    .use(new AppPlugin(appConfig))
    // MSW Plugin (intercepts network requests)
    .use(new MSWPlugin({
      enableBrowser: true,
      baseUrl: '/api/v1',
      logRequests: true,
      customHandlers: [
          // Custom handlers that are not part of standard CRUD
          http.get('/api/bootstrap', async () => {
             // We use closure 'driver' variable to bypass objectql service issues
             try {
                // Use IDataEngine interface directly via driver
                const user = (await driver.findOne('user', 'current')) || {};
                const contacts = await driver.find('contact', {});
                const opportunities = await driver.find('opportunity', {});
                const stats = { revenue: 125000, leads: 45, deals: 12 };

                return HttpResponse.json({
                    user,
                    stats,
                    contacts,
                    opportunities
                });
             } catch (e) {
                 console.error(e);
                 return new HttpResponse(null, { status: 500 });
             }
          })
      ]
    }));
  
  await kernel.bootstrap();

  // Seed Data
  await initializeMockData(kernel, driver);
  
  return kernel;
}

// Helper to seed data into the in-memory driver
async function initializeMockData(kernel: ObjectKernel, driver: InMemoryDriver) {
    console.log('[MockServer] Initializing mock data (fresh)...');
    
    try {
        // Seed User
        if (mockData.user) {
            await driver.create('user', { ...mockData.user, id: 'current', _id: 'current' });
        }

        // Seed Contacts
        if (mockData.contacts) {
            for (const contact of mockData.contacts) {
                await driver.create('contact', { ...contact, _id: contact.id });
            }
        }

        // Seed Opportunities
        if (mockData.opportunities) {
            for (const opp of mockData.opportunities) {
                await driver.create('opportunity', { ...opp, _id: opp.id });
            }
        }

        // Seed Accounts
        const accounts = [
            { id: '1', name: 'Acme Corp', industry: 'Technology' },
            { id: '2', name: 'TechStart Inc', industry: 'Startup' },
            { id: '3', name: 'Global Solutions', industry: 'Consulting' }
        ];

        for (const acc of accounts) {
            await driver.create('account', { ...acc, _id: acc.id });
        }

        console.log('[MockServer] Data seeded successfully');
    } catch (err) {
        console.error('[MockServer] Seeding failed:', err);
    }
}

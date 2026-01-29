import { ObjectStackClient } from '@objectstack/client';

export const client = new ObjectStackClient({
  baseUrl: '/api/v1',
  fetch: globalThis.fetch.bind(globalThis)
});

export const initClient = async () => {
    await client.connect();
    console.log('[Client] Connected to ObjectStack');
}

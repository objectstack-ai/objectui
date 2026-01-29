import { ObjectStackClient } from '@objectstack/client';

export const client = new ObjectStackClient({
  baseUrl: '/api/v1'
});

export const initClient = async () => {
    await client.connect();
    console.log('[Client] Connected to ObjectStack');
}

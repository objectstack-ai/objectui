import { ObjectStackAdapter } from '@object-ui/data-objectstack';

export const dataSource = new ObjectStackAdapter({
  baseUrl: '/api/v1',
  // In a real app we would have token management, but for MSW mock we might not need auth or use a dummy token.
  token: 'mock-token',
  fetch: globalThis.fetch.bind(globalThis), // Ensure we use the global fetch which Mocks/Browsers patch
});

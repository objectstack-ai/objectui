import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { startMockServer } from './mocks/runtime';
import { initClient } from './client';

async function enableMocking() {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }
  await startMockServer();
  await initClient(); // Ensure client is connected after server starts
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
});

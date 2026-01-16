import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@object-ui/components'; // Register components
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

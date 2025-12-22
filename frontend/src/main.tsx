import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Unregister service workers in development to prevent "message channel closed" errors
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister().then(() => {
        console.log('Service Worker unregistered in dev mode');
      });
    }
  });
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'

// Suppress development console logs in production
if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
}

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed, silently ignore
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);

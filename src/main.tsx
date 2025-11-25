import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import i18n from './i18n/config'

// Wait for i18n to be initialized before rendering
i18n.on('initialized', () => {
  createRoot(document.getElementById("root")!).render(<App />);
});

// Fallback in case initialized event was already fired
if (i18n.isInitialized) {
  createRoot(document.getElementById("root")!).render(<App />);
}

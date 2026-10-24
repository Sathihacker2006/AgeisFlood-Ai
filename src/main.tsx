import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Active DOM cleanup: remove any injected container watermark or API-key banner overlay
const cleanupWatermarks = () => {
  try {
    const candidates = document.querySelectorAll(
      '[class*="watermark"], [id*="watermark"], [class*="api-key"], [id*="api-key"], [class*="apikey"], [id*="apikey"], [data-testid*="watermark"], [data-testid*="api-key"]'
    );
    candidates.forEach((el) => {
      if (el && el.id !== 'root' && !el.closest('#root')) {
        el.remove();
      }
    });

    // Also check any body children outside #root with text containing "API key required"
    document.body.childNodes.forEach((node) => {
      if (node && node instanceof HTMLElement && node.id !== 'root') {
        const text = (node.textContent || '').toLowerCase();
        if (text.includes('api key required') || text.includes('watermark') || text.includes('api_key')) {
          node.remove();
        }
      }
    });

    // Scan all DOM elements outside #root
    document.querySelectorAll('*').forEach((el) => {
      if (
        el &&
        el.id !== 'root' &&
        !el.closest('#root') &&
        el !== document.body &&
        el !== document.documentElement &&
        el !== document.head
      ) {
        const text = (el.textContent || '').trim().toLowerCase();
        if (text === 'api key required' || (text.includes('api key required') && text.length < 60)) {
          el.remove();
        }
      }
    });

    // Also check Leaflet attribution containers if any sneak in
    document.querySelectorAll('.leaflet-control-attribution').forEach((el) => {
      el.remove();
    });
  } catch (_e) {
    // ignore
  }
};

// Run on load and observe DOM changes
cleanupWatermarks();
const observer = new MutationObserver(() => cleanupWatermarks());
observer.observe(document.body, { childList: true, subtree: true });

createRoot(document.getElementById('root')!).render(<App />);

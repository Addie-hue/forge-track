// Bypass Supabase Auth lock deadlocks caused by React/Vite HMR
if (typeof navigator !== 'undefined') {
  Object.defineProperty(navigator, 'locks', {
    value: {
      request: async (name, options, callback) => {
        const cb = typeof options === 'function' ? options : callback;
        return await cb();
      },
      query: async () => ({ held: [], pending: [] })
    },
    configurable: true
  });
}

import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </BrowserRouter>,
);


import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from '@/core/theme';
import { initializeCoreStore } from '@/core/store';
import { registerPWA } from '@/pwa';
import { APP_VERSION } from '@/core/version';
import '@/styles/global.css';

async function bootstrap() {
  const rootElement = document.getElementById('root') as HTMLElement;

  const renderFallback = (error: unknown) => {
    console.error('Titan failed to start', error);

    ReactDOM.createRoot(rootElement).render(
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-foreground">
        <div className="max-w-md space-y-3 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.32em] text-muted-foreground">Titan</p>
          <p className="text-[10px] uppercase tracking-[0.28em] text-primary">{APP_VERSION}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Unable to start the app</h1>
          <p className="text-sm text-muted-foreground">
            The offline core failed to initialize. Please refresh the page.
          </p>
        </div>
      </div>,
    );
  };

  try {
    await initializeCoreStore();

    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <ThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </React.StrictMode>,
    );
  } catch (error) {
    renderFallback(error);
  }
}

void bootstrap();
registerPWA();

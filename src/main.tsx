import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/global.css';
import './styles/app.css';
import { App } from './App';
import { createApp } from './container';
import { StoreProvider } from './state/StoreProvider';

const dashboard = createApp();
const container = document.getElementById('root');
if (container === null) throw new Error('Falta <div id="root"> en index.html');

createRoot(container).render(
  <StrictMode>
    <StoreProvider dashboard={dashboard}>
      <App
        onRetry={() => {
          void dashboard.actions.selectDate(dashboard.store.get().selectedDate);
        }}
      />
    </StoreProvider>
  </StrictMode>,
);

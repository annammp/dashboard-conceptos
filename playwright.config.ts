import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const isCI = Boolean(process.env['CI']);

export default defineConfig({
  testDir: 'e2e',
  testIgnore: ['**/smoke/**'],
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? [['html'], ['github']] : [['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    // Zona y locale fijos: con el reloj fijado en las fixtures, "hoy" es
    // siempre el mismo día y las pruebas no se rompen a medianoche.
    timezoneId: 'America/Mexico_City',
    locale: 'es-MX',
    // Diagnóstico solo cuando falla: una suite verde no deja basura.
    trace: 'on-first-retry',
    video: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Los e2e corren contra el driver local: herméticos, sin red y deterministas.
  webServer: {
    command: 'npm run build && npm run preview',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !isCI,
    timeout: 120_000,
    env: { VITE_DATA_DRIVER: 'local', VITE_BASE: '/', VITE_E2E: '1' },
  },
});

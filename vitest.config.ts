import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  test: {
    projects: [
      {
        // Dominio y estado: puros, sin DOM. Rápidos.
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        // Componentes. Se nombran *.dom.test.tsx para no mezclarlos.
        plugins: [react()],
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.dom.test.tsx'],
          setupFiles: ['src/test/setupDom.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/domain/**/*.ts'],
      exclude: ['src/domain/index.ts', 'src/domain/**/*.test.ts'],
      thresholds: { lines: 100, functions: 100, statements: 100, branches: 95 },
    },
  },
});

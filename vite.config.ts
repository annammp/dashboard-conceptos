import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// En GitHub Pages el sitio vive bajo /<repo>/. El workflow inyecta VITE_BASE;
// en local '/' es lo correcto.
const base = process.env['VITE_BASE'] ?? '/';

export default defineConfig({
  base,
  plugins: [react()],
  build: { target: 'es2023', sourcemap: true },
  server: { port: 5173 },
  preview: { port: 4173 },
});

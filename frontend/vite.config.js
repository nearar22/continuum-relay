import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Continuum Relay frontend build configuration.
// Dev server runs on 5190 to sit alongside the sibling projects.
// Build output is written to out/ so the static host can serve it directly.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5190,
    host: true,
  },
  preview: {
    port: 5190,
  },
  build: {
    outDir: 'out',
    emptyOutDir: true,
  },
});

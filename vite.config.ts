import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';

// Base relativa: funciona em https://<user>.github.io/organizador-treino/ e em qualquer outro host.
export default defineConfig({
  base: './',
  plugins: [preact()],
  build: { target: 'es2022' },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});

/// <reference types="vitest" />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'AtomEffectJQuery',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format: 'es' | 'cjs' | 'umd') => {
        if (format === 'es') return 'index.js';
        if (format === 'cjs') return 'index.cjs';
        return 'index.umd.js';
      }
    },
    rollupOptions: {
      external: ['jquery', '@but212/atom-effect'],
      output: {
        globals: {
          jquery: 'jQuery',
          '@but212/atom-effect': 'AtomEffect'
        }
      }
    },
    sourcemap: true
  },
  plugins: [
    dts({ rollupTypes: true })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./__tests__/setup.ts']
  }
} as any);

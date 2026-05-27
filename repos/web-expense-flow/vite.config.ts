/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

export default defineConfig({
  plugins: [react()],
  preview: {
    host: true,
    port: 3000,
    strictPort: true,
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    watch: {
      usePolling: true,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./setupTests.ts'],
    watch: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'test/**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      '**/*.stories.*', 
      '**/node_modules/**', 
      '**/dist/**',
      '**/storybook-static/**',
      '**/.storybook/**'
    ],
    reporters: [
      'default',
      ['junit', { outputFile: '/tmp/unit.xml' }],
    ],
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: [
        'text',
        'text-summary',
        'html',
        ['cobertura', { file: 'unit.coverage.xml' }],
      ],
      reportsDirectory: '/tmp/coverage',
      clean: false,
      cleanOnRerun: false,
      all: true,
      include: ['src/**/*.{js,jsx,ts,tsx}'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.stories.{js,jsx,ts,tsx}',
        '**/*.{test,spec}.{js,jsx,ts,tsx}',
        '**/setupTests.ts',
        '**/.storybook/**',
        '**/vite.config.ts',
        '**/*.d.ts',
      ],
      thresholds: {
        global: {
          branches: 50,
          functions: 50,
          lines: 50,
          statements: 50,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/opt/cla/src',
    },
    // Add dedupe to prevent multiple versions
    dedupe: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
    ],
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      '@testing-library/react', 
      '@testing-library/jest-dom',
      '@mui/material',
      '@mui/icons-material',
      '@emotion/react',
      '@emotion/styled',
      'framework-react-core',
    ],
    // Force optimization to avoid resolution issues
    force: true,
  },
  define: {
    global: 'globalThis',
  },
});
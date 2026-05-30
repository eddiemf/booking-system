import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@app': path.resolve(__dirname, 'src/application'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@config': path.resolve(__dirname, 'src/config'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
    },
  },
  test: {
    environment: 'node',
    clearMocks: true,
    mockReset: true,
    exclude: ['dist/**', 'node_modules/**'],
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts', 'tests/**/*.feature.ts'],
  },
});

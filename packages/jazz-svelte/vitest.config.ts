import { svelte } from '@sveltejs/vite-plugin-svelte';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
  plugins: [
    svelte({
      configFile: false,
      preprocess: vitePreprocess(),
    }),
  ],
  test: {
    include: ['src/**/*.test.{js,ts,svelte}'],
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    conditions: mode === 'test' ? ['browser'] : [],
  },
}));

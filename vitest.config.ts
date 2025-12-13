/// <reference types="vitest" />
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    setupFiles: ['src/test-setup.ts'],
    hideSkippedTests: true,
  },
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
      '@openhome/core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@openhome/ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
      '@pokemon-files': fileURLToPath(new URL('./packages/pokemon-files/src', import.meta.url)),
      '@pokemon-resources': fileURLToPath(
        new URL('./packages/pokemon-resources/src', import.meta.url)
      ),
      '@pkm-rs': fileURLToPath(new URL('./pkm_rs', import.meta.url)),
    },
  },
})

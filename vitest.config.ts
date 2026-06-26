/// <reference types="vitest" />
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    hideSkippedTests: true,
  },

  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
      '@openhome-core': fileURLToPath(new URL('./src/core', import.meta.url)),
      '@openhome-ui': fileURLToPath(new URL('./src/ui', import.meta.url)),
      '@pokemon-files': fileURLToPath(new URL('./src/core/pokemon-files/src', import.meta.url)),
      '@openhome-core/resources': fileURLToPath(
        new URL('./src/core/pokemon-resources/src', import.meta.url)
      ),
      '@pkm-rs': fileURLToPath(new URL('./pkm_rs', import.meta.url)),
    },
  },
})

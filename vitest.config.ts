/// <reference types="vitest" />
import { fileURLToPath, URL } from 'url'
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    setupFiles: ['src/test-setup.ts'],
  },
  resolve: {
    alias: {
      src: fileURLToPath(new URL('./src', import.meta.url)),
      '@pokemon-files': fileURLToPath(new URL('./packages/pokemon-files/src', import.meta.url)),
      '@pokemon-resources': fileURLToPath(
        new URL('./packages/pokemon-resources/src', import.meta.url)
      ),
      '@pkm-rs': fileURLToPath(new URL('./pkm_rs', import.meta.url)),
    },
  },
})

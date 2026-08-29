import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    // `globals: true` is what registers Testing Library's automatic DOM cleanup.
    // Without it, renders leak between test cases and present as confusing
    // "found multiple elements" failures — three separate agents hit this.
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
})

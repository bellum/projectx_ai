import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function basePath(value: string | undefined): string {
  const base = value || '/'
  if (!base.startsWith('/') || !base.endsWith('/')) {
    throw new Error('VITE_BASE_PATH must start and end with / (for example /projectx_ai/)')
  }
  return base
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: basePath(env.VITE_BASE_PATH),
    plugins: [react()],
    test: { environment: 'jsdom', setupFiles: './vitest.setup.ts', globals: true, exclude: ['tests/**', 'node_modules/**', 'dist/**'] }
  }
})

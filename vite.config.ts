import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import viteCompression from 'vite-plugin-compression2'
import { visualizer } from 'rollup-plugin-visualizer'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const enableAnalyze = mode === 'analyze' || env.ANALYZE === 'true'
  const manualChunkGroups: Record<string, string[]> = {
    'react-vendor': ['react', 'react-dom', 'react-router', '@tanstack/react-query', 'zustand'],
    'antd-vendor': ['antd', '@ant-design/icons', '@ant-design/x', '@ant-design/x-markdown'],
    'canvas-vendor': ['@antv/x6', '@antv/x6-react-shape', 'insert-css'],
    'charts-vendor': ['echarts'],
    'utils-vendor': ['axios', 'dayjs'],
  }

  const manualChunks = (moduleId: string) => {
    if (!moduleId.includes('node_modules')) return undefined

    const normalizedId = moduleId.replace(/\\/g, '/')
    const match = Object.entries(manualChunkGroups).find(([, packages]) =>
      packages.some((packageName) => normalizedId.includes(`/node_modules/${packageName}/`)),
    )

    return match?.[0] ?? 'vendor'
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      ViteImageOptimizer({
        png: { quality: 80 },
        jpeg: { quality: 80 },
        jpg: { quality: 80 },
        webp: { quality: 80 },
        avif: { quality: 70 },
      }),
      viteCompression({
        algorithms: ['gzip', 'brotliCompress'],
        threshold: 10240,
        deleteOriginalAssets: false,
        skipIfLargerOrEqual: true,
      }),
      enableAnalyze && visualizer({
        filename: 'dist/stats.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: 'assets/js/[name]-[hash].js',
          chunkFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.names?.[0] ?? assetInfo.name ?? ''

            if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(name)) {
              return 'assets/img/[name]-[hash][extname]'
            }

            if (/\.css$/i.test(name)) {
              return 'assets/css/[name]-[hash][extname]'
            }

            return 'assets/[name]-[hash][extname]'
          },
          manualChunks,
        },
      },
    },
    server: {
      port: 9099,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})

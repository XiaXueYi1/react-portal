import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import viteCompression from 'vite-plugin-compression2'
import { visualizer } from 'rollup-plugin-visualizer'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const toPackagePattern = (packageName: string) => packageName.split('/').map(escapeRegExp).join(String.raw`[\\/]`)

const createVendorGroup = (name: string, packages: string[], priority: number) => ({
  name,
  test: new RegExp(
    String.raw`node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:${packages.map(toPackagePattern).join('|')})(?:[\\/]|$)`,
  ),
  priority,
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const enableAnalyze = mode === 'analyze' || env.ANALYZE === 'true'
  const vendorGroups = [
    createVendorGroup('react-vendor', ['react', 'react-dom', 'react-router', '@tanstack/react-query', 'zustand'], 40),
    createVendorGroup('antd-core', ['antd'], 35),
    createVendorGroup('antd-icons', ['@ant-design/icons'], 34),
    createVendorGroup('antd-x', ['@ant-design/x', '@ant-design/x-markdown'], 33),
    createVendorGroup('canvas-vendor', ['@antv/x6', '@antv/x6-react-shape', 'insert-css'], 30),
    createVendorGroup('charts-vendor', ['echarts'], 30),
    createVendorGroup('utils-vendor', ['axios', 'dayjs'], 25),
    {
      name: 'vendor',
      test: /node_modules/,
      priority: 10,
    },
  ]

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
      rolldownOptions: {
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
          codeSplitting: {
            minSize: 20000,
            maxSize: 450000,
            groups: vendorGroups,
          },
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

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

const antdPackages = [
  'antd',
  '@ant-design/colors',
  '@ant-design/cssinjs',
  '@ant-design/cssinjs-utils',
  '@ant-design/fast-color',
  '@ant-design/icons',
  '@ant-design/react-slick',
  '@ant-design/x',
  '@ant-design/x-markdown',
  '@rc-component/async-validator',
  '@rc-component/color-picker',
  '@rc-component/context',
  '@rc-component/mini-decimal',
  '@rc-component/mutate-observer',
  '@rc-component/portal',
  '@rc-component/tour',
  '@rc-component/trigger',
  '@rc-component/util',
  'classnames',
  'copy-to-clipboard',
  'rc-cascader',
  'rc-checkbox',
  'rc-collapse',
  'rc-dialog',
  'rc-drawer',
  'rc-dropdown',
  'rc-field-form',
  'rc-image',
  'rc-input',
  'rc-input-number',
  'rc-mentions',
  'rc-menu',
  'rc-motion',
  'rc-notification',
  'rc-overflow',
  'rc-pagination',
  'rc-picker',
  'rc-progress',
  'rc-rate',
  'rc-resize-observer',
  'rc-segmented',
  'rc-select',
  'rc-slider',
  'rc-steps',
  'rc-switch',
  'rc-table',
  'rc-tabs',
  'rc-textarea',
  'rc-tooltip',
  'rc-tree',
  'rc-tree-select',
  'rc-upload',
  'rc-util',
]

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const enableAnalyze = mode === 'analyze' || env.ANALYZE === 'true'
  const vendorGroups = [
    createVendorGroup('react-vendor', ['react', 'react-dom', 'react-router', '@tanstack/react-query', 'zustand'], 40),
    createVendorGroup('antd-vendor', antdPackages, 35),
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

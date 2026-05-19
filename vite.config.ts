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
  // 只在明确需要时才优化图片（CI 或 OPTIMIZE_IMG=true）
  const enableImageOpt = env.OPTIMIZE_IMG === 'true' || mode === 'production'

  return {
    plugins: [
      react(),
      tailwindcss(),

      // 图片优化：仅 production 模式启用，避免日常 build 变慢
      enableImageOpt && ViteImageOptimizer({
        png: { quality: 80 },
        jpeg: { quality: 80 },
        jpg: { quality: 80 },
        webp: { quality: 80 },
        avif: { quality: 70 },
      }),

      // 压缩：只用 brotli 即可，nginx 同时支持时优先用 brotli
      // gzip 作为降级保留；两个都跑会让 build 时间 ×2
      viteCompression({
        algorithms: ['brotliCompress'],
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
      // Vite 8 已内置 rolldown，无需额外配置
      // 类型检查从 build 流程剥离（见下方说明）
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
            minSize: 10000,
            maxSize: 500000,
            groups: [
              {
                name: 'react-vendor',
                test: (id: string) =>
                  id.includes('node_modules') &&
                  /\/(react|react-dom|react-router|scheduler)\//.test(id),
                priority: 50,
              },
              {
                name: 'state-vendor',
                test: (id: string) =>
                  id.includes('node_modules') &&
                  /\/(@tanstack\/react-query|zustand)\//.test(id),
                priority: 45,
              },
              // antd 完整依赖树必须在同一 chunk，不能拆散
              {
                name: 'antd-vendor',
                test: (id: string) => {
                  if (!id.includes('node_modules')) return false
                  return (
                    /\/antd\//.test(id) ||
                    /\/@ant-design\/icons\//.test(id) ||
                    /\/rc-[^/]+\//.test(id) ||
                    /\/@rc-component\//.test(id)
                  )
                },
                priority: 40,
              },
              {
                name: 'antd-x-vendor',
                test: (id: string) =>
                  id.includes('node_modules') &&
                  /\/@ant-design\/x(-markdown)?\//.test(id),
                priority: 38,
              },
              {
                name: 'markdown-vendor',
                test: (id: string) =>
                  id.includes('node_modules') &&
                  /\/(remark|rehype|unified|hast|mdast|micromark|highlight\.js|lowlight|refractor|prismjs)\//.test(id),
                priority: 35,
              },
              {
                name: 'canvas-vendor',
                test: (id: string) =>
                  id.includes('node_modules') &&
                  /\/(@antv\/x6|@antv\/x6-react-shape|insert-css)\//.test(id),
                priority: 30,
              },
              {
                name: 'charts-vendor',
                test: (id: string) =>
                  id.includes('node_modules') && /\/echarts\//.test(id),
                priority: 30,
              },
              {
                name: 'utils-vendor',
                test: (id: string) =>
                  id.includes('node_modules') &&
                  /\/(dayjs|axios)\//.test(id),
                priority: 20,
              },
            ],
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
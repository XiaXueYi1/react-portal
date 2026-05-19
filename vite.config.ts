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
            minSize: 10000,   // 10KB，避免过多微小 chunk
            maxSize: 250000,  // 250KB，更有利于缓存命中和首屏
            groups: [
              // 【优先级最高】React 核心生态，极稳定，长期缓存
              {
                name: 'react-vendor',
                test: /node_modules[\\/](?:react|react-dom|react-router|scheduler)(?:[\\/]|$)/,
                priority: 50,
              },
              // 状态管理和请求，稳定但更新频率略高于 React
              {
                name: 'state-vendor',
                test: /node_modules[\\/](?:@tanstack[\\/]react-query|zustand)(?:[\\/]|$)/,
                priority: 45,
              },
              // Ant Design 核心 UI，体积大，单独隔离
              {
                name: 'antd-vendor',
                test: /node_modules[\\/](?:antd|@ant-design[\\/]icons|rc-[^/]+)(?:[\\/]|$)/,
                priority: 40,
              },
              // Ant Design X（AI 组件），依赖和更新频率与 antd 不同
              {
                name: 'antd-x-vendor',
                test: /node_modules[\\/](?:@ant-design[\\/]x(?!-markdown)|@ant-design[\\/]x-markdown)(?:[\\/]|$)/,
                priority: 38,
              },
              // Markdown 渲染链（可能含 remark/highlight.js），体积重
              {
                name: 'markdown-vendor',
                test: /node_modules[\\/](?:remark|rehype|unified|hast|mdast|micromark|highlight\.js|lowlight|refractor|prismjs)(?:[\\/]|$)/,
                priority: 35,
              },
              // 画布/流程图，体积最大，完全异步加载
              {
                name: 'canvas-vendor',
                test: /node_modules[\\/](?:@antv[\\/]x6|@antv[\\/]x6-react-shape|insert-css)(?:[\\/]|$)/,
                priority: 30,
              },
              // ECharts，按需加载时可进一步拆，这里先整体隔离
              {
                name: 'charts-vendor',
                test: /node_modules[\\/]echarts(?:[\\/]|$)/,
                priority: 30,
              },
              // 工具库：稳定、轻量，单独缓存
              {
                name: 'utils-vendor',
                test: /node_modules[\\/](?:dayjs|axios)(?:[\\/]|$)/,
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
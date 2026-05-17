import { useCallback, useEffect, useMemo, useState } from 'react'
import { Empty, Skeleton, message } from 'antd'
import { ArrowRightOutlined, SearchOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router'
import bannerImage from '@/assets/img/home-banner.png'
import CanvasApi from '@/views/canvas/api'
import type { CanvasSummary } from '@/views/canvas/types'

function FlowPreview({ thumbnail }: { thumbnail?: string | null }) {
  if (thumbnail) {
    return (
      <img
        src={thumbnail}
        alt=""
        className="h-full w-full object-cover opacity-55 blur-[2px] transition-all duration-300 group-hover:scale-105 group-hover:opacity-70 group-hover:blur-[1px]"
      />
    )
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-slate-50/90 to-blue-50/70">
      <div className="absolute left-[12%] top-[24%] h-7 w-20 rounded-md border border-blue-300/35 bg-white/70 blur-[1px]" />
      <div className="absolute left-[40%] top-[44%] h-7 w-20 rounded-md border border-cyan-300/35 bg-white/70 blur-[1px]" />
      <div className="absolute right-[12%] top-[24%] h-7 w-20 rounded-md border border-indigo-300/35 bg-white/70 blur-[1px]" />
      <svg className="absolute inset-0 h-full w-full opacity-50 blur-[0.5px]" viewBox="0 0 420 180" fill="none">
        <path d="M112 62 C160 62 162 88 188 88 L216 88" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
        <path d="M266 88 C304 88 306 62 326 62" stroke="#06b6d4" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const [prompt, setPrompt] = useState('')
  const [canvasList, setCanvasList] = useState<CanvasSummary[]>([])
  const [loading, setLoading] = useState(false)

  const loadRecentCanvases = useCallback(async () => {
    setLoading(true)
    try {
      const data = await CanvasApi.getCanvasList({ page: 1, pageSize: 6 })
      setCanvasList(data.list)
    } catch {
      message.error('加载近期画布失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRecentCanvases()
  }, [loadRecentCanvases])

  const recentCanvases = useMemo(
    () =>
      [...canvasList]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 6),
    [canvasList],
  )

  const handleStartChat = useCallback(() => {
    const content = prompt.trim()
    if (!content) return

    navigate(`/chat?message=${encodeURIComponent(content)}`)
  }, [navigate, prompt])

  return (
    <div className="relative size-full overflow-hidden bg-slate-950">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(248,250,252,0.42), rgba(248,250,252,0.86)), url(${bannerImage})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(147,197,253,0.18),transparent_42%),radial-gradient(circle_at_70%_58%,rgba(103,232,249,0.16),transparent_44%)]" />

      <div className="relative z-10 flex h-full -translate-y-14 flex-col">
        <div className="flex h-[28%] items-end justify-center px-8 pb-10">
          <div className="w-full max-w-6xl">
            <div className="relative">
              <input
                type="text"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    handleStartChat()
                  }
                }}
                placeholder="搜索画布或输入问题开始对话..."
                maxLength={200}
                className="w-full rounded-2xl border border-white/60 bg-white/70 px-6 py-5 pr-16 shadow-xl backdrop-blur-md transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400/40"
              />
              <button
                type="button"
                onClick={handleStartChat}
                className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg transition-all hover:from-blue-600 hover:to-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!prompt.trim()}
              >
                <SearchOutlined className="text-base" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex h-[72%] justify-center px-8 pt-4 pb-8">
          <div className="flex h-full min-h-0 w-full max-w-6xl flex-col">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="m-0 text-2xl text-gray-700/90">近期编辑画布</h2>
              <button
                type="button"
                onClick={() => navigate('/canvas-list')}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600/90 transition-colors hover:text-cyan-600"
              >
                查看全部
                <ArrowRightOutlined className="text-xs" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden">
              {loading ? (
                <div className="grid content-start grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-[188px] rounded-xl border border-white/40 bg-white/50 p-4 backdrop-blur-sm">
                      <Skeleton active paragraph={{ rows: 3 }} />
                    </div>
                  ))}
                </div>
              ) : recentCanvases.length > 0 ? (
                <div className="grid content-start grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {recentCanvases.map((canvas) => (
                    <button
                      key={canvas.id}
                      type="button"
                      onClick={() => navigate(`/canvas?id=${canvas.id}`)}
                      className="group h-[188px] cursor-pointer overflow-hidden rounded-xl border border-white/40 bg-white/50 text-left shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                    >
                      <div className="h-[140px] overflow-hidden bg-gradient-to-br from-gray-50/80 to-blue-50/50">
                        <FlowPreview thumbnail={canvas.thumbnail} />
                      </div>
                      <div className="bg-white/40 px-4 py-3">
                        <h3 className="truncate text-sm text-gray-800">{canvas.name}</h3>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/50 bg-white/50 backdrop-blur-sm">
                  <Empty description="暂无近期编辑画布" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

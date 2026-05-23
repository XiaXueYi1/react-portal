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
    <div className="relative size-full overflow-y-auto bg-slate-100">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(180deg, rgba(248,250,252,0.42), rgba(248,250,252,0.86)), url(${bannerImage})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(147,197,253,0.18),transparent_42%),radial-gradient(circle_at_70%_58%,rgba(103,232,249,0.16),transparent_44%)]" />

      <div className="relative z-10 flex min-h-full flex-col">
        <div className="flex items-end justify-center px-4 pb-6 pt-10 sm:px-6 md:min-h-[30%] md:px-8 md:pb-10">
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
                placeholder="输入问题开始对话..."
                maxLength={200}
                className="w-full rounded-2xl border border-white/60 bg-white/80 px-4 py-4 pr-14 text-base shadow-xl backdrop-blur-md transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-400/40 sm:px-6 sm:py-5 sm:pr-16"
              />
              <button
                type="button"
                onClick={handleStartChat}
                className="absolute right-2.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl bg-blue-600 text-white shadow-lg transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:right-3 sm:size-11"
                disabled={!prompt.trim()}
              >
                <SearchOutlined className="text-base" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 justify-center px-4 pb-6 pt-2 sm:px-6 md:px-8 md:pb-8 md:pt-4">
          <div className="flex h-full min-h-0 w-full max-w-6xl flex-col">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="m-0 text-xl font-semibold text-gray-700/90 sm:text-2xl">近期编辑画布</h2>
              <button
                type="button"
                onClick={() => navigate('/canvas-list')}
                className="inline-flex items-center gap-1.5 text-sm text-blue-600/90 transition-colors hover:text-cyan-600"
              >
                查看全部
                <ArrowRightOutlined className="text-xs" />
              </button>
            </div>

            <div className="home-card-scroll min-h-0 flex-1 overflow-y-auto pr-0 sm:pr-2">
              {loading ? (
                    <div className="grid content-start grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-[188px] rounded-xl border border-white/40 bg-white/50 p-4 backdrop-blur-sm">
                      <Skeleton active paragraph={{ rows: 3 }} />
                    </div>
                  ))}
                </div>
              ) : recentCanvases.length > 0 ? (
                    <div className="grid content-start grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                  {recentCanvases.map((canvas) => (
                    <button
                      key={canvas.id}
                      type="button"
                      onClick={() => navigate(`/canvas?id=${canvas.id}`)}
                      className="group h-[176px] cursor-pointer overflow-hidden rounded-xl border border-white/50 bg-white/65 text-left shadow-lg backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:h-[188px]"
                    >
                      <div className="h-[128px] overflow-hidden bg-gradient-to-br from-gray-50/80 to-blue-50/50 sm:h-[140px]">
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

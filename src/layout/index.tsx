import {
  ApartmentOutlined,
  BarChartOutlined,
  HomeOutlined,
  MessageOutlined,
  MoonOutlined,
  SunOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { Menu, Switch } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useAppStore } from '@/store'

const menuItems = [
  { key: '/home', icon: <HomeOutlined />, label: '首页' },
  { key: '/canvas', icon: <ApartmentOutlined />, label: '画布' },
  { key: '/canvas-list', icon: <UnorderedListOutlined />, label: '画布管理' },
  { key: '/charts', icon: <BarChartOutlined />, label: '图表' },
  { key: '/chat', icon: <MessageOutlined />, label: 'AI 对话' },
]

function AppLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { appState, setAppState } = useAppStore()
  const isSide = appState.layoutMode === 'side'
  const isDark = appState.darkMode
  const selectedKey = `/${pathname.split('/')[1]}`

  const header = (
    <header
      className={`app-header shrink-0 border-b px-3 sm:px-5 lg:px-6 ${isDark ? 'border-gray-800 bg-gray-950 text-white' : 'border-gray-200 bg-white'
        }`}
    >
      <div className="flex min-h-14 items-center gap-3">
        <h1 className="mr-auto whitespace-nowrap text-base font-semibold sm:text-lg lg:mr-8">Frontend-Portal</h1>
        <div className={`flex shrink-0 items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
          <span className="inline-flex items-center gap-2">
            <Switch
              checked={isDark}
              onChange={(checked) => setAppState({ darkMode: checked, theme: checked ? 'dark' : 'light' })}
              checkedChildren={<MoonOutlined />}
              unCheckedChildren={<SunOutlined />}
              aria-label="切换主题模式"
            />
            <span className="hidden sm:inline">主题</span>
          </span>
          <span className="hidden items-center gap-2 lg:inline-flex">
            <Switch
              checked={isSide}
              onChange={(v) => setAppState({ layoutMode: v ? 'side' : 'top' })}
              checkedChildren="侧"
              unCheckedChildren="顶"
              aria-label="切换导航布局"
            />
            布局
          </span>
        </div>
      </div>
      <Menu
        mode="horizontal"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        className={`app-top-menu border-0 ${isSide ? 'lg:hidden' : ''}`}
      />
    </header>
  )

  const sidebar = isSide && (
    <aside className="hidden w-60 shrink-0 bg-gray-900 lg:flex lg:flex-col">
      <div className="h-15 shrink-0 border-b border-gray-700 px-6 flex items-center">
        <h1 className="text-lg font-semibold text-white">Frontend-Portal</h1>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        className="flex-1 pt-2"
      />
    </aside>
  )

  return (
    <div className={`app-shell flex ${isSide ? 'lg:flex-row' : 'flex-col'}`}>
      {isSide ? sidebar : header}
      <div className="min-w-0 flex flex-1 flex-col overflow-hidden">
        {isSide && header}
        <main
          className={`min-h-0 flex flex-1 flex-col overflow-hidden ${isDark ? 'bg-gray-950' : 'bg-white'}`}
          style={{ position: 'relative' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout

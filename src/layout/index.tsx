import {
  ApartmentOutlined,
  BarChartOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
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
      className={`h-15 border-b px-6 shrink-0 flex items-center ${isDark ? 'border-gray-800 bg-gray-950 text-white' : 'border-gray-200 bg-white'
        }`}
    >
      <h1 className="mr-8 whitespace-nowrap text-lg font-semibold">Frontend-Portal</h1>
      {!isSide && (
        <Menu
          mode="horizontal"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          className="flex-1 border-0"
          style={{ lineHeight: '60px' }}
        />
      )}
      <div className={`ml-auto flex items-center gap-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
        <span className="flex items-center gap-2">
          <Switch
            checked={isDark}
            onChange={(checked) => setAppState({ darkMode: checked, theme: checked ? 'dark' : 'light' })}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
          />
          主题模式
        </span>
        <span className="flex items-center gap-2">
          <Switch
            checked={isSide}
            onChange={(v) => setAppState({ layoutMode: v ? 'side' : 'top' })}
            checkedChildren={<MenuFoldOutlined />}
            unCheckedChildren={<MenuUnfoldOutlined />}
          />
          侧边栏
        </span>
      </div>
    </header>
  )

  const sidebar = isSide && (
    <aside className="w-60 shrink-0 bg-gray-900 flex flex-col">
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
    <div className={`flex h-screen ${isSide ? 'flex-row' : 'flex-col'}`}>
      {isSide ? sidebar : header}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isSide && header}
        <main
          className={`flex-1 overflow-hidden flex flex-col ${isDark ? 'bg-gray-950' : 'bg-white'}`}
          style={{ position: 'relative' }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout

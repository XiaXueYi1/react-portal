import {
  ApartmentOutlined,
  BarChartOutlined,
  HomeOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { Button, Menu, Switch } from 'antd'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useAppStore } from '@/store'
import styles from './Layout.module.scss'

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { appState, setAppState } = useAppStore()
  const isSide = appState.layoutMode === 'side'
  const isDark = appState.darkMode
  const selectedKey = `/${pathname.split('/')[1]}`
  const handleNavigate = (key: string) => {
    navigate(key)
    setMobileMenuOpen(false)
  }

  const header = (
    <header
      className={`${styles.header} shrink-0 border-b px-3 sm:px-5 lg:px-6 ${isDark ? 'border-gray-800 bg-gray-950 text-white' : 'border-gray-200 bg-white'
        }`}
    >
      <div className={`${styles.mobileMenuSlot} flex items-center`}>
        <Button
          className={styles.mobileMenuButton}
          type="text"
          icon={mobileMenuOpen ? <MenuFoldOutlined /> : <MenuUnfoldOutlined />}
          aria-label={mobileMenuOpen ? '收起移动端菜单' : '展开移动端菜单'}
          onClick={() => setMobileMenuOpen((value) => !value)}
        />
      </div>
      <h1 className={`${styles.brand} whitespace-nowrap text-base font-semibold sm:text-lg`}>Frontend-Portal</h1>
      <Menu
        mode="horizontal"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => handleNavigate(key)}
        className={`${styles.topMenu} ${isSide ? styles.topMenuHidden : ''} border-0`}
      />
      <div className={`${styles.headerActions} flex shrink-0 items-center gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>
        <span className={`${styles.desktopLayoutToggle} items-center gap-2`}>
          <Switch
            checked={isSide}
            onChange={(v) => setAppState({ layoutMode: v ? 'side' : 'top' })}
            checkedChildren="侧"
            unCheckedChildren="顶"
            aria-label="切换导航布局"
          />
          <span className="hidden sm:inline">布局</span>
        </span>
      </div>
    </header>
  )

  const sidebar = isSide && (
    <aside className={`${styles.desktopSidebar} w-60 shrink-0 flex-col bg-gray-900`}>
      <div className="h-15 shrink-0 border-b border-gray-700 px-6 flex items-center">
        <h1 className="text-lg font-semibold text-white">Frontend-Portal</h1>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => handleNavigate(key)}
        className="flex-1 pt-2"
      />
    </aside>
  )

  const mobileSidebar = (
    <>
      {mobileMenuOpen && <button className={styles.mobileMask} aria-label="收起移动端菜单" onClick={() => setMobileMenuOpen(false)} />}
      <aside className={`${styles.mobileSidebar} ${mobileMenuOpen ? styles.mobileSidebarOpen : ''} flex flex-col bg-gray-900 shadow-2xl`}>
        <div className="h-15 shrink-0 border-b border-gray-700 px-5 flex items-center">
          <h1 className="text-lg font-semibold text-white">Frontend-Portal</h1>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => handleNavigate(key)}
          className="flex-1 pt-2"
        />
      </aside>
    </>
  )

  return (
    <div className={`${styles.shell} flex ${isSide ? 'lg:flex-row' : 'flex-col'}`}>
      {mobileSidebar}
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

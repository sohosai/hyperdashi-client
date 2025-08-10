import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenuToggle,
  NavbarMenu,
  NavbarMenuItem,
  Button,
  Tabs,
  Tab
} from '@heroui/react'
import { useState } from 'react'
import { ConnectionStatus } from '@/components/ui/ConnectionStatus'
 
export function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
 
  const isActive = (path: string) => {
    return location.pathname.startsWith(path)
  }

  const menuItems = [
    { href: '/', label: 'ダッシュボード', isActive: location.pathname === '/' },
    { href: '/items', label: '備品管理', isActive: isActive('/items') },
    { href: '/containers', label: 'コンテナ管理', isActive: isActive('/containers') },
    { href: '/loans', label: '貸出管理', isActive: isActive('/loans') },
    { href: '/cable-colors', label: 'ケーブル色管理', isActive: isActive('/cable-colors') },
    { href: '/labels', label: 'ラベル生成', isActive: isActive('/labels') },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        maxWidth="full" 
        isBordered
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
      >
        <NavbarContent>
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden"
          />
          <NavbarBrand>
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/hyperdashi.svg" 
                alt="HyperDashi" 
                className="h-8 w-8" 
              />
              <span className="font-bold text-lg sm:text-xl text-primary">HyperDashi</span>
            </Link>
          </NavbarBrand>
        </NavbarContent>

        {/* HeroUI Tabs for page navigation */}
        <div className="hidden sm:flex flex-1 justify-center items-center">
          <div className="w-full max-w-3xl">
            <Tabs
              selectedKey={menuItems.find(item => item.isActive)?.href ?? '/'}
              onSelectionChange={(key) => {
                navigate(String(key))
              }}
              aria-label="ページ切り替え"
              variant="underlined"
              color="primary"
            >
              {menuItems.map((item) => (
                <Tab key={item.href} title={item.label} />
              ))}
            </Tabs>
          </div>
        </div>

        <NavbarContent justify="end">
          <NavbarItem className="hidden sm:flex">
            <ConnectionStatus />
          </NavbarItem>
          <NavbarItem className="hidden sm:flex">
            <Button as={Link} color="primary" to="/items/new" variant="flat" size="sm">
              備品追加
            </Button>
          </NavbarItem>
        </NavbarContent>

        <NavbarMenu>
          {menuItems.map((item) => (
            <NavbarMenuItem key={item.href}>
              <Link
                to={item.href}
                className={`w-full text-lg ${item.isActive ? 'text-primary font-semibold' : 'text-foreground'}`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </Link>
            </NavbarMenuItem>
          ))}
          <NavbarMenuItem>
            <div className="flex flex-col gap-4 mt-4 pt-4 border-t border-divider">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground-500">接続状態:</span>
                <ConnectionStatus />
              </div>
              <Button 
                as={Link} 
                color="primary" 
                to="/items/new" 
                variant="flat" 
                size="sm"
                className="w-full"
                onClick={() => setIsMenuOpen(false)}
              >
                備品追加
              </Button>
            </div>
          </NavbarMenuItem>
        </NavbarMenu>
      </Navbar>

      <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <Outlet />
      </main>
    </div>
  )
}
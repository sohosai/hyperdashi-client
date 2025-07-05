import { Outlet, Link, useLocation } from 'react-router-dom'
import { 
  Navbar, 
  NavbarBrand, 
  NavbarContent, 
  NavbarItem,
  Button,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Avatar
} from '@heroui/react'
import { useState } from 'react'
import { ConnectionStatus } from '@/components/ui/ConnectionStatus'

export function Layout() {
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const isActive = (path: string) => {
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        maxWidth="full" 
        isBordered
        isMenuOpen={isMenuOpen}
        onMenuOpenChange={setIsMenuOpen}
      >
        <NavbarContent>
          <NavbarBrand>
            <Link to="/" className="font-bold text-xl text-primary">
              HyperDashi
            </Link>
          </NavbarBrand>
        </NavbarContent>

        <NavbarContent className="hidden sm:flex gap-4" justify="center">
          <NavbarItem isActive={location.pathname === '/'}>
            <Link to="/" className={location.pathname === '/' ? 'text-primary' : ''}>
              ダッシュボード
            </Link>
          </NavbarItem>
          <NavbarItem isActive={isActive('/items')}>
            <Link to="/items" className={isActive('/items') ? 'text-primary' : ''}>
              備品管理
            </Link>
          </NavbarItem>
          <NavbarItem isActive={isActive('/loans')}>
            <Link to="/loans" className={isActive('/loans') ? 'text-primary' : ''}>
              貸出管理
            </Link>
          </NavbarItem>
          <NavbarItem isActive={isActive('/cable-colors')}>
            <Link to="/cable-colors" className={isActive('/cable-colors') ? 'text-primary' : ''}>
              ケーブル色管理
            </Link>
          </NavbarItem>
        </NavbarContent>

        <NavbarContent justify="end">
          <NavbarItem>
            <ConnectionStatus />
          </NavbarItem>
          <NavbarItem>
            <Button as={Link} color="primary" to="/items/new" variant="flat">
              備品追加
            </Button>
          </NavbarItem>
          <NavbarItem>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <Avatar
                  isBordered
                  as="button"
                  className="transition-transform"
                  color="primary"
                  name="管理者"
                  size="sm"
                />
              </DropdownTrigger>
              <DropdownMenu aria-label="User Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <p className="font-semibold">ログイン中</p>
                  <p className="text-sm">admin@example.com</p>
                </DropdownItem>
                <DropdownItem key="settings">設定</DropdownItem>
                <DropdownItem key="help_and_feedback">ヘルプ＆フィードバック</DropdownItem>
                <DropdownItem key="logout" color="danger">
                  ログアウト
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Outlet />
      </main>
    </div>
  )
}
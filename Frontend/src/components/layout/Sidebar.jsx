import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Coffee,
  Table,
  ClipboardList,
  History,
  Package,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

const menuItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/menu', icon: Coffee, label: 'Menu' },
  { to: '/tables', icon: Table, label: 'Quản lý Bàn' },
  { to: '/orders', icon: ClipboardList, label: 'Tạo Order' },
  { to: '/inventory', icon: Package, label: 'Quản lý Kho' },
  { to: '/history', icon: History, label: 'Lịch sử Order' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="w-64 h-screen bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700 flex items-center gap-3">
        <img
          src="/logo.png"
          alt="Logo"
          className="w-9 h-9 rounded-lg object-cover bg-gray-800 shrink-0"
        />
        <div>
          <h1 className="text-lg font-semibold tracking-wide">
            Café <span className="text-amber-500">Manager</span>
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">Quản lý quán cà phê</p>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-700 space-y-2">
        {user && (
          <div className="px-4 py-2 text-xs text-gray-400">
            <p className="font-medium text-gray-300">{user.name}</p>
            <p className="capitalize">
              {user.role === 'admin' ? 'Quản lý' : 'Nhân viên'}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </aside>
  )
}
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './pages/LoginPage'
import Dashboard from './pages/Dashboard'
import MenuPage from './pages/MenuPage'
import TablesPage from './pages/TablesPage'
import OrdersPage from './pages/OrdersPage'
import HistoryPage from './pages/HistoryPage'
import InventoryPage from './pages/InventoryPage'

function PrivateRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Đang tải...
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<PrivateRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/tables" element={<TablesPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  DollarSign,
  ShoppingBag,
  LayoutGrid,
  AlertTriangle,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { getOrders } from '../api/orderApi'
import { getTables } from '../api/tableApi'
import { getProducts } from '../api/productApi'

const statusConfig = {
  completed: { label: 'Hoàn thành', className: 'bg-emerald-100 text-emerald-700' },
  preparing: { label: 'Đang làm', className: 'bg-blue-100 text-blue-700' },
  pending: { label: 'Chờ xử lý', className: 'bg-amber-100 text-amber-700' },
  cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-700' },
}

function isToday(iso) {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [orders, setOrders] = useState([])
  const [tables, setTables] = useState([])
  const [products, setProducts] = useState([])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const [oRes, tRes, pRes] = await Promise.all([
          getOrders(),
          getTables(),
          getProducts(),
        ])
        setOrders(oRes.data || [])
        setTables(tRes.data || [])
        setProducts(pRes.data || [])
      } catch {
        toast.error('Không tải được dashboard')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const todayOrders = orders.filter((o) => isToday(o.createdAt))
  const todayCompleted = todayOrders.filter((o) => o.status === 'completed')
  const revenueToday = todayCompleted.reduce(
    (sum, o) => sum + (Number(o.total) || 0),
    0
  )
  const occupiedTables = tables.filter((t) => t.status === 'occupied').length
  const outOfStock = products.filter((p) => p.status === 'out_of_stock').length

  // Top món (từ order hôm nay + mọi order gần đây)
  const soldMap = {}
  orders.forEach((order) => {
    if (order.status === 'cancelled') return
    ;(order.items || []).forEach((item) => {
      const name = item.name || 'Món'
      if (!soldMap[name]) soldMap[name] = { name, qty: 0, revenue: 0 }
      soldMap[name].qty += item.quantity || 0
      soldMap[name].revenue += (item.price || 0) * (item.quantity || 0)
    })
  })
  const topSelling = Object.values(soldMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5)

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">Đang tải dashboard...</div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">Tổng quan hoạt động hôm nay</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Doanh thu hôm nay</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {revenueToday.toLocaleString('vi-VN')}đ
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {todayCompleted.length} đơn đã hoàn thành
              </p>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Đơn hàng hôm nay</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {todayOrders.length}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {todayOrders.filter((o) => o.status === 'pending').length} chờ xử lý
              </p>
            </div>
            <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
              <ShoppingBag size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Bàn đang dùng</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">
                {occupiedTables}/{tables.length || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {tables.filter((t) => t.status === 'available').length} bàn trống
              </p>
            </div>
            <div className="p-2.5 bg-amber-50 rounded-lg text-amber-600">
              <LayoutGrid size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Món hết hàng</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{outOfStock}</p>
              <p className="text-xs text-gray-400 mt-1">
                {products.length} món trong menu
              </p>
            </div>
            <div className="p-2.5 bg-red-50 rounded-lg text-red-600">
              <AlertTriangle size={20} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Đơn gần đây */}
        <div className="xl:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Đơn hàng gần đây</h3>
            <Link
              to="/history"
              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-50 bg-gray-50/80">
                  <th className="px-5 py-3 font-medium">Mã đơn</th>
                  <th className="px-5 py-3 font-medium">Bàn</th>
                  <th className="px-5 py-3 font-medium">Tổng tiền</th>
                  <th className="px-5 py-3 font-medium">Trạng thái</th>
                  <th className="px-5 py-3 font-medium">Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-800">
                      {order._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {order.table?.name || '—'}
                    </td>
                    <td className="px-5 py-3 font-medium">
                      {Number(order.total).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusConfig[order.status]?.className
                        }`}
                      >
                        {statusConfig[order.status]?.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {recentOrders.length === 0 && (
            <div className="text-center py-12 text-gray-400 text-sm">
              Chưa có đơn hàng nào
            </div>
          )}
        </div>

        {/* Món bán chạy */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Món bán chạy</h3>
          </div>
          <div className="p-4 space-y-3">
            {topSelling.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">
                Chưa có dữ liệu bán
              </p>
            )}
            {topSelling.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center gap-3"
              >
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-400">{item.qty} đã bán</p>
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  {(item.revenue / 1000).toFixed(0)}k
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
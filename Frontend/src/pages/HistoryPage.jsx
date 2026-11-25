import { useState, useEffect } from 'react'
import { Search, Eye, Clock, Filter } from 'lucide-react'
import { toast } from 'sonner'
import { getOrders, updateOrderStatus } from '../api/orderApi'

const statusConfig = {
  completed: {
    label: 'Hoàn thành',
    className: 'bg-emerald-100 text-emerald-700',
  },
  preparing: {
    label: 'Đang làm',
    className: 'bg-blue-100 text-blue-700',
  },
  pending: {
    label: 'Chờ xử lý',
    className: 'bg-amber-100 text-amber-700',
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-red-100 text-red-700',
  },
}

const paymentMap = {
  cash: 'Tiền mặt',
  transfer: 'Chuyển khoản',
}

export default function HistoryPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [filterDate, setFilterDate] = useState('')

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = filterStatus !== 'all' ? { status: filterStatus } : {}
      const { data } = await getOrders(params)
      setOrders(data)
    } catch {
      toast.error('Không tải được lịch sử order')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [filterStatus])

  const filteredOrders = orders.filter((order) => {
    const q = search.toLowerCase()
    const tableName = order.table?.name || ''
    const matchSearch =
      order._id.toLowerCase().includes(q) ||
      tableName.toLowerCase().includes(q)

    let matchDate = true
    if (filterDate) {
      const local = new Date(order.createdAt).toLocaleDateString('en-CA')
      matchDate = local === filterDate
    }

    return matchSearch && matchDate
  })

  const formatTime = (iso) => {
    if (!iso) return '—'
    return new Date(iso).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const printBill = (order) => {
    const w = window.open('', '_blank', 'width=360,height=560')
    if (!w) {
      toast.error('Trình duyệt chặn popup — cho phép popup để in bill')
      return
    }

    const rows = (order.items || [])
      .map(
        (i) =>
          `<tr>
            <td style="padding:4px 0">${i.name} × ${i.quantity}</td>
            <td style="text-align:right;padding:4px 0">${(
              i.price * i.quantity
            ).toLocaleString('vi-VN')}đ</td>
          </tr>`
      )
      .join('')

    const pay =
      order.paymentMethod === 'transfer'
        ? 'Chuyển khoản'
        : order.paymentMethod === 'cash'
        ? 'Tiền mặt'
        : '—'

    w.document.write(`
      <html>
        <head>
          <title>Bill ${order._id.slice(-6).toUpperCase()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; font-size: 13px; color: #111; }
            h2 { margin: 0 0 4px; font-size: 18px; }
            .sub { color: #666; margin-bottom: 12px; font-size: 12px; }
            table { width: 100%; border-collapse: collapse; }
            .total { font-weight: bold; font-size: 15px; margin-top: 12px; display: flex; justify-content: space-between; }
            hr { border: none; border-top: 1px dashed #ccc; margin: 12px 0; }
          </style>
        </head>
        <body>
          <h2>Café Manager</h2>
          <div class="sub">Phiếu thanh toán</div>
          <p>
            Bàn: <b>${order.table?.name || '—'}</b><br/>
            Mã: ${order._id.slice(-6).toUpperCase()}<br/>
            Giờ: ${new Date(order.createdAt).toLocaleString('vi-VN')}<br/>
            TT: ${pay}
          </p>
          <hr/>
          <table>${rows}</table>
          <hr/>
          <div class="total">
            <span>Tổng cộng</span>
            <span>${Number(order.total).toLocaleString('vi-VN')}đ</span>
          </div>
          <p style="margin-top:16px;text-align:center;color:#666;font-size:12px">Cảm ơn quý khách!</p>
          <script>window.onload = function(){ window.print(); }<\/script>
        </body>
      </html>
    `)
    w.document.close()
  }

  const handleChangeStatus = async (orderId, status, paymentMethod) => {
    if (status === 'cancelled') {
      if (!window.confirm('Bạn chắc muốn hủy đơn này?')) return
    }

    setUpdating(true)
    try {
      const body = { status }
      if (status === 'completed' && paymentMethod) {
        body.paymentMethod = paymentMethod
      }
      await updateOrderStatus(orderId, body)
      toast.success(
        status === 'completed'
          ? 'Đã hoàn thành'
          : status === 'cancelled'
          ? 'Đã hủy đơn'
          : 'Đã cập nhật trạng thái'
      )
      setSelectedOrder(null)
      fetchOrders()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400 animate-pulse">
        Đang tải lịch sử...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Lịch sử Order</h2>
        <p className="text-sm text-gray-500 mt-1">
          Tổng cộng {orders.length} đơn hàng
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Tìm theo mã đơn hoặc bàn..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="preparing">Đang làm</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          {filterDate && (
            <button
              type="button"
              onClick={() => setFilterDate('')}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Xóa ngày
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-100 bg-gray-50">
                <th className="px-5 py-3 font-medium">Mã đơn</th>
                <th className="px-5 py-3 font-medium">Bàn</th>
                <th className="px-5 py-3 font-medium">Số món</th>
                <th className="px-5 py-3 font-medium">Tổng tiền</th>
                <th className="px-5 py-3 font-medium">Trạng thái</th>
                <th className="px-5 py-3 font-medium">Thanh toán</th>
                <th className="px-5 py-3 font-medium">Thời gian</th>
                <th className="px-5 py-3 font-medium text-center">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr
                  key={order._id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-5 py-3.5 font-medium text-gray-800">
                    {order._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {order.table?.name || '—'}
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {order.items?.reduce((s, i) => s + i.quantity, 0) || 0}
                  </td>
                  <td className="px-5 py-3.5 font-medium text-gray-800">
                    {Number(order.total).toLocaleString('vi-VN')}đ
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                        statusConfig[order.status]?.className
                      }`}
                    >
                      {statusConfig[order.status]?.label}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">
                    {order.paymentMethod
                      ? paymentMap[order.paymentMethod]
                      : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock size={13} />
                      {formatTime(order.createdAt)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            Không tìm thấy đơn hàng nào
          </div>
        )}
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">
                Chi tiết {selectedOrder._id.slice(-6).toUpperCase()}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Bàn</span>
                <span className="font-medium">
                  {selectedOrder.table?.name || '—'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Trạng thái</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusConfig[selectedOrder.status]?.className
                  }`}
                >
                  {statusConfig[selectedOrder.status]?.label}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Thời gian tạo</span>
                <span>{formatTime(selectedOrder.createdAt)}</span>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Danh sách món
                </p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium">
                        {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 flex justify-between">
                <span className="font-semibold text-gray-800">Tổng cộng</span>
                <span className="font-bold text-amber-600 text-lg">
                  {Number(selectedOrder.total).toLocaleString('vi-VN')}đ
                </span>
              </div>

              {selectedOrder.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      handleChangeStatus(selectedOrder._id, 'preparing')
                    }
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                  >
                    Bắt đầu làm
                  </button>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      handleChangeStatus(selectedOrder._id, 'cancelled')
                    }
                    className="flex-1 py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    Hủy đơn
                  </button>
                </div>
              )}

              {selectedOrder.status === 'preparing' && (
                <div className="space-y-2 pt-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() =>
                        handleChangeStatus(
                          selectedOrder._id,
                          'completed',
                          'cash'
                        )
                      }
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                    >
                      Hoàn thành (tiền mặt)
                    </button>
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() =>
                        handleChangeStatus(
                          selectedOrder._id,
                          'completed',
                          'transfer'
                        )
                      }
                      className="flex-1 py-2.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-sm font-medium rounded-lg disabled:opacity-50"
                    >
                      Chuyển khoản
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() =>
                      handleChangeStatus(selectedOrder._id, 'cancelled')
                    }
                    className="w-full py-2.5 border border-red-200 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    Hủy đơn
                  </button>
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 space-y-2">
              <button
                type="button"
                onClick={() => printBill(selectedOrder)}
                className="w-full py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50"
              >
                In bill
              </button>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
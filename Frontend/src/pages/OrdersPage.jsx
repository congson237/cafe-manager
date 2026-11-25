import { useState, useEffect } from 'react'
import { Plus, Minus, Trash2, ShoppingCart, Search, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { getProducts } from '../api/productApi'
import { getTables } from '../api/tableApi'
import { getOpenOrdersByTable, createOrder } from '../api/orderApi'

const QR_IMAGE = '/qr-payment.jpg'

export default function OrdersPage() {
  const [tables, setTables] = useState([])
  const [products, setProducts] = useState([])
  const [openOrders, setOpenOrders] = useState([])
  const [selectedTable, setSelectedTable] = useState(null)
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [showPayModal, setShowPayModal] = useState(false)

  const categories = ['Cà phê', 'Trà', 'Nước ép', 'Bánh ngọt', 'Khác']

  const fetchInit = async () => {
    try {
      setLoading(true)
      const [tablesRes, productsRes] = await Promise.all([
        getTables(),
        getProducts(),
      ])
      setTables(tablesRes.data)
      setProducts(productsRes.data.filter((p) => p.status === 'available'))
    } catch {
      toast.error('Không tải được dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInit()
  }, [])

  useEffect(() => {
    if (!selectedTable) {
      setOpenOrders([])
      return
    }
    getOpenOrdersByTable(selectedTable)
      .then((res) => setOpenOrders(res.data))
      .catch(() => setOpenOrders([]))
  }, [selectedTable])

  const filteredItems = products.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory =
      selectedCategory === 'all' || item.category === selectedCategory
    return matchSearch && matchCategory
  })

  const addToCart = (item) => {
    setCart((prev) => {
      const exist = prev.find((i) => i._id === item._id)
      if (exist) {
        return prev.map((i) =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        )
      }
      return [...prev, { ...item, quantity: 1 }]
    })
    toast.success(`Đã thêm ${item.name}`)
  }

  const updateQuantity = (id, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item._id === id ? { ...item, quantity: item.quantity + delta } : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (id) => {
    const item = cart.find((i) => i._id === id)
    setCart((prev) => prev.filter((i) => i._id !== id))
    if (item) toast.message(`Đã xóa ${item.name}`)
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  const openPayModal = () => {
    if (!selectedTable) {
      toast.error('Vui lòng chọn bàn!')
      return
    }
    if (cart.length === 0) {
      toast.error('Giỏ hàng đang trống!')
      return
    }
    setPaymentMethod('cash')
    setShowPayModal(true)
  }

  const handleCreateOrder = async () => {
    setSubmitting(true)
    try {
      await createOrder({
        tableId: selectedTable,
        items: cart.map((i) => ({
          productId: i._id,
          quantity: i.quantity,
        })),
        note,
        paymentMethod,
      })

      toast.success('Tạo order thành công!')
      setCart([])
      setNote('')
      setPaymentMethod('cash')
      setShowPayModal(false)

      const [openRes, tablesRes] = await Promise.all([
        getOpenOrdersByTable(selectedTable),
        getTables(),
      ])
      setOpenOrders(openRes.data)
      setTables(tablesRes.data)
    } catch (error) {
      toast.error(error.response?.data?.message || 'Tạo order thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const statusLabel = {
    pending: 'Chờ xử lý',
    preparing: 'Đang làm',
    completed: 'Hoàn thành',
  }

  const statusColor = {
    pending: 'bg-amber-100 text-amber-700',
    preparing: 'bg-blue-100 text-blue-700',
    completed: 'bg-emerald-100 text-emerald-700',
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Đang tải...</div>
  }

  return (
    <div className="h-[calc(100vh-7rem)] flex flex-col lg:flex-row gap-6">
      {/* Cột trái */}
      <div className="flex-1 flex flex-col gap-5 overflow-hidden">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-800 mb-3">Chọn bàn</h3>
          <div className="flex flex-wrap gap-2">
            {tables.map((table) => (
              <button
                key={table._id}
                onClick={() => setSelectedTable(table._id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  selectedTable === table._id
                    ? 'bg-amber-600 text-white border-amber-600'
                    : table.status === 'occupied'
                    ? 'bg-red-50 text-red-700 border-red-200 hover:border-red-400'
                    : table.status === 'reserved'
                    ? 'bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-amber-400'
                }`}
              >
                {table.name}
                {table.status === 'occupied' && (
                  <span className="ml-1 text-xs opacity-70">●</span>
                )}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Đỏ = đang có khách · Vàng = đã đặt · Trắng = trống
          </p>
        </div>

        {selectedTable && openOrders.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              Đơn đang mở của bàn này ({openOrders.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {openOrders.map((order) => (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm"
                >
                  <div>
                    <span className="font-medium text-gray-800">
                      {order._id.slice(-6).toUpperCase()}
                    </span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="text-gray-600">
                      {order.items.reduce((s, i) => s + i.quantity, 0)} món
                    </span>
                    <span className="mx-2 text-gray-300">|</span>
                    <span className="font-medium text-amber-600">
                      {order.total.toLocaleString('vi-VN')}đ
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        statusColor[order.status]
                      }`}
                    >
                      {statusLabel[order.status]}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(order.createdAt).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-200 flex-1 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 space-y-3">
            <h3 className="font-semibold text-gray-800">Danh sách món</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Tìm món..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="all">Tất cả</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  onClick={() => addToCart(item)}
                  className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:border-amber-300 hover:bg-amber-50/50 transition-colors cursor-pointer"
                >
                  <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-800 text-sm truncate">
                      {item.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {item.description || item.category}
                    </p>
                    <p className="text-sm font-semibold text-amber-600 mt-1">
                      {Number(item.price).toLocaleString('vi-VN')}đ
                    </p>
                  </div>
                  <button
                    type="button"
                    className="self-center p-1.5 bg-amber-100 text-amber-700 rounded-lg"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
            {filteredItems.length === 0 && (
              <div className="text-center py-12 text-gray-400 text-sm">
                Không có món nào
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cột phải */}
      <div className="w-full lg:w-96 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <ShoppingCart size={18} className="text-amber-600" />
          <h3 className="font-semibold text-gray-800">Tạo order mới</h3>
          {cart.length > 0 && (
            <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {cart.reduce((sum, i) => sum + i.quantity, 0)} món
            </span>
          )}
        </div>

        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <p className="text-sm text-gray-500">
            Bàn:{' '}
            <span className="font-semibold text-gray-800">
              {selectedTable
                ? tables.find((t) => t._id === selectedTable)?.name
                : 'Chưa chọn'}
            </span>
            {openOrders.length > 0 && (
              <span className="ml-2 text-xs text-amber-600">
                (đã có {openOrders.length} đơn đang mở)
              </span>
            )}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              Chưa có món nào
            </div>
          ) : (
            cart.map((item) => (
              <div key={item._id} className="flex gap-3 items-start">
                <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-800 truncate">
                    {item.name}
                  </h4>
                  <p className="text-xs text-amber-600 font-medium mt-0.5">
                    {Number(item.price).toLocaleString('vi-VN')}đ
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item._id, -1)}
                      className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-medium w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item._id, 1)}
                      className="p-1 rounded bg-gray-100 hover:bg-gray-200"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                  </p>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item._id)}
                    className="mt-2 p-1 text-red-500 hover:bg-red-50 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-gray-100 p-4 space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Ghi chú</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ít đá, không đường..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Tổng cộng</span>
            <span className="text-xl font-bold text-amber-600">
              {total.toLocaleString('vi-VN')}đ
            </span>
          </div>

          <button
            type="button"
            onClick={openPayModal}
            disabled={cart.length === 0 || !selectedTable || submitting}
            className="w-full py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
          >
            Tạo Order mới
          </button>
        </div>
      </div>

      {/* Modal thanh toán */}
      {showPayModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-sm shadow-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">
                Chọn hình thức thanh toán
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">
                Tổng: {total.toLocaleString('vi-VN')}đ
              </p>
            </div>

            <div className="p-5 space-y-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`w-full py-3 rounded-lg border text-sm font-medium transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-amber-600 bg-amber-50 text-amber-800'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Tiền mặt
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`w-full py-3 rounded-lg border text-sm font-medium transition-colors ${
                  paymentMethod === 'transfer'
                    ? 'border-amber-600 bg-amber-50 text-amber-800'
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Chuyển khoản
              </button>

              {paymentMethod === 'transfer' && (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-500 mb-2">
                    Quét QR để chuyển khoản
                  </p>
                  <img
                    src={QR_IMAGE}
                    alt="QR chuyển khoản"
                    className="mx-auto w-44 h-44 object-contain rounded-md bg-white"
                  />
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 text-sm font-medium hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleCreateOrder}
                disabled={submitting}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white text-sm font-medium rounded-lg"
              >
                {submitting ? 'Đang tạo...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
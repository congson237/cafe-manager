import { useState, useEffect, useRef } from 'react'
import { Bell } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Link } from 'react-router-dom'
import { getOrders } from '../../api/orderApi'
import { getIngredients } from '../../api/ingredientApi'

const READ_KEY = 'cafe_notifications_read'

function getReadIds() {
  try {
    return JSON.parse(localStorage.getItem(READ_KEY) || '[]')
  } catch {
    return []
  }
}

function saveReadIds(ids) {
  localStorage.setItem(READ_KEY, JSON.stringify([...new Set(ids)]))
}

export default function Header({ title }) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [readIds, setReadIds] = useState(() => getReadIds())
  const [loading, setLoading] = useState(false)
  const boxRef = useRef(null)
  const openRef = useRef(false)

  const roleLabel = user?.role === 'admin' ? 'Quản lý' : 'Nhân viên'

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const [oRes, iRes] = await Promise.all([getOrders(), getIngredients()])
      const list = []

      // --- Kho: stock <= minStock (minStock phải > 0 mới là "sắp hết") ---
      ;(iRes.data || []).forEach((ing) => {
        const stock = Number(ing.stock) || 0
        const min = Number(ing.minStock) || 0
        if (min > 0 && stock <= min) {
          list.push({
            id: `stock-${ing._id}-s${stock}-m${min}`,
            text: `"${ing.name}" sắp hết hàng (còn ${stock}${ing.unit || ''}, cảnh báo khi ≤ ${min})`,
            to: '/inventory',
            time: 'Cảnh báo kho',
          })
        }
      })

      // --- Đơn hoàn thành gần nhất ---
      const completed = (oRes.data || [])
        .filter((o) => o.status === 'completed')
        .sort(
          (a, b) =>
            new Date(b.completedAt || b.updatedAt || b.createdAt) -
            new Date(a.completedAt || a.updatedAt || a.createdAt)
        )
        .slice(0, 5)

      completed.forEach((order) => {
        const time = order.completedAt || order.updatedAt || order.createdAt
        list.push({
          id: `order-${order._id}`,
          text: `Đơn ${order._id.slice(-6).toUpperCase()} đã hoàn thành · ${
            order.table?.name || 'Bàn'
          } · ${Number(order.total).toLocaleString('vi-VN')}đ`,
          to: '/history',
          time: time
            ? new Date(time).toLocaleString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                day: '2-digit',
                month: '2-digit',
              })
            : '',
        })
      })

      if (list.length === 0) {
        list.push({
          id: 'empty',
          text: 'Không có thông báo',
          to: null,
          time: '',
        })
      }

      setNotifications(list)
    } catch {
      setNotifications([
        { id: 'err', text: 'Không tải được thông báo', to: null, time: '' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const unreadCount = notifications.filter(
    (n) => n.id !== 'empty' && n.id !== 'err' && !readIds.includes(n.id)
  ).length

  const markCurrentAsRead = () => {
    const ids = notifications
      .filter((n) => n.id !== 'empty' && n.id !== 'err')
      .map((n) => n.id)
    if (ids.length === 0) return
    const merged = [...new Set([...getReadIds(), ...ids])]
    setReadIds(merged)
    saveReadIds(merged)
  }

  const handleToggleBell = () => {
    if (open) {
      // Đóng → đánh dấu đã đọc
      markCurrentAsRead()
      setOpen(false)
      openRef.current = false
    } else {
      setOpen(true)
      openRef.current = true
      loadNotifications()
    }
  }

  // Load lúc vào app + mỗi 20s (sau khi hoàn thành order, chấm đỏ hiện lại)
  useEffect(() => {
    loadNotifications()
    const t = setInterval(() => {
      if (!openRef.current) loadNotifications()
    }, 20000)
    return () => clearInterval(t)
  }, [])

  // Khi quay lại tab
  useEffect(() => {
    const onFocus = () => {
      if (!openRef.current) loadNotifications()
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        if (openRef.current) {
          markCurrentAsRead()
          setOpen(false)
          openRef.current = false
        }
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [notifications, readIds])

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0">
      <h1 className="text-lg font-semibold text-gray-800">
        {title || 'Dashboard'}
      </h1>

      <div className="flex items-center gap-3">
        <div className="relative" ref={boxRef}>
          <button
            type="button"
            onClick={handleToggleBell}
            className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            title="Thông báo"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-800">
                  Thông báo
                </span>
                <button
                  type="button"
                  onClick={loadNotifications}
                  className="text-xs text-amber-600 hover:text-amber-700"
                >
                  Làm mới
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {loading ? (
                  <p className="p-4 text-sm text-gray-400 text-center">
                    Đang tải...
                  </p>
                ) : (
                  notifications.map((n) => {
                    const isUnread =
                      n.id !== 'empty' &&
                      n.id !== 'err' &&
                      !readIds.includes(n.id)
                    const body = (
                      <>
                        <p
                          className={`text-sm ${
                            isUnread ? 'text-gray-900 font-medium' : 'text-gray-600'
                          }`}
                        >
                          {n.text}
                        </p>
                        {n.time && (
                          <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                        )}
                      </>
                    )
                    return n.to ? (
                      <Link
                        key={n.id}
                        to={n.to}
                        onClick={() => {
                          markCurrentAsRead()
                          setOpen(false)
                          openRef.current = false
                        }}
                        className="block px-4 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0"
                      >
                        {body}
                      </Link>
                    ) : (
                      <div key={n.id} className="px-4 py-3">
                        {body}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-sm font-semibold">
            {(user?.name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="text-sm leading-tight hidden sm:block">
            <p className="font-medium text-gray-800">{user?.name || 'User'}</p>
            <p className="text-xs text-gray-500">{roleLabel}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
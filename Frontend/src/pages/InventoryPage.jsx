import { useState, useEffect } from 'react'
import { Plus, Search, Package } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  adjustStock,
  deleteIngredient,
} from '../api/ingredientApi'
import Modal from '../components/ui/Modal'

const units = ['g', 'kg', 'ml', 'l', 'cái', 'hộp', 'túi']

const emptyForm = {
  name: '',
  unit: 'g',
  stock: 0,
  minStock: 0,
  note: '',
}

export default function InventoryPage() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStockModalOpen, setIsStockModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [stockTarget, setStockTarget] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [stockForm, setStockForm] = useState({ type: 'in', amount: '' })
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data } = await getIngredients()
      setItems(data)
    } catch {
      toast.error('Không tải được kho')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = items.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
  )

  const lowStockCount = items.filter(
    (i) => Number(i.minStock) > 0 && Number(i.stock) <= Number(i.minStock)
  ).length

  const openAdd = () => {
    if (!isAdmin) return
    setEditing(null)
    setForm(emptyForm)
    setIsModalOpen(true)
  }

  const openEdit = (item) => {
    if (!isAdmin) return
    setEditing(item)
    setForm({
      name: item.name,
      unit: item.unit,
      stock: item.stock,
      minStock: item.minStock,
      note: item.note || '',
    })
    setIsModalOpen(true)
  }

  const openStock = (item) => {
    if (!isAdmin) return
    setStockTarget(item)
    setStockForm({ type: 'in', amount: '' })
    setIsStockModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isAdmin) return
    if (!form.name.trim()) {
      toast.error('Nhập tên nguyên liệu')
      return
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        unit: form.unit,
        stock: Number(form.stock) || 0,
        minStock: Number(form.minStock) || 0,
        note: form.note,
      }
      if (editing) {
        await updateIngredient(editing._id, payload)
        toast.success('Đã cập nhật')
      } else {
        await createIngredient(payload)
        toast.success('Đã thêm nguyên liệu')
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lưu thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleAdjustStock = async (e) => {
    e.preventDefault()
    if (!isAdmin) return
    if (!stockForm.amount && stockForm.amount !== 0) {
      toast.error('Nhập số lượng')
      return
    }
    setSaving(true)
    try {
      await adjustStock(stockTarget._id, {
        type: stockForm.type,
        amount: Number(stockForm.amount),
      })
      toast.success('Đã cập nhật tồn kho')
      setIsStockModalOpen(false)
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!isAdmin) return
    if (!window.confirm('Xóa nguyên liệu này?')) return
    try {
      await deleteIngredient(id)
      toast.success('Đã xóa')
      fetchData()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xóa thất bại')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">Đang tải kho...</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Kho</h2>
          <p className="text-sm text-gray-500 mt-1">
            {items.length} nguyên liệu
            {lowStockCount > 0 && (
              <span className="text-red-600"> · {lowStockCount} sắp hết</span>
            )}
            {!isAdmin && (
              <span className="text-gray-400"> · Chỉ xem (nhân viên)</span>
            )}
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg"
          >
            <Plus size={18} />
            Thêm nguyên liệu
          </button>
        )}
      </div>

      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          type="text"
          placeholder="Tìm nguyên liệu..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b bg-gray-50">
                <th className="px-5 py-3 font-medium">Tên</th>
                <th className="px-5 py-3 font-medium">Tồn kho</th>
                <th className="px-5 py-3 font-medium">Tối thiểu</th>
                <th className="px-5 py-3 font-medium">Đơn vị</th>
                <th className="px-5 py-3 font-medium">Ghi chú</th>
                <th className="px-5 py-3 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const low =
                  Number(item.minStock) > 0 &&
                  Number(item.stock) <= Number(item.minStock)
                return (
                  <tr
                    key={item._id}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      <span className="inline-flex items-center gap-2">
                        <Package size={14} className="text-gray-400" />
                        {item.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={
                          low ? 'text-red-600 font-semibold' : 'text-gray-800'
                        }
                      >
                        {item.stock}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{item.minStock}</td>
                    <td className="px-5 py-3.5 text-gray-600">{item.unit}</td>
                    <td className="px-5 py-3.5 text-gray-500 max-w-[140px] truncate">
                      {item.note || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      {isAdmin ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openStock(item)}
                            className="text-xs px-2 py-1 rounded border border-amber-200 text-amber-700 hover:bg-amber-50"
                          >
                            Nhập/Xuất
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="text-xs px-2 py-1 rounded border border-gray-200 text-gray-700 hover:bg-gray-50"
                          >
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item._id)}
                            className="text-xs px-2 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                          >
                            Xóa
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400"></span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            Chưa có nguyên liệu
          </div>
        )}
      </div>

      {isAdmin && (
        <>
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={editing ? 'Sửa nguyên liệu' : 'Thêm nguyên liệu'}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đơn vị
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tồn kho
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={(e) =>
                      setForm({ ...form, stock: e.target.value })
                    }
                    className="w-full px-3 py-2 text-sm border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mức cảnh báo (min)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.minStock}
                  onChange={(e) =>
                    setForm({ ...form, minStock: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ghi chú
                </label>
                <input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 border rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </form>
          </Modal>

          <Modal
            isOpen={isStockModalOpen}
            onClose={() => setIsStockModalOpen(false)}
            title={`Điều chỉnh: ${stockTarget?.name || ''}`}
          >
            <form onSubmit={handleAdjustStock} className="space-y-4">
              <p className="text-sm text-gray-500">
                Tồn hiện tại: <strong>{stockTarget?.stock}</strong>{' '}
                {stockTarget?.unit}
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Loại
                </label>
                <select
                  value={stockForm.type}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, type: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg bg-white"
                >
                  <option value="in">Nhập thêm (+)</option>
                  <option value="out">Xuất bớt (−)</option>
                  <option value="set">Đặt lại số lượng</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số lượng
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={stockForm.amount}
                  onChange={(e) =>
                    setStockForm({ ...stockForm, amount: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border rounded-lg"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsStockModalOpen(false)}
                  className="flex-1 py-2.5 border rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-amber-600 text-white rounded-lg disabled:opacity-50"
                >
                  {saving ? 'Đang lưu...' : 'Xác nhận'}
                </button>
              </div>
            </form>
          </Modal>
        </>
      )}
    </div>
  )
}
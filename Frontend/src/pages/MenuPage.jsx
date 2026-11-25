import { useState, useEffect } from 'react'
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../api/productApi'
import { getIngredients } from '../api/ingredientApi'
import Modal from '../components/ui/Modal'

const categories = ['Cà phê', 'Trà', 'Nước ép', 'Bánh ngọt', 'Khác']

const emptyForm = {
  name: '',
  category: 'Cà phê',
  price: '',
  description: '',
  image: '',
  status: 'available',
}

export default function MenuPage() {
  const { isAdmin } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [ingredients, setIngredients] = useState([])
  const [recipeRows, setRecipeRows] = useState([])
  const [saving, setSaving] = useState(false)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const { data } = await getProducts()
      setItems(data)
    } catch {
      toast.error('Không tải được danh sách món')
    } finally {
      setLoading(false)
    }
  }

  const fetchIngredients = async () => {
    try {
      const { data } = await getIngredients()
      setIngredients(data)
    } catch {
      // bỏ qua
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchIngredients()
  }, [])

  const filteredItems = items.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory =
      selectedCategory === 'all' || item.category === selectedCategory
    return matchSearch && matchCategory
  })

  const openAddModal = () => {
    setEditingItem(null)
    setForm(emptyForm)
    setRecipeRows([])
    setIsModalOpen(true)
  }

  const openEditModal = (item) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      category: item.category || 'Cà phê',
      price: item.price,
      description: item.description || '',
      image: item.image || '',
      status: item.status || 'available',
    })
    setRecipeRows(
      (item.recipe || []).map((r) => ({
        ingredient: r.ingredient?._id || r.ingredient || '',
        quantity: r.quantity ?? '',
      }))
    )
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingItem(null)
    setForm(emptyForm)
    setRecipeRows([])
  }

  const addRecipeRow = () => {
    setRecipeRows((prev) => [...prev, { ingredient: '', quantity: '' }])
  }

  const updateRecipeRow = (index, field, value) => {
    setRecipeRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  const removeRecipeRow = (index) => {
    setRecipeRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || form.price === '') {
      toast.error('Vui lòng nhập tên món và giá')
      return
    }

    setSaving(true)
    try {
      const recipe = recipeRows
        .filter((r) => r.ingredient && Number(r.quantity) > 0)
        .map((r) => ({
          ingredient: r.ingredient,
          quantity: Number(r.quantity),
        }))

      const payload = {
        ...form,
        price: Number(form.price),
        recipe,
      }

      if (editingItem) {
        await updateProduct(editingItem._id, payload)
        toast.success('Cập nhật món thành công!')
      } else {
        await createProduct(payload)
        toast.success('Thêm món mới thành công!')
      }

      closeModal()
      fetchProducts()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa món này?')) return
    try {
      await deleteProduct(id)
      toast.success('Đã xóa món')
      fetchProducts()
    } catch (error) {
      toast.error(error.response?.data?.message || 'Xóa thất bại')
    }
  }

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-400">Đang tải menu...</div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý Menu</h2>
          <p className="text-sm text-gray-500 mt-1">
            Tổng cộng {items.length} món
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus size={18} />
            Thêm món mới
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
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
          className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
        >
          <option value="all">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredItems.map((item) => (
          <div
            key={item._id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative h-44 bg-gray-100">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                  Không có ảnh
                </div>
              )}
              {item.status === 'out_of_stock' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                    Hết hàng
                  </span>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="font-semibold text-gray-800">{item.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                {item.description || item.category}
              </p>
              {item.recipe?.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                </p>
              )}

              <div className="mt-3 flex items-center justify-between">
                <span className="text-lg font-bold text-amber-600">
                  {Number(item.price).toLocaleString('vi-VN')}đ
                </span>

                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(item._id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          Không tìm thấy món nào
        </div>
      )}

      {isAdmin && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingItem ? 'Sửa món' : 'Thêm món mới'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên món *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục
                </label>
                <select
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giá (VNĐ) *
                </label>
                <input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Link ảnh
              </label>
              <input
                type="text"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trạng thái
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="available">Còn hàng</option>
                <option value="out_of_stock">Hết hàng</option>
              </select>
            </div>

            {/* Công thức liên kết kho */}
            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Công thức nguyên liệu (kho)
                </label>
                <button
                  type="button"
                  onClick={addRecipeRow}
                  className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                >
                  + Thêm nguyên liệu
                </button>
              </div>

              {recipeRows.length === 0 && (
                <p className="text-xs text-gray-400 mb-2">
                Nguyên liệu cần để làm món
                </p>
              )}

              <div className="space-y-2">
                {recipeRows.map((row, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <select
                      value={row.ingredient}
                      onChange={(e) =>
                        updateRecipeRow(index, 'ingredient', e.target.value)
                      }
                      className="flex-1 px-2 py-1.5 text-sm border border-gray-300 rounded-lg bg-white"
                    >
                      <option value="">Chọn nguyên liệu</option>
                      {ingredients.map((ing) => (
                        <option key={ing._id} value={ing._id}>
                          {ing.name} (còn {ing.stock}
                          {ing.unit})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      placeholder="SL"
                      value={row.quantity}
                      onChange={(e) =>
                        updateRecipeRow(index, 'quantity', e.target.value)
                      }
                      className="w-20 px-2 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeRecipeRow(index)}
                      className="text-xs text-red-500 px-2"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg"
              >
                {saving
                  ? 'Đang lưu...'
                  : editingItem
                  ? 'Cập nhật'
                  : 'Thêm món'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
import Ingredient from '../models/Ingredient.js'
import { syncProductStockStatus } from '../utils/productStock.js'

// @desc    Lấy tất cả nguyên liệu
// @route   GET /api/ingredients
// @access  Private (Admin + Staff)
export const getIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.find({ isActive: true }).sort({
      name: 1,
    })
    res.json(ingredients)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Lấy 1 nguyên liệu
// @route   GET /api/ingredients/:id
// @access  Private
export const getIngredientById = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id)
    if (!ingredient) {
      return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' })
    }
    res.json(ingredient)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Tạo nguyên liệu mới
// @route   POST /api/ingredients
// @access  Private (Admin + Staff)
export const createIngredient = async (req, res) => {
  try {
    const { name, unit, stock, minStock, note } = req.body

    if (!name || !unit) {
      return res.status(400).json({ message: 'Vui lòng nhập tên và đơn vị' })
    }

    const exists = await Ingredient.findOne({ name: name.trim() })
    if (exists) {
      return res.status(400).json({ message: 'Nguyên liệu này đã tồn tại' })
    }

    const ingredient = await Ingredient.create({
      name: name.trim(),
      unit,
      stock: stock || 0,
      minStock: minStock || 0,
      note: note || '',
    })

    res.status(201).json(ingredient)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Cập nhật nguyên liệu
// @route   PUT /api/ingredients/:id
// @access  Private (Admin + Staff)
export const updateIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id)
    if (!ingredient) {
      return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' })
    }

    const { name, unit, stock, minStock, note, isActive } = req.body

    if (name) ingredient.name = name.trim()
    if (unit) ingredient.unit = unit
    if (stock !== undefined) ingredient.stock = stock
    if (minStock !== undefined) ingredient.minStock = minStock
    if (note !== undefined) ingredient.note = note
    if (isActive !== undefined) ingredient.isActive = isActive

    const updated = await ingredient.save()
    await syncProductStockStatus([updated._id])
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Nhập / điều chỉnh tồn kho
// @route   PATCH /api/ingredients/:id/stock
// @access  Private (Admin + Staff)
export const adjustStock = async (req, res) => {
  try {
    const { amount, type } = req.body // type: 'in' | 'out' | 'set'

    if (amount === undefined || !type) {
      return res.status(400).json({ message: 'Vui lòng gửi amount và type' })
    }

    const ingredient = await Ingredient.findById(req.params.id)
    if (!ingredient) {
      return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' })
    }

    if (type === 'in') {
      ingredient.stock += Number(amount)
    } else if (type === 'out') {
      if (ingredient.stock < Number(amount)) {
        return res.status(400).json({ message: 'Tồn kho không đủ' })
      }
      ingredient.stock -= Number(amount)
    } else if (type === 'set') {
      ingredient.stock = Number(amount)
    } else {
      return res.status(400).json({ message: 'type phải là in, out hoặc set' })
    }

    const updated = await ingredient.save()
    await syncProductStockStatus([updated._id])
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Xóa mềm nguyên liệu
// @route   DELETE /api/ingredients/:id
// @access  Private (Admin + Staff)
export const deleteIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findById(req.params.id)
    if (!ingredient) {
      return res.status(404).json({ message: 'Không tìm thấy nguyên liệu' })
    }

    ingredient.isActive = false
    await ingredient.save()
    await syncProductStockStatus([ingredient._id])
    res.json({ message: 'Đã xóa nguyên liệu' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
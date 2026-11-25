import Order from '../models/Order.js'
import Table from '../models/Table.js'
import Product from '../models/Product.js'
import Ingredient from '../models/Ingredient.js'
import { syncProductStockStatus } from '../utils/productStock.js'

export const getOrders = async (req, res) => {
  try {
    const { status, table } = req.query
    const filter = {}
    if (status) filter.status = status
    if (table) filter.table = table

    const orders = await Order.find(filter)
      .populate('table', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getOpenOrdersByTable = async (req, res) => {
  try {
    const orders = await Order.find({
      table: req.params.tableId,
      status: { $in: ['pending', 'preparing'] },
    })
      .populate('table', 'name')
      .sort({ createdAt: -1 })

    res.json(orders)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table', 'name')
      .populate('createdBy', 'name')

    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy order' })
    }
    res.json(order)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const createOrder = async (req, res) => {
  try {
    const { tableId, items, note, paymentMethod } = req.body

    if (!tableId || !items || items.length === 0) {
      return res.status(400).json({ message: 'Vui lòng chọn bàn và món' })
    }

    const table = await Table.findById(tableId)
    if (!table) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' })
    }

    const needMap = {}
    const orderItems = []
    let total = 0

    for (const item of items) {
      const product = await Product.findById(item.productId).populate(
        'recipe.ingredient'
      )
      if (!product || !product.isActive) {
        return res
          .status(400)
          .json({ message: `Món không tồn tại: ${item.productId}` })
      }
      if (product.status === 'out_of_stock') {
        return res
          .status(400)
          .json({ message: `Món ${product.name} đang hết hàng` })
      }

      const qty = Number(item.quantity) || 0
      if (qty < 1) {
        return res.status(400).json({ message: 'Số lượng món không hợp lệ' })
      }

      if (product.recipe?.length) {
        for (const r of product.recipe) {
          const ingId = String(r.ingredient?._id || r.ingredient)
          const ingName = r.ingredient?.name || 'Nguyên liệu'
          const need = Number(r.quantity) * qty
          if (!needMap[ingId]) {
            needMap[ingId] = { need: 0, name: ingName }
          }
          needMap[ingId].need += need
          if (r.ingredient?.name) needMap[ingId].name = r.ingredient.name
        }
      }

      orderItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: qty,
      })
      total += product.price * qty
    }

    for (const [ingId, info] of Object.entries(needMap)) {
      const ing = await Ingredient.findById(ingId)
      if (!ing || ing.isActive === false) {
        return res.status(400).json({
          message: `Nguyên liệu không hợp lệ: ${info.name}`,
        })
      }
      if (Number(ing.stock) < info.need) {
        return res.status(400).json({
          message: `Không đủ nguyên liệu "${ing.name}" (cần ${info.need}, còn ${ing.stock} ${ing.unit}). Không thể tạo order.`,
        })
      }
    }

    const order = await Order.create({
      table: tableId,
      items: orderItems,
      note: note || '',
      total,
      paymentMethod: paymentMethod || null,
      createdBy: req.user._id,
    })

    if (table.status === 'available') {
      table.status = 'occupied'
      await table.save()
    }

    const populated = await Order.findById(order._id)
      .populate('table', 'name')
      .populate('createdBy', 'name')

    res.status(201).json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentMethod } = req.body
    const validStatuses = ['pending', 'preparing', 'completed', 'cancelled']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' })
    }

    const order = await Order.findById(req.params.id).populate('items.product')
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy order' })
    }

    if (status === 'completed' && order.status !== 'completed') {
      for (const item of order.items) {
        const product = await Product.findById(item.product).populate(
          'recipe.ingredient'
        )
        if (!product || !product.recipe) continue

        for (const recipeItem of product.recipe) {
          const ingredient = await Ingredient.findById(recipeItem.ingredient)
          if (!ingredient) continue

          const deductAmount = recipeItem.quantity * item.quantity
          if (Number(ingredient.stock) < deductAmount) {
            return res.status(400).json({
              message: `Không đủ nguyên liệu: ${ingredient.name} (cần ${deductAmount}, còn ${ingredient.stock})`,
            })
          }

          ingredient.stock -= deductAmount
          await ingredient.save()
        }
      }

      await syncProductStockStatus()

      order.completedAt = new Date()
      if (paymentMethod) order.paymentMethod = paymentMethod
    }

    // cancelled / preparing: không trừ kho, luôn cho phép
    order.status = status
    await order.save()

    const populated = await Order.findById(order._id)
      .populate('table', 'name')
      .populate('createdBy', 'name')

    res.json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) {
      return res.status(404).json({ message: 'Không tìm thấy order' })
    }

    if (order.status !== 'pending') {
      return res
        .status(400)
        .json({ message: 'Chỉ xóa được order đang chờ xử lý' })
    }

    await order.deleteOne()
    res.json({ message: 'Đã xóa order' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
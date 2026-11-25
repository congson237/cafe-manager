import express from 'express'
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/productController.js'
import { protect, adminOnly, staffOrAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Ai cũng xem được danh sách món (kể cả chưa đăng nhập)
router.get('/', getProducts)
router.get('/:id', getProductById)

// Chỉ Admin mới thêm/sửa/xóa món
router.post('/', protect, adminOnly, createProduct)
router.put('/:id', protect, adminOnly, updateProduct)
router.delete('/:id', protect, adminOnly, deleteProduct)

export default router
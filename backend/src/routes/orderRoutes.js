import express from 'express'
import {
  getOrders,
  getOpenOrdersByTable,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
} from '../controllers/orderController.js'
import { protect, staffOrAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect, staffOrAdmin)

router.route('/')
  .get(getOrders)
  .post(createOrder)

router.get('/table/:tableId/open', getOpenOrdersByTable)

router.route('/:id')
  .get(getOrderById)
  .delete(deleteOrder)

router.patch('/:id/status', updateOrderStatus)

export default router
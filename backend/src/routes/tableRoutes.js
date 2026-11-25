import express from 'express'
import {
  getTables,
  getTableById,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
} from '../controllers/tableController.js'
import { protect, adminOnly, staffOrAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

router.use(protect, staffOrAdmin)

router.route('/')
  .get(getTables)
  .post(adminOnly, createTable)

router.route('/:id')
  .get(getTableById)
  .put(adminOnly, updateTable)
  .delete(adminOnly, deleteTable)

router.patch('/:id/status', updateTableStatus)

export default router
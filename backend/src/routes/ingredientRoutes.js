import express from 'express'
import {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  adjustStock,
  deleteIngredient,
} from '../controllers/ingredientController.js'
import { protect, staffOrAdmin } from '../middleware/authMiddleware.js'

const router = express.Router()

// Tất cả route đều cần đăng nhập + (Admin hoặc Staff)
router.use(protect, staffOrAdmin)

router.route('/')
  .get(getIngredients)
  .post(createIngredient)

router.route('/:id')
  .get(getIngredientById)
  .put(updateIngredient)
  .delete(deleteIngredient)

router.patch('/:id/stock', adjustStock)

export default router
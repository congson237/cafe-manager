import Product from '../models/Product.js'
import Ingredient from '../models/Ingredient.js'

export async function canMakeProduct(product) {
  if (!product.recipe || product.recipe.length === 0) {
    return product.status !== 'out_of_stock'
  }

  for (const item of product.recipe) {
    const ingId = item.ingredient?._id || item.ingredient
    if (!ingId) return false

    const ing = await Ingredient.findById(ingId)
    if (!ing || ing.isActive === false) return false
    if (Number(ing.stock) < Number(item.quantity)) return false
  }
  return true
}

/** Đồng bộ status món theo kho. Không lọc theo id để tránh sót query. */
export async function syncProductStockStatus() {
  const products = await Product.find({
    isActive: true,
    'recipe.0': { $exists: true },
  })

  console.log(`[stock-sync] checking ${products.length} products with recipe`)

  for (const product of products) {
    const ok = await canMakeProduct(product)
    const next = ok ? 'available' : 'out_of_stock'

    console.log(
      `[stock-sync] ${product.name}: recipe=${product.recipe.length}, ok=${ok}, status=${product.status} -> ${next}`
    )

    if (product.status !== next) {
      product.status = next
      await product.save()
    }
  }
}
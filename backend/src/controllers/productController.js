import Product from '../models/Product.js'
import Ingredient from '../models/Ingredient.js'

// @desc    Lấy tất cả món
// @route   GET /api/products
// @access  Public (hoặc Private tùy bạn)
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('recipe.ingredient', 'name unit stock')
      .sort({ createdAt: -1 })
    res.json(products)
  } catch (error) {
    console.error('getProducts error:', error)
    res.status(500).json({ message: error.message })
  }
}

// @desc    Lấy 1 món
// @route   GET /api/products/:id
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      'recipe.ingredient',
      'name unit stock'
    )
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy món' })
    }
    res.json(product)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Tạo món mới
// @route   POST /api/products
// @access  Admin only
export const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, recipe, status } = req.body

    if (!name || price === undefined) {
      return res.status(400).json({ message: 'Vui lòng nhập tên và giá' })
    }

    // Kiểm tra nguyên liệu trong công thức có tồn tại không
    if (recipe && recipe.length > 0) {
      for (const item of recipe) {
        const ing = await Ingredient.findById(item.ingredient)
        if (!ing) {
          return res.status(400).json({
            message: `Nguyên liệu không tồn tại: ${item.ingredient}`,
          })
        }
      }
    }

    const product = await Product.create({
      name,
      description: description || '',
      price,
      category: category || 'Cà phê',
      image: image || '',
      recipe: recipe || [],
      status: status || 'available',
    })

    const populated = await product.populate('recipe.ingredient', 'name unit stock')
    res.status(201).json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Cập nhật món
// @route   PUT /api/products/:id
// @access  Admin only
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy món' })
    }

    const { name, description, price, category, image, recipe, status, isActive } =
      req.body

    if (name) product.name = name
    if (description !== undefined) product.description = description
    if (price !== undefined) product.price = price
    if (category) product.category = category
    if (image !== undefined) product.image = image
    if (status) product.status = status
    if (isActive !== undefined) product.isActive = isActive
    if (recipe) product.recipe = recipe

    const updated = await product.save()
    const populated = await updated.populate('recipe.ingredient', 'name unit stock')
    res.json(populated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Xóa mềm món
// @route   DELETE /api/products/:id
// @access  Admin only
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy món' })
    }

    product.isActive = false
    await product.save()
    res.json({ message: 'Đã xóa món' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
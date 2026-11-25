import mongoose from 'mongoose'

const recipeItemSchema = new mongoose.Schema(
  {
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ingredient',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.1, 'Số lượng phải lớn hơn 0'],
    },
  },
  { _id: false }
)

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên món'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Vui lòng nhập giá'],
      min: [0, 'Giá không được âm'],
    },
    category: {
      type: String,
      required: true,
      enum: ['Cà phê', 'Trà', 'Nước ép', 'Bánh ngọt', 'Khác'],
      default: 'Cà phê',
    },
    image: {
      type: String,
      default: '',
    },
    recipe: [recipeItemSchema], // công thức nguyên liệu
    status: {
      type: String,
      enum: ['available', 'out_of_stock'],
      default: 'available',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

const Product = mongoose.model('Product', productSchema)
export default Product
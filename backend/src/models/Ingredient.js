import mongoose from 'mongoose'

const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên nguyên liệu'],
      trim: true,
      unique: true,
    },
    unit: {
      type: String,
      required: [true, 'Vui lòng chọn đơn vị'],
      enum: ['g', 'kg', 'ml', 'l', 'cái', 'hộp', 'túi'],
      default: 'g',
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Tồn kho không được âm'],
      default: 0,
    },
    minStock: {
      type: Number,
      default: 0, // mức cảnh báo sắp hết
      min: 0,
    },
    note: {
      type: String,
      trim: true,
      default: '',
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

// Virtual: sắp hết hàng?
ingredientSchema.virtual('isLowStock').get(function () {
  return this.stock <= this.minStock
})

ingredientSchema.set('toJSON', { virtuals: true })
ingredientSchema.set('toObject', { virtuals: true })

const Ingredient = mongoose.model('Ingredient', ingredientSchema)
export default Ingredient
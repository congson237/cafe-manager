import mongoose from 'mongoose'

const tableSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vui lòng nhập tên bàn'],
      trim: true,
      unique: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: [1, 'Sức chứa tối thiểu 1 người'],
      default: 2,
    },
    floor: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['available', 'occupied', 'reserved'],
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

const Table = mongoose.model('Table', tableSchema)
export default Table
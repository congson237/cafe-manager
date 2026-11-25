import Table from '../models/Table.js'

// @desc    Lấy tất cả bàn
// @route   GET /api/tables
// @access  Private
export const getTables = async (req, res) => {
  try {
    const tables = await Table.find({ isActive: true }).sort({ name: 1 })
    res.json(tables)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Lấy 1 bàn
// @route   GET /api/tables/:id
export const getTableById = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
    if (!table) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' })
    }
    res.json(table)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Tạo bàn mới
// @route   POST /api/tables
// @access  Admin only
export const createTable = async (req, res) => {
  try {
    const { name, capacity, floor, status } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Vui lòng nhập tên bàn' })
    }

    const exists = await Table.findOne({ name: name.trim() })
    if (exists) {
      return res.status(400).json({ message: 'Tên bàn đã tồn tại' })
    }

    const table = await Table.create({
      name: name.trim(),
      capacity: capacity || 2,
      floor: floor || 1,
      status: status || 'available',
    })

    res.status(201).json(table)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Cập nhật bàn
// @route   PUT /api/tables/:id
// @access  Admin only
export const updateTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
    if (!table) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' })
    }

    const { name, capacity, floor, status, isActive } = req.body

    if (name) table.name = name.trim()
    if (capacity !== undefined) table.capacity = capacity
    if (floor !== undefined) table.floor = floor
    if (status) table.status = status
    if (isActive !== undefined) table.isActive = isActive

    const updated = await table.save()
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Đổi trạng thái bàn (available / occupied / reserved)
// @route   PATCH /api/tables/:id/status
// @access  Private (Admin + Staff)
export const updateTableStatus = async (req, res) => {
  try {
    const { status } = req.body
    if (!['available', 'occupied', 'reserved'].includes(status)) {
      return res.status(400).json({ message: 'Trạng thái không hợp lệ' })
    }

    const table = await Table.findById(req.params.id)
    if (!table) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' })
    }

    table.status = status
    const updated = await table.save()
    res.json(updated)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// @desc    Xóa mềm bàn
// @route   DELETE /api/tables/:id
// @access  Admin only
export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
    if (!table) {
      return res.status(404).json({ message: 'Không tìm thấy bàn' })
    }

    table.isActive = false
    await table.save()
    res.json({ message: 'Đã xóa bàn' })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}
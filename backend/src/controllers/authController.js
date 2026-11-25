import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  })
}

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' })
    }

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({ message: 'Email đã được sử dụng' })
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role === 'admin' ? 'admin' : 'staff',
    })

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' })
    }

    const user = await User.findOne({ email }).select('+password')

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng' })
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Tài khoản đã bị khóa' })
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const getMe = async (req, res) => {
  res.json(req.user)
}
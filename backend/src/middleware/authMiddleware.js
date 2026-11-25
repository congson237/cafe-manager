import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const protect = async (req, res, next) => {
  try {
    let token

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({ message: 'Chưa đăng nhập' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.id).select('-password')

    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'Tài khoản không hợp lệ hoặc đã bị khóa' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({ message: 'Token không hợp lệ' })
  }
}

export const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next()
  }
  return res.status(403).json({ message: 'Chỉ Admin mới có quyền này' })
}

export const staffOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'staff')) {
    return next()
  }
  return res.status(403).json({ message: 'Không có quyền truy cập' })
}
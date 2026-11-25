import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import morgan from 'morgan'
import connectDB from './config/db.js'

import authRoutes from './routes/authRoutes.js'
import ingredientRoutes from './routes/ingredientRoutes.js'
import productRoutes from './routes/productRoutes.js'
import tableRoutes from './routes/tableRoutes.js'
import orderRoutes from './routes/orderRoutes.js'

dotenv.config()
connectDB()

const app = express()

app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/', (req, res) => {
  res.json({ message: 'Café Manager API is running...' })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/ingredients', ingredientRoutes)
app.use('/api/products', productRoutes)
app.use('/api/tables', tableRoutes)
app.use('/api/orders', orderRoutes)

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
import mongoose from 'mongoose'
import ProductSchema from './product.model.js'

const MenuSchema = mongoose.Schema({
  name: String,
  products: [ProductSchema]
}, {
  timestamps: true
})

export default MenuSchema
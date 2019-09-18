import mongoose from 'mongoose'
import { ProductSchema } from './product.model.js'

export const MenuSchema = mongoose.Schema({
  name: String,
  products: [ProductSchema]
}, {
  timestamps: true
})

export default mongoose.model('Menu', MenuSchema)
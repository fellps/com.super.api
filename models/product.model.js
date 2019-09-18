import mongoose from 'mongoose'

const ProductSchema = mongoose.Schema({
  name: String,
  value: Number, 
  color: String
}, {
  timestamps: true
})

export default ProductSchema
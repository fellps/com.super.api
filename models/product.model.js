import mongoose from 'mongoose'

export const ProductSchema = mongoose.Schema({
  name: String,
  value: Number, 
  color: String
}, {
  timestamps: true
})

export default mongoose.model('Product', ProductSchema)
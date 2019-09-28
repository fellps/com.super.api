import mongoose from 'mongoose'

export const ProductSchema = mongoose.Schema({
  _id : { type : String, required : true },
  name: String,
  value: Number, 
  color: String
}, {
  timestamps: true
})

export default mongoose.model('Product', ProductSchema)
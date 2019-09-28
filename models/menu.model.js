import mongoose from 'mongoose'

export const MenuSchema = mongoose.Schema({
  _id : { type : String, required : true },
  name: String,
  isEnabled: Boolean,
  productsIds: []
}, {
  timestamps: true
})

export default mongoose.model('Menu', MenuSchema)
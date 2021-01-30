import mongoose from 'mongoose'

export const MenuSchema = mongoose.Schema({
  _id : { type : String, required : true },
  name: String,
  productsIds: [],
  isEnabled: Boolean,
  fromId: String,
}, {
  timestamps: true
})

export default mongoose.model('Menu', MenuSchema)
import mongoose from 'mongoose'

export const MenuSchema = mongoose.Schema({
  name: String,
  productsIds: []
}, {
  timestamps: true
})

export default mongoose.model('Menu', MenuSchema)
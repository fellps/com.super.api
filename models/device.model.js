import mongoose from 'mongoose'

export const DeviceSchema = mongoose.Schema({
  name: String,
  menus: []
}, {
  timestamps: true
})

export default mongoose.model('Device', DeviceSchema)
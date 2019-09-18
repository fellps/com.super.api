import mongoose from 'mongoose'

const DeviceSchema = mongoose.Schema({
  name: String,
  menus: []
}, {
  timestamps: true
})

export default DeviceSchema